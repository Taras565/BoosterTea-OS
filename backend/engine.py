from datetime import date

def calculate_syutsay(birth_date: date) -> int:
    day = birth_date.day
    while day > 9:
        day = sum(int(digit) for digit in str(day))
    return day

def get_k_ns(hd_type: str) -> float:
    if not hd_type: return 0.65
    hd_type = hd_type.lower()
    if "generator" in hd_type: return 0.70
    elif "projector" in hd_type or "manifestor" in hd_type: return 0.60
    elif "reflector" in hd_type: return 0.50
    return 0.65

def t_avatar(avatar_id, lang):
    avatars = {
        "zen": {
            "uk": {"name": "АБСОЛЮТНИЙ ЧІЛ", "slogan": "Жодних нервів. Тільки спокій, ясний розум і повний контроль."},
            "en": {"name": "ABSOLUTE CHILL", "slogan": "Zero stress. Just peace, clear mind, and full control."},
            "ru": {"name": "АБСОЛЮТНЫЙ ЧИЛЛ", "slogan": "Никаких нервов. Только покой, ясный ум и полный контроль."},
            "es": {"name": "RELAX ABSOLUTO", "slogan": "Cero estrés. Solo paz, mente clara y control total."}
        },
        "creative": {
            "uk": {"name": "ТВОРЧИЙ ПОТІК", "slogan": "Думки ясні. Натхнення на максимумі. Час створювати нове."},
            "en": {"name": "CREATIVE FLOW", "slogan": "Clear thoughts. Max inspiration. Time to create."},
            "ru": {"name": "ТВОРЧЕСКИЙ ПОТОК", "slogan": "Мысли ясны. Вдохновение на максимуме. Время создавать новое."},
            "es": {"name": "FLUJO CREATIVO", "slogan": "Pensamientos claros. Inspiración al máximo. Hora de crear."}
        },
        "energy": {
            "uk": {"name": "ТУРБО-РЕЖИМ", "slogan": "Батарейка на 100%. Жодної втоми. Готовність звертати гори."},
            "en": {"name": "TURBO MODE", "slogan": "Battery at 100%. Zero fatigue. Ready to move mountains."},
            "ru": {"name": "ТУРБО-РЕЖИМ", "slogan": "Батарейка на 100%. Никакой усталости. Готовность сворачивать горы."},
            "es": {"name": "MODO TURBO", "slogan": "Batería al 100%. Cero fatiga. Listo para mover montañas."}
        },
        "neo": {
            "uk": {"name": "ІДЕАЛЬНИЙ БАЛАНС", "slogan": "Все під контролем. Енергія та фокус у цілковитій гармонії."},
            "en": {"name": "PERFECT BALANCE", "slogan": "Everything under control. Energy and focus in perfect harmony."},
            "ru": {"name": "ИДЕАЛЬНЫЙ БАЛАНС", "slogan": "Все под контролем. Энергия и фокус в полной гармонии."},
            "es": {"name": "EQUILIBRIO PERFECTO", "slogan": "Todo bajo control. Energía y enfoque en perfecta armonía."}
        }
    }
    return avatars.get(avatar_id, avatars["neo"]).get(lang, avatars.get(avatar_id, avatars["neo"])["uk"])

def determine_avatar(base: str, target: str, profession: str, stress: int, lang: str):
    if target == "RELAX":
        a = t_avatar("zen", lang)
        return { "id": "human_zen", "name": a["name"], "slogan": a["slogan"], "image": "/human_zen.png", "stats": { "focus": 40, "energy": 10, "calm": 50 } }
    elif target == "FOCUS":
        a = t_avatar("creative", lang)
        return { "id": "human_creative", "name": a["name"], "slogan": a["slogan"], "image": "/human_creative.png", "stats": { "focus": 40, "energy": 30, "calm": 30 } }
    elif target == "ENERGY":
        a = t_avatar("energy", lang)
        return { "id": "human_energy", "name": a["name"], "slogan": a["slogan"], "image": "/human_energy.png", "stats": { "focus": 20, "energy": 60, "calm": 5 } }
    else:
        a = t_avatar("neo", lang)
        return { "id": "human_balance", "name": a["name"], "slogan": a["slogan"], "image": "/human_balance.png", "stats": { "focus": 33, "energy": 33, "calm": 33 } }

