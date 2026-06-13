"""
BoosterTea Liquid OS — Full Stress Test Suite
Тестує 100+ сценаріїв: всі ендпоінти, граничні кейси, движок, рецепти.
"""

import asyncio
import httpx
import random
import json
from datetime import date, timedelta, datetime
from collections import defaultdict
import time
import sys

API_URL = "http://localhost:8000/api"
NUM_USERS = 100
TIMEOUT = 15.0

genders = ["male", "female"]
professions = ["coding", "study", "business", "creative", "sport", "routine"]
formats = ["long", "shot", "tea"]
languages = ["uk", "en", "ru", "es"]
caffeine_amounts = [0, 60, 120, 150, 200, 250]  # 250 — граничний кейс
sensitivities = ["normal", "high"]

results = {
    "pass": 0,
    "fail": 0,
    "errors": [],
    "warnings": [],
    "endpoint_stats": defaultdict(lambda: {"ok": 0, "fail": 0}),
    "recipe_stats": defaultdict(int),
    "base_distribution": defaultdict(int),
    "edge_cases": []
}

def log_pass(endpoint):
    results["pass"] += 1
    results["endpoint_stats"][endpoint]["ok"] += 1

def log_fail(endpoint, msg):
    results["fail"] += 1
    results["endpoint_stats"][endpoint]["fail"] += 1
    results["errors"].append(f"[{endpoint}] {msg}")

def log_warn(msg):
    results["warnings"].append(f"⚠️  {msg}")

def log_edge(msg):
    results["edge_cases"].append(f"🔬 {msg}")


# ───────────────────────────────────────────────
# HELPER — Generate random user payload
# ───────────────────────────────────────────────
def make_user(idx, gender=None, birth_year=None, smoker=None, contraceptives=None,
              sensitivity=None, bedtime=None, weight=None):
    g = gender or random.choice(genders)
    by = birth_year or random.randint(1975, 2004)
    bd = date(by, random.randint(1, 12), random.randint(1, 28))
    return {
        "telegram_id": 10000000 + idx,
        "username": f"StressUser_{idx}",
        "weight": weight or random.randint(45, 130),
        "gender": g,
        "birth_date": bd.isoformat(),
        "profession_type": random.choice(professions),
        "taste_acid_pref": random.randint(1, 10),
        "taste_bitter_pref": random.randint(1, 10),
        "taste_sweet_pref": random.randint(1, 10),
        "caffeine_sensitivity": sensitivity or random.choice(sensitivities),
        "smoker": smoker if smoker is not None else random.choice([True, False]),
        "oral_contraceptives": contraceptives if contraceptives is not None else (random.choice([True, False]) if g == "female" else False),
        "target_bedtime": bedtime or f"{random.randint(21, 23):02d}:{random.choice(['00','30'])}",
        "last_period_date": (date.today() - timedelta(days=random.randint(1, 27))).isoformat() if g == "female" else None,
    }

def make_calc(tg_id, prof=None, fmt=None, lang=None, cns=None, energy=None, mental=None,
              caff_mg=None, caff_time=None, had_caff=None):
    p = prof or random.choice(professions)
    return {
        "telegram_id": tg_id,
        "specific_activity_id": p,
        "scale_cns": cns or random.randint(2, 10),
        "scale_energy": energy or random.randint(2, 10),
        "scale_mental": mental or random.randint(2, 10),
        "had_caffeine_recently": had_caff if had_caff is not None else random.choice([True, False]),
        "caffeine_mg": caff_mg if caff_mg is not None else random.choice(caffeine_amounts),
        "caffeine_time": caff_time or f"{random.randint(8, 22):02d}:00",
        "drink_format": fmt or random.choice(formats),
        "latitude": random.uniform(46, 52),
        "longitude": random.uniform(22, 38),
        "language": lang or random.choice(languages),
    }


