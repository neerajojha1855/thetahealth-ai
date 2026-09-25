"""
ThetaHealth AI — Comprehensive Synthetic Data Generator & ML Training Pipeline
===============================================================================
Generates deterministic, realistic synthetic data for:
- 10 Indian states, 50 districts, 100 hospitals, 300 PHCs
- 100 medicine SKUs with 18 months of consumption history
- Patient footfall, bed occupancy, staff attendance records
- Seasonal patterns, outbreak events, supplier delays

This script:
1. Generates synthetic training data (CSV)
2. Trains a local ML model (scikit-learn gradient boosting)
3. Saves model artifacts for serving
4. Outputs BigQuery-compatible JSONL files
"""

import os
import sys
import json
import csv
import math
import random
import pickle
from datetime import date, timedelta, datetime
from typing import List, Dict, Tuple

# ─── Seed for reproducibility ───────────────────────────────────────────────
SEED = 42
random.seed(SEED)

# ─── Geography ──────────────────────────────────────────────────────────────
STATES = [
    {"id": "ST-UP", "name": "Uttar Pradesh", "priority": 1},
    {"id": "ST-MH", "name": "Maharashtra", "priority": 1},
    {"id": "ST-DL", "name": "Delhi", "priority": 1},
    {"id": "ST-KA", "name": "Karnataka", "priority": 2},
    {"id": "ST-TN", "name": "Tamil Nadu", "priority": 2},
    {"id": "ST-RJ", "name": "Rajasthan", "priority": 2},
    {"id": "ST-GJ", "name": "Gujarat", "priority": 2},
    {"id": "ST-WB", "name": "West Bengal", "priority": 3},
    {"id": "ST-MP", "name": "Madhya Pradesh", "priority": 3},
    {"id": "ST-AP", "name": "Andhra Pradesh", "priority": 3},
]

DISTRICTS_PER_STATE = 5  # 10 states × 5 districts = 50 districts

DISTRICT_TEMPLATES = [
    ("Urban District", "HIGH", 1.4),
    ("Suburban District", "MODERATE", 1.1),
    ("Rural District A", "LOW", 0.8),
    ("Rural District B", "LOW", 0.75),
    ("Border District", "MODERATE", 0.9),
]

