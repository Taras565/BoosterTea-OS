from fastapi import FastAPI, Depends, BackgroundTasks, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
import asyncio
import httpx
import os
import hmac
import hashlib
from urllib.parse import parse_qsl

import models_v2 as models
import database
from engine import calculate_syutsay, determine_recipe, get_k_ns

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Bio-Adaptive Tea Sommelier")

# Secure CORS Policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://boostertea-app.onrender.com", "http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Telegram WebApp Auth
BOT_TOKEN = os.getenv("BOT_TOKEN") or os.getenv("TELEGRAM_BOT_TOKEN", "")

def verify_telegram_data(init_data: str) -> bool:
    if not BOT_TOKEN:
        print("WARNING: BOT_TOKEN is not set. Skipping Telegram auth validation.")
        return True # Fail open if no token is set so MVP doesn't break, but print warning
        
    try:
        parsed_data = dict(parse_qsl(init_data))
        if "hash" not in parsed_data:
            return False
            
        hash_val = parsed_data.pop("hash")
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed_data.items()))
        secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        return calculated_hash == hash_val
    except Exception:
        return False

def get_current_user_tg(x_telegram_init_data: Optional[str] = Header(None)):
    # Localhost bypass or when token missing
    if not BOT_TOKEN:
        return True
        
    if not x_telegram_init_data:
        raise HTTPException(status_code=401, detail="Missing Telegram Auth Data")
        
    if not verify_telegram_data(x_telegram_init_data):
        raise HTTPException(status_code=403, detail="Invalid Telegram Signature")
    
    return True

import json

@app.get("/api/reset_db")
def reset_db():
    try:
        models.Base.metadata.drop_all(bind=database.engine)
        models.Base.metadata.create_all(bind=database.engine)
        return {"status": "Database successfully reset with new schema!"}
    except Exception as e:
        return {"status": "Error", "message": str(e)}

@app.get("/api/me")
def get_me(db: Session = Depends(database.get_db), tg_user: bool = Depends(get_current_user_tg), x_telegram_init_data: Optional[str] = Header(None)):
    if not x_telegram_init_data:
        return {"user": None}
    
    try:
        parsed_data = dict(parse_qsl(x_telegram_init_data))
        user_json = parsed_data.get("user")
        if not user_json:
            return {"user": None}
        
        tg_id = json.loads(user_json).get("id")
        user = db.query(models.User).filter(models.User.telegram_id == tg_id).first()
        
        if user:
            return {
                "user": {
                    "name": user.username or "",
                    "weight": user.weight,
                    "gender": user.gender,
                    "birthDate": str(user.birth_date) if user.birth_date else "",
                    "profession": user.profession_type,
                    "taste_acid": user.taste_acid_pref,
                    "taste_bitter": user.taste_bitter_pref,
                    "taste_sweet": user.taste_sweet_pref,
                    "caffeine_sensitivity": user.caffeine_sensitivity,
                    "company_id": user.company_id,
                    "current_streak_cycle": user.current_streak_cycle,
                    "last_period_date": str(user.last_period_date) if user.last_period_date else None
                }
            }
    except Exception as e:
        print("Error in /api/me:", e)
    
    return {"user": None}

