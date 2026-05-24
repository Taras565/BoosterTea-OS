from fastapi import FastAPI, Depends, BackgroundTasks, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime, timedelta
import asyncio
import httpx
import os
import hmac
import hashlib
from urllib.parse import parse_qsl
from fastapi import Request

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
    smoker: bool = False
    oral_contraceptives: bool = False
    target_bedtime: Optional[str] = "23:00"

class StateRequest(BaseModel):
    telegram_id: int
    specific_activity_id: str
    scale_cns: int
    scale_energy: int
    scale_mental: int
    had_caffeine_recently: bool
    caffeine_mg: Optional[int] = None
    caffeine_time: Optional[str] = None
    drink_format: str = "long"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    language: str = "uk"

class BaristaCertRequest(BaseModel):
    telegram_id: int
    point_id: str
    score: int
    passed: bool

class HACCPRequest(BaseModel):
    telegram_id: int
    point_id: str
    shift_type: str
    fridge_temp_ok: bool
    pumps_washed: bool
    expiry_checked: bool
    notes: Optional[str] = None

class ScanQRRequest(BaseModel):
    barista_id: int
    client_id: int
    point_id: str

class StatusUpdateRequest(BaseModel):
    telegram_id: int
    point_id: str
    status: str

class EMAReviewRequest(BaseModel):
    telegram_id: int
    point_id: str
    rating: int # 1-5
    tags: Optional[dict] = None

class ReferralClaimRequest(BaseModel):
    referrer_id: int
    referral_id: int

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
            last_period_date=req.last_period_date,
            smoker=req.smoker,
            oral_contraceptives=req.oral_contraceptives,
            target_bedtime=req.target_bedtime
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
        
        # Inline keyboard (1-10)
        row1 = [{"text": str(i), "callback_data": f"fb:{i}:{log_id}"} for i in range(1, 6)]
        row2 = [{"text": str(i), "callback_data": f"fb:{i}:{log_id}"} for i in range(6, 11)]
        
        payload = {
            "chat_id": user_id, 
            "text": message,
            "reply_markup": {"inline_keyboard": [row1, row2]}
        }
        
        try:
            async with httpx.AsyncClient() as client:
                await client.post(url, json=payload)
        except Exception as e:
            print(f"TG Push Failed: {e}")
    else:
        print(f"[PUSH] Telegram ID {user_id}: {message}")

@app.post("/api/webhook/telegram")
async def telegram_webhook(req: Request, db: Session = Depends(database.get_db)):
    data = await req.json()
    if "callback_query" in data:
        cb = data["callback_query"]
        cb_id = cb["id"]
        cb_data = cb.get("data", "")
        chat_id = cb["message"]["chat"]["id"]
        msg_id = cb["message"]["message_id"]
        
        if cb_data.startswith("fb:"):
            parts = cb_data.split(":")
            if len(parts) == 3:
                score = int(parts[1])
                log_id = parts[2]
                
                feedback = models.FeedbackLog(
                    log_id=log_id,
                    effectiveness_score=score,
                    taste_score=0,
                    comment=None
                )
                db.add(feedback)
                db.commit()
                
                bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
                if bot_token:
                    async with httpx.AsyncClient() as client:
                        await client.post(f"https://api.telegram.org/bot{bot_token}/answerCallbackQuery", json={
                            "callback_query_id": cb_id,
                            "text": "Оцінка збережена! 🚀"
                        })
                        await client.post(f"https://api.telegram.org/bot{bot_token}/editMessageText", json={
                            "chat_id": chat_id,
                            "message_id": msg_id,
                            "text": f"✅ Оцінка {score}/10 збережена. Твій профіль адаптовано!"
                        })
    return {"status": "ok"}