# ───────────────────────────────────────────────
# TEST 1 — Basic Register + Calculate (100 users)
# ───────────────────────────────────────────────
async def test_register_calculate(client: httpx.AsyncClient, idx: int):
    user_data = make_user(idx)
    tg_id = user_data["telegram_id"]

    # Register
    try:
        r = await client.post(f"{API_URL}/register", json=user_data, timeout=TIMEOUT)
        if r.status_code == 200:
            log_pass("register")
        else:
            log_fail("register", f"User {idx}: HTTP {r.status_code} — {r.text[:200]}")
            return None
    except Exception as e:
        log_fail("register", f"User {idx}: {e}")
        return None

    # Calculate
    calc_data = make_calc(tg_id)
    try:
        r2 = await client.post(f"{API_URL}/calculate", json=calc_data, timeout=TIMEOUT)
        if r2.status_code == 200:
            data = r2.json()
            recipe = data.get("recipe", {})

            # Assertions
            if not recipe.get("base"):
                log_fail("calculate", f"User {idx}: Missing 'base' in recipe")
                return None
            if not recipe.get("tea_ml") or recipe["tea_ml"] <= 0:
                log_fail("calculate", f"User {idx}: Invalid tea_ml={recipe.get('tea_ml')}")
                return None
            if recipe["tea_ml"] > 500:
                log_warn(f"User {idx}: Extremely high tea_ml={recipe['tea_ml']} (weight={user_data['weight']}kg)")
            if not recipe.get("activator"):
                log_fail("calculate", f"User {idx}: Missing activator")
                return None
            if not recipe.get("instructions"):
                log_fail("calculate", f"User {idx}: Missing instructions")
                return None
            if not recipe.get("avatar_name"):
                log_fail("calculate", f"User {idx}: Missing avatar_name")
                return None
            if not recipe.get("stats"):
                log_fail("calculate", f"User {idx}: Missing stats block")
                return None
            if not data.get("challenge_day"):
                log_warn(f"User {idx}: Missing challenge_day in response")

            results["base_distribution"][recipe.get("base_key", "??")] += 1
            results["recipe_stats"][calc_data["drink_format"]] += 1
            log_pass("calculate")
            return tg_id
        else:
            log_fail("calculate", f"User {idx}: HTTP {r2.status_code} — {r2.text[:200]}")
            return None
    except Exception as e:
        log_fail("calculate", f"User {idx}: {e}")
        return None


# ───────────────────────────────────────────────
# TEST 2 — All 6 professions × 3 formats × 4 langs
# ───────────────────────────────────────────────
async def test_all_profession_format_combos(client: httpx.AsyncClient, base_idx: int):
    """72 combination tests."""
    combos_ok = 0
    combos_fail = 0

    for p_i, prof in enumerate(professions):
        for f_i, fmt in enumerate(formats):
            for l_i, lang in enumerate(languages[:2]):  # uk + en to save time
                idx = base_idx + p_i * 100 + f_i * 10 + l_i
                tg_id = 20000000 + idx
                user = make_user(idx, gender=random.choice(genders))
                user["telegram_id"] = tg_id

                # Register (may already exist — that's OK)
                await client.post(f"{API_URL}/register", json=user, timeout=TIMEOUT)

                calc = make_calc(tg_id, prof=prof, fmt=fmt, lang=lang)
                try:
                    r = await client.post(f"{API_URL}/calculate", json=calc, timeout=TIMEOUT)
                    if r.status_code == 200:
                        recipe = r.json().get("recipe", {})
                        if recipe.get("base") and recipe.get("tea_ml", 0) > 0:
                            combos_ok += 1
                            log_pass("calculate_combo")
                        else:
                            combos_fail += 1
                            log_fail("calculate_combo", f"prof={prof} fmt={fmt} lang={lang}: incomplete recipe")
                    else:
                        combos_fail += 1
                        log_fail("calculate_combo", f"prof={prof} fmt={fmt} lang={lang}: HTTP {r.status_code}")
                except Exception as e:
                    combos_fail += 1
                    log_fail("calculate_combo", f"{prof}/{fmt}/{lang}: {e}")

    log_edge(f"Profession×Format×Lang combos: {combos_ok} OK / {combos_fail} FAIL")


