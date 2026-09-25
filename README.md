<div align="center">

# 🏥 ThetaHealth AI

### AI-Powered Healthcare Operations Intelligence & Supply Chain Resilience Platform

**Predict · Prevent · Coordinate · Resilience**

[![Track](https://img.shields.io/badge/Track-Smart%20Health%20%26%20Supply%20Chain-06b6d4?style=for-the-badge)](https://github.com)
[![Google AI](https://img.shields.io/badge/Google%20AI-Gemini%201.5%20Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)
[![Vertex AI](https://img.shields.io/badge/Vertex%20AI-AutoML%20Forecasting-0F9D58?style=for-the-badge&logo=google-cloud)](https://cloud.google.com/vertex-ai)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org)

</div>

---

## 📋 Overview

ThetaHealth AI is a **federated, AI-powered healthcare operations platform** designed for national-scale health resource and supply chain management across India's vast network of Primary Health Centres (PHCs), district hospitals, and state warehouses.

> **This is not a conventional hospital-management CRUD app.** It is an AI-driven resilience engine that continuously answers: *What is happening? What will happen next? What should we do about it?*

### The Core Intelligence Loop

```
OBSERVE → UNDERSTAND → PREDICT → DETECT RISK → RECOMMEND → HUMAN APPROVAL → ACT → MEASURE IMPACT → LEARN
```

### The Problem

Public healthcare systems across India face persistent supply chain vulnerabilities:

| Problem | Impact |
|---|---|
| **Invisible supply chains** | No real-time visibility into medicine stocks across 300+ PHCs |
| **Reactive crisis response** | Stock-outs discovered *after* they cause harm |
| **Fragmented data** | PHC workers report through paper; data never reaches decision-makers |
| **No predictive capability** | Seasonal surges and supplier delays not anticipated |
| **Manual redistribution** | Surplus at one facility cannot efficiently reach deficit at another |

---

## ✨ Key Features

### 🎯 National Health Command Center
Real-time operations dashboard — total facilities, active PHCs, bed availability, critical stock-outs, staff availability, and a national **Theta Resilience Score** (0–100).

### 🔮 AI-Powered Demand Forecasting (Vertex AI)
Trained Gradient Boosting model on **177,327 samples** across 18 months of synthetic historical data — medicine demand at 7/14/30-day horizons with outbreak-aware seasonal patterns.

### 🎙️ Theta Voice — PHC Natural Language Reporting
PHC workers report in plain language (voice or text). **Gemini 1.5 Flash** extracts structured operational data with per-field confidence scores. **Theta Clarify** asks follow-up questions when ambiguous ("Paracetamol 500mg or 650mg?").

### ⚠️ Stock-Out Prediction & Risk Radar
Every facility classified into risk tiers (🔴 Critical / 🟠 High / 🟡 Watch / 🟢 Stable). Predictive stock-out alerts with days-remaining calculations factoring in forecasted demand and active outbreaks.

### 🔄 Theta Resource Exchange
AI identifies surplus/deficit imbalances across the network and generates **redistribution recommendations** — fully explainable, requiring human approval before any transfer executes.

### 🚨 Emergency Command Mode
Dedicated outbreak command interface for declared emergencies (dengue, cholera, floods). Real-time impact metrics and recommended immediate actions.

### 🧪 What-If Simulator
Model "what if?" scenarios: +30% patient surge, +5-day supplier delay, -15% staff availability — see projected impact *before* the crisis arrives.

### 🤖 Ask Theta — AI Copilot
Natural-language query interface powered by Gemini. Grounded in authoritative Firestore/BigQuery data — never fabricates numerical facts.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND  (React + Vite)                      │
│              Vercel CDN · TypeScript · Tailwind CSS              │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTPS REST
┌───────────────────────────▼──────────────────────────────────────┐
│                   BACKEND  (FastAPI · Cloud Run)                  │
│  Auth/RBAC · Pharmacy · Voice · Forecasting · Supply Chain       │
│  Emergency · Simulator · Copilot · Redistribution Engine         │
└──────┬──────────────┬──────────────┬───────────────┬────────────┘
       │              │              │               │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼────┐  ┌──────▼──────┐
│  Firestore  │ │  BigQuery  │ │ Vertex  │  │   Gemini    │
│  Real-Time  │ │ Historical │ │   AI    │  │  1.5 Flash  │
│   Ops State │ │ Analytics  │ │Forecast │  │  NLP/Extract│
└─────────────┘ └────────────┘ └─────────┘  └─────────────┘
```

### Three Architectural Layers

| Layer | System | Question It Answers |
|---|---|---|
| **Layer 1 — Operational Truth** | Firebase Firestore | "What is happening now?" |
| **Layer 2 — Historical Intelligence** | Google BigQuery | "What has happened?" |
| **Layer 3 — Predictive Intelligence** | Google Vertex AI | "What is likely to happen next?" |
| **Intelligence Interface** | Gemini API | "How can humans communicate with the system?" |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19 + Vite** | UI framework + build tool |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Utility-first styling |
| **shadcn/ui + Radix UI** | Accessible component system |
| **Recharts** | Demand forecasting charts |
| **React Router v7** | Client-side routing |
| **TanStack Query** | Server state + caching |

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.11+ + FastAPI** | Async REST API |
| **Pydantic v2** | Schema validation |
| **Firebase Admin SDK** | Firestore + Auth |
| **google-genai** | Gemini 1.5 Flash integration |
| **google-cloud-aiplatform** | Vertex AI |
| **scikit-learn** | Local ML model serving |
| **Uvicorn** | ASGI server |

### Google Cloud Services
| Service | Role |
|---|---|
| **Gemini 1.5 Flash** | PHC voice/text → structured JSON; ThetaBrief; Ask Theta |
| **Vertex AI** | Demand forecasting, stock-out prediction, bed demand |
| **Firebase Firestore** | Real-time operational state |
| **BigQuery** | Historical analytics warehouse |
| **Cloud Run** | Serverless backend compute |
| **Firebase Auth** | JWT-based authentication |
| **Secret Manager** | Credentials management |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.11+
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/thetahealth-ai.git
cd thetahealth-ai
```

### 2. Backend Setup
```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY (optional — falls back to rule-based extraction)

# Train the ML model (generates synthetic data + trains GBR model)
python train_model.py

# Start the API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API is now available at:
- **API Root**: http://localhost:8000/
- **Interactive Docs**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Verify VITE_API_URL=http://localhost:8000/api/v1

# Start development server
npm run dev
```

The frontend is now available at: **http://localhost:5173**

### 4. (Optional) Enable Gemini API
Add your API key to `backend/.env`:
```env
GEMINI_API_KEY=your-gemini-api-key-here
```
The system automatically upgrades from intelligent rule-based extraction to full **Gemini 1.5 Flash** NLP.

---

## 🧠 ML Training Pipeline

The training pipeline (`backend/train_model.py`) generates fully deterministic synthetic healthcare data and trains the demand forecasting model:

```bash
cd backend
python train_model.py
```

**What it does:**

1. **Generates facility network** — 10 states, 50 districts, 410 facilities (100 hospitals, 300 PHCs, 10 warehouses)
2. **Generates medicine catalog** — 90 SKUs across 25+ therapeutic categories (antipyretics, antibiotics, antimalarials, vaccines, IV fluids, diagnostics, surgical supplies)
3. **Generates 18 months of consumption history** — 208,620 records with:
   - India-specific seasonal patterns (dengue/malaria monsoon peaks, respiratory winter surge, dehydration summer peak)
   - Day-of-week demand variation (Monday catchup, Sunday low)
   - 3 injected outbreak events (Dengue Meerut 2026, Cholera WB 2025, Malaria MP 2025)
   - Gaussian noise for realism
4. **Trains Gradient Boosting Regressor** on 177,327 samples
5. **Saves artifacts** to `backend/ml/artifacts/theta_demand_model.pkl`
6. **Exports BigQuery-compatible JSONL** for analytics pipeline

**Model Performance:**
```
Algorithm  : Gradient Boosting Regressor (scikit-learn)
MAE        : 4.35 units/day
R² Score   : 0.6206
Train set  : 177,327 samples (85%)
Test set   : 31,293 samples (15%)
Features   : Facility, Medicine, State, Category, Month,
             Day-of-week, Day-of-year, Outbreak flag,
             Seasonal factor, Facility demand factor
```

---

## 📱 Application Pages

| Page | Route | Description |
|---|---|---|
| **National Command Center** | `/` | Real-time KPIs, Observe→Predict→Act workflow, live transaction stream |
| **Analytics & Forecasting** | `/analytics` | Recharts demand curves, Vertex AI AutoML, bed demand forecast |
| **Theta Voice** | `/voice` | Voice/text PHC reporting with Gemini NLP extraction |
| **Pharmacy FEFO** | `/pharmacy` | Inventory tracking, First-Expiry-First-Out compliance, batch management |
| **Supply Chain Control Tower** | `/supply-chain` | 5-tier pipeline visualization, AI redistribution recommendations |
| **Emergency Mode** | `/emergency` | Outbreak command interface with real-time impact metrics |
| **What-If Simulator** | `/simulator` | Scenario modeling (surge, delay, staffing) |
| **Ask Theta Copilot** | `/copilot` | Grounded natural language queries with source citations |
| **Facility Network** | `/facilities` | Digital twins across 400 facilities, risk radar |
| **Settings / RBAC** | `/settings` | 9-persona role switcher, access control matrix |

---

## 🔐 Role-Based Access Control (9 Tiers)

| Role | Name | Scope |
|---|---|---|
| `NATIONAL_ADMIN` | Dr. Aarti Sharma | All 10 states, 400 facilities |
| `STATE_DISTRICT_ADMIN` | Rajesh Varma | District Meerut (50 facilities) |
| `HOSPITAL_ADMIN` | Dr. Sanjay Gupta | Meerut District Hospital |
| `PHC_WORKER` | Sunita Devi | PHC Anandpur |
| `DOCTOR_NURSE` | Dr. Priya Patel | Clinical Ward, PHC Anandpur |
| `PHARMACIST` | Anil Deshmukh | Pharmacy Depot, Meerut DH |
| `SUPPLY_CHAIN_MANAGER` | Vikram Mehta | Northern Corridor Logistics |
| `EMERGENCY_OFFICER` | Col. Raghav Singhania | Dengue Outbreak Response |
| `ANALYST` | Meera Krishnan | Epidemiological Intelligence |

Switch between roles in **Settings** → "Switch Active Persona" to see role-scoped views.

---

## 🎯 Demo Scenarios

### Primary: Dengue Outbreak (Meerut, Uttar Pradesh)

This end-to-end scenario demonstrates the full intelligence loop:

1. **PHC Worker Reports** via Theta Voice:
   > *"Emergency — dengue outbreak surge, 45 new patients today at PHC Rampur"*
   
   → Gemini extracts `EMERGENCY_REPORT` intent with 93% confidence

2. **Risk Engine Activates**:
   - Doxycycline 100mg: **2.1 days remaining** (CRITICAL)
   - AI forecasts **+68% consumption surge** above baseline

3. **Redistribution Engine Generates Recommendation**:
   - Transfer #TX-8831: 400 strips from District Hospital Meerut (surplus: 28 days)
   - → PHC Rampur (deficit: 2.1 days), 18.4 km distance, 0.75h transit
   - AI confidence: **98%**

4. **Human Approves** → Firestore state updates:
   - PHC Rampur resilience: 64.0 → **86.4** ✅
   - Risk level: HIGH → **LOW**
   - Stock-out alert: **Resolved**

### Additional Scenarios
| Scenario | Trigger |
|---|---|
| Supply Chain Disruption | Supplier delayed 4 days — ORS sachets |
| ICU Surge | KEM Hospital Mumbai at 97.3% ICU capacity |
| Medicine Overstock | Amoxicillin batch expiring in 26 days — FEFO transfer |
| Staff Shortage | Unexpected absenteeism → workforce alert |

---

## 📡 API Reference

Base URL: `http://localhost:8000/api/v1`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/facilities` | List all facilities with digital twin state |
| `GET` | `/facilities/{id}` | Facility detail + risk breakdown |
| `GET` | `/operational/alerts` | Active operational alerts |
| `POST` | `/operational/transactions` | Record inventory transaction |
| `GET` | `/pharmacy/inventory/{facilityId}` | FEFO inventory with expiry risk |
| `POST` | `/voice/parse` | Parse PHC report → structured JSON (Gemini) |
| `POST` | `/voice/confirm-commit` | Commit validated report to Firestore |
| `GET` | `/analytics/forecast/medicine` | Vertex AI medicine demand forecast |
| `GET` | `/analytics/forecast/beds` | 72-hour bed demand forecast |
| `GET` | `/supply/summary` | Supply chain overview + recommendations |
| `POST` | `/supply/recommendations/{id}/approve` | Approve redistribution transfer |
| `POST` | `/supply/recommendations/{id}/reject` | Reject with reason |
| `POST` | `/copilot/query` | Ask Theta natural language query |
| `POST` | `/simulator/run` | Run what-if scenario simulation |
| `GET` | `/emergency/active` | Active emergency declarations |

Full interactive documentation: **http://localhost:8000/api/v1/docs**

---

## 🔒 AI Safety Principles

ThetaHealth AI is a **decision-support system**. We strictly enforce:

| Principle | Implementation |
|---|---|
| **No autonomous actions** | Every critical action requires authorized human approval |
| **No hallucinated facts** | All numerical data sourced from Firestore/BigQuery — Gemini never invents numbers |
| **Transparent confidence** | Every AI extraction shows per-field confidence scores |
| **Mandatory clarification** | Below-threshold confidence triggers conversational disambiguation |
| **Full audit trail** | All approvals, rejections, and extractions logged with user + timestamp |
| **No patient data** | Platform operates on operational/logistics data only — no clinical patient records |

---

## 🗂️ Project Structure

```
thetahealth-ai/
├── backend/
│   ├── app/
│   │   ├── ai/                  # Gemini extractor + Copilot engine
│   │   ├── api/v1/endpoints/    # FastAPI route handlers (11 modules)
│   │   ├── ml/                  # Vertex AI forecaster + model artifacts
│   │   ├── repositories/        # Firestore + BigQuery data access
│   │   ├── schemas/             # Pydantic v2 request/response models
│   │   ├── security/            # Firebase auth + 9-tier RBAC
│   │   ├── services/            # Business logic layer
│   │   └── utils/               # Config, helpers
│   ├── data/                    # Synthetic training data (CSV + JSONL)
│   ├── ml/artifacts/            # Trained model pickle
│   ├── train_model.py           # ML training pipeline
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   └── src/
│       ├── components/          # Reusable UI (shadcn/ui, charts, layout)
│       ├── features/            # Page-level feature modules (10 pages)
│       ├── hooks/               # Custom React hooks
│       ├── lib/                 # Firebase config, utilities
│       ├── services/            # API client functions
│       └── types/               # TypeScript type definitions
│
├── ARCHITECTURE.md              # Detailed system architecture
├── PRD.md                       # Product Requirements Document
├── tech_stack.md                # Technology stack reference
└── README.md                    # This file
```

---

## 🌍 Scalability & BRICS Vision

ThetaHealth AI is designed from the ground up for national and federated scale:

- **PHC → District → State → National** hierarchy built into the data model
- **Country-scoped data** with clean federation boundaries for cross-national deployment
- **Federated learning interface** — models designed for future cross-BRICS training without sharing sensitive patient data
- **Multilingual ready** — Gemini supports Hindi, Tamil, Bengali, and other regional languages (voice interface planned for Phase 2)
- **Offline-first PHC interface** — reports queue locally (IndexedDB) and sync when connectivity returns

---

## 🚢 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy via Vercel CLI or GitHub integration
```

Required environment variables in Vercel:
```
VITE_API_BASE_URL=https://your-cloud-run-url/api/v1
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

### Backend → Google Cloud Run
```bash
cd backend
gcloud builds submit --tag gcr.io/PROJECT_ID/thetahealth-api
gcloud run deploy thetahealth-api \
  --image gcr.io/PROJECT_ID/thetahealth-api \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

See [`gcp_backend_deployment_guide.md`](gcp_backend_deployment_guide.md) for the full guide.

---

## 📊 Evaluation Criteria Alignment

| Criterion | Weight | How We Address It |
|---|---|---|
| **AI/Technical Execution** | 25% | Real Gemini NLP + trained Vertex AI GBR model (R²=0.62, MAE=4.35) |
| **Problem-Solution Fit** | 20% | Full supply chain visibility, predictive stock-outs, redistribution engine |
| **Deployability & Scalability** | 20% | Cloud Run + Vercel, serverless, no Kubernetes required |
| **Depth & Reach Across India** | 20% | 10 states, 50 districts, 400 facilities, India seasonal patterns |
| **Impact Potential** | 15% | Preventable medicine shortages during outbreaks eliminated |

---

## 👥 Team Theta

Built for the **Build with AI: Code for Communities** Google Cloud Hackathon, Track 3 — Smart Health & Supply Chain Resilience, BRICS Theme: **Resilience**.

---

## 📄 License

MIT License — see [`LICENSE`](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for India's frontline healthcare workers**

*ThetaHealth AI — Predict · Prevent · Coordinate · Resilience*

</div>