@app.get("/api/set_webhook")
async def set_webhook(url: str):
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        return {"error": "No token"}
    async with httpx.AsyncClient() as client:
        res = await client.post(f"https://api.telegram.org/bot{bot_token}/setWebhook", json={"url": url})
        return res.json()

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

    # Get last 30 days logs for cycling logic
    thirty_days_ago = date.today() - timedelta(days=30)
    past_logs = db.query(models.StateLog).filter(
        models.StateLog.telegram_id == user.telegram_id,
        func.date(models.StateLog.created_at) >= thirty_days_ago
    ).all()

    # Engine Logic
    recipe = determine_recipe(
        scale_cns=req.scale_cns,
        scale_energy=req.scale_energy,
        scale_mental=req.scale_mental,
        caffeine_mg=req.caffeine_mg,
        caffeine_time=req.caffeine_time,
        had_caffeine=req.had_caffeine_recently,
        specific_activity_id=req.specific_activity_id,
        drink_format=req.drink_format,
        weather_temp=weather_temp,
        user=user,
        language=req.language,
        menstrual_cycle_day=menstrual_cycle_day,
        past_logs=past_logs
    )

    # Save Log
    log = models.StateLog(
        telegram_id=user.telegram_id,
        scale_cns=req.scale_cns,
        scale_energy=req.scale_energy,
        scale_mental=req.scale_mental,
        caffeine_mg=req.caffeine_mg,
        caffeine_time=req.caffeine_time,
        had_caffeine_recently=req.had_caffeine_recently,
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
        
    if user.current_streak_cycle > 21:
        user.current_streak_cycle = 1 # Capped streak logic (21 Day Challenge)
        
    user.last_checkin_date = today

    db.commit()

    # Schedule Feedback Push
    bg_tasks.add_task(schedule_feedback, user.telegram_id, log.log_id)

    return {
        "status": "ok",
        "recipe": recipe,
        "weather": {"temp": weather_temp, "condition": weather_condition},
        "log_id": log.log_id,
        "challenge_day": user.current_streak_cycle
    }

@app.get("/api/locations")
def get_locations(db: Session = Depends(database.get_db)):
    points = db.query(models.BoosterPoint).filter(models.BoosterPoint.is_active == True).all()
    return {
        "status": "ok",
        "locations": [
            {
                "id": p.id,
                "name": p.name,
                "address": p.address,
                "lat": p.lat,
                "lon": p.lon,
                "status": p.status,
                "regular_hours": p.regular_hours,
                "special_hours": p.special_hours,
                "rating_ema": p.rating_ema
            } for p in points
        ]
    }

@app.post("/api/seed_locations")
def seed_locations(db: Session = Depends(database.get_db)):
    count = db.query(models.BoosterPoint).count()
    if count > 0:
        return {"status": "already_seeded", "count": count}
    
    # Test locations in Kyiv
    points = [
        models.BoosterPoint(name="BoosterTea Khreshchatyk", address="вул. Хрещатик, 1", lat=50.4501, lon=30.5234),
        models.BoosterPoint(name="BoosterTea Podil", address="вул. Сагайдачного, 10", lat=50.4607, lon=30.5186),
        models.BoosterPoint(name="BoosterTea Gulliver", address="Спортивна площа, 1a", lat=50.4385, lon=30.5226)
    ]
    db.add_all(points)
    db.commit()
    return {"status": "ok", "seeded": len(points)}

@app.post("/api/feedback/ema")
def submit_ema_review(req: EMAReviewRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.telegram_id == req.telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    point = db.query(models.BoosterPoint).filter(models.BoosterPoint.id == req.point_id).first()
    if not point:
        raise HTTPException(status_code=404, detail="Point not found")
        
    # Save the review
    review = models.Review(
        telegram_id=req.telegram_id,
        point_id=req.point_id,
        rating=req.rating,
        tags=req.tags
    )
    db.add(review)
    
    # Calculate new EMA rating
    # N = 50 for sensitivity
    N = 50
    K = 2 / (N + 1)
    
    # EMA_new = (Rating_new * K) + (EMA_prev * (1 - K))
    new_ema = (req.rating * K) + (point.rating_ema * (1 - K))
    point.rating_ema = round(new_ema, 2)
    point.total_reviews += 1
    
    db.commit()
    return {"status": "ok", "new_rating_ema": point.rating_ema}

@app.post("/api/referral/claim")
def claim_referral(req: ReferralClaimRequest, db: Session = Depends(database.get_db)):
    referrer = db.query(models.User).filter(models.User.telegram_id == req.referrer_id).first()
    referral = db.query(models.User).filter(models.User.telegram_id == req.referral_id).first()
    
    if not referrer or not referral:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")
        
    # Set referral link
    referral.referred_by_id = req.referrer_id
    
    # Grant Booster Star (48 hours) to Referrer
    from datetime import datetime, timedelta
    referrer.booster_star_active_until = datetime.utcnow() + timedelta(hours=48)
    
    # Grant Avatar item
    referrer.avatar_id = "golden_cup" # mock exclusive avatar item
    
    db.commit()
    return {
        "status": "ok", 
        "booster_star_active_until": referrer.booster_star_active_until.isoformat(),
        "avatar_id": referrer.avatar_id
    }

@app.post("/api/b2b/status")
def update_point_status(req: StatusUpdateRequest, db: Session = Depends(database.get_db)):
    # Мульти-Тенантний RBAC (Mock перевірка для прототипу)
    user = db.query(models.User).filter(models.User.telegram_id == req.telegram_id).first()
    if not user or user.role not in ["barista", "admin"]:
        raise HTTPException(status_code=403, detail="Доступ заборонено. Тільки для партнерів.")
        
    point = db.query(models.BoosterPoint).filter(models.BoosterPoint.id == req.point_id).first()
    if not point:
        raise HTTPException(status_code=404, detail="Booster Point не знайдено.")
        
    point.status = req.status
    db.commit()
    return {"status": "ok", "point_status": point.status}

@app.post("/api/b2b/certify")
def certify_barista(req: BaristaCertRequest, db: Session = Depends(database.get_db)):
    cert = models.BaristaCertificate(
        telegram_id=req.telegram_id,
        point_id=req.point_id,
        score=req.score,
        passed=req.passed
    )
    db.add(cert)
    
    # Update user role to barista
    user = db.query(models.User).filter(models.User.telegram_id == req.telegram_id).first()
    if user:
        user.role = "barista"
        
    db.commit()
    return {"status": "ok", "cert_id": cert.cert_id}

@app.post("/api/b2b/haccp")
def log_haccp(req: HACCPRequest, db: Session = Depends(database.get_db)):
    log = models.HACCPLog(
        point_id=req.point_id,
        telegram_id=req.telegram_id,
        shift_type=req.shift_type,
        fridge_temp_ok=req.fridge_temp_ok,
        pumps_washed=req.pumps_washed,
        expiry_checked=req.expiry_checked,
        notes=req.notes
    )
    db.add(log)
    db.commit()
    return {"status": "ok", "log_id": log.log_id}

@app.post("/api/b2b/scan_qr")
def scan_qr(req: ScanQRRequest, db: Session = Depends(database.get_db)):
    # Verify barista role (in a real app, verify properly)
    client = db.query(models.User).filter(models.User.telegram_id == req.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    # Increment streak manually here as a manual checkin override
    # If they already checked in today via the app, maybe don't increment, 
    # but for O2O we assume this is the checkin.
    today = date.today()
    if client.last_checkin_date != today:
        if client.last_checkin_date:
            days_missed = (today - client.last_checkin_date).days
            if days_missed == 1:
                client.current_streak_cycle += 1
            elif days_missed == 2 and client.grace_periods > 0:
                client.grace_periods -= 1
                client.current_streak_cycle += 1
            elif days_missed > 1:
                client.current_streak_cycle = 1
        else:
            client.current_streak_cycle = 1
            
        if client.current_streak_cycle > 21:
            client.current_streak_cycle = 1
            
        client.last_checkin_date = today
        db.commit()
        
    return {"status": "ok", "challenge_day": client.current_streak_cycle, "client_name": client.username}

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