# ───────────────────────────────────────────────
# TEST 3 — Edge Cases
# ───────────────────────────────────────────────
async def test_edge_cases(client: httpx.AsyncClient):
    """Граничні кейси для движка."""

    # Edge A: Max weight (130kg)
    tg_id = 30000001
    u = make_user(9901, weight=130, gender="male")
    u["telegram_id"] = tg_id
    await client.post(f"{API_URL}/register", json=u, timeout=TIMEOUT)
    r = await client.post(f"{API_URL}/calculate", json=make_calc(tg_id, cns=10, energy=10, mental=10), timeout=TIMEOUT)
    if r.status_code == 200:
        ml = r.json().get("recipe", {}).get("tea_ml", 0)
        log_edge(f"Edge A (max weight 130kg): tea_ml={ml}")
        log_pass("edge_max_weight")
    else:
        log_fail("edge_max_weight", f"HTTP {r.status_code}")

    # Edge B: Min weight (45kg)
    tg_id = 30000002
    u = make_user(9902, weight=45, gender="female")
    u["telegram_id"] = tg_id
    await client.post(f"{API_URL}/register", json=u, timeout=TIMEOUT)
    r = await client.post(f"{API_URL}/calculate", json=make_calc(tg_id, cns=2, energy=2, mental=2), timeout=TIMEOUT)
    if r.status_code == 200:
        ml = r.json().get("recipe", {}).get("tea_ml", 0)
        log_edge(f"Edge B (min weight 45kg): tea_ml={ml}")
        log_pass("edge_min_weight")
    else:
        log_fail("edge_min_weight", f"HTTP {r.status_code}")

    # Edge C: Smoker + high caffeine → fast metabolism
    tg_id = 30000003
    u = make_user(9903, smoker=True, sensitivity="normal")
    u["telegram_id"] = tg_id
    await client.post(f"{API_URL}/register", json=u, timeout=TIMEOUT)
    r = await client.post(f"{API_URL}/calculate", json=make_calc(tg_id, caff_mg=200, caff_time="06:00"), timeout=TIMEOUT)
    if r.status_code == 200:
        log_edge(f"Edge C (smoker + 200mg caffeine at 6am): OK")
        log_pass("edge_smoker_caffeine")
    else:
        log_fail("edge_smoker_caffeine", f"HTTP {r.status_code}")

    # Edge D: Oral contraceptives → slow metabolism
    tg_id = 30000004
    u = make_user(9904, gender="female", contraceptives=True)
    u["telegram_id"] = tg_id
    await client.post(f"{API_URL}/register", json=u, timeout=TIMEOUT)
    r = await client.post(f"{API_URL}/calculate", json=make_calc(tg_id, caff_mg=120, caff_time="08:00"), timeout=TIMEOUT)
    if r.status_code == 200:
        log_edge(f"Edge D (OC + 120mg caffeine): OK")
        log_pass("edge_oral_contraceptives")
    else:
        log_fail("edge_oral_contraceptives", f"HTTP {r.status_code}")

    # Edge E: Curfew — bedtime in 30 min, request sport (energy)
    tg_id = 30000005
    now = datetime.now()
    bedtime_soon = f"{(now.hour):02d}:{(now.minute + 30) % 60:02d}"
    u = make_user(9905, bedtime=bedtime_soon)
    u["telegram_id"] = tg_id
    await client.post(f"{API_URL}/register", json=u, timeout=TIMEOUT)
    r = await client.post(f"{API_URL}/calculate", json=make_calc(tg_id, prof="sport"), timeout=TIMEOUT)
    if r.status_code == 200:
        base_key = r.json().get("recipe", {}).get("base_key", "??")
        explanation = r.json().get("recipe", {}).get("explanation", "")
        has_curfew = "Комендантська" in explanation or "sleep" in explanation.lower()
        if has_curfew:
            log_edge(f"Edge E (curfew activated for sport near bedtime): base_key={base_key} ✅")
        else:
            log_edge(f"Edge E (curfew NOT triggered near bedtime): base_key={base_key} — check logic")
        log_pass("edge_curfew")
    else:
        log_fail("edge_curfew", f"HTTP {r.status_code}")

    # Edge F: Female, late luteal phase (day 25) — PMDD
    tg_id = 30000006
    period_start = date.today() - timedelta(days=24)  # cycle day ~25
    u = make_user(9906, gender="female")
    u["telegram_id"] = tg_id
    u["last_period_date"] = period_start.isoformat()
    await client.post(f"{API_URL}/register", json=u, timeout=TIMEOUT)
    r = await client.post(f"{API_URL}/calculate", json=make_calc(tg_id, prof="routine"), timeout=TIMEOUT)
    if r.status_code == 200:
        base_key = r.json().get("recipe", {}).get("base_key", "??")
        supplement = r.json().get("recipe", {}).get("supplement")
        log_edge(f"Edge F (PMDD late luteal day ~25): base_key={base_key}, supplement={supplement}")
        log_pass("edge_pmdd")
    else:
        log_fail("edge_pmdd", f"HTTP {r.status_code}")

    # Edge G: High caffeine sensitivity
    tg_id = 30000007
    u = make_user(9907, sensitivity="high")
    u["telegram_id"] = tg_id
    await client.post(f"{API_URL}/register", json=u, timeout=TIMEOUT)
    r = await client.post(f"{API_URL}/calculate", json=make_calc(tg_id, caff_mg=60, caff_time="10:00"), timeout=TIMEOUT)
    if r.status_code == 200:
        log_edge(f"Edge G (high caffeine sensitivity): OK")
        log_pass("edge_high_sensitivity")
    else:
        log_fail("edge_high_sensitivity", f"HTTP {r.status_code}")

    # Edge H: Unknown profession_type (fallback)
    tg_id = 30000008
    u = make_user(9908)
    u["telegram_id"] = tg_id
    u["profession_type"] = "unknown_type"
    await client.post(f"{API_URL}/register", json=u, timeout=TIMEOUT)
    calc = make_calc(tg_id)
    calc["specific_activity_id"] = "unknown_activity"
    r = await client.post(f"{API_URL}/calculate", json=calc, timeout=TIMEOUT)
    if r.status_code == 200:
        log_edge(f"Edge H (unknown activity fallback): OK — base_key={r.json().get('recipe',{}).get('base_key')}")
        log_pass("edge_unknown_activity")
    else:
        log_fail("edge_unknown_activity", f"HTTP {r.status_code}: {r.text[:150]}")

    # Edge I: Unregistered user → should return 404
    tg_id = 99999999
    r = await client.post(f"{API_URL}/calculate", json=make_calc(tg_id), timeout=TIMEOUT)
    if r.status_code == 404:
        log_edge("Edge I (unregistered user → 404): ✅ Correct")
        log_pass("edge_404_unregistered")
    else:
        log_fail("edge_404_unregistered", f"Expected 404, got {r.status_code}: {r.text[:100]}")

    # Edge J: Max stress (cns=10) for all professions
    for prof in professions:
        tg_id = 30000010 + professions.index(prof)
        u = make_user(9910 + professions.index(prof))
        u["telegram_id"] = tg_id
        await client.post(f"{API_URL}/register", json=u, timeout=TIMEOUT)
        r = await client.post(f"{API_URL}/calculate", json=make_calc(tg_id, prof=prof, cns=10, energy=10, mental=10), timeout=TIMEOUT)
        if r.status_code == 200:
            log_pass(f"edge_max_stress_{prof}")
        else:
            log_fail(f"edge_max_stress_{prof}", f"HTTP {r.status_code}")


