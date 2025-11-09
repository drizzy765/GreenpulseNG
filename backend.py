
import os
import sqlite3
import uuid
from datetime import datetime
import pandas as pd
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field
import uvicorn
from passlib.context import CryptContext
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.graphics import renderPDF
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.piecharts import Pie
from reportlab.lib.colors import HexColor
from prophet import Prophet

# --- Configuration ---
DATABASE_URL = "emissions.db"
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
origins = ["*"]

# --- FastAPI App Initialization ---
app = FastAPI(
    title="GreenpulseNG API",
    description="API for Nigerian carbon emissions tracking.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Security ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class DevUser(BaseModel):
    id: int = 1
    username: str = "dev"

async def current_active_user(token: str = Depends(oauth2_scheme)):
    # This is a mock authentication for development
    return DevUser()

# --- Database Setup ---
def get_conn():
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    cursor = conn.cursor()
    
    # Drop old table if it exists
    cursor.execute("DROP TABLE IF EXISTS emissions;")
    
    # Create new emissions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS emissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_id TEXT NOT NULL,
        business_type TEXT,
        date TEXT,
        source_category TEXT,
        activity TEXT,
        amount REAL,
        unit TEXT,
        emission_factor REAL,
        emissions_kgCO2e REAL,
        scope TEXT,
        user_id TEXT
    );
    """)
    
    # Create users and shares table if they don't exist
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS shares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE NOT NULL,
        business_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)
    conn.commit()
    conn.close()

# Initialize DB on startup
init_db()

# --- Pydantic Models ---
class ManualEntry(BaseModel):
    business_id: str
    business_type: str
    date: str
    source_category: str
    activity: str
    amount: float
    unit: str
    emission_factor: float
    scope: str

class ScenarioRequest(BaseModel):
    waste_reduction: float = Field(0, ge=0, le=100)
    solar_percentage: float = Field(0, ge=0, le=100)
    transport_reduction: float = Field(0, ge=0, le=100)
    commute_reduction: float = Field(0, ge=0, le=100)
    source_category: str = "all"

class ShareCreateRequest(BaseModel):
    business_id: str

# --- Helper Functions ---
def get_ai_recommendation(activity: str, source_category: str) -> str:
    recommendations = {
        "electricity": "Consider installing solar panels to reduce reliance on the grid.",
        "transport": "Optimize delivery routes and consider using more fuel-efficient vehicles.",
        "waste": "Implement a recycling program and compost organic waste.",
        "default": "Review your energy consumption and identify areas for reduction."
    }
    return recommendations.get(source_category, recommendations["default"])

def convert_naira_to_kwh(amount_naira: float):
    """Placeholder for future implementation."""
    pass

# --- API Endpoints ---
@app.post("/manual_entry")
async def manual_entry(entry: ManualEntry, user: DevUser = Depends(current_active_user)):
    emissions_kgCO2e = entry.amount * entry.emission_factor
    conn = get_conn()
    try:
        conn.execute(
            """
            INSERT INTO emissions (business_id, business_type, date, source_category, activity, amount, unit, emission_factor, emissions_kgCO2e, scope, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (entry.business_id, entry.business_type, entry.date, entry.source_category, entry.activity, entry.amount, entry.unit, entry.emission_factor, emissions_kgCO2e, entry.scope, str(user.id))
        )
        conn.commit()
    finally:
        conn.close()
    return {"message": "Manual entry added successfully", "emissions_kgCO2e": emissions_kgCO2e}

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...), user: DevUser = Depends(current_active_user)):
    required_columns = [
        'business_id', 'business_type', 'date', 'source_category', 'activity',
        'amount', 'unit', 'emission_factor', 'scope'
    ]
    
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

    if not all(col in df.columns for col in required_columns):
        raise HTTPException(status_code=400, detail=f"Missing required columns. Required: {required_columns}")

    df['emissions_kgCO2e'] = df['amount'] * df['emission_factor']
    df['user_id'] = str(user.id)
    
    # Ensure all 10 columns are present for the database
    final_columns = required_columns + ['emissions_kgCO2e', 'user_id']
    df = df[final_columns]

    conn = get_conn()
    try:
        df.to_sql('emissions', conn, if_exists='replace', index=False)
    finally:
        conn.close()
    
    return {"message": "Data uploaded and replaced successfully", "rows": len(df)}

@app.get("/dashboard/{business_id}")
async def get_dashboard(business_id: str, user: DevUser = Depends(current_active_user)):
    conn = get_conn()
    try:
        df = pd.read_sql_query("SELECT * FROM emissions WHERE business_id = ? AND user_id = ?", conn, params=(business_id, str(user.id)))
        if df.empty:
            raise HTTPException(status_code=404, detail="No data found for this business")
        
        total_emissions = float(df['emissions_kgCO2e'].sum())
        avg_monthly = float(total_emissions / 12)
        
        contributors = df.groupby('source_category')['emissions_kgCO2e'].sum().reset_index()
        by_scope = df.groupby('scope')['emissions_kgCO2e'].sum().reset_index()

        return {
            "total_emissions": total_emissions,
            "avg_monthly_emissions": avg_monthly,
            "contributors": contributors.to_dict(orient='records'),
            "by_scope": by_scope.to_dict(orient='records')
        }
    finally:
        conn.close()

