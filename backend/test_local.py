import sys
sys.path.append('backend')
from engine import determine_recipe, get_k_ns
from datetime import date, timedelta
import random

genders = ["male", "female"]
professions = ["coding", "study", "business", "creative", "sport", "routine"]
formats = ["long", "shot"]
languages = ["uk", "en", "es", "ru"]

class MockUser:
    def __init__(self, weight, gender, birth_date, prof):
        self.weight = weight
        self.gender = gender
        self.birth_date = birth_date
        self.profession_type = prof
        self.taste_acid_pref = random.randint(2, 8)
        self.taste_bitter_pref = random.randint(2, 8)
        self.taste_sweet_pref = random.randint(2, 8)
        
        types = ["Generator", "Projector", "Manifestor", "Reflector", "Manifesting Generator"]
        self.hd_type = types[(birth_date.year + birth_date.month + birth_date.day) % len(types)]

def run_tests():
    print("Running 200 local stress tests on engine...")
    errors = []
    
    for i in range(200):
        weight = random.randint(45, 115)
        gender = random.choice(genders)
        bd = date.today() - timedelta(days=random.randint(6000, 15000))
        prof = random.choice(professions)
        fmt = random.choice(formats)
        lang = random.choice(languages)
        
        user = MockUser(weight, gender, bd, prof)
        
        cns = random.randint(2, 10)
        energy = random.randint(2, 10)
        mental = random.randint(2, 10)
        caff = random.choice([True, False])
        temp = random.randint(5, 35)
        
        try:
            recipe = determine_recipe(cns, energy, mental, caff, prof, fmt, temp, user, lang)
            
            if not recipe["base"]: errors.append(f"Test {i}: Missing base")
            if recipe["tea_ml"] <= 0: errors.append(f"Test {i}: Invalid tea_ml {recipe['tea_ml']}")
            if fmt == "shot" and recipe["water_ml"] != 0: errors.append(f"Test {i}: Shot has water")
            
        except Exception as e:
            errors.append(f"Test {i} Exception: {str(e)}")
            
    if errors:
        print(f"FAILED: {len(errors)} errors found.")
        for e in errors[:10]: print(e)
    else:
        print("SUCCESS: 200/200 recipes successfully generated. Logic is solid.")

if __name__ == "__main__":
    run_tests()
