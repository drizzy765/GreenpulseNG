
# dashboard_extended.py
# Extended EcoImpact Tracker with Deeper Insights, Forecasting, Scenario Analysis, and Reporting

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.express as px
from prophet import Prophet
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io
import uuid

# Streamlit Page Config
st.set_page_config(page_title="EcoImpact Tracker", layout="wide")

st.title("EcoImpact Tracker")
st.write("Interactive dashboard for emissions tracking, forecasting, and insights across businesses.")

# Load Data
@st.cache_data
def load_data():
    df = pd.read_csv("all_emission.csv")
    df['date'] = pd.to_datetime(df['date'], format='%Y-%m', errors='coerce')
    return df

all_emissions = load_data()

# Sidebar for Business Selection
st.sidebar.title("Select Business")
business_ids = all_emissions['business_id'].unique()
selected_business = st.sidebar.selectbox("Business ID", business_ids)
business_type = all_emissions[all_emissions['business_id'] == selected_business]['business_type'].iloc[0]

# Tabs
tab1, tab2, tab3, tab4, tab5 = st.tabs(["Overview", "Emission Intensity", "Sector Benchmarks", "Top Contributors", "Forecast & Scenarios"])

# Tab 1: Overview (Original Dashboard)
with tab1:
    st.header(f"Emission Overview for {selected_business}")
    
    # Filter by selected business
    business_data = all_emissions[all_emissions['business_id'] == selected_business]
    
    # Data Aggregations
    cat_data = business_data.groupby("source_category", as_index=False)["emissions_kgCO2e"].sum()
    bus_data = all_emissions.groupby("business_type", as_index=False)["emissions_kgCO2e"].sum()
    scope_data = business_data.groupby("scope", as_index=False)["emissions_kgCO2e"].sum()
    time_data = business_data.groupby("date", as_index=False)["emissions_kgCO2e"].sum()

    # Subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=("Emissions by Source Category", "Emissions by Business Type",
                        "Emissions Over Time", "Emissions by Scope"),
        specs=[[{"type": "bar"}, {"type": "bar"}],
               [{"type": "scatter"}, {"type": "pie"}]]
    )

    # Bar: Source Category
    fig.add_trace(
        go.Bar(x=cat_data["source_category"], y=cat_data["emissions_kgCO2e"],
               marker_color="#2E86AB", text=cat_data["emissions_kgCO2e"].round(2), textposition="outside"),
        row=1, col=1
    )

    # Horizontal Bar: Business Type
    fig.add_trace(
        go.Bar(x=bus_data["emissions_kgCO2e"], y=bus_data["business_type"],
               orientation="h", marker_color="#2E86AB",
               text=bus_data["emissions_kgCO2e"].round(2), textposition="outside"),
        row=1, col=2
    )

    # Line: Over Time
    if not time_data.empty:
        fig.add_trace(
            go.Scatter(x=time_data["date"], y=time_data["emissions_kgCO2e"],
                       mode="lines+markers", line=dict(color="#2E86AB")),
            row=2, col=1
        )

    # Pie: Scope
    fig.add_trace(
        go.Pie(labels=scope_data["scope"], values=scope_data["emissions_kgCO2e"],
               marker=dict(colors=["#2E86AB", "#4682B4", "#5DADE2"])),
        row=2, col=2
    )

    fig.update_layout(height=800, width=1000, title_text=f"Overview for {selected_business}", showlegend=True)
    st.plotly_chart(fig, use_container_width=True)

# Tab 2: Emission Intensity
with tab2:
    st.header("Emission Intensity")
    intensity = all_emissions.groupby(['business_id', 'business_type'])['emissions_kgCO2e'].sum().reset_index()
    intensity['avg_monthly_emissions'] = (intensity['emissions_kgCO2e'] / 12).round(2)
    business_intensity = intensity[intensity['business_id'] == selected_business]
    
    st.metric(f"Average Monthly Emissions for {selected_business}", 
              f"{business_intensity['avg_monthly_emissions'].iloc[0]} kgCO2e")
    
    # Bar Plot
    fig_intensity = go.Figure()
    # Create comprehensive color mapping with fallback for all business types
    color_map = {
        'Bakery': '#2E86AB', 'Restaurant': '#4682B4', 'Supermarket': '#5DADE2',
        'Pharmacy': '#87CEEB', 'FuelStation': '#B0E0E6', 'SmallShop': '#90EE90',
        'ISP': '#FFB6C1', 'Hardware Store': '#DDA0DD', 'Consulting': '#F0E68C',
        'Gym': '#FF6347', 'Call Center': '#40E0D0', 'E-Commerce': '#FFD700',
        'Solar Installer': '#32CD32', 'Real Estate': '#9370DB', 'Insurance Broker': '#20B2AA',
        'Art Gallery': '#FF69B4', 'Laundromat': '#00CED1', 'Software Dev': '#1E90FF',
        'Law Firm': '#DC143C', 'Logistics Hub': '#FF8C00', 'Advertising Agency': '#8B008B',
        'Veterinary Clinic': '#2F4F4F', 'Data Center': '#708090'
    }
    # Use default color for any unmapped types
    default_color = '#CCCCCC'
    fig_intensity.add_trace(
        go.Bar(x=intensity['business_id'], y=intensity['avg_monthly_emissions'],
               marker_color=intensity['business_type'].map(color_map).fillna(default_color),
               text=intensity['avg_monthly_emissions'], textposition='outside')
    )
    fig_intensity.update_layout(
        title="Average Monthly Emissions by Business (2024)",
        xaxis_title="Business ID",
        yaxis_title="Avg Emissions (kgCO2e)",
        xaxis_tickangle=45
    )
    st.plotly_chart(fig_intensity, use_container_width=True)

