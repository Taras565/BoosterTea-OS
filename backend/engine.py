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
    if "GABA" in base and target in ["FOCUS", "RELAX"] and stress >= 7:
        a = t_avatar("zen", lang)
        return { "id": "avatar_zen_master", "name": a["name"], "slogan": a["slogan"], "image": "/avatar_zen_master_1778484425493.png", "stats": { "focus": 40, "energy": 10, "calm": 50 } }
    if "Да Хун Пао" in base or "Da Hong Pao" in base and profession == "CREATIVE":
        a = t_avatar("creative", lang)
        return { "id": "avatar_creative_cyborg", "name": a["name"], "slogan": a["slogan"], "image": "/avatar_creative_cyborg_1778484439484.png", "stats": { "focus": 30, "energy": 30, "calm": 20 } }
    if ("Шу Пуер" in base or "Саган" in base or "Puer" in base or "Sagan" in base) and target == "ENERGY" and stress <= 4:
        a = t_avatar("energy", lang)
        return { "id": "avatar_energy_phoenix", "name": a["name"], "slogan": a["slogan"], "image": "/avatar_energy_phoenix_1778484456721.png", "stats": { "focus": 20, "energy": 60, "calm": 5 } }
    a = t_avatar("neo", lang)
    return { "id": "avatar_adaptive_neo", "name": a["name"], "slogan": a["slogan"], "image": "/avatar_adaptive_neo_1778484470404.png", "stats": { "focus": 25, "energy": 25, "calm": 25 } }

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
        "Puer": {"uk": "Шу Пуер", "en": "Shu Puer", "ru": "Шу Пуэр", "es": "Shu Puer"},
        "Pure GABA": {"uk": "Чиста Преміум GABA", "en": "Pure Premium GABA", "ru": "Чистая Премиум GABA", "es": "GABA Premium Pura"},
        "GABA (Stress)": {"uk": "GABA (Стрес-компенсація)", "en": "GABA (Stress Compensation)", "ru": "GABA (Стресс-компенсация)", "es": "GABA (Compensación de Estrés)"},
        "GABA (Decaf)": {"uk": "GABA (Захист від кофеїну)", "en": "GABA (Caffeine Protection)", "ru": "GABA (Защита от кофеина)", "es": "GABA (Protección contra cafeína)"}
    }
    return bases.get(base_type, bases["GABA"]).get(lang, bases.get(base_type, bases["GABA"])["uk"])

