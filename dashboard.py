import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import streamlit as st


# Streamlit Page Config

st.set_page_config(page_title="EcoImpact Dashboard", layout="wide")

st.title("EcoImpact Dashboard")
st.write("Interactive dashboard for emissions tracking across businesses.")


# Load Data

@st.cache_data
def load_data():
    return pd.read_csv("all_emission.csv")

all_emissions = load_data()


# Data Aggregations


# Emissions by Source Category
cat_data = all_emissions.groupby("source_category", as_index=False)["emissions_kgCO2e"].sum()

# Emissions by Business Type
bus_data = all_emissions.groupby("business_type", as_index=False)["emissions_kgCO2e"].sum()

# Emissions by Scope
scope_data = all_emissions.groupby("scope", as_index=False)["emissions_kgCO2e"].sum()

# Emissions Over Time
if "date" in all_emissions.columns:
    all_emissions["date"] = pd.to_datetime(all_emissions["date"], errors="coerce")
    time_data = all_emissions.groupby("date", as_index=False)["emissions_kgCO2e"].sum()
else:
    time_data = pd.DataFrame(columns=["date", "emissions_kgCO2e"])

# Create Plotly Subplots

fig = make_subplots(
    rows=2, cols=2,
    subplot_titles=("Emissions by Source Category", "Emissions by Business Type",
                    "Emissions Over Time", "Emissions by Scope"),
    specs=[[{"type": "bar"}, {"type": "bar"}],
           [{"type": "scatter"}, {"type": "pie"}]]
)

# 1. Bar chart - Source Category
fig.add_trace(
    go.Bar(x=cat_data["source_category"], y=cat_data["emissions_kgCO2e"],
           marker_color="#2E86AB", text=cat_data["emissions_kgCO2e"], textposition="outside"),
    row=1, col=1
)

# 2. Horizontal bar - Business Type
fig.add_trace(
    go.Bar(x=bus_data["emissions_kgCO2e"], y=bus_data["business_type"],
           orientation="h", marker_color="#2E86AB",
           text=bus_data["emissions_kgCO2e"], textposition="outside"),
    row=1, col=2
)

# 3. Line chart - Over Time
if not time_data.empty:
    fig.add_trace(
        go.Scatter(x=time_data["date"], y=time_data["emissions_kgCO2e"],
                   mode="lines+markers", line=dict(color="#2E86AB")),
        row=2, col=1
    )

# 4. Pie chart - Scope
fig.add_trace(
    go.Pie(labels=scope_data["scope"], values=scope_data["emissions_kgCO2e"],
           marker=dict(colors=["#2E86AB", "#4682B4", "#5DADE2"])),
    row=2, col=2
)


# Update Layout
fig.update_layout(
    height=800, width=1000,
    title_text="EcoImpact Dashboard",
    showlegend=True
)


# Streamlit Render

st.plotly_chart(fig, use_container_width=True)
