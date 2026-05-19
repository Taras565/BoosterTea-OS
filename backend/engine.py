from datetime import date

def calculate_syutsay(birth_date: date) -> int:
    day = birth_date.day
    while day > 9:
        day = sum(int(digit) for digit in str(day))
    return day

def get_k_ns(hd_type: str) -> float:
    if not hd_type: return 0.65
    hd_type = hd_type.lower()
    if "generator" in hd_type:
        return 0.70
    elif "projector" in hd_type or "manifestor" in hd_type:
        return 0.60
    elif "reflector" in hd_type:
        return 0.50
    return 0.65

def determine_avatar(base: str, target: str, profession: str, stress: int):
    if "GABA" in base and target in ["FOCUS", "RELAX"] and stress >= 7:
        return { 
            "id": "avatar_zen_master", 
            "name": "Дзен-Майстер", 
            "slogan": "Розум холодний, як лід у твоїй склянці. Повний контроль над хаосом.", 
            "image": "/avatar_zen_master_1778484425493.png", 
            "stats": { "focus": 40, "energy": 10, "calm": 50 }
        }
    if "Да Хун Пао" in base and profession == "CREATIVE":
        return { 
            "id": "avatar_creative_cyborg", 
            "name": "Креативний Кіборг", 
            "slogan": "Нейрони заряджені. Синдром білого аркуша знищено. Твори.", 
            "image": "/avatar_creative_cyborg_1778484439484.png", 
            "stats": { "focus": 30, "energy": 30, "calm": 20 }
        }
    if ("Шу Пуер" in base or "Саган" in base) and target == "ENERGY" and stress <= 4:
        return { 
            "id": "avatar_energy_phoenix", 
            "name": "Енергетичний Фенікс", 
            "slogan": "Повне перезавантаження та миттєвий підйом. Час завойовувати світ.", 
            "image": "/avatar_energy_phoenix_1778484456721.png", 
            "stats": { "focus": 20, "energy": 60, "calm": 5 }
        }
    return { 
        "id": "avatar_adaptive_neo", 
        "name": "Адаптивний Нео", 
        "slogan": "Система відновлює ресурси. Крок за кроком повертаємо баланс.", 
        "image": "/avatar_adaptive_neo_1778484470404.png", 
        "stats": { "focus": 25, "energy": 25, "calm": 25 }
    }

def determine_recipe(scale_cns: int, scale_energy: int, scale_mental: int, had_caffeine: bool, specific_activity_id: str, weather_temp: int, user):
    k_ns = get_k_ns(user.hd_type)
    weight = user.weight or 70
    
    if user.gender == "female":
        k_ns *= 0.9

    v_tea = round(weight * k_ns, 1)

    # Determine implicit target state from scales
    target_state = "RELAX"
    if scale_cns >= 7:
        target_state = "RELAX"
    elif scale_energy < 5 and not had_caffeine:
        target_state = "ENERGY"
    elif scale_mental < 6:
        target_state = "FOCUS"
    else:
        target_state = "COMMUNICATION"

    recipe = {
        "base": "GABA",
        "activator": "Яблучно-імбирний",
        "tea_ml": v_tea,
        "juice_ml": 100,
        "water_ml": 50,
        "ice_cubes": 0,
        "cocktail_status": "Охолоджений",
        "instructions": "",
        "breathwork_protocol": "square"
    }

    sub = specific_activity_id
    if sub == 'Студент': recipe["base"] = "GABA"
    elif sub == 'Розробник / QA / DS': recipe["base"] = "М'яка GABA"
    elif sub == 'Трейдер / Фінансист': recipe["base"] = "GABA + Да Хун Пао"
    elif sub == 'Креатор / Дизайнер': recipe["base"] = "Да Хун Пао"
    elif sub == 'Письменник / Копірайтер': recipe["base"] = "Шен Пуер"
    elif sub == 'Спікер / Лектор': recipe["base"] = "GABA"
    elif sub == 'Sales / Менеджер': recipe["base"] = "Да Хун Пао"; recipe["activator"] = "Лимонний фреш"
    elif sub == 'Кардіо / Вода': recipe["base"] = "Да Хун Пао"
    elif sub == 'Силовий тренінг': recipe["base"] = "Шу Пуер"
    elif sub == 'Навчання': recipe["base"] = "М'яка GABA"
    elif sub == 'Побутові задачі': recipe["base"] = "Шу Пуер"
    elif sub == 'Пенсіонер / Відновлення': recipe["base"] = "Чиста Преміум GABA"

    # Stress Overrides (CNS)
    if scale_cns >= 7 and ("Шу Пуер" in recipe["base"] or "Саган" in recipe["base"]):
        recipe["base"] = "GABA (Стрес-компенсація)"
    
    # Caffeine check
    if had_caffeine:
        recipe["tea_ml"] = round(recipe["tea_ml"] / 2, 1)
        if "Шу Пуер" in recipe["base"] or "Да Хун Пао" in recipe["base"]:
            recipe["base"] = "GABA (Захист від передозу кофеїну)"

    # Breathwork Protocol
    if "Шу Пуер" in recipe["base"] or "Саган" in recipe["base"]:
        recipe["breathwork_protocol"] = "fire"
    else:
        recipe["breathwork_protocol"] = "square"

    # Weather Integration
    if weather_temp > 22:
        recipe["ice_cubes"] = round(weather_temp / 6)
        recipe["cocktail_status"] = "Охолоджений"
        if recipe["activator"] != "Лимонний фреш":
            if (user.taste_acid_pref or 5) >= 6: 
                recipe["activator"] = "Грейпфрутовий/Гранатовий"
            else:
                recipe["activator"] = "Чорничний"
    else:
        recipe["ice_cubes"] = 0
        recipe["cocktail_status"] = "Підігрітий"
        recipe["activator"] = "Підігрітий яблучно-імбирний"
        recipe["juice_ml"] = 120
        recipe["water_ml"] = 30

    # Override for specific taste if sweet is high and hot
    if weather_temp > 22 and recipe["activator"] not in ["Лимонний фреш", "Грейпфрутовий/Гранатовий"]:
        if (user.taste_sweet_pref or 5) >= 7:
            recipe["activator"] = "Вишневий"

    ice_text = f"{recipe['ice_cubes']} кубиків льоду" if recipe["ice_cubes"] > 0 else "без льоду"
    recipe["instructions"] = f'Змішай {recipe["tea_ml"]} мл концентрату ({recipe["base"]}), {recipe["juice_ml"]} мл соку ({recipe["activator"]}) та {recipe["water_ml"]} мл води. Подавати {ice_text}.'

    avatar = determine_avatar(recipe["base"], target_state, user.profession_type, scale_cns)
    
    recipe["avatar_id"] = avatar["id"]
    recipe["avatar_name"] = avatar["name"]
    recipe["avatar_slogan"] = avatar["slogan"]
    recipe["avatar_image"] = avatar["image"]
    recipe["stats"] = avatar["stats"]

    return recipe
