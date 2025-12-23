# GreenPulseNG VERSION 1 

**GreenPulseNG** provides AI-powered carbon emission tracking and insights tailored for Nigerian businesses. This repository contains the source code for Version 1.

## Live Demo
**Frontend Application:** [https://greenpulsefrontend.vercel.app/](https://greenpulsefrontend.vercel.app/)

---

## Project Structure

This project consists of two main components:

### 1. `backend/` (FastAPI)
The Python backend hosted on Render.
- **Key Features:**
  - REST API with FastAPI
  - AI Integration (Groq Llama 3) for insights and report generation
  - PDF Report Generation (ReportLab)
  - SQLite Database (Production ready for migration to PostgreSQL)

### 2. `frontend-react/` (React + Vite)
The Frontend UI hosted on Vercel.
- **Key Features:**
  - Modern React with functionality-first design
  - Firebase Authentication
  - Real-time Emissions Dashboard
  - Interactive AI Chat Interface
  - Responsive Mobile Design

---

##  Setup & Deployment

### Backend Setup
1. Navigate to `backend/`.
2. Create a virtual environment: `python -m venv venv`.
3. Install dependencies: `pip install -r requirements.txt`.
4. Create `.env` from `.env.example`.
5. Run locally: `uvicorn backend:app --reload`.

### Frontend Setup
1. Navigate to `frontend-react/`.
2. Install dependencies: `npm install`.
3. Create `.env` with Firebase credentials.
4. Run locally: `npm run dev`.

---

##  Development Journey
The creation of GreenPulseNG followed a rigorous software engineering process:
1.  **Architecture Design:** Decoupled Frontend (React) and Backend (FastAPI) for scalability.
2.  **Database Modeling:** Designed SQLite schema for users, emissions, and business profiles.
3.  **AI Integration:** Implemented Groq/Llama 3 for intelligent emission analysis and forecasting.
4.  **Security Implementation:** Secured API endpoints with OAuth2 and Firebase Authentication.
5.  **PDF Reporting Engine:** Built a custom PDF generator using ReportLab for professional-grade exports.
6.  **Responsive UI:** Crafted a mobile-first interface with "Quick Insights" and real-time dashboards.
7.  **Deployment Pipeline:** Established CI/CD workflows via Vercel (Frontend) and Render (Backend).

##  Version 1 Release Notes
- **AI-Powered Insights:** Custom analysis for Nigerian market context.
- **PDF Reporting:** robust layout engine for generating professional carbon reports.
- **Mobile Optimized:** fully responsive design including "Quick Insights" sidebar management.
- **Secure:** Firebase Auth integration and environment variable security.

---

*GreenPulseNG V1 - Empowering Sustainable Business in Nigeria*
