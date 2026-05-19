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

    # Weather Integration & Premium Mixology Activators
    is_hot_weather = weather_temp > 22
    t_sweet = user.taste_sweet_pref or 5
    t_acid = user.taste_acid_pref or 5
    t_bitter = user.taste_bitter_pref or 5

    # Base water/juice
    recipe["juice_ml"] = 120
    recipe["water_ml"] = 30

    garnish = ""
    glass_type = ""

    if is_hot_weather:
        recipe["ice_cubes"] = round(weather_temp / 6)
        recipe["cocktail_status"] = "Ice / Охолоджений"
        glass_type = "прозорий хайбол (Highball)"
        
        if t_acid >= 7 and t_sweet < 7:
            recipe["activator"] = "Рубіновий грейпфрутовий фреш"
            garnish = "гілочкою розмарину та слайсом червоного грейпфрута"
        elif t_sweet >= 7 and t_acid < 7:
            recipe["activator"] = "Ожиново-лавандовий кордіал"
            garnish = "свіжими ягодами лохини на кризі"
        elif t_bitter >= 7:
            recipe["activator"] = "Тонік (Espresso-style)"
            garnish = "цедрою лимона (ефірні олії на край келиха)"
        else:
            recipe["activator"] = "Крафтовий лимонад з лаймом"
            garnish = "свіжою м'ятою та шматочком лайма"
    else:
        recipe["ice_cubes"] = 0
        recipe["cocktail_status"] = "Hot / Зігріваючий"
        glass_type = "двостінний прозорий келих (Double Glass)"
        
        if t_sweet >= 7 and t_acid < 7:
            recipe["activator"] = "Обліпиховий настій з медом"
            garnish = "паличкою кориці та зірочкою бадьяну"
        elif t_acid >= 7 and t_sweet < 7:
            recipe["activator"] = "Теплий настій дикої журавлини"
            garnish = "слайсом дегідрованого апельсина"
        elif t_bitter >= 7:
            recipe["activator"] = "Пряний імбирний шот з куркумою"
            garnish = "щіпкою свіжозмеленого чорного перцю"
        else:
            recipe["activator"] = "Класичний яблучний фреш"
            garnish = "тонким слайсом свіжого яблука"

    ice_text = f"Додайте {recipe['ice_cubes']} ідеально прозорих кубиків льоду." if recipe["ice_cubes"] > 0 else "Прогрійте келих перед подачею."
    
    recipe["instructions"] = (
        f"Візьміть {glass_type}. {ice_text} "
        f"Спочатку налийте {recipe['activator']} ({recipe['juice_ml']} мл) та воду ({recipe['water_ml']} мл). "
        f"Обережно по ложці (барним методом) влийте {recipe['tea_ml']} мл концентрату «{recipe['base']}», щоб створити ідеальний двошаровий градієнт. "
        f"Прикрасьте {garnish}. Візуальний WOW-ефект гарантовано!"
    )

    avatar = determine_avatar(recipe["base"], target_state, user.profession_type, scale_cns)
    
    recipe["avatar_id"] = avatar["id"]
    recipe["avatar_name"] = avatar["name"]
    recipe["avatar_slogan"] = avatar["slogan"]
    recipe["avatar_image"] = avatar["image"]
    recipe["stats"] = avatar["stats"]

    explanation_parts = []
    
    hd = user.hd_type if user.hd_type else "Генератор"
    explanation_parts.append(f"🧬 Твій генетичний профіль ({hd}) та мета-профіль «{sub}» формують унікальну потребу.")
    explanation_parts.append(f"База {recipe['base']} ({recipe['tea_ml']} мл) ідеально балансує твою нервову систему в цьому стані.")
    
    if scale_cns >= 7:
        explanation_parts.append(f"Через високий рівень стресу ({scale_cns}/10) ми додали компоненти для релаксації ЦНС.")
    elif scale_energy < 5 and not had_caffeine:
        explanation_parts.append(f"Враховуючи низький заряд ({scale_energy}/10), формула налаштована на плавний підйом енергії.")
    elif scale_mental < 6:
        explanation_parts.append(f"Щоб пробити ментальний туман, акцент зроблено на концентрацію та ясний розум.")
        
    if weather_temp > 22:
        explanation_parts.append(f"Надворі спекотно ({weather_temp}°C), тому коктейль подається охолодженим на основі фрешу.")
    else:
        explanation_parts.append(f"Прохолодна погода ({weather_temp}°C) потребує зігрівання — подаємо теплий напій.")
        
    if had_caffeine:
        explanation_parts.append("Оскільки ти вже пив каву, дозу чайного екстракту знижено для захисту серцево-судинної системи.")
        
    recipe["explanation"] = " ".join(explanation_parts)

    return recipe
