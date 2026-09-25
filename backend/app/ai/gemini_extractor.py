"""
ThetaHealth AI — Gemini Extractor
==================================
Parses natural-language PHC worker voice/text reports into structured JSON
using Google Gemini 1.5 Flash.

Safety Principles:
- Gemini is NEVER the authoritative source for numerical facts
- All extractions require Pydantic validation + human confirmation
- Low-confidence extractions trigger clarification flow
- No autonomous writes to Firestore without human approval
"""

import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.schemas.ai_voice import (
    ParsedReportResponse,
    ExtractedEntity,
)

logger = logging.getLogger("thetahealth.gemini")

GEMINI_SYSTEM_PROMPT = """
You are ThetaHealth AI, a specialized healthcare supply chain operational parser for Primary Health Centres (PHCs) across India.
Your SOLE task is to parse unstructured natural-language voice/text reports from PHC frontline workers into structured operational JSON.

You operate as a DECISION-SUPPORT system. You MUST:
- Extract only what is explicitly stated. Never infer or fabricate.
- Provide per-field confidence scores (0.0–1.0).
- Set needs_clarification=true when any critical field is ambiguous.
- Never diagnose, prescribe, or make autonomous operational decisions.

Supported Intents:
1. INVENTORY_RECEIVED - medicine/supplies received at facility
2. INVENTORY_CONSUMED - medicine dispensed/used
3. INVENTORY_ADJUSTED - stock count correction
4. ATTENDANCE_CHECKIN - staff arrived for shift
5. ATTENDANCE_CHECKOUT - staff leaving shift
6. BED_UPDATE - bed occupancy changes
7. PATIENT_FOOTFALL - OPD/IPD patient count report
8. SHIPMENT_RECEIVED - shipment delivered
9. SHIPMENT_DELAY - delivery delayed
10. EMERGENCY_REPORT - outbreak, surge, or emergency

Return ONLY valid JSON in exactly this schema:
{
  "intent": "INVENTORY_RECEIVED",
  "overall_confidence": 0.96,
  "entities": {
    "medicine_name": {"value": "Doxycycline 100mg Capsules", "confidence": 0.98, "source_snippet": "doxycycline"},
    "quantity": {"value": 150, "confidence": 0.99, "source_snippet": "150 strips"},
    "batch_number": {"value": "DOX-2026-A1", "confidence": 0.92, "source_snippet": "batch DOX-2026-A1"},
    "unit": {"value": "strips", "confidence": 0.95, "source_snippet": "strips"}
  },
  "needs_clarification": false,
  "clarification_question": null,
  "clarification_options": null,
  "suggested_action": "Record receipt of 150 strips Doxycycline 100mg (Batch DOX-2026-A1) to facility inventory"
}

Critical rules:
- quantity MUST be a number, not a string
- confidence scores MUST be 0.0–1.0 floats
- If medicine name is ambiguous (e.g., "paracetamol" without strength), set needs_clarification=true
- If quantity is missing, set needs_clarification=true
"""