ACTIVITY_MULTIPLIERS = {
    "coding":   {"psych": 9, "phys": 1},
    "study":    {"psych": 8, "phys": 2},
    "business": {"psych": 9, "phys": 3},
    "creative": {"psych": 7, "phys": 2},
    "sport":    {"psych": 4, "phys": 9},
    "routine":  {"psych": 5, "phys": 5}
}

def get_base_name(base_type: str, lang: str) -> str:
    bases = {
        "GABA": {"uk": "GABA", "en": "GABA", "ru": "GABA", "es": "GABA"},
        "Soft GABA": {"uk": "М'яка GABA", "en": "Soft GABA", "ru": "Мягкая GABA", "es": "GABA Suave"},
        "GABA + DHP": {"uk": "GABA + Да Хун Пао", "en": "GABA + Da Hong Pao", "ru": "GABA + Да Хун Пао", "es": "GABA + Da Hong Pao"},
        "DHP": {"uk": "Да Хун Пао", "en": "Da Hong Pao", "ru": "Да Хун Пао", "es": "Da Hong Pao"},
        "Puer": {"uk": "Шу Пуер (var. kucha)", "en": "Shu Puer (var. kucha)", "ru": "Шу Пуэр (var. kucha)", "es": "Shu Puer (var. kucha)"},
        "Pure GABA": {"uk": "Чиста Преміум GABA", "en": "Pure Premium GABA", "ru": "Чистая Премиум GABA", "es": "GABA Premium Pura"},
        "GABA (Stress)": {"uk": "GABA (Стрес-компенсація)", "en": "GABA (Stress Compensation)", "ru": "GABA (Стресс-компенсация)", "es": "GABA (Compensación de Estrés)"},
        "GABA (Decaf)": {"uk": "GABA (Захист від кофеїну)", "en": "GABA (Caffeine Protection)", "ru": "GABA (Защита от кофеина)", "es": "GABA (Protección contra cafeína)"}
    }
    return bases.get(base_type, bases["GABA"]).get(lang, bases.get(base_type, bases["GABA"])["uk"])