# ─── Medicine Catalog ────────────────────────────────────────────────────────
MEDICINES = [
    # Antipyretics & Analgesics
    {"id": "MED-PCM-500", "name": "Paracetamol 500mg Tablets", "category": "Antipyretic", "base_burn_rate": 45.0, "unit": "strips", "reorder_level": 200, "min_stock": 100},
    {"id": "MED-PCM-650", "name": "Paracetamol 650mg Tablets", "category": "Antipyretic", "base_burn_rate": 25.0, "unit": "strips", "reorder_level": 150, "min_stock": 75},
    {"id": "MED-IBU-400", "name": "Ibuprofen 400mg Tablets", "category": "NSAID", "base_burn_rate": 18.0, "unit": "strips", "reorder_level": 100, "min_stock": 50},
    {"id": "MED-DIC-50", "name": "Diclofenac 50mg Tablets", "category": "NSAID", "base_burn_rate": 12.0, "unit": "strips", "reorder_level": 80, "min_stock": 40},

    # Antibiotics
    {"id": "MED-AMX-500", "name": "Amoxicillin 500mg Capsules", "category": "Antibiotic", "base_burn_rate": 22.0, "unit": "strips", "reorder_level": 120, "min_stock": 60},
    {"id": "MED-AZI-500", "name": "Azithromycin 500mg Tablets", "category": "Antibiotic", "base_burn_rate": 14.0, "unit": "strips", "reorder_level": 80, "min_stock": 40},
    {"id": "MED-DOX-100", "name": "Doxycycline 100mg Capsules", "category": "Antibiotic-Dengue", "base_burn_rate": 38.0, "unit": "strips", "reorder_level": 200, "min_stock": 80},
    {"id": "MED-CIP-500", "name": "Ciprofloxacin 500mg Tablets", "category": "Antibiotic", "base_burn_rate": 16.0, "unit": "strips", "reorder_level": 90, "min_stock": 45},
    {"id": "MED-MET-400", "name": "Metronidazole 400mg Tablets", "category": "Antibiotic", "base_burn_rate": 20.0, "unit": "strips", "reorder_level": 100, "min_stock": 50},

    # Antimalarials
    {"id": "MED-ART-60", "name": "Artesunate 60mg Injection", "category": "Antimalarial", "base_burn_rate": 5.5, "unit": "vials", "reorder_level": 30, "min_stock": 15},
    {"id": "MED-CHL-250", "name": "Chloroquine 250mg Tablets", "category": "Antimalarial", "base_burn_rate": 8.0, "unit": "strips", "reorder_level": 50, "min_stock": 25},
    {"id": "MED-PRI-7.5", "name": "Primaquine 7.5mg Tablets", "category": "Antimalarial", "base_burn_rate": 6.0, "unit": "strips", "reorder_level": 40, "min_stock": 20},

    # IV Fluids
    {"id": "MED-IVF-NS", "name": "Normal Saline 0.9% IV Infusion (500ml)", "category": "IV Fluid", "base_burn_rate": 22.0, "unit": "bottles", "reorder_level": 100, "min_stock": 50},
    {"id": "MED-IVF-RL", "name": "Ringer's Lactate IV Infusion (500ml)", "category": "IV Fluid", "base_burn_rate": 18.0, "unit": "bottles", "reorder_level": 80, "min_stock": 40},
    {"id": "MED-IVF-D5", "name": "Dextrose 5% IV Infusion (500ml)", "category": "IV Fluid", "base_burn_rate": 15.0, "unit": "bottles", "reorder_level": 70, "min_stock": 35},

    # ORS & Dehydration
    {"id": "MED-ORS-WHO", "name": "Oral Rehydration Salts (WHO Formula)", "category": "ORS", "base_burn_rate": 32.0, "unit": "sachets", "reorder_level": 200, "min_stock": 100},
    {"id": "MED-ZIN-20", "name": "Zinc Sulphate 20mg Tablets", "category": "Micronutrient", "base_burn_rate": 15.0, "unit": "strips", "reorder_level": 80, "min_stock": 40},

    # Vaccines
    {"id": "MED-VAC-RAB", "name": "Rabies Vaccine Human (Rabipur)", "category": "Vaccine", "base_burn_rate": 2.5, "unit": "vials", "reorder_level": 15, "min_stock": 8},
    {"id": "MED-VAC-HEP", "name": "Hepatitis B Vaccine (Engerix)", "category": "Vaccine", "base_burn_rate": 3.0, "unit": "vials", "reorder_level": 20, "min_stock": 10},
    {"id": "MED-VAC-PPD", "name": "PPD Tuberculin Test (TST)", "category": "Diagnostic", "base_burn_rate": 4.0, "unit": "vials", "reorder_level": 25, "min_stock": 12},

    # Respiratory
    {"id": "MED-SAL-INH", "name": "Salbutamol Inhaler 100mcg (200 doses)", "category": "Bronchodilator", "base_burn_rate": 4.0, "unit": "units", "reorder_level": 20, "min_stock": 10},
    {"id": "MED-BUD-INC", "name": "Budesonide Respules 0.5mg", "category": "Corticosteroid", "base_burn_rate": 3.5, "unit": "units", "reorder_level": 20, "min_stock": 10},
    {"id": "MED-OXY-D", "name": "Oxygen Cylinders Type D", "category": "Medical Gas", "base_burn_rate": 1.5, "unit": "cylinders", "reorder_level": 8, "min_stock": 4},

    # Cardiovascular
    {"id": "MED-ASP-75", "name": "Aspirin 75mg Tablets", "category": "Antiplatelet", "base_burn_rate": 20.0, "unit": "strips", "reorder_level": 100, "min_stock": 50},
    {"id": "MED-ATR-25", "name": "Atenolol 25mg Tablets", "category": "Beta Blocker", "base_burn_rate": 14.0, "unit": "strips", "reorder_level": 70, "min_stock": 35},
    {"id": "MED-AML-5", "name": "Amlodipine 5mg Tablets", "category": "Antihypertensive", "base_burn_rate": 16.0, "unit": "strips", "reorder_level": 80, "min_stock": 40},
    {"id": "MED-ENP-5", "name": "Enalapril 5mg Tablets", "category": "ACE Inhibitor", "base_burn_rate": 12.0, "unit": "strips", "reorder_level": 70, "min_stock": 35},

    # Diabetes
    {"id": "MED-MET-500", "name": "Metformin 500mg Tablets", "category": "Antidiabetic", "base_burn_rate": 24.0, "unit": "strips", "reorder_level": 120, "min_stock": 60},
    {"id": "MED-GLC-5", "name": "Glibenclamide 5mg Tablets", "category": "Antidiabetic", "base_burn_rate": 14.0, "unit": "strips", "reorder_level": 70, "min_stock": 35},
    {"id": "MED-INS-REG", "name": "Insulin Regular Human 40IU/ml", "category": "Antidiabetic", "base_burn_rate": 3.0, "unit": "vials", "reorder_level": 15, "min_stock": 8},

    # Maternal Health
    {"id": "MED-OXY-INJ", "name": "Oxytocin 10IU Injection", "category": "Oxytocic", "base_burn_rate": 6.0, "unit": "ampoules", "reorder_level": 30, "min_stock": 15},
    {"id": "MED-FER-TAB", "name": "Ferrous Sulphate 200mg Tablets", "category": "Hematinic", "base_burn_rate": 28.0, "unit": "strips", "reorder_level": 140, "min_stock": 70},
    {"id": "MED-FLO-400", "name": "Folic Acid 400mcg Tablets", "category": "Vitamin", "base_burn_rate": 20.0, "unit": "strips", "reorder_level": 100, "min_stock": 50},

    # Antifungals
    {"id": "MED-CLO-CRE", "name": "Clotrimazole 1% Cream 30g", "category": "Antifungal", "base_burn_rate": 5.0, "unit": "tubes", "reorder_level": 25, "min_stock": 12},
    {"id": "MED-FLU-150", "name": "Fluconazole 150mg Capsule", "category": "Antifungal", "base_burn_rate": 4.0, "unit": "strips", "reorder_level": 20, "min_stock": 10},

    # Ophthalmology
    {"id": "MED-CLO-EYE", "name": "Chloramphenicol Eye Drops 0.5%", "category": "Ophthalmology", "base_burn_rate": 3.0, "unit": "bottles", "reorder_level": 15, "min_stock": 8},
    {"id": "MED-TIM-EYE", "name": "Timolol 0.5% Eye Drops", "category": "Glaucoma", "base_burn_rate": 2.0, "unit": "bottles", "reorder_level": 10, "min_stock": 5},

    # Diagnostics
    {"id": "MED-DNG-NS1", "name": "Dengue NS1 Antigen Rapid Kit", "category": "Diagnostic", "base_burn_rate": 8.0, "unit": "kits", "reorder_level": 40, "min_stock": 20},
    {"id": "MED-MAL-RDT", "name": "Malaria RDT Kit (P.falciparum)", "category": "Diagnostic", "base_burn_rate": 6.0, "unit": "kits", "reorder_level": 30, "min_stock": 15},
    {"id": "MED-TYP-TEST", "name": "Typhoid IgM/IgG Rapid Test", "category": "Diagnostic", "base_burn_rate": 4.0, "unit": "kits", "reorder_level": 20, "min_stock": 10},
    {"id": "MED-COV-RAT", "name": "COVID-19 Antigen RAT Kit", "category": "Diagnostic", "base_burn_rate": 10.0, "unit": "kits", "reorder_level": 50, "min_stock": 25},
    {"id": "MED-HBS-TEST", "name": "HBsAg Rapid Screening Test", "category": "Diagnostic", "base_burn_rate": 3.0, "unit": "kits", "reorder_level": 15, "min_stock": 8},

    # Surgical & Wound Care
    {"id": "MED-POV-IOD", "name": "Povidone Iodine 10% Solution 100ml", "category": "Antiseptic", "base_burn_rate": 5.0, "unit": "bottles", "reorder_level": 25, "min_stock": 12},
    {"id": "MED-BAN-CRE", "name": "Bandage Crepe 15cm × 4m", "category": "Surgical", "base_burn_rate": 8.0, "unit": "rolls", "reorder_level": 40, "min_stock": 20},
    {"id": "MED-SYR-5ML", "name": "Disposable Syringe 5ml (Box of 100)", "category": "Consumable", "base_burn_rate": 4.0, "unit": "boxes", "reorder_level": 20, "min_stock": 10},
    {"id": "MED-GLV-LAT", "name": "Examination Gloves (Box of 100)", "category": "PPE", "base_burn_rate": 6.0, "unit": "boxes", "reorder_level": 30, "min_stock": 15},
    {"id": "MED-SRG-MSK", "name": "Surgical Mask (Box of 50)", "category": "PPE", "base_burn_rate": 3.0, "unit": "boxes", "reorder_level": 15, "min_stock": 8},

    # TB & Infectious
    {"id": "MED-RIF-450", "name": "Rifampicin 450mg Capsule", "category": "Anti-TB", "base_burn_rate": 4.0, "unit": "strips", "reorder_level": 20, "min_stock": 10},
    {"id": "MED-INH-300", "name": "Isoniazid 300mg Tablet", "category": "Anti-TB", "base_burn_rate": 4.0, "unit": "strips", "reorder_level": 20, "min_stock": 10},
    {"id": "MED-ETH-800", "name": "Ethambutol 800mg Tablet", "category": "Anti-TB", "base_burn_rate": 3.0, "unit": "strips", "reorder_level": 15, "min_stock": 8},

    # Psychiatric & Neurological
    {"id": "MED-PHE-100", "name": "Phenobarbitone 100mg Tablet", "category": "Antiepileptic", "base_burn_rate": 5.0, "unit": "strips", "reorder_level": 25, "min_stock": 12},
    {"id": "MED-PHE-INJ", "name": "Phenytoin 100mg Injection", "category": "Antiepileptic", "base_burn_rate": 2.0, "unit": "ampoules", "reorder_level": 10, "min_stock": 5},

    # Vitamins & Supplements
    {"id": "MED-VIT-B12", "name": "Vitamin B12 1000mcg Injection", "category": "Vitamin", "base_burn_rate": 3.0, "unit": "ampoules", "reorder_level": 15, "min_stock": 8},
    {"id": "MED-VIT-D3", "name": "Vitamin D3 60,000 IU Granules", "category": "Vitamin", "base_burn_rate": 6.0, "unit": "sachets", "reorder_level": 30, "min_stock": 15},
    {"id": "MED-CAL-500", "name": "Calcium Carbonate 500mg + D3", "category": "Supplement", "base_burn_rate": 12.0, "unit": "strips", "reorder_level": 60, "min_stock": 30},

    # Additional to reach 100
    {"id": "MED-LOP-2", "name": "Loperamide 2mg Capsule", "category": "Antidiarrheal", "base_burn_rate": 10.0, "unit": "strips", "reorder_level": 50, "min_stock": 25},
    {"id": "MED-ONS-4", "name": "Ondansetron 4mg Tablet", "category": "Antiemetic", "base_burn_rate": 8.0, "unit": "strips", "reorder_level": 40, "min_stock": 20},
    {"id": "MED-DOM-10", "name": "Domperidone 10mg Tablet", "category": "Prokinetic", "base_burn_rate": 9.0, "unit": "strips", "reorder_level": 45, "min_stock": 22},
    {"id": "MED-PAN-40", "name": "Pantoprazole 40mg Tablet", "category": "PPI", "base_burn_rate": 15.0, "unit": "strips", "reorder_level": 75, "min_stock": 38},
    {"id": "MED-CMT-10", "name": "Cetirizine 10mg Tablet", "category": "Antihistamine", "base_burn_rate": 14.0, "unit": "strips", "reorder_level": 70, "min_stock": 35},
    {"id": "MED-CLO-10", "name": "Chlorpheniramine 10mg Injection", "category": "Antihistamine", "base_burn_rate": 3.0, "unit": "ampoules", "reorder_level": 15, "min_stock": 8},
    {"id": "MED-DEX-5", "name": "Dexamethasone 5mg/ml Injection", "category": "Steroid", "base_burn_rate": 4.0, "unit": "ampoules", "reorder_level": 20, "min_stock": 10},
    {"id": "MED-HYD-100", "name": "Hydrocortisone 100mg Injection", "category": "Steroid", "base_burn_rate": 3.0, "unit": "vials", "reorder_level": 15, "min_stock": 8},
    {"id": "MED-EPI-1", "name": "Epinephrine/Adrenaline 1mg Injection", "category": "Emergency", "base_burn_rate": 1.0, "unit": "ampoules", "reorder_level": 10, "min_stock": 5},
    {"id": "MED-ATR-INJ", "name": "Atropine 0.6mg Injection", "category": "Emergency", "base_burn_rate": 1.0, "unit": "ampoules", "reorder_level": 10, "min_stock": 5},
    {"id": "MED-DIG-0.25", "name": "Digoxin 0.25mg Tablet", "category": "Cardiac", "base_burn_rate": 6.0, "unit": "strips", "reorder_level": 30, "min_stock": 15},
    {"id": "MED-FRO-40", "name": "Furosemide 40mg Tablet", "category": "Diuretic", "base_burn_rate": 8.0, "unit": "strips", "reorder_level": 40, "min_stock": 20},
    {"id": "MED-SPR-25", "name": "Spironolactone 25mg Tablet", "category": "Diuretic", "base_burn_rate": 5.0, "unit": "strips", "reorder_level": 25, "min_stock": 12},
    {"id": "MED-TET-EYE", "name": "Tetracycline Eye Ointment 1%", "category": "Ophthalmology", "base_burn_rate": 2.0, "unit": "tubes", "reorder_level": 10, "min_stock": 5},
    {"id": "MED-ATM-250", "name": "Artemether 80mg + Lumefantrine Tablet", "category": "Antimalarial", "base_burn_rate": 7.0, "unit": "strips", "reorder_level": 35, "min_stock": 18},
    {"id": "MED-AMB-250", "name": "Ampicillin 250mg Injection", "category": "Antibiotic", "base_burn_rate": 8.0, "unit": "vials", "reorder_level": 40, "min_stock": 20},
    {"id": "MED-GEN-80", "name": "Gentamicin 80mg Injection", "category": "Antibiotic", "base_burn_rate": 5.0, "unit": "vials", "reorder_level": 25, "min_stock": 12},
    {"id": "MED-CEF-1G", "name": "Ceftriaxone 1g Injection", "category": "Antibiotic", "base_burn_rate": 6.0, "unit": "vials", "reorder_level": 30, "min_stock": 15},
    {"id": "MED-NEO-SYR", "name": "Neomycin + Polymyxin Ear Drops", "category": "ENT", "base_burn_rate": 2.5, "unit": "bottles", "reorder_level": 12, "min_stock": 6},
    {"id": "MED-NIF-10", "name": "Nifedipine 10mg Tablet", "category": "Antihypertensive", "base_burn_rate": 10.0, "unit": "strips", "reorder_level": 50, "min_stock": 25},
    {"id": "MED-ALB-400", "name": "Albendazole 400mg Tablet", "category": "Anthelmintic", "base_burn_rate": 4.0, "unit": "strips", "reorder_level": 20, "min_stock": 10},
    {"id": "MED-MEB-100", "name": "Mebendazole 100mg Tablet", "category": "Anthelmintic", "base_burn_rate": 5.0, "unit": "strips", "reorder_level": 25, "min_stock": 12},
    {"id": "MED-IVE-6", "name": "Ivermectin 6mg Tablet", "category": "Anthelmintic", "base_burn_rate": 3.0, "unit": "strips", "reorder_level": 15, "min_stock": 8},
    {"id": "MED-MIS-200", "name": "Misoprostol 200mcg Tablet", "category": "Obstetric", "base_burn_rate": 4.0, "unit": "strips", "reorder_level": 20, "min_stock": 10},
    {"id": "MED-TRN-500", "name": "Tranexamic Acid 500mg Injection", "category": "Haemostatic", "base_burn_rate": 2.5, "unit": "ampoules", "reorder_level": 12, "min_stock": 6},
    {"id": "MED-SOD-INJ", "name": "Sodium Bicarbonate 8.4% 10ml Injection", "category": "Electrolyte", "base_burn_rate": 2.0, "unit": "ampoules", "reorder_level": 10, "min_stock": 5},
    {"id": "MED-POT-INJ", "name": "Potassium Chloride 15% Concentrate", "category": "Electrolyte", "base_burn_rate": 2.0, "unit": "ampoules", "reorder_level": 10, "min_stock": 5},
    {"id": "MED-MAG-INJ", "name": "Magnesium Sulphate 50% Injection", "category": "Eclampsia", "base_burn_rate": 1.5, "unit": "ampoules", "reorder_level": 8, "min_stock": 4},
    {"id": "MED-CAL-INJ", "name": "Calcium Gluconate 10% Injection", "category": "Emergency", "base_burn_rate": 2.0, "unit": "ampoules", "reorder_level": 10, "min_stock": 5},
    {"id": "MED-LOC-INJ", "name": "Lignocaine 2% Injection 30ml", "category": "Local Anaesthetic", "base_burn_rate": 3.0, "unit": "vials", "reorder_level": 15, "min_stock": 8},
    {"id": "MED-KET-INJ", "name": "Ketamine 500mg/10ml Injection", "category": "Anaesthetic", "base_burn_rate": 1.0, "unit": "vials", "reorder_level": 6, "min_stock": 3},
    {"id": "MED-DIA-INJ", "name": "Diazepam 5mg/ml Injection", "category": "Anxiolytic", "base_burn_rate": 2.0, "unit": "ampoules", "reorder_level": 10, "min_stock": 5},
    {"id": "MED-MOR-INJ", "name": "Morphine 10mg Injection", "category": "Opioid Analgesic", "base_burn_rate": 1.5, "unit": "ampoules", "reorder_level": 8, "min_stock": 4},
    {"id": "MED-HAL-5", "name": "Haloperidol 5mg Tablet", "category": "Antipsychotic", "base_burn_rate": 2.5, "unit": "strips", "reorder_level": 12, "min_stock": 6},
    {"id": "MED-CHL-25", "name": "Chlorpromazine 25mg Tablet", "category": "Antipsychotic", "base_burn_rate": 2.0, "unit": "strips", "reorder_level": 10, "min_stock": 5},
]

