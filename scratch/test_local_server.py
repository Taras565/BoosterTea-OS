import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("Registering...")
req1 = {
    'telegram_id': 123456789, 
    'username': 'test', 
    'weight': 70, 
    'gender': 'male', 
    'birth_date': '1990-01-01', 
    'profession_type': 'routine', 
    'taste_acid_pref': 5, 
    'taste_bitter_pref': 5, 
    'taste_sweet_pref': 5, 
    'caffeine_sensitivity': 'normal', 
    'smoker': False, 
    'oral_contraceptives': False, 
    'target_bedtime': '23:00'
}
r1 = client.post('/api/register', json=req1)
print('Register:', r1.status_code, r1.text)

print("Calculating...")
req2 = {
    'telegram_id': 123456789, 
    'specific_activity_id': 'routine', 
    'drink_format': 'long', 
    'scale_cns': 5, 
    'scale_energy': 5, 
    'scale_mental': 5, 
    'had_caffeine_recently': False, 
    'caffeine_mg': None, 
    'latitude': 50.45, 
    'longitude': 30.52, 
    'language': 'uk'
}
try:
    r2 = client.post('/api/calculate', json=req2)
    print('Calculate:', r2.status_code, r2.text)
except Exception as e:
    import traceback
    traceback.print_exc()
