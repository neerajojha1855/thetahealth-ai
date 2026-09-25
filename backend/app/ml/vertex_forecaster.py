"""
ThetaHealth AI — Local ML Demand Forecaster
============================================
Loads the trained scikit-learn GradientBoosting model from disk and serves
real predictions for medicine demand at 7/14/30-day horizons.

Falls back to the deterministic simulation if model is not available.
"""

import os
import math
import pickle
import logging
from datetime import datetime, date, timedelta, timezone
from typing import List, Optional, Dict, Any

from app.schemas.analytics import (
    MedicineForecast,
    ForecastPoint,
    HourlyBedForecastPoint,
    BedDemandForecast,
)

logger = logging.getLogger("thetahealth.vertex_forecaster")

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "theta_demand_model.pkl")
TODAY = date.today()

# ─── Medicine metadata for display ───────────────────────────────────────────
MEDICINE_META: Dict[str, Dict] = {
    "MED-DOX-100": {"name": "Doxycycline 100mg Capsules", "base_burn": 38.0, "category": "Antibiotic-Dengue", "unit": "strips"},
    "MED-ART-60":  {"name": "Artesunate 60mg Injection", "base_burn": 5.5, "category": "Antimalarial", "unit": "vials"},
    "MED-PCM-500": {"name": "Paracetamol 500mg Tablets", "base_burn": 45.0, "category": "Antipyretic", "unit": "strips"},
    "MED-IVF-NS":  {"name": "Normal Saline 0.9% IV Infusion", "base_burn": 22.0, "category": "IV Fluid", "unit": "bottles"},
    "MED-ORS-WHO": {"name": "Oral Rehydration Salts (WHO Formula)", "base_burn": 32.0, "category": "ORS", "unit": "sachets"},
    "MED-AMX-500": {"name": "Amoxicillin 500mg Capsules", "base_burn": 22.0, "category": "Antibiotic", "unit": "strips"},
    "MED-DNG-NS1": {"name": "Dengue NS1 Antigen Rapid Kit", "base_burn": 8.0, "category": "Diagnostic", "unit": "kits"},
    "MED-MAL-RDT": {"name": "Malaria RDT Kit", "base_burn": 6.0, "category": "Diagnostic", "unit": "kits"},
}

FACILITY_META: Dict[str, Dict] = {
    "FAC-UP-MEE-001": {"name": "District Hospital Meerut", "type": "HOSPITAL", "state": "ST-UP"},
    "FAC-UP-MEE-002": {"name": "PHC Anandpur", "type": "PHC", "state": "ST-UP"},
    "FAC-UP-MEE-003": {"name": "PHC Rampur", "type": "PHC", "state": "ST-UP"},
    "FAC-UP-LKO-001": {"name": "Central Medical Warehouse Lucknow", "type": "WAREHOUSE", "state": "ST-UP"},
    "FAC-DL-CEN-001": {"name": "AIIMS New Delhi", "type": "HOSPITAL", "state": "ST-DL"},
    "FAC-MH-MUM-001": {"name": "KEM Hospital Mumbai", "type": "HOSPITAL", "state": "ST-MH"},
    "FAC-KA-BLR-001": {"name": "Victoria Hospital Bangalore", "type": "HOSPITAL", "state": "ST-KA"},
    "FAC-TN-CHE-001": {"name": "RGGGH Chennai", "type": "HOSPITAL", "state": "ST-TN"},
}

SEASONAL_PATTERNS: Dict[str, List[float]] = {
    "Antibiotic-Dengue": [0.7, 0.6, 0.7, 0.8, 0.9, 1.1, 1.3, 1.6, 1.8, 2.0, 1.5, 0.9],
    "Antimalarial":      [0.7, 0.6, 0.7, 0.8, 1.0, 1.3, 1.6, 1.8, 1.7, 1.4, 1.0, 0.8],
    "Diagnostic":        [0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.3, 1.5, 1.6, 1.8, 1.3, 0.9],
    "IV Fluid":          [0.8, 0.8, 1.0, 1.3, 1.5, 1.4, 1.2, 1.1, 1.0, 0.8, 0.7, 0.7],
    "ORS":               [0.8, 0.8, 1.0, 1.3, 1.5, 1.4, 1.2, 1.1, 1.0, 0.8, 0.7, 0.7],
    "Antipyretic":       [0.9, 0.8, 0.9, 1.0, 1.1, 1.0, 1.1, 1.2, 1.1, 1.2, 1.1, 1.0],
    "Antibiotic":        [0.9, 0.9, 0.9, 1.0, 1.0, 1.1, 1.1, 1.1, 1.0, 1.0, 1.0, 1.0],
}

DOW_FACTORS = [1.15, 1.05, 1.0, 1.0, 1.10, 0.90, 0.70]

# Active outbreaks (deterministic for demo)
ACTIVE_OUTBREAKS = {
    "ST-UP": {
        "categories": ["Antibiotic-Dengue", "Diagnostic", "IV Fluid", "ORS"],
        "multiplier": 2.8,
        "label": "Dengue Outbreak — Meerut District",
    }
}