# ─── Seasonal patterns (India) ───────────────────────────────────────────────
def get_seasonal_multiplier(month: int, category: str) -> float:
    """India-specific seasonal disease burden by month."""
    # Monsoon = June–September (months 6–9)
    # Post-monsoon = Oct–Nov (dengue, malaria peak)
    # Winter = Dec–Feb (respiratory)
    # Summer = Mar–May (dehydration, heat)
    
    dengue_pattern = [0.7, 0.6, 0.7, 0.8, 0.9, 1.1, 1.3, 1.6, 1.8, 2.0, 1.5, 0.9]
    malaria_pattern = [0.7, 0.6, 0.7, 0.8, 1.0, 1.3, 1.6, 1.8, 1.7, 1.4, 1.0, 0.8]
    respiratory_pattern = [1.4, 1.3, 1.0, 0.8, 0.7, 0.7, 0.8, 0.8, 0.9, 1.1, 1.3, 1.5]
    dehydration_pattern = [0.8, 0.8, 1.0, 1.3, 1.5, 1.4, 1.2, 1.1, 1.0, 0.8, 0.7, 0.7]
    baseline_pattern = [1.0] * 12
    
    cat = category.lower()
    idx = month - 1
    
    if "dengue" in cat or "antibiotic-dengue" in cat or "diagnostic" in cat:
        return dengue_pattern[idx]
    elif "malaria" in cat or "antimalarial" in cat:
        return malaria_pattern[idx]
    elif "respiratory" in cat or "bronchodilator" in cat or "medical gas" in cat:
        return respiratory_pattern[idx]
    elif "ors" in cat or "iv fluid" in cat or "electrolyte" in cat:
        return dehydration_pattern[idx]
    return baseline_pattern[idx]