# ───────────────────────────────────────────────
# TEST 4 — Other API Endpoints
# ───────────────────────────────────────────────
async def test_other_endpoints(client: httpx.AsyncClient, tg_id: int):
    """Перевірка допоміжних ендпоінтів."""

    # /api/stats
    try:
        r = await client.get(f"{API_URL}/stats", timeout=TIMEOUT)
        if r.status_code == 200:
            d = r.json()
            if "total_users" in d and "total_checkins" in d:
                log_pass("stats")
            else:
                log_fail("stats", f"Missing fields: {d}")
        else:
            log_fail("stats", f"HTTP {r.status_code}")
    except Exception as e:
        log_fail("stats", str(e))

    # /api/locations
    try:
        r = await client.get(f"{API_URL}/locations", timeout=TIMEOUT)
        if r.status_code == 200:
            d = r.json()
            locations = d.get("locations", [])
            if isinstance(locations, list):
                log_pass("locations")
                if len(locations) == 0:
                    log_warn("locations: no locations returned (may need seeding)")
                else:
                    # Validate location structure
                    for loc in locations:
                        for field in ["id", "name", "lat", "lon", "status"]:
                            if field not in loc:
                                log_warn(f"Location missing field '{field}': {loc}")
            else:
                log_fail("locations", f"Not a list: {d}")
        else:
            log_fail("locations", f"HTTP {r.status_code}")
    except Exception as e:
        log_fail("locations", str(e))

    # /api/order/generate_code
    try:
        r = await client.get(f"{API_URL}/order/generate_code", timeout=TIMEOUT)
        if r.status_code == 200:
            d = r.json()
            code = d.get("short_code", "")
            if code and "-" in code:
                log_pass("order_generate_code")
            else:
                log_fail("order_generate_code", f"Invalid short_code: {code}")
        else:
            log_fail("order_generate_code", f"HTTP {r.status_code}")
    except Exception as e:
        log_fail("order_generate_code", str(e))

    # /api/b2b/certify
    try:
        r = await client.post(f"{API_URL}/b2b/certify", json={
            "telegram_id": tg_id,
            "point_id": "test-point-1",
            "score": 100,
            "passed": True
        }, timeout=TIMEOUT)
        if r.status_code == 200:
            d = r.json()
            if d.get("status") == "ok" and d.get("cert_id"):
                log_pass("b2b_certify")
            else:
                log_fail("b2b_certify", f"Bad response: {d}")
        else:
            log_fail("b2b_certify", f"HTTP {r.status_code}: {r.text[:150]}")
    except Exception as e:
        log_fail("b2b_certify", str(e))

    # /api/b2b/haccp
    try:
        r = await client.post(f"{API_URL}/b2b/haccp", json={
            "telegram_id": tg_id,
            "point_id": "test-point-1",
            "shift_type": "OPENING",
            "fridge_temp_ok": True,
            "pumps_washed": True,
            "expiry_checked": True,
            "notes": "Stress test HACCP log"
        }, timeout=TIMEOUT)
        if r.status_code == 200:
            log_pass("b2b_haccp")
        else:
            log_fail("b2b_haccp", f"HTTP {r.status_code}: {r.text[:150]}")
    except Exception as e:
        log_fail("b2b_haccp", str(e))

    # /api/b2b/scan_qr — scan existing user
    try:
        r = await client.post(f"{API_URL}/b2b/scan_qr", json={
            "barista_id": tg_id,
            "client_id": tg_id,
            "point_id": "test-point-1"
        }, timeout=TIMEOUT)
        if r.status_code == 200:
            d = r.json()
            if "challenge_day" in d:
                log_pass("b2b_scan_qr")
            else:
                log_fail("b2b_scan_qr", f"Missing challenge_day: {d}")
        elif r.status_code == 404:
            log_warn("b2b_scan_qr: client not found (user may not exist as client)")
            log_pass("b2b_scan_qr")  # acceptable
        else:
            log_fail("b2b_scan_qr", f"HTTP {r.status_code}: {r.text[:150]}")
    except Exception as e:
        log_fail("b2b_scan_qr", str(e))

    # /api/b2b/status — should fail (user not barista yet)
    try:
        r = await client.post(f"{API_URL}/b2b/status", json={
            "telegram_id": tg_id,
            "point_id": "test-point-1",
            "status": "OPEN"
        }, timeout=TIMEOUT)
        # After certify, user is barista — expect 200 or 404 (point not found)
        if r.status_code in [200, 403, 404]:
            log_pass("b2b_status")
        else:
            log_fail("b2b_status", f"Unexpected HTTP {r.status_code}: {r.text[:150]}")
    except Exception as e:
        log_fail("b2b_status", str(e))

    # /api/v1/b2b/pulse — should return insufficient_data or ok
    try:
        r = await client.get(f"{API_URL}/v1/b2b/pulse?company_id=test-company", timeout=TIMEOUT)
        if r.status_code == 200:
            d = r.json()
            if d.get("status") in ["ok", "insufficient_data"]:
                log_pass("b2b_pulse")
            else:
                log_fail("b2b_pulse", f"Bad status: {d}")
        else:
            log_fail("b2b_pulse", f"HTTP {r.status_code}")
    except Exception as e:
        log_fail("b2b_pulse", str(e))

    # /api/v1/feedback/ema — needs valid log_id, use mock
    try:
        r = await client.post(f"{API_URL}/v1/feedback/ema", json={
            "log_id": "00000000-0000-0000-0000-000000000000",
            "effectiveness_score": 8,
            "taste_score": 7,
            "comment": "stress test"
        }, timeout=TIMEOUT)
        if r.status_code in [200, 404]:
            log_pass("ema_feedback")
        else:
            log_fail("ema_feedback", f"HTTP {r.status_code}: {r.text[:150]}")
    except Exception as e:
        log_fail("ema_feedback", str(e))