# Tab 3: Sector Benchmarks
with tab3:
    st.header("Sector Benchmarks")
    benchmarks = all_emissions.groupby('business_type')['emissions_kgCO2e'].sum().reset_index()
    benchmarks['avg_emissions'] = (benchmarks['emissions_kgCO2e'] / all_emissions.groupby('business_type')['business_id'].nunique()).round(2)
    avg_sector = benchmarks[benchmarks['business_type'] == business_type]['avg_emissions'].iloc[0]
    
    st.write(f"Your sector ({business_type}) average: {avg_sector} kgCO2e")
    st.write(f"Your total emissions: {intensity[intensity['business_id'] == selected_business]['emissions_kgCO2e'].iloc[0]} kgCO2e")
    
    # Bar Plot
    fig_benchmarks = go.Figure()
    fig_benchmarks.add_trace(
        go.Bar(x=benchmarks['business_type'], y=benchmarks['avg_emissions'],
               marker_color='#2E86AB', text=benchmarks['avg_emissions'], textposition='outside')
    )
    fig_benchmarks.update_layout(
        title="Average Emissions by Sector (2024)",
        xaxis_title="Business Type",
        yaxis_title="Avg Emissions (kgCO2e)",
        xaxis_tickangle=45
    )
    st.plotly_chart(fig_benchmarks, use_container_width=True)

# Tab 4: Top Contributors
with tab4:
    st.header("Top Emission Sources")
    contributors = all_emissions[all_emissions['business_id'] == selected_business].groupby('source_category')['emissions_kgCO2e'].sum().reset_index()
    
    # Table
    st.write(contributors.rename(columns={'source_category': 'Source Category', 'emissions_kgCO2e': 'Emissions (kgCO2e)'}))

    # Pie Chart
    fig_contributors = go.Figure()
    fig_contributors.add_trace(
        go.Pie(labels=contributors['source_category'], values=contributors['emissions_kgCO2e'],
               marker=dict(colors=["#2E86AB", "#4682B4", "#5DADE2", "#87CEEB", "#B0E0E6"]))
    )
    fig_contributors.update_layout(title=f"Emission Sources for {selected_business} (2024)")
    st.plotly_chart(fig_contributors, use_container_width=True)

