# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Development Commands

### Backend (FastAPI + Python)
```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Train the ML model (generates synthetic data + trains model)
python train_model.py

# Start the API server (development mode)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Run tests
pytest
```

### Frontend (React + Vite + TypeScript)
```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Environment Setup
1. Backend: Copy `.env.example` to `.env` and add your `GEMINI_API_KEY` (optional)
2. Frontend: Copy `.env.example` to `.env` and verify `VITE_API_URL=http://localhost:8000/api/v1`

## 🏗️ Code Architecture

### Three-Layer Architecture (Per README)
1. **Layer 1 — Operational Truth** (Firebase Firestore): Real-time state ("What is happening now?")
2. **Layer 2 — Historical Intelligence** (Google BigQuery): Historical analytics ("What has happened?")
3. **Layer 3 — Predictive Intelligence** (Google Vertex AI): Demand forecasting ("What is likely to happen next?")
4. **Intelligence Interface** (Gemini API): Natural language processing for voice/text reports

### Backend Structure (`backend/app/`)
- `api/v1/endpoints/`: REST API route handlers (11 modules for facilities, auth, voice, pharmacy, etc.)
- `ai/`: Gemini extractor (`gemini_extractor.py`) and Copilot engine (`copilot_engine.py`)
- `ml/`: Vertex AI forecaster and model artifacts
- `repositories/`: Firestore + BigQuery data access layer
- `schemas/`: Pydantic v2 request/response models
- `services/`: Business logic layer
- `security/`: Firebase auth + 9-tier RBAC system
- `utils/`: Configuration helpers

### Frontend Structure (`frontend/src/`)
- `components/`: Reusable UI components (shadcn/ui, Radix UI)
- `features/`: Page-level modules (10 pages: dashboard, analytics, voice, pharmacy, supply-chain, etc.)
- `hooks/`: Custom React hooks
- `lib/`: Firebase configuration and utilities
- `services/`: API client functions (TanStack Query integration)
- `types/`: TypeScript type definitions

### Key Technologies
- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Recharts + React Router v7 + TanStack Query
- **Backend**: Python 3.11+ + FastAPI + Pydantic v2 + Firebase Admin SDK + Google Cloud AI Platform + google-genai
- **Infrastructure**: Vercel (frontend) + Cloud Run (backend) + Firebase Firestore + BigQuery + Vertex AI

## 📱 Application Pages
- `/`: National Command Center (real-time KPIs)
- `/analytics`: Demand forecasting and analytics
- `/voice`: Theta Voice PHC reporting
- `/pharmacy`: Inventory tracking (FEFO)
- `/supply-chain`: Supply chain control tower
- `/emergency`: Emergency command interface
- `/simulator`: What-if scenario modeling
- `/copilot`: Ask Theta natural language queries
- `/facilities`: Facility network and risk radar
- `/settings`: Role-based access control (9 tiers)

## 🔐 Role-Based Access Control (9 Tiers)
Switch between personas in Settings to see role-scoped views:
1. NATIONAL_ADMIN (all facilities)
2. STATE_DISTRICT_ADMIN (district-level)
3. HOSPITAL_ADMIN
4. PHC_WORKER
5. DOCTOR_NURSE
6. PHARMACIST
7. SUPPLY_CHAIN_MANAGER
8. EMERGENCY_OFFICER
9. ANALYST

## 📊 ML Training Pipeline
Run `python train_model.py` in backend/ to:
1. Generate synthetic healthcare data (410 facilities, 90 medicine SKUs, 18 months history)
2. Train Gradient Boosting Regressor model (MAE: 4.35, R²: 0.62)
3. Save model artifacts to `backend/ml/artifacts/`

## 🚀 Deployment
- **Frontend**: `npm run build` → Deploy to Vercel
- **Backend**: Docker build → Deploy to Google Cloud Run
- See `gcp_backend_deployment_guide.md` and `vercel_frontend_deployment_guide.md` for detailed guides

## 🔑 Important Notes
- The platform implements AI safety principles: no autonomous actions, no hallucinated facts, mandatory clarification, full audit trail
- Designed for national-scale deployment across India's healthcare system (10 states, 50 districts, 400+ facilities)
- Uses synthetic data for demo purposes; production would connect to real healthcare data sources