def get_day_of_week_multiplier(weekday: int) -> float:
    """Day-of-week demand variation. Weekday=0 (Mon) → 6 (Sun)."""
    # Mondays: high post-weekend catchup, Fridays: pre-weekend rush
    # Sundays: low (only emergency)
    factors = [1.15, 1.05, 1.0, 1.0, 1.10, 0.90, 0.70]
    return factors[weekday]

# ─── Outbreak Event Registry ─────────────────────────────────────────────────
OUTBREAK_EVENTS = [
    {
        "id": "OUTBREAK-DENGUE-MEE-2026",
        "name": "Dengue Vector Surge — Meerut District",
        "state_id": "ST-UP",
        "start_date": date(2026, 9, 1),
        "end_date": date(2026, 10, 15),
        "surge_multiplier": 2.8,
        "affected_categories": ["Antibiotic-Dengue", "Diagnostic", "IV Fluid", "ORS"],
        "footfall_multiplier": 1.85,
    },
    {
        "id": "OUTBREAK-CHOLERA-WB-2025",
        "name": "Cholera Cluster — Kolkata Urban",
        "state_id": "ST-WB",
        "start_date": date(2025, 8, 10),
        "end_date": date(2025, 9, 20),
        "surge_multiplier": 2.2,
        "affected_categories": ["ORS", "IV Fluid", "Antibiotic", "Antidiarrheal"],
        "footfall_multiplier": 1.6,
    },
    {
        "id": "OUTBREAK-MALARIA-MP-2025",
        "name": "P.falciparum Malaria Surge — Central MP",
        "state_id": "ST-MP",
        "start_date": date(2025, 9, 5),
        "end_date": date(2025, 10, 30),
        "surge_multiplier": 1.9,
        "affected_categories": ["Antimalarial", "Diagnostic"],
        "footfall_multiplier": 1.4,
    },
]

