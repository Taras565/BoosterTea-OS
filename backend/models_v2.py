from sqlalchemy import Column, Integer, BigInteger, String, Float, Date, Time, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    telegram_id = Column(BigInteger, primary_key=True, autoincrement=False)
    username = Column(String(100), nullable=True)
    weight = Column(Integer, nullable=False)
    gender = Column(String(10), nullable=False)
    birth_date = Column(Date, nullable=False)
    birth_time = Column(Time, nullable=True)
    birth_place = Column(String(150), nullable=True)
    hd_type = Column(String(50), nullable=True)
    syutsay_number = Column(Integer, nullable=True)
    
    # Super-Personalization Addon
    profession_type = Column(String(50), nullable=False, default="COGNITIVE")
    taste_acid_pref = Column(Integer, default=5)
    taste_bitter_pref = Column(Integer, default=5)
    taste_sweet_pref = Column(Integer, default=5)
    caffeine_sensitivity = Column(String(50), default="normal")
    smoker = Column(Boolean, default=False)
    oral_contraceptives = Column(Boolean, default=False)
    target_bedtime = Column(String(10), nullable=True) # зберігатимемо як "23:00"

    # B2B & Flywheel Retention (Block 1)
    role = Column(String(50), default="client") # "client", "barista", "admin"
    company_id = Column(String(50), nullable=True)
    current_streak_cycle = Column(Integer, default=0)
    last_checkin_date = Column(Date, nullable=True)
    grace_periods = Column(Integer, default=1)

    # Biometrics & Endocrinology (Block 2)
    last_period_date = Column(Date, nullable=True) # for calculating ALLO drop in luteal phase
    
    # Gamification & Referrals (Block 3)
    booster_star_active_until = Column(DateTime(timezone=True), nullable=True)
    avatar_id = Column(String(100), nullable=True, default="default")
    referred_by_id = Column(BigInteger, ForeignKey("users.telegram_id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    state_logs = relationship("StateLog", back_populates="user")

class Herb(Base):
    __tablename__ = "herbs"

    herb_id = Column(String(50), primary_key=True)
    name_uk = Column(String(100), nullable=False)
    active_substance = Column(String(100))
    description_uk = Column(String)

class StateLog(Base):
    __tablename__ = "state_logs"

    log_id = Column(String(36), primary_key=True, default=generate_uuid)
    telegram_id = Column(BigInteger, ForeignKey("users.telegram_id"))
    stress_level = Column(Integer, nullable=True) # deprecated
    target_state = Column(String(50), nullable=True) # deprecated
    scale_cns = Column(Integer, nullable=True)
    scale_energy = Column(Integer, nullable=True)
    scale_mental = Column(Integer, nullable=True)
    caffeine_mg = Column(Integer, nullable=True)
    caffeine_time = Column(String(10), nullable=True)
    had_caffeine_recently = Column(Boolean, nullable=True) # deprecated, but kept for backwards compatibility
    weather_temp = Column(Integer, nullable=True)
    latitude = Column(Float, nullable=True)
    weather_condition = Column(String(50), nullable=True)
    
    # Super-Personalization Addon
    current_activity = Column(String(100), nullable=False, default="Кодинг")
    assigned_avatar_id = Column(String(50), nullable=True)
    recommended_herb_id = Column(String(50), ForeignKey("herbs.herb_id"), nullable=True)
    
    # B2B Analytics
    company_id = Column(String(50), nullable=True)

    # EMA & Biometrics context
    menstrual_cycle_day = Column(Integer, nullable=True) # Computed at checkin time

    recommended_recipe_id = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="state_logs")
    feedbacks = relationship("FeedbackLog", back_populates="state_log")

class FeedbackLog(Base):
    __tablename__ = "feedback_logs"

    feedback_id = Column(String(36), primary_key=True, default=generate_uuid)
    log_id = Column(String(36), ForeignKey("state_logs.log_id"))
    effectiveness_score = Column(Integer) # 1-10
    taste_score = Column(Integer) # 1-10
    comment = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    state_log = relationship("StateLog", back_populates="feedbacks")

class BoosterPoint(Base):
    __tablename__ = "booster_points"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    address = Column(String(200), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    status = Column(String(50), default="OPEN") # "OPEN", "CLOSED", "TEMPORARY_CLOSED"
    regular_hours = Column(JSON, nullable=True) # e.g. {"monday": "09:00-21:00"}
    special_hours = Column(JSON, nullable=True) # e.g. {"2026-01-01": "closed"}
    rating_ema = Column(Float, default=5.0)
    total_reviews = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cocktails = relationship("Cocktail", back_populates="point")

class Cocktail(Base):
    __tablename__ = "cocktails"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    point_id = Column(String(36), ForeignKey("booster_points.id"))
    name = Column(String(100), nullable=False)
    base_state = Column(String(50), nullable=False) # "Energy", "Focus", "Relax"
    price = Column(Float, nullable=False, default=0.0)
    taste_description = Column(String(255), nullable=True)
    image_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    point = relationship("BoosterPoint", back_populates="cocktails")

class BaristaCertificate(Base):
    __tablename__ = "barista_certificates"

    cert_id = Column(String(36), primary_key=True, default=generate_uuid)
    telegram_id = Column(BigInteger, ForeignKey("users.telegram_id"))
    point_id = Column(String(36), ForeignKey("booster_points.id"))
    score = Column(Integer, nullable=False)
    passed = Column(Boolean, nullable=False)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    point = relationship("BoosterPoint")

class HACCPLog(Base):
    __tablename__ = "haccp_logs"

    log_id = Column(String(36), primary_key=True, default=generate_uuid)
    point_id = Column(String(36), ForeignKey("booster_points.id"))
    telegram_id = Column(BigInteger, ForeignKey("users.telegram_id")) # Barista who filled it
    shift_type = Column(String(20)) # "OPENING", "CLOSING"
    fridge_temp_ok = Column(Boolean, nullable=False)
    pumps_washed = Column(Boolean, nullable=False)
    expiry_checked = Column(Boolean, nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    point = relationship("BoosterPoint")
    barista = relationship("User")

# --- RBAC Multi-Tenant ---

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False) # e.g. "Point Manager"

class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False) # e.g. "location:update_status"

class RolePermission(Base):
    __tablename__ = "role_permissions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    role_id = Column(Integer, ForeignKey("roles.id"))
    permission_id = Column(Integer, ForeignKey("permissions.id"))

class UserRole(Base):
    __tablename__ = "user_roles"
    id = Column(Integer, primary_key=True, autoincrement=True)
    telegram_id = Column(BigInteger, ForeignKey("users.telegram_id"))
    role_id = Column(Integer, ForeignKey("roles.id"))
    tenant_id = Column(String(36), ForeignKey("booster_points.id"), nullable=True) # None = Global SuperAdmin
    
    user = relationship("User")
    role = relationship("Role")
    tenant = relationship("BoosterPoint")

# --- EMA Rating (Ecological Momentary Assessment) ---
class Review(Base):
    __tablename__ = "reviews"
    review_id = Column(String(36), primary_key=True, default=generate_uuid)
    telegram_id = Column(BigInteger, ForeignKey("users.telegram_id"))
    point_id = Column(String(36), ForeignKey("booster_points.id"))
    rating = Column(Integer, nullable=False) # 1-5
    tags = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    point = relationship("BoosterPoint")

# --- O2O & Click & Collect ---
class Order(Base):
    __tablename__ = "orders"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    telegram_id = Column(BigInteger, ForeignKey("users.telegram_id"))
    point_id = Column(String(36), ForeignKey("booster_points.id"))
    status = Column(String(20), default="pending") # pending, paid, completed, refunded
    short_code = Column(String(10), nullable=False) # e.g. BRAVO-27
    total_amount = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    point = relationship("BoosterPoint")

class CheckInLog(Base):
    __tablename__ = "checkin_logs"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    telegram_id = Column(BigInteger, ForeignKey("users.telegram_id"))
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=True)
    status = Column(String(20), default="valid") # valid, rolled_back
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