# Tab 5: Forecast & Scenarios
with tab5:
    st.header(" Emissions Forecasting & Scenarios")
    
    # Forecasting
    st.subheader("Forecast")
    source = st.selectbox("Choose Source Category for Forecasting:", all_emissions['source_category'].unique(), key='forecast_source')
    periods = st.slider("Months to Forecast:", 3, 24, 12, key='forecast_periods')
    
    # Filter data for selected business and source
    df_filtered = all_emissions[(all_emissions['business_id'] == selected_business) & 
                               (all_emissions['source_category'] == source)]
    monthly = df_filtered.groupby('date')['emissions_kgCO2e'].sum().reset_index()
    monthly['date'] = pd.to_datetime(monthly['date'])
    df_prophet = monthly.rename(columns={'date': 'ds', 'emissions_kgCO2e': 'y'})
    
    if not df_prophet.empty:
        model = Prophet()
        model.fit(df_prophet)
        future = model.make_future_dataframe(periods=periods, freq='M')
        forecast = model.predict(future)
        
        # Plotly Forecast Plot
        fig_forecast = go.Figure()
        fig_forecast.add_trace(
            go.Scatter(x=df_prophet['ds'], y=df_prophet['y'], mode='lines+markers', 
                       name='Historical', line=dict(color='#2E86AB'))
        )
        fig_forecast.add_trace(
            go.Scatter(x=forecast['ds'], y=forecast['yhat'], mode='lines', 
                       name='Forecast', line=dict(color='#4682B4'))
        )
        fig_forecast.add_trace(
            go.Scatter(x=forecast['ds'], y=forecast['yhat_lower'], mode='lines', 
                       name='Lower Bound', line=dict(color='#5DADE2', dash='dash'))
        )
        fig_forecast.add_trace(
            go.Scatter(x=forecast['ds'], y=forecast['yhat_upper'], mode='lines', 
                       name='Upper Bound', line=dict(color='#5DADE2', dash='dash'))
        )
        fig_forecast.update_layout(
            title=f"Emissions Forecast for {selected_business} ({source})",
            xaxis_title="Date",
            yaxis_title="Emissions (kgCO2e)",
            showlegend=True
        )
        st.plotly_chart(fig_forecast, use_container_width=True)
    else:
        st.warning("Not enough data to forecast for this selection.")

    # Scenario Analysis
    st.subheader(" Scenario Analysis")
    waste_reduction = st.slider("Reduce Waste Emissions (%)", 0, 50, 10, key='waste_reduction')
    solar_percentage = st.slider("Switch to Solar Electricity (%)", 0, 100, 0, key='solar_percentage')
    
    # Get original business data for comparison (from tab1 scope)
    original_business_data = all_emissions[all_emissions['business_id'] == selected_business].copy()
    original_total = original_business_data['emissions_kgCO2e'].sum()
    
    # Simulate reductions - work on a copy to avoid modifying original
    sim_data = original_business_data.copy()
    
    # Apply waste reduction directly to emissions (not emission_factor)
    sim_data.loc[sim_data['source_category'] == 'waste', 'emissions_kgCO2e'] *= (1 - waste_reduction / 100)
    
    # Apply solar percentage reduction to electricity emissions (not emission_factor)
    # This correctly reduces electricity emissions by the solar percentage
    sim_data.loc[sim_data['source_category'] == 'electricity', 'emissions_kgCO2e'] *= (1 - solar_percentage / 100)
    
    # Calculate new total from modified emissions (don't recalculate from amount * factor)
    new_total = sim_data['emissions_kgCO2e'].sum()
    st.metric("Simulated Emissions Reduction", f"{(original_total - new_total).round(2)} kgCO2e")

    # Bar Plot for Comparison
    fig_scenario = go.Figure()
    fig_scenario.add_trace(
        go.Bar(x=['Original', 'Simulated'], y=[original_total, new_total],
               marker_color=['#2E86AB', '#5DADE2'],
               text=[original_total.round(2), new_total.round(2)], textposition='outside')
    )
    fig_scenario.update_layout(
        title="Original vs Simulated Emissions",
        yaxis_title="Emissions (kgCO2e)",
        showlegend=False
    )
    st.plotly_chart(fig_scenario, use_container_width=True)

# PDF Report Generation
def generate_pdf_report(business_id, business_type, intensity, contributors, avg_sector, forecast_data=None):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.setFont("Helvetica", 12)
    
    c.drawString(100, 750, f"EcoImpact Report for {business_id} ({business_type})")
    c.drawString(100, 730, f"Total Emissions (2024): {intensity[intensity['business_id'] == business_id]['emissions_kgCO2e'].iloc[0]} kgCO2e")
    c.drawString(100, 710, f"Average Monthly Emissions: {intensity[intensity['business_id'] == business_id]['avg_monthly_emissions'].iloc[0]} kgCO2e")
    c.drawString(100, 690, f"Sector Average ({business_type}): {avg_sector} kgCO2e")
    
    c.drawString(100, 670, "Top Emission Sources:")
    y = 650
    for _, row in contributors.iterrows():
        c.drawString(120, y, f"{row['source_category']}: {round(row['emissions_kgCO2e'], 2)} kgCO2e")  # <-- FIXED HERE
        y -= 20
    
    c.drawString(100, y-20, "Recommendations:")
    c.drawString(120, y-40, "- Switch to renewable energy to reduce electricity emissions.")
    c.drawString(120, y-60, "- Increase recycling to lower waste emissions.")
    
    if forecast_data is not None:
        c.drawString(100, y-80, "Forecast (Next 12 Months):")
        c.drawString(120, y-100, f"Predicted Emissions: {round(forecast_data['yhat'].iloc[-1], 2)} kgCO2e")  # <-- FIXED HERE
    
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer
# ...existing code...
# ...existing code...

# PDF Report Download Section (add after all tabs, before sidebar instructions)
st.sidebar.header("Download PDF Report")
if st.sidebar.button("Generate PDF Report"):
    # You may want to pass forecast data from tab5 if available
    pdf_buffer = generate_pdf_report(
        selected_business,
        business_type,
        intensity,
        contributors,
        avg_sector
        # , forecast_data=forecast if you want to include forecast
    )
    st.sidebar.download_button(
        label="Download EcoImpact PDF Report",
        data=pdf_buffer,
        file_name=f"EcoImpact_Report_{selected_business}.pdf",
        mime="application/pdf"
    )

# ...existing code...
# Sidebar Instructions
st.sidebar.markdown("""
### How to Use
1. Select a Business ID.
2. Explore tabs for insights, forecasts, and scenarios.
3. Download a PDF report for detailed analysis.
""")
