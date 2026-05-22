import sys
import os
import random
from collections import Counter
import json

# Add backend directory to path so we can import engine
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from engine import determine_recipe

class MockUser:
    def __init__(self):
        self.weight = random.randint(50, 110)
        self.gender = random.choice(["male", "female"])
        self.hd_type = random.choice(["Generator", "Projector", "Manifestor", "Reflector", "Manifesting Generator"])
        self.taste_sweet_pref = random.choice([2, 5, 8])
        self.taste_acid_pref = random.choice([2, 5, 8])
        self.taste_bitter_pref = random.choice([2, 5, 8])
        self.profession_type = random.choice(["coding", "study", "business", "creative", "sport", "routine"])

def run_stress_tests(num_tests=100):
    results = []
    
    bases_counter = Counter()
    avatars_counter = Counter()
    formats_counter = Counter()
    
    tea_volumes = []
    
    for _ in range(num_tests):
        user = MockUser()
        
        # Random daily state
        scale_cns = random.randint(2, 10)
        scale_energy = random.randint(2, 10)
        scale_mental = random.randint(2, 10)
        had_caffeine = random.choice([True, False])
        specific_activity_id = user.profession_type
        drink_format = random.choice(["shot", "tea", "long"])
        weather_temp = random.randint(-10, 35)
        
        recipe = determine_recipe(
            scale_cns=scale_cns,
            scale_energy=scale_energy,
            scale_mental=scale_mental,
            had_caffeine=had_caffeine,
            specific_activity_id=specific_activity_id,
            drink_format=drink_format,
            weather_temp=weather_temp,
            user=user,
            language="uk"
        )
        
        bases_counter[recipe["base"]] += 1
        avatars_counter[recipe["avatar_name"]] += 1
        formats_counter[drink_format] += 1
        tea_volumes.append(recipe["tea_ml"])
        
        results.append({
            "user": vars(user),
            "recipe": recipe
        })

    print("--- STRESS TEST RESULTS (100 ITERATIONS) ---")
    print("\n1. Base distribution:")
    for base, count in bases_counter.most_common():
        print(f"  - {base}: {count}")
        
    print("\n2. Avatar/State distribution:")
    for avatar, count in avatars_counter.most_common():
        print(f"  - {avatar}: {count}")
        
    print("\n3. Format distribution:")
    for fmt, count in formats_counter.most_common():
        print(f"  - {fmt}: {count}")
        
    print("\n4. Tea Volume (ml):")
    print(f"  - Min: {min(tea_volumes)}")
    print(f"  - Max: {max(tea_volumes)}")
    print(f"  - Avg: {round(sum(tea_volumes)/len(tea_volumes), 1)}")

if __name__ == "__main__":
    run_stress_tests(100)