@app.get("/insights/{business_id}")
async def get_insights(business_id: str, user: DevUser = Depends(current_active_user)):
    conn = get_conn()
    try:
        df_business = pd.read_sql_query("SELECT * FROM emissions WHERE business_id = ? AND user_id = ?", conn, params=(business_id, str(user.id)))
        if df_business.empty:
            raise HTTPException(status_code=404, detail="No data found for this business")

        business_type = df_business['business_type'].iloc[0]
        total_emissions = df_business['emissions_kgCO2e'].sum()

        df_sector = pd.read_sql_query("SELECT * FROM emissions WHERE business_type = ?", conn, params=(business_type,))
        avg_sector_emissions = df_sector.groupby('business_id')['emissions_kgCO2e'].sum().mean()

        green_score = (1 - (total_emissions / avg_sector_emissions)) * 100 if avg_sector_emissions > 0 else 100
        green_score = max(0, min(100, green_score))

        top_activity = df_business.groupby('activity')['emissions_kgCO2e'].sum().idxmax()
        top_source_category = df_business.loc[df_business['activity'] == top_activity, 'source_category'].iloc[0]
        
        recommendation = get_ai_recommendation(top_activity, top_source_category)

        return {
            "green_score": green_score,
            "recommendation": recommendation,
            "explanation": "Based on Nigerian grid emission factors (0.359 kgCO₂/kWh) and fuel standards, your business emissions are interpreted according to local energy and waste conditions."
        }
    finally:
        conn.close()

@app.post("/forecast/{business_id}")
async def get_forecast(business_id: str, scenario: ScenarioRequest, user: DevUser = Depends(current_active_user)):
    conn = get_conn()
    try:
        df = pd.read_sql_query("SELECT * FROM emissions WHERE business_id = ? AND user_id = ?", conn, params=(business_id, str(user.id)))
        if df.empty:
            raise HTTPException(status_code=400, detail="Not enough data for forecast")
        
        sim_data = df.copy()
        sim_data.loc[sim_data['source_category'] == 'waste', 'emissions_kgCO2e'] *= (1 - scenario.waste_reduction / 100)
        sim_data.loc[sim_data['source_category'] == 'electricity', 'emissions_kgCO2e'] *= (1 - scenario.solar_percentage / 100)
        sim_data.loc[sim_data['source_category'] == 'transport', 'emissions_kgCO2e'] *= (1 - scenario.transport_reduction / 100)
        sim_data.loc[sim_data['source_category'] == 'commute', 'emissions_kgCO2e'] *= (1 - scenario.commute_reduction / 100)
        
        df_filtered = sim_data if scenario.source_category == 'all' else sim_data[sim_data['source_category'] == scenario.source_category]
        df_prophet = df_filtered.groupby('date')['emissions_kgCO2e'].sum().reset_index().rename(columns={'date': 'ds', 'emissions_kgCO2e': 'y'})
        
        if len(df_prophet) < 2:
            raise HTTPException(status_code=400, detail="Not enough data for forecast")

        model = Prophet()
        model.fit(df_prophet)
        future = model.make_future_dataframe(periods=12, freq='M')
        forecast = model.predict(future)
        
        return {
            "forecast": forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict(orient='records')
        }
    finally:
        conn.close()

@app.get("/report/{business_id}")
async def generate_pdf_report(business_id: str, user: DevUser = Depends(current_active_user)):
    conn = get_conn()
    try:
        df = pd.read_sql_query("SELECT * FROM emissions WHERE business_id = ? AND user_id = ?", conn, params=(business_id, str(user.id)))
        if df.empty:
            raise HTTPException(status_code=404, detail="No data found for report")

        business_type = df['business_type'].iloc[0]
        total_emissions = df['emissions_kgCO2e'].sum()
        avg_monthly = total_emissions / 12
        
        contributors = df.groupby('source_category')['emissions_kgCO2e'].sum().reset_index()
        top_category = contributors.loc[contributors['emissions_kgCO2e'].idxmax(), 'source_category']
        recommendation = get_ai_recommendation("", top_category)

        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        c.setFont("Helvetica", 12)
        c.drawString(100, 750, f"EcoImpact Report for {business_id} ({business_type})")
        c.drawString(100, 730, f"Total Annual Emissions: {total_emissions:.2f} kgCO2e")
        c.drawString(100, 710, f"Average Monthly Emissions: {avg_monthly:.2f} kgCO2e")
        
        y = 690
        c.drawString(100, y, "Top Emission Sources:")
        y -= 20
        for _, row in contributors.iterrows():
            c.drawString(120, y, f"{row['source_category']}: {row['emissions_kgCO2e']:.2f} kgCO2e")
            y -= 20
        
        c.drawString(100, y-20, "Recommendation:")
        c.drawString(120, y-40, f"- {recommendation}")

        drawing = Drawing(400, 200)
        pie = Pie()
        pie.x = 150; pie.y = 50; pie.width = 150; pie.height = 150
        pie.data = contributors['emissions_kgCO2e'].tolist()
        pie.labels = contributors['source_category'].tolist()
        drawing.add(pie)
        drawing.drawOn(c, 100, y-300)
        
        c.showPage()
        c.save()
        buffer.seek(0)
        return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": f"attachment;filename=report_{business_id}.pdf"})
    finally:
        conn.close()

if __name__ == "__main__":
    uvicorn.run("backend:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
