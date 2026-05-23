from sqlalchemy import Column, Integer, BigInteger, String, Float, Date, Time, ForeignKey, DateTime, Boolean
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
    company_id = Column(String(50), nullable=True)
    current_streak_cycle = Column(Integer, default=0)
    last_checkin_date = Column(Date, nullable=True)
    grace_periods = Column(Integer, default=1)

    # Biometrics & Endocrinology (Block 2)
    last_period_date = Column(Date, nullable=True) # for calculating ALLO drop in luteal phase

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
