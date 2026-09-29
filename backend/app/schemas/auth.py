from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, EmailStr

class RoleEnum(str, Enum):
    NATIONAL_ADMIN = "NATIONAL_ADMIN"
    STATE_DISTRICT_ADMIN = "STATE_DISTRICT_ADMIN"
    HOSPITAL_ADMIN = "HOSPITAL_ADMIN"
    PHC_WORKER = "PHC_WORKER"
    DOCTOR_NURSE = "DOCTOR_NURSE"
    PHARMACIST = "PHARMACIST"
    SUPPLY_CHAIN_MANAGER = "SUPPLY_CHAIN_MANAGER"
    EMERGENCY_OFFICER = "EMERGENCY_OFFICER"
    ANALYST = "ANALYST"

class ScopeLevel(str, Enum):
    NATIONAL = "NATIONAL"
    STATE = "STATE"
    DISTRICT = "DISTRICT"
    FACILITY = "FACILITY"

class UserProfile(BaseModel):
    uid: str
    email: str
    name: str
    role: RoleEnum
    scope_level: ScopeLevel
    state_id: Optional[str] = None
    district_id: Optional[str] = None
    facility_id: Optional[str] = None
    facility_name: Optional[str] = None
    permissions: List[str] = []
    profile_picture: Optional[str] = None
    designation: Optional[str] = None
    organisation: Optional[str] = None
    work_location: Optional[str] = None

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str
    name: str
    designation: Optional[str] = None
    work_location: Optional[str] = None
    organisation: Optional[str] = None
    role: Optional[RoleEnum] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    designation: Optional[str] = None
    organisation: Optional[str] = None
    work_location: Optional[str] = None

class TokenVerifyRequest(BaseModel):
    id_token: str

class RoleMetadata(BaseModel):
    role: RoleEnum
    title: str
    description: str
    scope_level: ScopeLevel
    primary_view: str
    capabilities: List[str]