def determine_recipe(scale_cns: int, scale_energy: int, scale_mental: int, had_caffeine: bool, specific_activity_id: str, drink_format: str, weather_temp: int, user, language: str = "uk"):
    k_ns = get_k_ns(user.hd_type)
    weight = user.weight or 70
    if user.gender == "female": k_ns *= 0.9
    
    # Strict Activity-to-Target Mapping
    if specific_activity_id == "sport":
        target_state = "ENERGY"
    elif specific_activity_id == "business":
        target_state = "COMMUNICATION"
    elif specific_activity_id in ["coding", "study"]:
        target_state = "FOCUS"
    elif specific_activity_id == "creative":
        target_state = "FOCUS" if scale_mental < 5 else "COMMUNICATION"
    elif specific_activity_id == "routine":
        target_state = "RELAX"
    else:
        # Fallback to generic slider logic
        target_state = "RELAX"
        if scale_cns >= 7: target_state = "RELAX"
        elif scale_energy < 5 and not had_caffeine: target_state = "ENERGY"
        elif scale_mental < 6: target_state = "FOCUS"
        else: target_state = "COMMUNICATION"

    # Dynamic State Modifier based on deviation from norm (5)
    state_modifier = 1.0
    if target_state == "RELAX" and scale_cns > 5:
        state_modifier = 1.0 + ((scale_cns - 5) * 0.05)  # Max +25%
    elif target_state == "ENERGY" and scale_energy < 5:
        state_modifier = 1.0 + ((5 - scale_energy) * 0.08)  # Max +32%
    elif target_state == "FOCUS" and scale_mental < 5:
        state_modifier = 1.0 + ((5 - scale_mental) * 0.08)  # Max +32%

    # Scientific standard: 30ml liquid extract is 1 serving for 70kg adult
    base_volume = 30.0
    weight_factor = weight / 70.0
    
    k_ns_modifier = 1.0
    if k_ns >= 0.7: k_ns_modifier = 1.05
    elif k_ns <= 0.5: k_ns_modifier = 0.95
    else: k_ns_modifier = 1.0

    v_tea = base_volume * weight_factor * k_ns_modifier * state_modifier

    if had_caffeine:
        if getattr(user, "caffeine_sensitivity", "normal") == "high":
            v_tea = v_tea * 0.65  # 35% reduction for slow metabolizers
        else:
            v_tea = v_tea * 0.85  # 15% reduction for normal metabolizers
        
    v_tea = round(v_tea, 1)

    recipe = {
        "base_key": "GABA",
        "activator": "Apple-Ginger", 
        "tea_ml": v_tea,
        "juice_ml": 0,
        "water_ml": 0,
        "ice_cubes": 0,
        "cocktail_status": "Chilled",
        "instructions": "",
        "breathwork_protocol": "square",
        "weight_factor": weight_factor,
        "k_ns_modifier": k_ns_modifier,
        "state_modifier": state_modifier
    }

    # Strict Molecule (Base) Mapping
    if specific_activity_id == "sport":
        recipe["base_key"] = "Puer"
    elif specific_activity_id == "business":
        recipe["base_key"] = "DHP"
    elif specific_activity_id == "coding":
        recipe["base_key"] = "GABA + DHP"
    elif specific_activity_id == "study":
        recipe["base_key"] = "Pure GABA"
    elif specific_activity_id == "creative":
        recipe["base_key"] = "Soft GABA" if target_state == "FOCUS" else "DHP"
    elif specific_activity_id == "routine":
        recipe["base_key"] = "Pure GABA" if scale_cns >= 8 else "Soft GABA"
    else:
        # Fallback base logic
        if target_state == "RELAX":
            recipe["base_key"] = "Pure GABA" if scale_cns >= 9 else "Soft GABA"
        elif target_state == "ENERGY":
            recipe["base_key"] = "Puer"
        elif target_state == "FOCUS":
            recipe["base_key"] = "GABA + DHP" if scale_mental < 3 else "GABA"
        elif target_state == "COMMUNICATION":
            recipe["base_key"] = "DHP"
    
    recipe["breathwork_protocol"] = "fire" if target_state == "ENERGY" else "square"

    is_hot_weather = weather_temp > 22
    t_sweet = user.taste_sweet_pref or 5
    t_acid = user.taste_acid_pref or 5
    t_bitter = user.taste_bitter_pref or 5

    # Activator translations
    acts = {
        "Ruby Grapefruit": {"uk": "Рубіновий грейпфрутовий фреш", "en": "Ruby Grapefruit Fresh", "ru": "Рубиновый грейпфрутовый фреш", "es": "Jugo Fresco de Pomelo Rubí"},
        "Blackberry Lavender": {"uk": "Ожиново-лавандовий кордіал", "en": "Blackberry Lavender Cordial", "ru": "Ежевично-лавандовый кордиал", "es": "Cordial de Zarzamora y Lavanda"},
        "Tonic": {"uk": "Тонік (Espresso-style)", "en": "Tonic (Espresso-style)", "ru": "Тоник (Espresso-style)", "es": "Tónica (Estilo Espresso)"},
        "Lime Lemonade": {"uk": "Крафтовий лимонад з лаймом", "en": "Craft Lime Lemonade", "ru": "Крафтовый лимонад с лаймом", "es": "Limonada Artesanal con Lima"},
        "Buckthorn Honey": {"uk": "Обліпиховий настій з медом", "en": "Sea Buckthorn Honey Infusion", "ru": "Облепиховый настой с медом", "es": "Infusión de Espino Amarillo con Miel"},
        "Warm Cranberry": {"uk": "Теплий настій дикої журавлини", "en": "Warm Wild Cranberry Infusion", "ru": "Теплый настой дикой клюквы", "es": "Infusión Tibia de Arándano Salvaje"},
        "Spicy Ginger": {"uk": "Пряний імбирний шот з куркумою", "en": "Spicy Ginger Turmeric Shot", "ru": "Пряный имбирный шот с куркумой", "es": "Shot de Jengibre Picante con Cúrcuma"},
        "Classic Apple": {"uk": "Класичний яблучний фреш", "en": "Classic Apple Fresh", "ru": "Классический яблочный фреш", "es": "Jugo Fresco de Manzana Clásico"},
        "Apple-Ginger": {"uk": "Яблучно-імбирний фреш", "en": "Apple-Ginger Fresh", "ru": "Яблочно-имбирный фреш", "es": "Jugo Fresco de Manzana y Jengibre"},
        "Lemon Fresh": {"uk": "Лимонний фреш", "en": "Lemon Fresh", "ru": "Лимонный фреш", "es": "Jugo Fresco de Limón"},
        "Orange Fresh": {"uk": "Апельсиновий фреш", "en": "Orange Fresh", "ru": "Апельсиновый фреш", "es": "Jugo Fresco de Naranja"}
    }
    
    garnishes = {
        "Rosemary": {"uk": "гілочкою розмарину", "en": "rosemary sprig", "ru": "веточкой розмарина", "es": "ramita de romero"},
        "Blueberries": {"uk": "свіжими ягодами лохини", "en": "fresh blueberries", "ru": "свежими ягодами голубики", "es": "arándanos frescos"},
        "Lemon Zest": {"uk": "цедрою лимона", "en": "lemon zest", "ru": "цедрой лимона", "es": "ralladura de limón"},
        "Mint Lime": {"uk": "свіжою м'ятою та лаймом", "en": "fresh mint and lime", "ru": "свежей мятой и лаймом", "es": "menta fresca y lima"},
        "Cinnamon": {"uk": "паличкою кориці", "en": "cinnamon stick", "ru": "палочкой корицы", "es": "rama de canela"},
        "Orange": {"uk": "слайсом апельсина", "en": "orange slice", "ru": "слайсом апельсина", "es": "rodaja de naranja"},
        "Pepper": {"uk": "чорним перцем", "en": "black pepper", "ru": "черным перцем", "es": "pimienta negra"},
        "Apple": {"uk": "слайсом яблука", "en": "apple slice", "ru": "слайсом яблока", "es": "rodaja de manzana"}
    }
    
    glasses = {
        "Highball": {"uk": "прозорий хайбол (Highball)", "en": "clear highball", "ru": "прозрачный хайбол", "es": "vaso alto transparente"},
        "Shot": {"uk": "лабораторну мензурку (Shot)", "en": "laboratory beaker (Shot)", "ru": "лабораторную мензурку (Shot)", "es": "vaso de chupito (Shot)"},
        "Double": {"uk": "двостінний прозорий келих", "en": "double-walled clear glass", "ru": "двустенный прозрачный бокал", "es": "vaso transparente de doble pared"}
    }
    
    statuses = {
        "Shot": {"uk": "Концентрат / Швидка абсорбція", "en": "Concentrate / Fast Absorption", "ru": "Концентрат / Быстрая абсорбция", "es": "Concentrado / Absorción Rápida"},
        "Ice": {"uk": "Ice / Охолоджений", "en": "Ice / Chilled", "ru": "Ice / Охлажденный", "es": "Ice / Enfriado"},
        "Hot": {"uk": "Hot / Зігріваючий", "en": "Hot / Warming", "ru": "Hot / Согревающий", "es": "Hot / Calentador"}
    }

    act_key = recipe["activator"]
    garnish_key = ""
    glass_key = "Highball"
    status_key = "Ice"

    if drink_format == "shot":
        recipe["juice_ml"] = 20
        recipe["water_ml"] = 0
        recipe["ice_cubes"] = 0
        status_key = "Shot"
        glass_key = "Shot"
        if t_acid >= 7: act_key = "Spicy Ginger"; garnish_key = ""
        else: act_key = "Ruby Grapefruit"; garnish_key = ""
    elif drink_format == "tea":
        recipe["juice_ml"] = 0
        recipe["water_ml"] = 180
        if is_hot_weather:
            status_key = "Ice"
            glass_key = "Highball"
            recipe["ice_cubes"] = max(1, round(weather_temp / 5))
        else:
            status_key = "Hot"
            glass_key = "Double"
            recipe["ice_cubes"] = 0
    else: # long
        recipe["juice_ml"] = 80
        recipe["water_ml"] = 100
        if is_hot_weather:
            status_key = "Ice"
            glass_key = "Highball"
            recipe["ice_cubes"] = max(1, round(weather_temp / 4))
            # Vitamin C + Sucrose synergy for hot weather EGCG absorption
            if t_sweet >= 7: act_key = "Lime Lemonade"; garnish_key = "Mint Lime"
            elif t_acid >= 7: act_key = "Ruby Grapefruit"; garnish_key = "Rosemary"
            else: act_key = "Orange Fresh"; garnish_key = "Orange"
        else:
            status_key = "Hot"
            glass_key = "Highball"
            recipe["ice_cubes"] = 0
            if t_sweet >= 7 and t_acid < 7: act_key = "Buckthorn Honey"; garnish_key = "Cinnamon"
            elif t_acid >= 7 and t_sweet < 7: act_key = "Warm Cranberry"; garnish_key = "Orange"
            elif t_bitter >= 7: act_key = "Spicy Ginger"; garnish_key = "Pepper"
            else: act_key = "Classic Apple"; garnish_key = "Apple"

    recipe["base"] = get_base_name(recipe["base_key"], language)
    if recipe["base_key"] == "GABA + DHP":
        half = round(recipe["tea_ml"] / 2.0, 1)
        if language == "uk": recipe["base"] = f"GABA ({half} мл) + Да Хун Пао ({half} мл)"
        elif language == "ru": recipe["base"] = f"GABA ({half} мл) + Да Хун Пао ({half} мл)"
        else: recipe["base"] = f"GABA ({half} ml) + Da Hong Pao ({half} ml)"
    
    if drink_format == "tea":
        tea_activator = {"uk": "Чиста Вода", "en": "Pure Water", "ru": "Чистая Вода", "es": "Agua Pura"}
        recipe["activator"] = tea_activator[language]
    else:
        recipe["activator"] = acts.get(act_key, acts["Apple-Ginger"]).get(language, acts.get(act_key, acts["Apple-Ginger"])["uk"])
        
    recipe["cocktail_status"] = statuses[status_key][language]
    
    g_str = garnishes.get(garnish_key, {}).get(language, "")
    gl_str = glasses[glass_key][language]
    
    inst = {
        "shot": {
            "uk": f"Формат «Шот». Змішайте {recipe['tea_ml']} мл нашого концентрату «{recipe['base']}» та {recipe['juice_ml']} мл реагенту ({recipe['activator']}), який ви купуєте окремо. Подавати у {gl_str}. Випити залпом.",
            "en": f"Shot format. Mix {recipe['tea_ml']} ml of our '{recipe['base']}' concentrate with {recipe['juice_ml']} ml of reagent ({recipe['activator']}) purchased separately. Serve in {gl_str}. Drink in one gulp.",
            "ru": f"Формат «Шот». Смешайте {recipe['tea_ml']} мл нашего концентрата «{recipe['base']}» и {recipe['juice_ml']} мл реагента ({recipe['activator']}), который вы покупаете отдельно. Подавать в {gl_str}. Выпить залпом.",
            "es": f"Formato Shot. Mezcla {recipe['tea_ml']} ml de nuestro concentrado '{recipe['base']}' con {recipe['juice_ml']} ml de reactivo ({recipe['activator']}) comprado por separado. Servir en {gl_str}. Beber de un trago."
        },
        "long": {
            "uk": f"Візьміть {gl_str}. Налийте {recipe['activator']} ({recipe['juice_ml']} мл, купується окремо) та воду ({recipe['water_ml']} мл). Влийте {recipe['tea_ml']} мл нашого концентрату «{recipe['base']}». Прикрасьте {g_str}.",
            "en": f"Take {gl_str}. Pour {recipe['activator']} ({recipe['juice_ml']} ml, bought separately) and water ({recipe['water_ml']} ml). Add {recipe['tea_ml']} ml of our '{recipe['base']}' concentrate. Garnish with {g_str}.",
            "ru": f"Возьмите {gl_str}. Налейте {recipe['activator']} ({recipe['juice_ml']} мл, покупается отдельно) и воду ({recipe['water_ml']} мл). Влейте {recipe['tea_ml']} мл нашего концентрата «{recipe['base']}». Украсьте {g_str}.",
            "es": f"Toma {gl_str}. Vierte {recipe['activator']} ({recipe['juice_ml']} ml, comprado por separado) y agua ({recipe['water_ml']} ml). Añade {recipe['tea_ml']} ml de nuestro concentrado '{recipe['base']}'. Adorna con {g_str}."
        },
        "tea": {
            "uk": f"Формат «Просто Чай». Візьміть {gl_str}. Додайте {recipe['tea_ml']} мл нашого концентрату «{recipe['base']}» та залийте водою ({recipe['water_ml']} мл). Мінімум зусиль — максимум результату.",
            "en": f"'Just Tea' format. Take {gl_str}. Add {recipe['tea_ml']} ml of our '{recipe['base']}' concentrate and pour water ({recipe['water_ml']} ml). Minimum effort — maximum result.",
            "ru": f"Формат «Просто Чай». Возьмите {gl_str}. Добавьте {recipe['tea_ml']} мл нашего концентрата «{recipe['base']}» и залейте водой ({recipe['water_ml']} мл). Минимум усилий — максимум результата.",
            "es": f"Formato 'Solo Té'. Toma {gl_str}. Añade {recipe['tea_ml']} ml de nuestro concentrado '{recipe['base']}' y vierte agua ({recipe['water_ml']} ml). Mínimo esfuerzo — máximo resultado."
        }
    }
    
    fmt = drink_format if drink_format in ["shot", "tea"] else "long"
    recipe["instructions"] = inst[fmt][language]

    avatar = determine_avatar(recipe["base_key"], target_state, user.profession_type, scale_cns, language)
    recipe["avatar_id"] = avatar["id"]
    recipe["avatar_name"] = avatar["name"]
    recipe["avatar_slogan"] = avatar["slogan"]
    recipe["avatar_image"] = avatar["image"]
    recipe["stats"] = avatar["stats"]

    tech = "Дихання Вогню" if target_state == "ENERGY" else "Квадратне Дихання"
    tech_en = "Breath of Fire" if target_state == "ENERGY" else "Square Breathing"
    tech_ru = "Дыхание Огня" if target_state == "ENERGY" else "Квадратное Дыхание"
    tech_es = "Respiración de Fuego" if target_state == "ENERGY" else "Respiración Cuadrada"

    tgt_uk = {"RELAX": "Спокою", "ENERGY": "Енергії", "FOCUS": "Фокусу", "COMMUNICATION": "Комунікації"}[target_state]
    tgt_en = {"RELAX": "Relaxation", "ENERGY": "Energy", "FOCUS": "Focus", "COMMUNICATION": "Communication"}[target_state]
    tgt_ru = {"RELAX": "Спокойствия", "ENERGY": "Энергии", "FOCUS": "Фокуса", "COMMUNICATION": "Коммуникации"}[target_state]
    tgt_es = {"RELAX": "Relajación", "ENERGY": "Energía", "FOCUS": "Enfoque", "COMMUNICATION": "Comunicación"}[target_state]

    wf = recipe.get("weight_factor", 1.0)
    kn = recipe.get("k_ns_modifier", 1.0)
    sm = recipe.get("state_modifier", 1.0)

    exp = {
        "uk": f"Формула: (База 30 мл × Вага {wf:.2f} × Нейротип {kn:.2f} × Стан {sm:.2f}) = {recipe['tea_ml']} мл. Ця медично-точна доза концентрату {recipe['base']} гарантує перехід в стан {tgt_uk}.",
        "en": f"Formula: (Base 30 ml × Weight {wf:.2f} × Neurotype {kn:.2f} × State {sm:.2f}) = {recipe['tea_ml']} ml. This medically-precise dose of {recipe['base']} guarantees the {tgt_en} target state.",
        "ru": f"Формула: (База 30 мл × Вес {wf:.2f} × Нейротип {kn:.2f} × Состояние {sm:.2f}) = {recipe['tea_ml']} мл. Эта медицински-точная доза концентрата {recipe['base']} гарантирует переход в состояние {tgt_ru}.",
        "es": f"Fórmula: (Base 30 ml × Peso {wf:.2f} × Neurotipo {kn:.2f} × Estado {sm:.2f}) = {recipe['tea_ml']} ml. Esta dosis de {recipe['base']} médicamente precisa garantiza el estado {tgt_es}."
    }
    recipe["explanation"] = exp[language]

    return recipe
