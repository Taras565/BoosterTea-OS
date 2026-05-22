import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from backend.engine import determine_recipe

class MockUser:
    hd_type = "Generator"
    weight = 72
    gender = "male"
    profession_type = "coding"
    taste_sweet_pref = 5
    taste_acid_pref = 5
    taste_bitter_pref = 5

user = MockUser()

print("--- TESTING 'TEA' FORMAT ---")
recipe_tea = determine_recipe(
    scale_cns=8, 
    scale_energy=4, 
    scale_mental=7, 
    had_caffeine=False, 
    specific_activity_id="coding", 
    drink_format="tea", 
    weather_temp=25, 
    user=user, 
    language="uk"
)

for k, v in recipe_tea.items():
    if k not in ["avatar_id", "avatar_name", "avatar_slogan", "avatar_image", "stats"]:
        print(f"{k}: {v}")

print("\n--- TESTING 'SHOT' FORMAT ---")
recipe_shot = determine_recipe(
    scale_cns=8, 
    scale_energy=4, 
    scale_mental=7, 
    had_caffeine=False, 
    specific_activity_id="coding", 
    drink_format="shot", 
    weather_temp=25, 
    user=user, 
    language="uk"
)
for k, v in recipe_shot.items():
    if k not in ["avatar_id", "avatar_name", "avatar_slogan", "avatar_image", "stats"]:
        print(f"{k}: {v}")