class VertexForecaster:
    """
    Demand forecaster using trained local ML model with Vertex AI fallback path.
    """

    def __init__(self):
        self._model = None
        self._artifacts: Optional[Dict[str, Any]] = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                with open(MODEL_PATH, "rb") as f:
                    self._artifacts = pickle.load(f)
                self._model = self._artifacts["model"]
                metrics = self._artifacts.get("metrics", {})
                logger.info(
                    f"ML model loaded. MAE={metrics.get('mae','?')} R2={metrics.get('r2','?')}"
                )
            except Exception as e:
                logger.warning(f"Could not load ML model: {e}. Using simulation fallback.")
        else:
            logger.info("ML model artifact not found. Using deterministic simulation.")

    def _get_seasonal_factor(self, month: int, category: str) -> float:
        pattern = SEASONAL_PATTERNS.get(category, [1.0] * 12)
        return pattern[month - 1]

    def _is_outbreak_affected(self, state_id: str, category: str) -> float:
        ob = ACTIVE_OUTBREAKS.get(state_id)
        if ob and category in ob["categories"]:
            return ob["multiplier"]
        return 1.0

    def _ml_predict(self, facility_id: str, medicine_id: str, target_date: date) -> Optional[float]:
        """Use loaded ML model to predict daily demand."""
        if not self._model or not self._artifacts:
            return None

        try:
            fac_enc = self._artifacts["facility_encoder"]
            med_enc = self._artifacts["medicine_encoder"]
            state_enc = self._artifacts["state_encoder"]
            cat_enc = self._artifacts["category_encoder"]

            med_meta = MEDICINE_META.get(medicine_id, {})
            fac_meta = FACILITY_META.get(facility_id, {})
            
            category = med_meta.get("category", "Antibiotic")
            state_id = fac_meta.get("state", "ST-UP")
            
            # Handle unseen labels gracefully
            try:
                fac_encoded = fac_enc.transform([facility_id])[0]
            except ValueError:
                fac_encoded = 0
            
            try:
                med_encoded = med_enc.transform([medicine_id])[0]
            except ValueError:
                med_encoded = 0
            
            try:
                state_encoded = state_enc.transform([state_id])[0]
            except ValueError:
                state_encoded = 0
            
            try:
                cat_encoded = cat_enc.transform([category])[0]
            except ValueError:
                cat_encoded = 0

            import numpy as np
            month = target_date.month
            dow = target_date.weekday()
            doy = target_date.timetuple().tm_yday
            seasonal = self._get_seasonal_factor(month, category)
            is_outbreak = 1 if self._is_outbreak_affected(state_id, category) > 1.1 else 0
            fac_demand = 1.0  # default

            X = np.array([[
                fac_encoded, med_encoded, state_encoded, cat_encoded,
                month, dow, doy,
                is_outbreak, seasonal, fac_demand
            ]])

            prediction = float(self._model.predict(X)[0])
            return max(0.0, prediction)
        except Exception as e:
            logger.warning(f"ML predict failed: {e}")
            return None

    def generate_medicine_forecast(
        self,
        medicine_id: str = "MED-DOX-100",
        facility_id: str = "FAC-UP-MEE-003",
        horizon_days: int = 14,
    ) -> MedicineForecast:
        
        med = MEDICINE_META.get(medicine_id, {
            "name": medicine_id,
            "base_burn": 20.0,
            "category": "Antibiotic",
            "unit": "units",
        })
        fac = FACILITY_META.get(facility_id, {
            "name": facility_id,
            "type": "PHC",
            "state": "ST-UP",
        })

        med_name = med["name"]
        base_burn = med["base_burn"]
        category = med["category"]
        state_id = fac.get("state", "ST-UP")
        fac_name = fac["name"]

        # Determine outbreak state
        outbreak_mult = self._is_outbreak_affected(state_id, category)
        anomaly_detected = outbreak_mult > 1.2
        anomaly_reason = None
        if anomaly_detected:
            ob = ACTIVE_OUTBREAKS.get(state_id, {})
            anomaly_reason = f"{ob.get('label', 'Outbreak')}: +{int((outbreak_mult-1)*100)}% vs baseline"

        # Current stock (deterministic by medicine)
        stock_map = {
            "MED-DOX-100": 80, "MED-ART-60": 25, "MED-PCM-500": 650,
            "MED-IVF-NS": 320, "MED-ORS-WHO": 480, "MED-AMX-500": 240,
            "MED-DNG-NS1": 45, "MED-MAL-RDT": 30,
        }
        current_stock = stock_map.get(medicine_id, 200)

        # ── Historical points (last 14 days) ──────────────────────────────
        historical_points: List[ForecastPoint] = []
        for i in range(14, 0, -1):
            past_date = TODAY - timedelta(days=i)
            seasonal = self._get_seasonal_factor(past_date.month, category)
            dow = DOW_FACTORS[past_date.weekday()]
            
            # Try ML prediction, fallback to simulation
            ml_pred = self._ml_predict(facility_id, medicine_id, past_date)
            if ml_pred is not None:
                actual = round(ml_pred, 1)
            else:
                actual = round(base_burn * seasonal * dow * (1 + (math.sin(i) * 0.1)), 1)
            
            historical_points.append(
                ForecastPoint(
                    date=past_date.isoformat(),
                    predicted_quantity=actual,
                    p10_lower=round(actual * 0.85, 1),
                    p90_upper=round(actual * 1.15, 1),
                    actual_quantity=actual,
                )
            )

        # ── Forecast points (future) ───────────────────────────────────────
        forecast_points: List[ForecastPoint] = []
        cumulative_burn = 0.0
        
        for i in range(1, horizon_days + 1):
            future_date = TODAY + timedelta(days=i)
            seasonal = self._get_seasonal_factor(future_date.month, category)
            dow = DOW_FACTORS[future_date.weekday()]
            
            # Graduated outbreak ramp
            if anomaly_detected:
                ramp = min(1.0, i / 7)
                effective_mult = 1.0 + (outbreak_mult - 1.0) * ramp
            else:
                effective_mult = 1.0
            
            ml_pred = self._ml_predict(facility_id, medicine_id, future_date)
            if ml_pred is not None:
                p50 = round(ml_pred * effective_mult, 1)
            else:
                p50 = round(base_burn * seasonal * dow * effective_mult * (1 + math.cos(i) * 0.05), 1)
            
            p10 = round(p50 * 0.82, 1)
            p90 = round(p50 * 1.22, 1)
            cumulative_burn += p50
            
            forecast_points.append(
                ForecastPoint(
                    date=future_date.isoformat(),
                    predicted_quantity=p50,
                    p10_lower=p10,
                    p90_upper=p90,
                    actual_quantity=None,
                )
            )

        # ── Derived metrics ────────────────────────────────────────────────
        avg_daily_burn = round(sum(p.predicted_quantity for p in forecast_points[:7]) / 7, 1)
        days_left = round(current_stock / avg_daily_burn, 1) if avg_daily_burn > 0 else 999.0
        stockout_date = (
            (TODAY + timedelta(days=int(days_left))).isoformat()
            if days_left < horizon_days else None
        )
        
        # Confidence based on model availability
        confidence = 0.94 if self._model else 0.88

        return MedicineForecast(
            medicine_id=medicine_id,
            medicine_name=med_name,
            facility_id=facility_id,
            facility_name=fac_name,
            horizon_days=horizon_days,
            current_stock=current_stock,
            predicted_burn_rate_daily=avg_daily_burn,
            days_until_stockout=days_left,
            predicted_stockout_date=stockout_date,
            historical_points=historical_points,
            forecast_points=forecast_points,
            confidence_score=confidence,
            anomaly_detected=anomaly_detected,
            anomaly_reason=anomaly_reason,
        )

    def generate_bed_forecast(
        self,
        facility_id: str = "FAC-UP-MEE-001",
        horizon_hours: int = 72,
    ) -> BedDemandForecast:
        now = datetime.now(timezone.utc)
        points: List[HourlyBedForecastPoint] = []

        fac = FACILITY_META.get(facility_id, {"name": facility_id})
        fac_name = fac.get("name", facility_id)

        base_general = 142
        base_icu = 18
        base_emg = 14

        # Dengue outbreak increases bed pressure
        state_id = fac.get("state", "ST-UP")
        has_outbreak = state_id in ACTIVE_OUTBREAKS
        outbreak_bed_mult = 1.25 if has_outbreak else 1.0

        for h in range(1, horizon_hours + 1, 3):
            t = now + timedelta(hours=h)
            # Diurnal variation: peak at 10:00 and 18:00
            hour_of_day = t.hour
            diurnal = 1.0 + 0.12 * math.sin(math.pi * hour_of_day / 12)
            surge_mult = outbreak_bed_mult * diurnal
            
            gen = int(base_general * surge_mult * (1 + h / 72 * 0.05))
            icu = int(base_icu * (1.0 + h / 72 * 0.28 * outbreak_bed_mult))
            emg = int(base_emg * surge_mult)
            
            surge_risk = round(min(1.0, 0.62 + (h / 72 * 0.22) * outbreak_bed_mult), 2)

            points.append(
                HourlyBedForecastPoint(
                    timestamp=t.strftime("%b %d, %H:%M"),
                    general_beds_demand=gen,
                    icu_beds_demand=icu,
                    emergency_beds_demand=emg,
                    surge_risk_score=surge_risk,
                )
            )

        return BedDemandForecast(
            facility_id=facility_id,
            facility_name=fac_name,
            horizon_hours=horizon_hours,
            points=points,
            peak_general_demand=max(p.general_beds_demand for p in points),
            peak_icu_demand=max(p.icu_beds_demand for p in points),
            icu_saturation_risk_pct=round(
                (max(p.icu_beds_demand for p in points) / 25) * 100, 1
            ),
        )


vertex_forecaster = VertexForecaster()