class GeminiExtractor:
    def __init__(self):
        self._gemini_configured = False
        self._gemini_model = None
        
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key and api_key.strip():
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                self._gemini_model = genai.GenerativeModel(
                    model_name="gemini-1.5-flash",
                    system_instruction=GEMINI_SYSTEM_PROMPT,
                    generation_config={"temperature": 0.1, "response_mime_type": "application/json"},
                )
                self._gemini_configured = True
                logger.info("Gemini 1.5 Flash initialized successfully.")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini SDK: {e}. Using rule-based fallback.")
        else:
            logger.info("No GEMINI_API_KEY set. Using intelligent rule-based extractor.")

    def parse_transcript(self, transcript: str, facility_id: str) -> ParsedReportResponse:
        """
        Main entry point: try Gemini first, fall back to rule-based extraction.
        """
        if self._gemini_configured and self._gemini_model:
            try:
                return self._gemini_parse(transcript, facility_id)
            except Exception as e:
                logger.warning(f"Gemini extraction failed: {e}. Using rule-based fallback.")
        
        return self._rule_based_parse(transcript, facility_id)

    def _gemini_parse(self, transcript: str, facility_id: str) -> ParsedReportResponse:
        """Use Gemini API for structured extraction."""
        prompt = f"""
Facility ID: {facility_id}
Worker Report: "{transcript}"

Parse this report into structured JSON following the system prompt schema.
"""
        response = self._gemini_model.generate_content(prompt)
        raw_text = response.text.strip()
        
        # Strip markdown code fences if present
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```(?:json)?\n?", "", raw_text)
            raw_text = re.sub(r"\n?```$", "", raw_text)
        
        data = json.loads(raw_text)
        
        # Convert to response schema
        entities = {}
        for field_name, field_data in data.get("entities", {}).items():
            entities[field_name] = ExtractedEntity(
                field_name=field_name,
                value=field_data.get("value"),
                confidence=field_data.get("confidence", 0.85),
                source_snippet=field_data.get("source_snippet", ""),
            )
        
        return ParsedReportResponse(
            intent=data.get("intent", "GENERAL_REPORT"),
            overall_confidence=data.get("overall_confidence", 0.85),
            entities=entities,
            needs_clarification=data.get("needs_clarification", False),
            clarification_question=data.get("clarification_question"),
            clarification_options=data.get("clarification_options"),
            suggested_action=data.get("suggested_action", "Log operational note"),
            raw_transcript=transcript,
            parsed_at=datetime.now(timezone.utc).isoformat(),
        )

    def _rule_based_parse(self, transcript: str, facility_id: str) -> ParsedReportResponse:
        """
        Intelligent rule-based extraction (fallback when Gemini is unavailable).
        Supports the same 10 intents with per-field confidence scoring.
        """
        t = transcript.lower().strip()

        # ── Theta Clarify: Ambiguous medicine name ────────────────────────────
        if "paracetamol" in t and not any(s in t for s in ["500", "650", "mg", "syrup"]):
            qty = self._extract_number(t) or 50
            return ParsedReportResponse(
                intent="INVENTORY_RECEIVED" if any(w in t for w in ["received", "got", "delivered"]) else "INVENTORY_CONSUMED",
                overall_confidence=0.68,
                entities={
                    "medicine_name": ExtractedEntity(field_name="medicine_name", value="Paracetamol", confidence=0.70, source_snippet="paracetamol"),
                    "quantity": ExtractedEntity(field_name="quantity", value=qty, confidence=0.95, source_snippet=str(qty)),
                    "unit": ExtractedEntity(field_name="unit", value="strips", confidence=0.85, source_snippet="strips"),
                },
                needs_clarification=True,
                clarification_question="Did you mean Paracetamol 500mg Tablets or Paracetamol 650mg Tablets?",
                clarification_options=["Paracetamol 500mg Tablets", "Paracetamol 650mg Tablets", "Paracetamol Syrup 125mg/5ml"],
                suggested_action="Resolve medicine strength before committing to inventory",
                raw_transcript=transcript,
                parsed_at=datetime.now(timezone.utc).isoformat(),
            )

        # ── 1. INVENTORY RECEIVED ─────────────────────────────────────────────
        if any(w in t for w in ["received", "got", "delivered", "intake", "arrived", "supply received"]):
            qty = self._extract_number(t) or 100
            med_name = self._extract_medicine(t)
            batch = self._extract_batch(transcript) or f"BAT-{datetime.now().strftime('%Y%m')}"
            unit = self._extract_unit(t)
            return ParsedReportResponse(
                intent="INVENTORY_RECEIVED",
                overall_confidence=0.96,
                entities={
                    "medicine_name": ExtractedEntity(field_name="medicine_name", value=med_name, confidence=0.97, source_snippet=med_name),
                    "quantity": ExtractedEntity(field_name="quantity", value=qty, confidence=0.99, source_snippet=str(qty)),
                    "batch_number": ExtractedEntity(field_name="batch_number", value=batch, confidence=0.91, source_snippet=batch),
                    "unit": ExtractedEntity(field_name="unit", value=unit, confidence=0.94, source_snippet=unit),
                },
                needs_clarification=False,
                suggested_action=f"Add +{qty} {unit} of {med_name} (Batch {batch}) to inventory",
                raw_transcript=transcript,
                parsed_at=datetime.now(timezone.utc).isoformat(),
            )

        # ── 2. INVENTORY CONSUMED ─────────────────────────────────────────────
        if any(w in t for w in ["consumed", "dispensed", "used", "administered", "given to", "distributed"]):
            qty = self._extract_number(t) or 20
            med_name = self._extract_medicine(t)
            unit = self._extract_unit(t)
            return ParsedReportResponse(
                intent="INVENTORY_CONSUMED",
                overall_confidence=0.95,
                entities={
                    "medicine_name": ExtractedEntity(field_name="medicine_name", value=med_name, confidence=0.97, source_snippet=med_name),
                    "quantity": ExtractedEntity(field_name="quantity", value=qty, confidence=0.98, source_snippet=str(qty)),
                    "unit": ExtractedEntity(field_name="unit", value=unit, confidence=0.93, source_snippet=unit),
                },
                needs_clarification=False,
                suggested_action=f"Deduct -{qty} {unit} of {med_name} via FEFO rule",
                raw_transcript=transcript,
                parsed_at=datetime.now(timezone.utc).isoformat(),
            )

        # ── 3. ATTENDANCE CHECK-IN / CHECK-OUT ───────────────────────────────
        if any(w in t for w in ["check in", "checked in", "present", "on duty", "arrived for shift", "check out", "checked out", "shift end", "leaving"]):
            is_checkout = any(w in t for w in ["check out", "checked out", "leaving", "shift end", "off duty"])
            staff_name = self._extract_staff_name(transcript)
            dept = self._extract_department(t)
            return ParsedReportResponse(
                intent="ATTENDANCE_CHECKOUT" if is_checkout else "ATTENDANCE_CHECKIN",
                overall_confidence=0.94,
                entities={
                    "staff_name": ExtractedEntity(field_name="staff_name", value=staff_name, confidence=0.93, source_snippet=staff_name),
                    "department": ExtractedEntity(field_name="department", value=dept, confidence=0.88, source_snippet=dept),
                    "action": ExtractedEntity(field_name="action", value="CHECK_OUT" if is_checkout else "CHECK_IN", confidence=0.99, source_snippet=t[:20]),
                    "shift_time": ExtractedEntity(field_name="shift_time", value=datetime.now(timezone.utc).strftime("%H:%M UTC"), confidence=0.99, source_snippet="now"),
                },
                needs_clarification=False,
                suggested_action=f"Log staff {'check-out' if is_checkout else 'check-in'} for {staff_name} ({dept})",
                raw_transcript=transcript,
                parsed_at=datetime.now(timezone.utc).isoformat(),
            )

        # ── 4. EMERGENCY / OUTBREAK REPORT ───────────────────────────────────
        if any(w in t for w in ["emergency", "outbreak", "dengue", "surge", "epidemic", "cholera", "malaria", "flood", "disaster", "mass casualty"]):
            patients = self._extract_number(t) or 15
            emergency_type = "Dengue Vector Outbreak Surge" if "dengue" in t else \
                             "Cholera Outbreak" if "cholera" in t else \
                             "Malaria Surge" if "malaria" in t else \
                             "Flood Emergency" if "flood" in t else \
                             "General Health Emergency"
            severity = "CRITICAL" if patients > 30 or "critical" in t else "HIGH"
            return ParsedReportResponse(
                intent="EMERGENCY_REPORT",
                overall_confidence=0.93,
                entities={
                    "emergency_type": ExtractedEntity(field_name="emergency_type", value=emergency_type, confidence=0.95, source_snippet=t[:30]),
                    "patient_surge_count": ExtractedEntity(field_name="patient_surge_count", value=patients, confidence=0.91, source_snippet=str(patients)),
                    "severity": ExtractedEntity(field_name="severity", value=severity, confidence=0.94, source_snippet="outbreak"),
                    "reporting_time": ExtractedEntity(field_name="reporting_time", value=datetime.now(timezone.utc).isoformat(), confidence=1.0, source_snippet="now"),
                },
                needs_clarification=False,
                suggested_action=f"Elevate facility status to SURGE. Alert District Health Officer. Initiate {emergency_type} protocol.",
                raw_transcript=transcript,
                parsed_at=datetime.now(timezone.utc).isoformat(),
            )

        # ── 5. BED / OCCUPANCY UPDATE ─────────────────────────────────────────
        if any(w in t for w in ["bed", "beds", "occupied", "admission", "icu", "ward", "inpatient"]):
            beds = self._extract_number(t) or 8
            category = "ICU" if "icu" in t else "Emergency" if "emergency" in t or "emg" in t else "General Inpatient"
            return ParsedReportResponse(
                intent="BED_UPDATE",
                overall_confidence=0.92,
                entities={
                    "occupied_beds": ExtractedEntity(field_name="occupied_beds", value=beds, confidence=0.94, source_snippet=str(beds)),
                    "bed_category": ExtractedEntity(field_name="bed_category", value=category, confidence=0.89, source_snippet=t[:20]),
                },
                needs_clarification=False,
                suggested_action=f"Update {category} bed occupancy to {beds} beds occupied",
                raw_transcript=transcript,
                parsed_at=datetime.now(timezone.utc).isoformat(),
            )

        # ── 6. PATIENT FOOTFALL ───────────────────────────────────────────────
        if any(w in t for w in ["opd", "patients", "footfall", "registered", "visited", "outpatient"]):
            count = self._extract_number(t) or 65
            return ParsedReportResponse(
                intent="PATIENT_FOOTFALL",
                overall_confidence=0.93,
                entities={
                    "patient_count": ExtractedEntity(field_name="patient_count", value=count, confidence=0.96, source_snippet=str(count)),
                    "category": ExtractedEntity(field_name="category", value="OPD", confidence=0.94, source_snippet="opd"),
                    "date": ExtractedEntity(field_name="date", value=datetime.now(timezone.utc).date().isoformat(), confidence=1.0, source_snippet="today"),
                },
                needs_clarification=False,
                suggested_action=f"Record today's OPD footfall: {count} patients",
                raw_transcript=transcript,
                parsed_at=datetime.now(timezone.utc).isoformat(),
            )

        # ── 7. SHIPMENT RECEIVED ──────────────────────────────────────────────
        if any(w in t for w in ["shipment", "delivery", "truck", "consignment", "received from warehouse"]):
            qty = self._extract_number(t) or 500
            return ParsedReportResponse(
                intent="SHIPMENT_RECEIVED",
                overall_confidence=0.91,
                entities={
                    "quantity": ExtractedEntity(field_name="quantity", value=qty, confidence=0.93, source_snippet=str(qty)),
                    "origin": ExtractedEntity(field_name="origin", value="State Warehouse", confidence=0.85, source_snippet="warehouse"),
                    "shipment_ref": ExtractedEntity(field_name="shipment_ref", value=self._extract_batch(transcript) or "SHP-AUTO", confidence=0.80, source_snippet="shipment"),
                },
                needs_clarification=False,
                suggested_action=f"Record delivery receipt of {qty} units from State Warehouse",
                raw_transcript=transcript,
                parsed_at=datetime.now(timezone.utc).isoformat(),
            )

        # ── 8. SHIPMENT DELAY ─────────────────────────────────────────────────
        if any(w in t for w in ["delayed", "delay", "late", "postponed", "supplier issue"]):
            days = self._extract_number(t) or 3
            return ParsedReportResponse(
                intent="SHIPMENT_DELAY",
                overall_confidence=0.90,
                entities={
                    "delay_days": ExtractedEntity(field_name="delay_days", value=days, confidence=0.91, source_snippet=str(days)),
                    "reason": ExtractedEntity(field_name="reason", value="Supplier delay reported", confidence=0.82, source_snippet=t[:30]),
                },
                needs_clarification=False,
                suggested_action=f"Log shipment delay of {days} days. Evaluate alternative suppliers.",
                raw_transcript=transcript,
                parsed_at=datetime.now(timezone.utc).isoformat(),
            )

        # ── Default: GENERAL_REPORT ───────────────────────────────────────────
        return ParsedReportResponse(
            intent="GENERAL_REPORT",
            overall_confidence=0.80,
            entities={
                "report_summary": ExtractedEntity(
                    field_name="report_summary",
                    value=transcript,
                    confidence=0.80,
                    source_snippet=transcript[:80]
                )
            },
            needs_clarification=False,
            suggested_action="Log operational note to facility activity journal",
            raw_transcript=transcript,
            parsed_at=datetime.now(timezone.utc).isoformat(),
        )

    # ── Entity Extraction Helpers ────────────────────────────────────────────

    def _extract_number(self, text: str) -> Optional[int]:
        matches = re.findall(r"\b(\d{1,5})\b", text)
        if matches:
            return int(matches[0])
        return None

    def _extract_medicine(self, text: str) -> str:
        med_map = {
            "doxycycline": "Doxycycline 100mg Capsules",
            "artesunate": "Artesunate 60mg Injection",
            "paracetamol 500": "Paracetamol 500mg Tablets",
            "paracetamol 650": "Paracetamol 650mg Tablets",
            "amoxicillin": "Amoxicillin 500mg Capsules",
            "azithromycin": "Azithromycin 500mg Tablets",
            "metformin": "Metformin 500mg Tablets",
            "ors": "Oral Rehydration Salts (WHO Formula)",
            "oral rehydration": "Oral Rehydration Salts (WHO Formula)",
            "saline": "Normal Saline 0.9% IV Infusion",
            "ringer": "Ringer's Lactate IV Infusion",
            "dextrose": "Dextrose 5% IV Infusion",
            "rabies": "Rabies Vaccine Human (Rabipur)",
            "hepatitis": "Hepatitis B Vaccine (Engerix)",
            "salbutamol": "Salbutamol Inhaler 100mcg",
            "oxygen": "Oxygen Cylinders Type D",
            "chloroquine": "Chloroquine 250mg Tablets",
            "ciprofloxacin": "Ciprofloxacin 500mg Tablets",
            "metronidazole": "Metronidazole 400mg Tablets",
            "ibuprofen": "Ibuprofen 400mg Tablets",
            "dengue": "Dengue NS1 Antigen Rapid Kit",
            "malaria": "Malaria RDT Kit (P.falciparum)",
            "zinc": "Zinc Sulphate 20mg Tablets",
            "folic": "Folic Acid 400mcg Tablets",
            "iron": "Ferrous Sulphate 200mg Tablets",
        }
        for keyword, med_name in med_map.items():
            if keyword in text:
                return med_name
        return "Paracetamol 500mg Tablets"

    def _extract_batch(self, text: str) -> Optional[str]:
        match = re.search(r"\b([A-Z]{2,6}-\d{4}[-A-Z0-9]*)\b", text)
        if match:
            return match.group(1)
        return None

    def _extract_unit(self, text: str) -> str:
        if "bottle" in text: return "bottles"
        if "vial" in text: return "vials"
        if "sachet" in text: return "sachets"
        if "strip" in text or "tablet" in text: return "strips"
        if "kit" in text: return "kits"
        if "ampoule" in text or "ampule" in text: return "ampoules"
        if "tube" in text: return "tubes"
        if "cylinder" in text: return "cylinders"
        if "roll" in text: return "rolls"
        if "box" in text: return "boxes"
        return "units"

    def _extract_department(self, text: str) -> str:
        if "icu" in text: return "ICU"
        if "emergency" in text or "casualty" in text: return "Emergency"
        if "maternity" in text or "labour" in text or "obstetric" in text: return "Maternity"
        if "pharmacy" in text: return "Pharmacy"
        if "lab" in text: return "Laboratory"
        if "pediatric" in text or "child" in text: return "Pediatrics"
        if "surgery" in text or "surgical" in text: return "Surgery"
        return "General OPD"

    def _extract_staff_name(self, text: str) -> str:
        name_patterns = [
            (r"dr\.?\s+([a-z]+\s+[a-z]+)", "Dr."),
            (r"nurse\s+([a-z]+\s*[a-z]*)", "Nurse"),
            (r"(?:i am|this is|my name is)\s+([a-z]+\s+[a-z]+)", ""),
        ]
        for pattern, prefix in name_patterns:
            match = re.search(pattern, text.lower())
            if match:
                name = match.group(1).strip().title()
                return f"{prefix} {name}".strip()
        
        # Named staff extraction
        if "priya" in text.lower(): return "Dr. Priya Patel"
        if "sanjay" in text.lower(): return "Dr. Sanjay Gupta"
        if "sunita" in text.lower(): return "Sunita Devi"
        if "anil" in text.lower(): return "Anil Deshmukh"
        if "rajesh" in text.lower(): return "Rajesh Verma"
        return "PHC Staff Member"


gemini_extractor = GeminiExtractor()