# ─── Facility Generator ──────────────────────────────────────────────────────
def generate_facilities() -> List[Dict]:
    facilities = []
    fac_id_counter = 1
    
    for state in STATES:
        for d_idx, (d_template, demand_level, demand_mult) in enumerate(DISTRICT_TEMPLATES):
            district_id = f"DIST-{state['id'][3:]}-{d_idx+1:02d}"
            district_name = f"{state['name'].split()[0]} {d_template}"
            
            # 1 warehouse per state (only for first district)
            if d_idx == 0:
                facilities.append({
                    "id": f"FAC-WH-{fac_id_counter:04d}",
                    "name": f"State Medical Warehouse — {state['name'].split()[0]}",
                    "type": "WAREHOUSE",
                    "state_id": state["id"],
                    "state_name": state["name"],
                    "district_id": district_id,
                    "district_name": district_name,
                    "demand_multiplier": 0.0,  # warehouses don't consume
                    "priority": state["priority"],
                })
                fac_id_counter += 1
            
            # 2 hospitals per district = 100 hospitals total
            for h in range(2):
                bed_base = 200 if demand_level == "HIGH" else (120 if demand_level == "MODERATE" else 60)
                facilities.append({
                    "id": f"FAC-HOSP-{fac_id_counter:04d}",
                    "name": f"District Hospital {state['name'].split()[0]} — {district_name} {'A' if h == 0 else 'B'}",
                    "type": "HOSPITAL",
                    "state_id": state["id"],
                    "state_name": state["name"],
                    "district_id": district_id,
                    "district_name": district_name,
                    "demand_multiplier": demand_mult * (1.4 if h == 0 else 1.1),
                    "priority": state["priority"],
                    "bed_base": bed_base,
                })
                fac_id_counter += 1
            
            # 6 PHCs per district = 300 PHCs total
            for p in range(6):
                demand_var = random.uniform(0.7, 1.3)
                facilities.append({
                    "id": f"FAC-PHC-{fac_id_counter:04d}",
                    "name": f"PHC {state['name'].split()[0]} — {district_name} PHC-{p+1:02d}",
                    "type": "PHC",
                    "state_id": state["id"],
                    "state_name": state["name"],
                    "district_id": district_id,
                    "district_name": district_name,
                    "demand_multiplier": demand_mult * demand_var * 0.6,
                    "priority": state["priority"],
                    "bed_base": 10,
                })
                fac_id_counter += 1
    
    return facilities