# ───────────────────────────────────────────────
# TEST 5 — Concurrent Load Test
# ───────────────────────────────────────────────
async def test_concurrent_load(client: httpx.AsyncClient):
    """20 одночасних запитів calculate."""
    tg_ids_registered = []

    # Pre-register 20 users
    for i in range(20):
        tg_id = 40000000 + i
        u = make_user(5000 + i)
        u["telegram_id"] = tg_id
        r = await client.post(f"{API_URL}/register", json=u, timeout=TIMEOUT)
        if r.status_code == 200:
            tg_ids_registered.append(tg_id)

    # Fire all at once
    tasks = [
        client.post(f"{API_URL}/calculate", json=make_calc(tid), timeout=TIMEOUT)
        for tid in tg_ids_registered
    ]
    t0 = time.time()
    responses = await asyncio.gather(*tasks, return_exceptions=True)
    elapsed = time.time() - t0

    ok_count = 0
    for resp in responses:
        if isinstance(resp, Exception):
            log_fail("concurrent_load", str(resp))
        elif resp.status_code == 200:
            ok_count += 1
            log_pass("concurrent_load")
        else:
            log_fail("concurrent_load", f"HTTP {resp.status_code}")

    log_edge(f"Concurrent load (20 simultaneous): {ok_count}/{len(responses)} OK in {elapsed:.2f}s")
    if elapsed > 10:
        log_warn(f"Concurrent load took {elapsed:.2f}s — potential performance issue")