class RegistrationRequest(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    weight: int
    gender: str
    birth_date: date
    taste_acid_pref: int = 5
    taste_bitter_pref: int = 5
    taste_sweet_pref: int = 5
    profession_type: Optional[str] = "COGNITIVE"
    birth_time: Optional[str] = "12:00"
    birth_place: Optional[str] = None
    caffeine_sensitivity: str = "normal"
    company_id: Optional[str] = None
    last_period_date: Optional[date] = None

class StateRequest(BaseModel):
    telegram_id: int
    specific_activity_id: str
    scale_cns: int
    scale_energy: int
    scale_mental: int
    had_caffeine_recently: bool
    drink_format: str = "long"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    language: str = "uk"

# Mock HD generator
def mock_hd_type(birth_date: date) -> str:
    types = ["Generator", "Projector", "Manifestor", "Reflector", "Manifesting Generator"]
    idx = (birth_date.year + birth_date.month + birth_date.day) % len(types)
    return types[idx]

@app.post("/api/register")
def register_user(req: RegistrationRequest, db: Session = Depends(database.get_db), tg_user: bool = Depends(get_current_user_tg)):
    user = db.query(models.User).filter(models.User.telegram_id == req.telegram_id).first()
    
    hd = mock_hd_type(req.birth_date)
    syutsay = calculate_syutsay(req.birth_date)

    if not user:
        # Time string to python time object (simplified)
        from datetime import time
        h, m = map(int, req.birth_time.split(':')) if req.birth_time else (12, 0)
        
        user = models.User(
            telegram_id=req.telegram_id,
            username=req.username,
            weight=req.weight,
            gender=req.gender,
            birth_date=req.birth_date,
            birth_time=time(h, m),
            birth_place=req.birth_place,
            hd_type=hd,
            syutsay_number=syutsay,
            profession_type=req.profession_type,
            taste_acid_pref=req.taste_acid_pref,
            taste_bitter_pref=req.taste_bitter_pref,
            taste_sweet_pref=req.taste_sweet_pref,
            caffeine_sensitivity=req.caffeine_sensitivity,
            company_id=req.company_id,
            last_period_date=req.last_period_date
        )
        db.add(user)
        db.commit()
    
    return {"status": "ok", "hd_type": hd, "syutsay_number": syutsay, "k_ns": get_k_ns(hd)}

async def schedule_feedback(user_id: int, log_id: str):
    await asyncio.sleep(7200) # 2 hours
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    message = f"Привіт! Як твій фокус після біо-бусту? Оціни свій стан від 1 до 10. (Log ID: {log_id})"
    
    if bot_token:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        try:
            async with httpx.AsyncClient() as client:
                await client.post(url, json={"chat_id": user_id, "text": message})
        except Exception as e:
            print(f"TG Push Failed: {e}")
    else:
        print(f"[PUSH] Telegram ID {user_id}: {message}")

@app.post("/api/calculate")
async def calculate_daily_recipe(req: StateRequest, bg_tasks: BackgroundTasks, db: Session = Depends(database.get_db), tg_user: bool = Depends(get_current_user_tg)):
    user = db.query(models.User).filter(models.User.telegram_id == req.telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please complete onboarding.")

    # Real weather API integration
    weather_temp = 22 # fallback
    weather_condition = "Unknown"
    
    if req.latitude is not None and req.longitude is not None:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(f"https://api.open-meteo.com/v1/forecast?latitude={req.latitude}&longitude={req.longitude}&current_weather=true", timeout=3.0)
                if res.status_code == 200:
                    data = res.json()
                    weather_temp = int(data["current_weather"]["temperature"])
        except Exception as e:
            print(f"Weather fetch failed: {e}")

    # Determine menstrual cycle day if applicable
    menstrual_cycle_day = None
    if user.gender.lower() in ['female', 'жінка', 'f'] and user.last_period_date:
        delta = date.today() - user.last_period_date
        menstrual_cycle_day = (delta.days % 28) + 1

    # Engine Logic
    recipe = determine_recipe(
        scale_cns=req.scale_cns,
        scale_energy=req.scale_energy,
        scale_mental=req.scale_mental,
        had_caffeine=req.had_caffeine_recently,
        specific_activity_id=req.specific_activity_id,
        drink_format=req.drink_format,
        weather_temp=weather_temp,
        user=user,
        language=req.language,
        menstrual_cycle_day=menstrual_cycle_day
    )

    # Save Log
    log = models.StateLog(
        telegram_id=user.telegram_id,
        scale_cns=req.scale_cns,
        scale_energy=req.scale_energy,
        scale_mental=req.scale_mental,
        had_caffeine=req.had_caffeine_recently,
        current_activity=req.specific_activity_id,
        weather_temp=weather_temp,
        weather_condition=weather_condition,
        recommended_recipe_id=recipe["base"],
        assigned_avatar_id=recipe.get("avatar_id"),
        company_id=user.company_id,
        menstrual_cycle_day=menstrual_cycle_day
    )
    db.add(log)
    
    # Streak & Grace Period Logic
    today = date.today()
    if user.last_checkin_date:
        days_missed = (today - user.last_checkin_date).days
        if days_missed == 1:
            user.current_streak_cycle += 1
        elif days_missed == 2 and user.grace_periods > 0:
            user.grace_periods -= 1
            user.current_streak_cycle += 1
        elif days_missed > 1:
            user.current_streak_cycle = 1 # Reset cycle after grace period fail
            user.grace_periods = 1 # Restore grace period on new cycle
    else:
        user.current_streak_cycle = 1
        
    if user.current_streak_cycle > 7:
        user.current_streak_cycle = 1 # Capped streak logic
        
    user.last_checkin_date = today

    db.commit()

    # Schedule Feedback Push
    bg_tasks.add_task(schedule_feedback, user.telegram_id, log.log_id)

    return {
        "status": "ok",
        "recipe": recipe,
        "weather": {"temp": weather_temp, "condition": weather_condition},
        "log_id": log.log_id
    }

@app.get("/api/stats")
def get_stats(db: Session = Depends(database.get_db)):
    users_count = db.query(models.User).count()
    logs_count = db.query(models.StateLog).count()
    return {
        "status": "online",
        "total_users": users_count,
        "total_checkins": logs_count
    }

@app.get("/api/export_data")
def export_data(token: str, db: Session = Depends(database.get_db)):
    if not BOT_TOKEN or token != BOT_TOKEN:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid Export Token")
        
    from fastapi.responses import StreamingResponse
    import io
    import csv
    
    users = db.query(models.User).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["telegram_id", "username", "gender", "weight", "birth_date", "profession_type", "hd_type", "k_ns", "created_at"])
    
    for u in users:
        writer.writerow([u.telegram_id, u.username, u.gender, u.weight, u.birth_date, u.profession_type, u.hd_type, get_k_ns(u.hd_type or ""), u.created_at])
        
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=liquid_os_users.csv"})


# B2B Pulse API with Anonymity Threshold
@app.get("/api/v1/b2b/pulse")
def get_b2b_pulse(company_id: str, db: Session = Depends(database.get_db)):
    if not company_id:
        raise HTTPException(status_code=400, detail="Missing company_id")
        
    today = date.today()
    logs = db.query(models.StateLog).filter(
        models.StateLog.company_id == company_id,
        func.date(models.StateLog.created_at) == today
    ).all()
    
    unique_users = set(log.telegram_id for log in logs)
    
    if len(unique_users) < 3:
        return {"status": "insufficient_data", "message": "Anonymity threshold not met (< 3 unique users today)"}
        
    avg_cns = sum(log.scale_cns for log in logs if log.scale_cns is not None) / len(logs)
    avg_energy = sum(log.scale_energy for log in logs if log.scale_energy is not None) / len(logs)
    avg_mental = sum(log.scale_mental for log in logs if log.scale_mental is not None) / len(logs)
    
    return {
        "status": "ok",
        "company_id": company_id,
        "unique_users_today": len(unique_users),
        "vibe": {
            "avg_cns_load": round(avg_cns, 1),
            "avg_energy": round(avg_energy, 1),
            "avg_mental": round(avg_mental, 1)
        }
    }


class EMAFeedbackRequest(BaseModel):
    log_id: str
    effectiveness_score: int
    taste_score: int
    comment: Optional[str] = None

@app.post("/api/v1/feedback/ema")
def submit_ema_feedback(req: EMAFeedbackRequest, db: Session = Depends(database.get_db), tg_user: bool = Depends(get_current_user_tg)):
    log = db.query(models.StateLog).filter(models.StateLog.log_id == req.log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="State log not found")
        
    feedback = models.FeedbackLog(
        log_id=req.log_id,
        effectiveness_score=req.effectiveness_score,
        taste_score=req.taste_score,
        comment=req.comment
    )
    db.add(feedback)
    db.commit()
    
    return {"status": "ok", "message": "Feedback saved for Contextual Bandit model"}