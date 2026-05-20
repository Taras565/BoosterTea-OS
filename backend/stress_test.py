import asyncio
import httpx
import random
from datetime import date, timedelta
import uuid

# Configuration
API_URL = "http://localhost:8000/api"
NUM_TESTS = 200

# Random Data Generators
genders = ["male", "female"]
professions = ["coding", "study", "business", "creative", "sport", "routine"]
formats = ["long", "shot"]

async def run_test(client, idx):
    tg_id = random.randint(1000000, 9999999)
    weight = random.randint(45, 115)
    gender = random.choice(genders)
    birth_date = date.today() - timedelta(days=random.randint(6000, 15000))
    prof = random.choice(professions)
    
    # 1. Register User
    reg_payload = {
        "telegram_id": tg_id,
        "username": f"TestUser_{idx}",
        "weight": weight,
        "gender": gender,
        "birth_date": birth_date.isoformat(),
        "profession_type": prof,
        "taste_acid_pref": random.randint(2, 8),
        "taste_bitter_pref": random.randint(2, 8),
        "taste_sweet_pref": random.randint(2, 8)
    }
    
    r1 = await client.post(f"{API_URL}/register", json=reg_payload)
    if r1.status_code != 200:
        return f"Error registering user {idx}: {r1.text}"
        
    # 2. Calculate Recipe
    calc_payload = {
        "telegram_id": tg_id,
        "specific_activity_id": prof,
        "scale_cns": random.randint(2, 10),
        "scale_energy": random.randint(2, 10),
        "scale_mental": random.randint(2, 10),
        "had_caffeine_recently": random.choice([True, False]),
        "drink_format": random.choice(formats),
        "latitude": 50.45,
        "longitude": 30.52,
        "language": "uk"
    }
    
    r2 = await client.post(f"{API_URL}/calculate", json=calc_payload)
    if r2.status_code != 200:
        return f"Error calculating recipe for user {idx}: {r2.text}"
        
    data = r2.json()
    recipe = data.get("recipe", {})
    
    # Assertions
    if not recipe.get("base"):
        return f"User {idx}: Missing base"
    if recipe.get("tea_ml", 0) <= 0:
        return f"User {idx}: Invalid tea_ml ({recipe.get('tea_ml')})"
        
    return None

async def main():
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Start server if needed or assume it's running
        print(f"Running {NUM_TESTS} stress tests...")
        tasks = [run_test(client, i) for i in range(NUM_TESTS)]
        results = await asyncio.gather(*tasks)
        
        errors = [r for r in results if r is not None]
        if errors:
            print(f"FAILED: {len(errors)} errors found.")
            for e in errors[:10]:
                print(e)
        else:
            print(f"SUCCESS: All {NUM_TESTS} tests passed perfectly!")

if __name__ == "__main__":
    asyncio.run(main())