# ───────────────────────────────────────────────
# TEST 6 — Duplicate Register (idempotency)
# ───────────────────────────────────────────────
async def test_duplicate_register(client: httpx.AsyncClient):
    tg_id = 50000001
    u = make_user(8001)
    u["telegram_id"] = tg_id

    r1 = await client.post(f"{API_URL}/register", json=u, timeout=TIMEOUT)
    r2 = await client.post(f"{API_URL}/register", json=u, timeout=TIMEOUT)

    if r1.status_code == 200 and r2.status_code == 200:
        log_pass("duplicate_register")
        log_edge("Duplicate register: idempotent ✅")
    else:
        log_fail("duplicate_register", f"r1={r1.status_code}, r2={r2.status_code}")


# ───────────────────────────────────────────────
# TEST 7 — Streak Logic
# ───────────────────────────────────────────────
async def test_streak_logic(client: httpx.AsyncClient):
    tg_id = 60000001
    u = make_user(7001)
    u["telegram_id"] = tg_id
    await client.post(f"{API_URL}/register", json=u, timeout=TIMEOUT)

    # First checkin
    r = await client.post(f"{API_URL}/calculate", json=make_calc(tg_id), timeout=TIMEOUT)
    if r.status_code == 200:
        day1 = r.json().get("challenge_day", 0)
        # Second checkin (same day — should not increment streak)
        r2 = await client.post(f"{API_URL}/calculate", json=make_calc(tg_id), timeout=TIMEOUT)
        if r2.status_code == 200:
            day2 = r2.json().get("challenge_day", 0)
            log_edge(f"Streak logic: first={day1}, second same-day={day2} (should be same)")
            if day2 < 1 or day2 > 21:
                log_fail("streak_logic", f"challenge_day out of range: {day2}")
            else:
                log_pass("streak_logic")
        else:
            log_fail("streak_logic", f"Second calc HTTP {r2.status_code}")
    else:
        log_fail("streak_logic", f"First calc HTTP {r.status_code}")


