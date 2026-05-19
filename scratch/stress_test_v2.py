import asyncio
import httpx
import time
from concurrent.futures import ThreadPoolExecutor

API_URL = "http://localhost:8000/api"

async def register_user():
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(f"{API_URL}/register", json={
                "telegram_id": 999999,
                "username": "stress_tester",
                "weight": 70,
                "gender": "male",
                "birth_date": "1995-05-15",
                "profession_type": "coding",
                "taste_acid_pref": 5,
                "taste_bitter_pref": 5,
                "taste_sweet_pref": 5
            }, headers={"X-Telegram-Init-Data": "mock_data"})
            return res.status_code == 200
        except Exception:
            return False

async def single_request(client, idx):
    payload = {
        "telegram_id": 999999,
        "specific_activity_id": "coding",
        "scale_cns": 5,
        "scale_energy": 5,
        "scale_mental": 5,
        "had_caffeine_recently": False,
        "latitude": 50.45,
        "longitude": 30.52
    }
    
    start_time = time.time()
    try:
        response = await client.post(f"{API_URL}/calculate", json=payload, headers={"X-Telegram-Init-Data": "mock_data"})
        duration = time.time() - start_time
        return {"status": response.status_code, "duration": duration, "error": None}
    except Exception as e:
        duration = time.time() - start_time
        return {"status": 0, "duration": duration, "error": str(e)}

async def run_stress_test(num_requests=100):
    print("Registering test user...")
    registered = await register_user()
    print(f"Registration successful: {registered}")
    
    print(f"Starting {num_requests} concurrent requests to /api/calculate...")
    start_time = time.time()
    
    async with httpx.AsyncClient() as client:
        tasks = [single_request(client, i) for i in range(num_requests)]
        results = await asyncio.gather(*tasks)
        
    total_time = time.time() - start_time
    
    success_count = sum(1 for r in results if r["status"] == 200)
    error_count = len(results) - success_count
    avg_duration = sum(r["duration"] for r in results) / len(results)
    
    print("\n--- Stress Test Results ---")
    print(f"Total Requests: {num_requests}")
    print(f"Total Time: {total_time:.2f} seconds")
    print(f"Successful (200 OK): {success_count}")
    print(f"Failed/Errors: {error_count}")
    print(f"Average Response Time: {avg_duration*1000:.2f} ms")
    
    if error_count > 0:
        print("\nErrors seen:")
        for r in results:
            if r["status"] != 200:
                print(f"Status: {r['status']}, Error: {r['error']}")
                break

if __name__ == "__main__":
    asyncio.run(run_stress_test(100))