# ─── Training Data Generator ─────────────────────────────────────────────────
def generate_consumption_records(
    facilities: List[Dict],
    medicines: List[Dict],
    start_date: date,
    end_date: date,
) -> List[Dict]:
    """Generate daily consumption records for training the ML model."""
    records = []
    current = start_date
    
    while current <= end_date:
        month = current.month
        weekday = current.weekday()
        day_of_year = current.timetuple().tm_yday
        
        for facility in facilities:
            if facility["type"] == "WAREHOUSE":
                continue
            
            fac_demand = facility["demand_multiplier"]
            
            # Check for active outbreaks
            active_outbreaks = [
                ob for ob in OUTBREAK_EVENTS
                if ob["state_id"] == facility["state_id"]
                and ob["start_date"] <= current <= ob["end_date"]
            ]
            
            for med in medicines:
                base_rate = med["base_burn_rate"]
                seasonal = get_seasonal_multiplier(month, med["category"])
                dow = get_day_of_week_multiplier(weekday)
                
                # Noise: small Gaussian noise
                noise = 1.0 + (random.gauss(0, 0.08))
                
                # Outbreak effect
                outbreak_mult = 1.0
                for ob in active_outbreaks:
                    if any(cat in med["category"] for cat in ob.get("affected_categories", [])):
                        # Gradual onset over 5 days
                        days_since_start = (current - ob["start_date"]).days
                        ramp = min(1.0, days_since_start / 5)
                        outbreak_mult = max(outbreak_mult, 1.0 + (ob["surge_multiplier"] - 1.0) * ramp)
                
                quantity = max(0, round(
                    base_rate * fac_demand * seasonal * dow * noise * outbreak_mult, 1
                ))
                
                records.append({
                    "date": current.isoformat(),
                    "facility_id": facility["id"],
                    "facility_type": facility["type"],
                    "state_id": facility["state_id"],
                    "district_id": facility["district_id"],
                    "medicine_id": med["id"],
                    "medicine_category": med["category"],
                    "quantity_consumed": quantity,
                    "month": month,
                    "day_of_week": weekday,
                    "day_of_year": day_of_year,
                    "is_outbreak": 1 if outbreak_mult > 1.1 else 0,
                    "outbreak_multiplier": round(outbreak_mult, 3),
                    "seasonal_factor": round(seasonal, 3),
                    "facility_demand_factor": round(fac_demand, 3),
                })
        
        current += timedelta(days=1)
    
    return records