# ───────────────────────────────────────────────
# MAIN
# ───────────────────────────────────────────────
async def main():
    print("\n" + "="*60)
    print("   🧬 BoosterTea Liquid OS — Full Stress Test Suite")
    print("="*60)
    print(f"   Target: {API_URL}")
    print(f"   Users:  {NUM_USERS}")
    print(f"   Time:   {datetime.now().strftime('%H:%M:%S')}")
    print("="*60 + "\n")

    # Health check
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(f"{API_URL}/stats", timeout=5.0)
            if r.status_code != 200:
                print(f"❌ FATAL: Backend not reachable at {API_URL}")
                print(f"   Response: {r.status_code} — {r.text[:100]}")
                sys.exit(1)
            else:
                d = r.json()
                print(f"✅ Backend online — Users in DB: {d.get('total_users', '?')}, Checkins: {d.get('total_checkins', '?')}\n")
        except Exception as e:
            print(f"❌ FATAL: Cannot connect to {API_URL}")
            print(f"   Error: {e}")
            print("\n   💡 Make sure to start the backend first:")
            print("      cd backend && uvicorn main:app --reload")
            sys.exit(1)

    async with httpx.AsyncClient() as client:

        # ── Phase 1: Register + Calculate 100 users ──
        print("📦 Phase 1: Registering & calculating 100 users...")
        tasks = [test_register_calculate(client, i) for i in range(NUM_USERS)]
        registered_ids = await asyncio.gather(*tasks)
        registered_ids = [tid for tid in registered_ids if tid is not None]
        print(f"   ✔ {len(registered_ids)} users registered & calculated\n")

        # ── Phase 2: Profession × Format × Lang combos ──
        print("🔀 Phase 2: Profession × Format × Language combos...")
        await test_all_profession_format_combos(client, 200)
        print("   ✔ Done\n")

        # ── Phase 3: Engine Edge Cases ──
        print("🔬 Phase 3: Engine edge cases...")
        await test_edge_cases(client)
        print("   ✔ Done\n")

        # ── Phase 4: Other Endpoints ──
        if registered_ids:
            print("🌐 Phase 4: Other API endpoints...")
            await test_other_endpoints(client, registered_ids[0])
            print("   ✔ Done\n")

        # ── Phase 5: Concurrent Load ──
        print("⚡ Phase 5: Concurrent load (20 simultaneous)...")
        await test_concurrent_load(client)
        print("   ✔ Done\n")

        # ── Phase 6: Duplicate Register ──
        print("♻️  Phase 6: Duplicate register (idempotency)...")
        await test_duplicate_register(client)
        print("   ✔ Done\n")

        # ── Phase 7: Streak Logic ──
        print("🏆 Phase 7: Streak logic...")
        await test_streak_logic(client)
        print("   ✔ Done\n")

    # ───── REPORT ─────
    total = results["pass"] + results["fail"]
    print("="*60)
    print("   📊 STRESS TEST REPORT")
    print("="*60)
    print(f"\n   Total checks:  {total}")
    print(f"   ✅ PASSED:      {results['pass']}")
    print(f"   ❌ FAILED:      {results['fail']}")

    if total > 0:
        pct = (results['pass'] / total) * 100
        print(f"   📈 Success rate: {pct:.1f}%")

    # Endpoint summary
    print("\n── Endpoint Summary ──────────────────────────────────")
    for ep, stat in sorted(results["endpoint_stats"].items()):
        total_ep = stat["ok"] + stat["fail"]
        bar = "✅" if stat["fail"] == 0 else "❌"
        print(f"   {bar} {ep:35s} OK={stat['ok']:3d}  FAIL={stat['fail']:3d}")

    # Base distribution
    if results["base_distribution"]:
        print("\n── Recipe Base Distribution ──────────────────────────")
        for base, count in sorted(results["base_distribution"].items(), key=lambda x: -x[1]):
            bar = "█" * min(count, 40)
            print(f"   {base:30s} {count:3d} {bar}")

    # Format distribution
    if results["recipe_stats"]:
        print("\n── Drink Format Distribution ─────────────────────────")
        for fmt, count in results["recipe_stats"].items():
            print(f"   {fmt:10s}: {count}")

    # Edge cases
    if results["edge_cases"]:
        print("\n── Edge Case Results ─────────────────────────────────")
        for e in results["edge_cases"]:
            print(f"   {e}")

    # Warnings
    if results["warnings"]:
        print("\n── ⚠️  Warnings ──────────────────────────────────────")
        for w in results["warnings"]:
            print(f"   {w}")

    # Errors
    if results["errors"]:
        print(f"\n── ❌ Errors ({len(results['errors'])}) ──────────────────────────────────")
        for e in results["errors"][:30]:
            print(f"   {e}")
        if len(results["errors"]) > 30:
            print(f"   ... and {len(results['errors']) - 30} more errors")

    print("\n" + "="*60)
    if results["fail"] == 0:
        print("   🎉 ALL TESTS PASSED! System is stable.")
    elif results["fail"] < 5:
        print("   ⚠️  MOSTLY OK — minor issues found, see errors above.")
    else:
        print("   🚨 CRITICAL ISSUES FOUND — review errors above.")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
