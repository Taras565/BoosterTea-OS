from fastapi import FastAPI, Depends, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
import asyncio
import httpx
import os

import models_v2 as models
import database
from engine import calculate_syutsay, determine_recipe, get_k_ns

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Bio-Adaptive Tea Sommelier")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class StateRequest(BaseModel):
    telegram_id: int
    specific_activity_id: str
    scale_cns: int
    scale_energy: int
    scale_mental: int
    had_caffeine_recently: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None

# Mock HD generator
def mock_hd_type(birth_date: date) -> str:
    types = ["Generator", "Projector", "Manifestor", "Reflector", "Manifesting Generator"]
    idx = (birth_date.year + birth_date.month + birth_date.day) % len(types)
    return types[idx]

@app.post("/api/register")
def register_user(req: RegistrationRequest, db: Session = Depends(database.get_db)):
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
            taste_sweet_pref=req.taste_sweet_pref
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
async def calculate_daily_recipe(req: StateRequest, bg_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
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

    # Engine Logic
    recipe = determine_recipe(
        scale_cns=req.scale_cns,
        scale_energy=req.scale_energy,
        scale_mental=req.scale_mental,
        had_caffeine=req.had_caffeine_recently,
        specific_activity_id=req.specific_activity_id,
        weather_temp=weather_temp,
        user=user
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
        assigned_avatar_id=recipe.get("avatar_id")
    )
    db.add(log)
    db.commit()

    # Schedule Feedback Push
    bg_tasks.add_task(schedule_feedback, user.telegram_id, log.log_id)

    return {
        "status": "ok",
        "recipe": recipe,
        "weather": {"temp": weather_temp, "condition": weather_condition},
        "log_id": log.log_id
    }