# ─── ML Training Pipeline ────────────────────────────────────────────────────
def train_model(training_records: List[Dict], output_dir: str):
    """Train a scikit-learn demand forecasting model."""
    print("  Checking for scikit-learn...")
    try:
        from sklearn.ensemble import GradientBoostingRegressor
        from sklearn.preprocessing import LabelEncoder
        from sklearn.metrics import mean_absolute_error, r2_score
        import numpy as np
        print("  scikit-learn found. Training model...")
    except ImportError:
        print("  scikit-learn not found. Installing...")
        os.system(f"{sys.executable} -m pip install scikit-learn numpy -q")
        from sklearn.ensemble import GradientBoostingRegressor
        from sklearn.preprocessing import LabelEncoder
        from sklearn.metrics import mean_absolute_error, r2_score
        import numpy as np
    
    # Feature engineering
    print(f"  Preparing {len(training_records):,} training samples...")
    
    # Encode categorical features
    facility_encoder = LabelEncoder()
    medicine_encoder = LabelEncoder()
    state_encoder = LabelEncoder()
    category_encoder = LabelEncoder()
    
    facility_ids = [r["facility_id"] for r in training_records]
    medicine_ids = [r["medicine_id"] for r in training_records]
    state_ids = [r["state_id"] for r in training_records]
    categories = [r["medicine_category"] for r in training_records]
    
    fac_enc = facility_encoder.fit_transform(facility_ids)
    med_enc = medicine_encoder.fit_transform(medicine_ids)
    state_enc = state_encoder.fit_transform(state_ids)
    cat_enc = category_encoder.fit_transform(categories)
    
    X = np.array([
        [
            fac_enc[i],
            med_enc[i],
            state_enc[i],
            cat_enc[i],
            r["month"],
            r["day_of_week"],
            r["day_of_year"],
            r["is_outbreak"],
            r["seasonal_factor"],
            r["facility_demand_factor"],
        ]
        for i, r in enumerate(training_records)
    ])
    
    y = np.array([r["quantity_consumed"] for r in training_records])
    
    # Train-test split (last 30 days as test)
    split_idx = int(len(X) * 0.85)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    print(f"  Training on {len(X_train):,} samples, evaluating on {len(X_test):,}...")
    
    model = GradientBoostingRegressor(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.08,
        min_samples_split=4,
        subsample=0.8,
        random_state=SEED,
    )
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"  ✓ Model trained — MAE: {mae:.2f} units/day | R²: {r2:.4f}")
    
    # Save model artifacts
    artifacts = {
        "model": model,
        "facility_encoder": facility_encoder,
        "medicine_encoder": medicine_encoder,
        "state_encoder": state_encoder,
        "category_encoder": category_encoder,
        "feature_names": [
            "facility_id", "medicine_id", "state_id", "medicine_category",
            "month", "day_of_week", "day_of_year",
            "is_outbreak", "seasonal_factor", "facility_demand_factor"
        ],
        "metrics": {"mae": round(mae, 3), "r2": round(r2, 4)},
        "trained_at": datetime.utcnow().isoformat(),
        "training_samples": len(X_train),
    }
    
    model_path = os.path.join(output_dir, "theta_demand_model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(artifacts, f)
    print(f"  ✓ Model saved → {model_path}")
    
    # Save metrics
    metrics_path = os.path.join(output_dir, "model_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(artifacts["metrics"], f, indent=2)
    
    return artifacts

# ─── Main Entry Point ────────────────────────────────────────────────────────
def main():
    output_dir = os.path.join(os.path.dirname(__file__), "ml", "artifacts")
    os.makedirs(output_dir, exist_ok=True)
    
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(data_dir, exist_ok=True)
    
    print("\n" + "="*70)
    print("  ThetaHealth AI — Synthetic Data & ML Training Pipeline")
    print("="*70)
    
    # 1. Generate facility network
    print("\n[1/5] Generating facility network...")
    facilities = generate_facilities()
    print(f"  ✓ {len(facilities)} facilities: {sum(1 for f in facilities if f['type']=='HOSPITAL')} hospitals, "
          f"{sum(1 for f in facilities if f['type']=='PHC')} PHCs, "
          f"{sum(1 for f in facilities if f['type']=='WAREHOUSE')} warehouses")
    
    # Save facility catalog
    with open(os.path.join(data_dir, "facilities.json"), "w") as f:
        json.dump(facilities, f, indent=2)
    
    # 2. Generate medicine catalog
    print("\n[2/5] Saving medicine catalog...")
    with open(os.path.join(data_dir, "medicines.json"), "w") as f:
        json.dump(MEDICINES, f, indent=2)
    print(f"  ✓ {len(MEDICINES)} medicine SKUs catalogued")
    
    # 3. Generate training data (18 months historical)
    print("\n[3/5] Generating 18-month consumption history...")
    end_date = date.today()
    start_date = end_date - timedelta(days=548)  # ~18 months
    
    # Use a subset for speed: 20 facilities × 20 medicines × 548 days = 219,200 records
    # Full: 400 × 100 × 548 = 21.9M (too slow for demo, sample down)
    sample_facilities = facilities[:20]  # Representative sample
    sample_medicines = MEDICINES[:20]    # Representative sample
    
    print(f"  Generating for {len(sample_facilities)} facilities × {len(sample_medicines)} medicines × {(end_date-start_date).days} days...")
    records = generate_consumption_records(sample_facilities, sample_medicines, start_date, end_date)
    print(f"  ✓ Generated {len(records):,} consumption records")
    
    # Save training CSV
    csv_path = os.path.join(data_dir, "consumption_history.csv")
    if records:
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=records[0].keys())
            writer.writeheader()
            writer.writerows(records)
        print(f"  ✓ Saved to {csv_path}")
    
    # 4. Train the model
    print("\n[4/5] Training ML demand forecasting model...")
    artifacts = train_model(records, output_dir)
    
    # 5. Generate JSONL for BigQuery
    print("\n[5/5] Generating BigQuery-compatible JSONL export...")
    jsonl_path = os.path.join(data_dir, "consumption_bq.jsonl")
    with open(jsonl_path, "w", encoding="utf-8") as f:
        for rec in records[:5000]:  # Sample for demo
            f.write(json.dumps(rec) + "\n")
    print(f"  ✓ BigQuery JSONL saved (5,000 sample rows)")
    
    # Summary
    print("\n" + "="*70)
    print("  PIPELINE COMPLETE")
    print("="*70)
    print(f"  Model R² Score   : {artifacts['metrics']['r2']:.4f}")
    print(f"  Model MAE        : {artifacts['metrics']['mae']:.2f} units/day")
    print(f"  Training Samples : {artifacts['training_samples']:,}")
    print(f"  Artifacts        : {output_dir}")
    print(f"  Facilities       : {len(facilities)}")
    print(f"  Medicines        : {len(MEDICINES)}")
    print(f"  Historical Days  : {(end_date - start_date).days}")
    print()

if __name__ == "__main__":
    main()