def determine_recipe(scale_cns: int, scale_energy: int, scale_mental: int, had_caffeine: bool, specific_activity_id: str, drink_format: str, weather_temp: int, user, language: str = "uk"):
    k_ns = get_k_ns(user.hd_type)
    weight = user.weight or 70
    if user.gender == "female": k_ns *= 0.9
    
    target_state = "RELAX"
    if scale_cns >= 7: target_state = "RELAX"
    elif scale_energy < 5 and not had_caffeine: target_state = "ENERGY"
    elif scale_mental < 6: target_state = "FOCUS"
    else: target_state = "COMMUNICATION"

    # Dynamic State Modifier based on deviation from norm (5)
    state_modifier = 1.0
    if target_state == "RELAX" and scale_cns > 5:
        state_modifier = 1.0 + ((scale_cns - 5) * 0.06)  # Max +30% at stress 10
    elif target_state == "ENERGY" and scale_energy < 5:
        state_modifier = 1.0 + ((5 - scale_energy) * 0.1)  # Max +30% at energy 2
    elif target_state == "FOCUS" and scale_mental < 5:
        state_modifier = 1.0 + ((5 - scale_mental) * 0.1)  # Max +30% at mental 2

    v_tea = round(weight * k_ns * state_modifier, 1)

    recipe = {
        "base_key": "GABA",
        "activator": "Apple-Ginger", # We will translate activators later
        "tea_ml": v_tea,
        "juice_ml": 100,
        "water_ml": 50,
        "ice_cubes": 0,
        "cocktail_status": "Chilled",
        "instructions": "",
        "breathwork_protocol": "square"
    }

    if target_state == "RELAX":
        recipe["base_key"] = "Pure GABA" if scale_cns >= 9 else "Soft GABA"
    elif target_state == "ENERGY":
        recipe["base_key"] = "Puer" if not had_caffeine else "GABA (Decaf)"
    elif target_state == "FOCUS":
        recipe["base_key"] = "GABA + DHP" if scale_mental < 3 else "GABA"
    elif target_state == "COMMUNICATION":
        recipe["base_key"] = "DHP"
    
    if had_caffeine:
        recipe["tea_ml"] = round(recipe["tea_ml"] / 2, 1)

    recipe["breathwork_protocol"] = "fire" if target_state == "ENERGY" else "square"

    is_hot_weather = weather_temp > 22
    t_sweet = user.taste_sweet_pref or 5
    t_acid = user.taste_acid_pref or 5
    t_bitter = user.taste_bitter_pref or 5

    recipe["juice_ml"] = 120
    recipe["water_ml"] = 30

    garnish = ""
    glass_type = ""

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
        "Lemon Fresh": {"uk": "Лимонний фреш", "en": "Lemon Fresh", "ru": "Лимонный фреш", "es": "Jugo Fresco de Limón"}
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
        shot_coef = 0.65
        recipe["tea_ml"] = round(recipe["tea_ml"] * shot_coef, 1)
        recipe["juice_ml"] = round(15 + (recipe["tea_ml"] * 0.1), 1)
        recipe["water_ml"] = 0
        status_key = "Shot"
        glass_key = "Shot"
    elif drink_format == "tea":
        recipe["juice_ml"] = 0
        recipe["water_ml"] = 150
        status_key = "Hot" if not is_hot_weather else "Ice"
        glass_key = "Double" if not is_hot_weather else "Highball"
    elif is_hot_weather:
        recipe["ice_cubes"] = round(weather_temp / 6)
        status_key = "Ice"
        glass_key = "Highball"
        if t_acid >= 7 and t_sweet < 7: act_key = "Ruby Grapefruit"; garnish_key = "Rosemary"
        elif t_sweet >= 7 and t_acid < 7: act_key = "Blackberry Lavender"; garnish_key = "Blueberries"
        elif t_bitter >= 7: act_key = "Tonic"; garnish_key = "Lemon Zest"
        else: act_key = "Lime Lemonade"; garnish_key = "Mint Lime"
    else:
        recipe["ice_cubes"] = 0
        status_key = "Hot"
        glass_key = "Double"
        if t_sweet >= 7 and t_acid < 7: act_key = "Buckthorn Honey"; garnish_key = "Cinnamon"
        elif t_acid >= 7 and t_sweet < 7: act_key = "Warm Cranberry"; garnish_key = "Orange"
        elif t_bitter >= 7: act_key = "Spicy Ginger"; garnish_key = "Pepper"
        else: act_key = "Classic Apple"; garnish_key = "Apple"

    recipe["base"] = get_base_name(recipe["base_key"], language)
    
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

    exp = {
        "uk": f"Формула (Вага {weight} кг × HD k_ns {k_ns:.2f} × Модифікатор {state_modifier:.2f}) = {recipe['tea_ml']} мл. База {recipe['base']} та техніка '{tech}' точно підібрані для переходу в стан {tgt_uk}.",
        "en": f"Formula (Weight {weight} kg × HD k_ns {k_ns:.2f} × Modifier {state_modifier:.2f}) = {recipe['tea_ml']} ml. Base {recipe['base']} and '{tech_en}' technique perfectly match the {tgt_en} target state.",
        "ru": f"Формула (Вес {weight} кг × HD k_ns {k_ns:.2f} × Модификатор {state_modifier:.2f}) = {recipe['tea_ml']} мл. База {recipe['base']} и техника '{tech_ru}' точно подобраны для перехода в состояние {tgt_ru}.",
        "es": f"Fórmula (Peso {weight} kg × HD k_ns {k_ns:.2f} × Modificador {state_modifier:.2f}) = {recipe['tea_ml']} ml. La base {recipe['base']} y técnica '{tech_es}' están adaptadas para el estado {tgt_es}."
    }
    recipe["explanation"] = exp[language]

    return recipe
