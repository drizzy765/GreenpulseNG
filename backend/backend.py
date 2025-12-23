import os
import io
import uuid
import sqlite3
import json
from datetime import datetime
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

import pandas as pd
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from passlib.context import CryptContext
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.piecharts import Pie
import uvicorn

# --- Groq SDK ---
from groq import Groq

# Configure Groq
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# --- Configuration ---
DATABASE_URL = os.getenv("DATABASE_URL", "emissions.db")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ACCESS_TOKEN_EXPIRE_MINUTES = 30
ALLOWED_ORIGINS = ["*"]

# --- FastAPI Setup ---
app = FastAPI(
    title="GreenpulseNG API",
    description="API for Nigerian carbon emissions tracking (Powered by Gemini 2.0).",
    version="3.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# --- Security ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class DevUser(BaseModel):
    id: int = 1
    username: str = "dev"

async def current_active_user(token: str = Depends(oauth2_scheme)):
    # Simple dev auth mock, in real app verify token
    return DevUser()

async def get_optional_user(token: str = Depends(oauth2_scheme)):
    try:
        return DevUser()
    except:
        return None

# --- Database Helpers ---
@contextmanager
def get_conn():
    conn = sqlite3.connect(DATABASE_URL, detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db(force_reset: bool = False):
    """
    Initialize database tables. Only creates tables if they don't exist.
    Set force_reset=True (via RESET_DB env var) to drop and recreate tables (development only).
    """
    with get_conn() as conn:
        cursor = conn.cursor()
        
        # Only drop tables if explicitly requested (development/testing only)
        if force_reset and os.getenv("RESET_DB", "").lower() == "true":
            cursor.execute("DROP TABLE IF EXISTS emissions;")
            cursor.execute("DROP TABLE IF EXISTS users;")
        
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
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL
        );
        """)
        conn.commit()

# Initialize DB on startup (safe - only creates if not exists)
init_db(force_reset=False)

# --- Pydantic Models ---
class ManualEntry(BaseModel):
    business_id: str | None = None
    business_type: str
    date: str
    source_category: str
    activity: str
    amount: float
    unit: str
    emission_factor: float
    scope: str
    user_id: str | None = None

class BulkEntryItem(ManualEntry):
    pass

class BulkEntryRequest(BaseModel):
    entries: list[BulkEntryItem]
    generate_if_missing: bool = True

class ScenarioRequest(BaseModel):
    waste_reduction: float = Field(0, ge=0, le=100)
    solar_percentage: float = Field(0, ge=0, le=100)
    transport_reduction: float = Field(0, ge=0, le=100)
    commute_reduction: float = Field(0, ge=0, le=100)
    source_category: str = "all"

# --- Utility Functions ---
def generate_business_id() -> str:
    return str(uuid.uuid4())[:8]

def parse_date_safe(d: str) -> str:
    try:
        return pd.to_datetime(d).strftime('%Y-%m-%d')
    except Exception:
        return d

def compute_emissions(amount: float, factor: float) -> float:
    return float(amount) * float(factor)

def get_emission_factor(source_category: str, activity: str) -> float:
    defaults = {
        "electricity": 0.359,
        "diesel": 2.68,
        "petrol": 2.31,
        "waste": 0.5,
        "natural_gas": 2.03,
        "lpg": 2.9
    }
    return defaults.get(source_category.lower(), 1.0)

# --- Async Gemini Wrapper ---
async def ask_gemini(prompt: str) -> str:
    """
    Asynchronously query Gemini AI model.
    Returns AI response or error message string.
    """
    try:
        print(f"DEBUG: ask_gemini started with prompt length {len(prompt)}")
        api_key = os.getenv("GROQ_API_KEY")
        print(f"DEBUG: Groq API Key present: {bool(api_key)}")
        if api_key:
             print(f"DEBUG: Key starts with: {api_key[:4]}...")
        
        # Use Groq Llama 3 model
        response = client.chat.completions.create(
            messages=[
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-8b-instant",
        )
        print("DEBUG: ask_gemini success")
        return response.choices[0].message.content
    except Exception as e:
        error_str = str(e)
        print(f"Gemini API Error: {error_str}")  # Log for debugging
        with open("debug_errors.log", "a") as f:
            f.write(f"{datetime.now()}: {error_str}\n")
        
        # RETURN THE REAL ERROR FOR DEBUGGING
        return f"DEBUG_ERROR: {error_str}"

        # if "429" in error_str or "quota" in error_str.lower() or "resource exhausted" in error_str.lower():
        #     return "AI usage limit reached. Please try again in 1 minute."
            
        # return "AI service temporarily unavailable. Please try again later."

# --- API Endpoints ---

@app.post("/manual_entry")
async def manual_entry(entry: ManualEntry, user: DevUser = Depends(current_active_user)):
    business_id = entry.business_id or generate_business_id()
    emissions_kgCO2e = compute_emissions(entry.amount, entry.emission_factor)
    date = parse_date_safe(entry.date)
    with get_conn() as conn:
        # Check if user passed explicit ID or use DevUser if token present
        uid = entry.user_id if entry.user_id else (str(user.id) if user else None)
        
        conn.execute("""
        INSERT INTO emissions (business_id, business_type, date, source_category, activity, amount, unit, emission_factor, emissions_kgCO2e, scope, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (business_id, entry.business_type, date, entry.source_category, entry.activity, entry.amount, entry.unit, entry.emission_factor, emissions_kgCO2e, entry.scope, uid))
        conn.commit()
    return {"success": True, "business_id": business_id, "emissions_kgCO2e": emissions_kgCO2e}

@app.post("/emissions/bulk")
async def bulk_emissions(req: BulkEntryRequest, user: DevUser = Depends(current_active_user)):
    rows = []
    with get_conn() as conn:
        for item in req.entries:
            business_id = item.business_id or (generate_business_id() if req.generate_if_missing else None)
            if not business_id:
                raise HTTPException(status_code=400, detail="Missing business_id")
            date = parse_date_safe(item.date)
            ef = item.emission_factor if item.emission_factor != 0 else get_emission_factor(item.source_category, item.activity)
            emissions_kg = compute_emissions(item.amount, ef)
            
            # Check if user passed explicit ID or use DevUser if token present
            uid = item.user_id if item.user_id else (str(user.id) if user else None)

            conn.execute("""
            INSERT INTO emissions (business_id, business_type, date, source_category, activity, amount, unit, emission_factor, emissions_kgCO2e, scope, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (business_id, item.business_type, date, item.source_category, item.activity, item.amount, item.unit, ef, emissions_kg, item.scope, uid))
            
            rows.append({"business_id": business_id, "emissions_kgCO2e": emissions_kg})
        conn.commit()
    return {"success": True, "count": len(rows)}

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...), user: DevUser = Depends(current_active_user)):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    required = ['business_type', 'source_category', 'amount']
    if not all(col in df.columns for col in required):
        raise HTTPException(status_code=400, detail=f"CSV missing columns. Need: {required}")
    rows_inserted = 0
    with get_conn() as conn:
        for _, row in df.iterrows():
            bid = row.get('business_id', generate_business_id())
            date = parse_date_safe(str(row.get('date', datetime.now().date())))
            ef = row.get('emission_factor', get_emission_factor(row['source_category'], row.get('activity', '')))
            emission = float(row['amount']) * float(ef)
            conn.execute("""
            INSERT INTO emissions (business_id, business_type, date, source_category, activity, amount, unit, emission_factor, emissions_kgCO2e, scope, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (bid, row['business_type'], date, row['source_category'], row.get('activity', 'unknown'), row['amount'], row.get('unit', 'unit'), ef, emission, row.get('scope', 'Scope 1'), str(user.id)))
            rows_inserted += 1
        conn.commit()
    return {"success": True, "rows": rows_inserted}

@app.get("/dashboard/{business_id}")
async def get_dashboard(business_id: str, user_id: str | None = None):
    with get_conn() as conn:
        if user_id:
            df = pd.read_sql_query("SELECT * FROM emissions WHERE user_id = ?", conn, params=(user_id,))
        else:
            # Fallback for legacy or anonymous with business_id (though plan says guest is local)
            df = pd.read_sql_query("SELECT * FROM emissions WHERE business_id = ?", conn, params=(business_id,))
    if df.empty:
        raise HTTPException(status_code=404, detail="No data found")
    total = float(df['emissions_kgCO2e'].sum())
    by_category = df.groupby('source_category')['emissions_kgCO2e'].sum().reset_index().to_dict(orient='records')
    return {"success": True, "total_emissions": total, "by_category": by_category}

@app.get("/emissions/{business_id}")
async def get_emissions(business_id: str, user_id: str | None = None):
    """Get all emission entries for a business (history view)"""
    with get_conn() as conn:
        if user_id:
            df = pd.read_sql_query("SELECT * FROM emissions WHERE user_id = ? ORDER BY date DESC", conn, params=(user_id,))
        else:
            df = pd.read_sql_query("SELECT * FROM emissions WHERE business_id = ? ORDER BY date DESC", conn, params=(business_id,))
    if df.empty:
        raise HTTPException(status_code=404, detail="No data found")
    # Convert DataFrame to list of dicts, handling NaN values properly
    df = df.fillna('')  # Replace NaN with empty string for JSON serialization
    rows = df.to_dict(orient='records')
    return {"success": True, "rows": rows}

@app.get("/leaderboard")
async def get_leaderboard(user: DevUser = Depends(current_active_user)):
    """Get leaderboard of businesses ranked by green score"""
    with get_conn() as conn:
        # Get all businesses with their emissions data
        df = pd.read_sql_query("SELECT business_id, business_type, emissions_kgCO2e FROM emissions", conn)
    
    if df.empty:
        return {"success": True, "leaderboard": []}
    
    # Calculate total emissions per business
    business_totals = df.groupby(['business_id', 'business_type'])['emissions_kgCO2e'].sum().reset_index()
    
    # Calculate sector averages for green score calculation
    sector_avgs = df.groupby('business_type')['emissions_kgCO2e'].sum() / df.groupby('business_type')['business_id'].nunique()
    
    # Calculate green score for each business
    leaderboard = []
    for _, row in business_totals.iterrows():
        business_type = row['business_type']
        total_emissions = row['emissions_kgCO2e']
        sector_avg = sector_avgs.get(business_type, total_emissions)
        
        # Green score: lower emissions relative to sector average = higher score
        if sector_avg > 0:
            green_score = max(0, min(100, (1 - (total_emissions / sector_avg)) * 100))
        else:
            green_score = 100
        
        leaderboard.append({
            "business_id": row['business_id'],
            "business_name": row['business_type'],  # Using business_type as name for now
            "business_type": business_type,
            "green_score": round(green_score, 2),
            "total_emissions": round(total_emissions, 2),
            "updated_at": datetime.now().isoformat()
        })
    
    # Sort by green score (descending)
    leaderboard.sort(key=lambda x: x['green_score'], reverse=True)
    
    return {"success": True, "leaderboard": leaderboard}

@app.get("/insights/{business_id}")
async def get_insights(business_id: str, user_id: str | None = None):
    print(f"DEBUG: Received insights request for business_id={business_id} user_id={user_id}")
    try:
        with get_conn() as conn:
            if user_id:
                df = pd.read_sql_query("SELECT * FROM emissions WHERE user_id = ?", conn, params=(user_id,))
            else:
                df = pd.read_sql_query("SELECT * FROM emissions WHERE business_id = ?", conn, params=(business_id,))
        if df.empty:
            print("DEBUG: No data found for insights")
            raise HTTPException(status_code=404, detail="No data")
        
        total = df['emissions_kgCO2e'].sum()
        if len(df) > 0:
            b_type = df['business_type'].iloc[0]
            # Safely get top category, handle potential NaNs or empty groups
            cat_sums = df.groupby('source_category')['emissions_kgCO2e'].sum()
            top_cat = cat_sums.idxmax() if not cat_sums.empty else "General"
        else:
             b_type = "Business"
             top_cat = "General"

        prompt = f"""
        Analyze these emissions stats for a Nigerian {b_type}:
        - Total Emissions: {total:.2f} kgCO2e
        - Top Source: {top_cat}
        
        Provide:
        1. One sentence assessment of their status.
        2. Three specific reduction techniques suitable for Nigeria (considering power/fuel challenges).
        3. Estimated cost impact (Low/Medium/High).
        """
        print("DEBUG: Calling ask_gemini...")
        ai_response = await ask_gemini(prompt)
        print(f"DEBUG: ask_gemini returned: {ai_response[:50]}...")
        # Ensure response is always a string
        ai_analysis_str = str(ai_response) if ai_response else "No analysis available"
        return {"success": True, "business_id": business_id, "total_emissions": total, "ai_analysis": ai_analysis_str}
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error in get_insights: {str(e)}"
        print(error_msg)
        with open("debug_errors.log", "a") as f:
            f.write(f"{datetime.now()}: {error_msg}\n")
        # Return a valid response with the error in the analysis field to avoid 500
        return {"success": False, "business_id": business_id, "total_emissions": 0, "ai_analysis": f"DEBUG_ERROR: {str(e)}"}

class AIScenarioInput(BaseModel):
    business_id: str
    waste_reduction: float = Field(0, ge=0, le=100)
    solar_percentage: float = Field(0, ge=0, le=100)
    transport_reduction: float = Field(0, ge=0, le=100)
    commute_reduction: float = Field(0, ge=0, le=100)
    source_category: str = "all"
    user_id: str | None = None

class ReportRequest(BaseModel):
    business_id: str
    user_id: str | None = None


@app.post("/ai/scenario")
async def ai_scenario(req: AIScenarioInput, user: DevUser = Depends(current_active_user)):
    with get_conn() as conn:
        # Prioritize req.user_id, fallback to user.id if logged in, else business_id
        uid = req.user_id or (str(user.id) if user else None)
        if uid:
             df = pd.read_sql_query("SELECT * FROM emissions WHERE user_id = ?", conn, params=(uid,))
        else:
             df = pd.read_sql_query("SELECT * FROM emissions WHERE business_id = ?", conn, params=(req.business_id,))
    if df.empty: raise HTTPException(404, "No data")
    sim = df.copy()
    reductions = {
        'waste': req.waste_reduction,
        'electricity': req.solar_percentage,
        'transport': req.transport_reduction,
        'commute': req.commute_reduction
    }
    for cat, reduc in reductions.items():
        if reduc > 0:
            sim.loc[sim['source_category'].str.lower() == cat, 'emissions_kgCO2e'] *= (1 - reduc/100)
    before = df['emissions_kgCO2e'].sum()
    after = sim['emissions_kgCO2e'].sum()
    saved = before - after
    prompt = f"""
    Scenario Analysis:
    A business reduced emissions from {before:.2f} to {after:.2f} kgCO2e (saved {saved:.2f}).
    Interventions: {json.dumps(reductions)}
    Explain operational benefits beyond carbon (cost savings, health, efficiency).
    """
    explanation = await ask_gemini(prompt)
    return {"success": True, "before": before, "after": after, "saved": saved, "explanation": explanation}

@app.post("/ai/report")
async def ai_report(req: ReportRequest, user: DevUser = Depends(current_active_user)):
    business_id = req.business_id
    with get_conn() as conn:
        uid = req.user_id or (str(user.id) if user else None)
        if uid:
            df = pd.read_sql_query("SELECT * FROM emissions WHERE user_id = ?", conn, params=(uid,))
        else:
            df = pd.read_sql_query("SELECT * FROM emissions WHERE business_id = ?", conn, params=(business_id,))
    if df.empty: raise HTTPException(404, "No data")
    total = df['emissions_kgCO2e'].sum()
    cats = df.groupby('source_category')['emissions_kgCO2e'].sum().to_dict()
    prompt = f"Write an executive summary for a Carbon Emission Report.\nTotal: {total:.2f} kgCO2e.\nBreakdown: {cats}\nTone: Professional, max 100 words."
    summary = await ask_gemini(prompt)
    # PDF Generation using SimpleDocTemplate for automatic layout handling
    buffer = io.BytesIO()
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72, leftMargin=72,
        topMargin=72, bottomMargin=72
    )
    
    Story = []
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = styles["Heading1"]
    title_style.alignment = 1 # Center
    
    normal_style = styles["Normal"]
    normal_style.fontSize = 11
    normal_style.leading = 14
    
    # Title
    Story.append(Paragraph(f"Carbon Report: {business_id}", title_style))
    Story.append(Spacer(1, 12))
    
    # Subtitle
    Story.append(Paragraph(f"<b>Total Emissions:</b> {total:.2f} kgCO2e", normal_style))
    Story.append(Spacer(1, 24))
    
    # Executive Summary
    Story.append(Paragraph("<b>Executive Summary</b>", styles["Heading3"]))
    Story.append(Spacer(1, 12))
    
    # Handle newlines in AI response
    formatted_summary = summary.replace('\n', '<br/>')
    Story.append(Paragraph(formatted_summary, normal_style))
    Story.append(Spacer(1, 24))
    
    # Pie Chart
    # We need to render the drawing to a flowable or keep using the drawing flowable if available
    # For simplicity in SimpleDocTemplate with Drawing, we wrap it
    drawing = Drawing(400, 200)
    pie = Pie()
    pie.x = 100
    pie.y = 50
    pie.data = list(cats.values())
    pie.labels = list(cats.keys())
    
    # Legend/Labels - ReportLab Pie chart is simple, might need explicit legend or better sizing
    # Making it simpler for stability:
    pie.width = 150
    pie.height = 150
    
    drawing.add(pie)
    Story.append(drawing)
    
    doc.build(Story)
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=report_{business_id}.pdf"})

@app.post("/ai/chat")
async def chat_ai(payload: dict):
    prompt = payload.get("prompt", "")
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    reply = await ask_gemini(prompt)
    return {"success": True, "response": reply}

# --- SPA Fallback for Production ---
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

dist_path = os.path.join(os.path.dirname(__file__), "../frontend-react/dist")
if os.path.exists(dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
        index_path = os.path.join(dist_path, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "Frontend not built"}

if __name__ == "__main__":
    uvicorn.run("backend:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
