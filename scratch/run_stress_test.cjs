const fs = require('fs');

function get_k_ns(hd_type) {
    if (!hd_type) return 0.65;
    const hd = hd_type.toLowerCase();
    if (hd.includes("generator")) return 0.70;
    if (hd.includes("projector") || hd.includes("manifestor")) return 0.60;
    if (hd.includes("reflector")) return 0.50;
    return 0.65;
}

function determine_recipe(scale_cns, scale_energy, scale_mental, had_caffeine, specific_activity_id, drink_format, weather_temp, user) {
    let k_ns = get_k_ns(user.hd_type);
    let weight = user.weight || 70;
    if (user.gender === "female") k_ns *= 0.9;
    
    let target_state = "RELAX";
    if (scale_cns >= 7) target_state = "RELAX";
    else if (scale_energy < 5 && !had_caffeine) target_state = "ENERGY";
    else if (scale_mental < 6) target_state = "FOCUS";
    else target_state = "COMMUNICATION";

    let state_modifier = 1.0;
    if (target_state === "RELAX" && scale_cns > 5) {
        state_modifier = 1.0 + ((scale_cns - 5) * 0.06);
    } else if (target_state === "ENERGY" && scale_energy < 5) {
        state_modifier = 1.0 + ((5 - scale_energy) * 0.1);
    } else if (target_state === "FOCUS" && scale_mental < 5) {
        state_modifier = 1.0 + ((5 - scale_mental) * 0.1);
    }

    let v_tea = Math.round((weight * k_ns * state_modifier) * 10) / 10;

    let recipe = {
        base_key: "GABA",
        activator: "Apple-Ginger",
        tea_ml: v_tea,
        juice_ml: 100,
        water_ml: 50,
        ice_cubes: 0,
        cocktail_status: "Chilled",
        instructions: "",
        breathwork_protocol: "square",
        target_state: target_state
    };

    let sub = specific_activity_id;
    if (sub === 'coding') recipe.base_key = "Soft GABA";
    else if (sub === 'study') recipe.base_key = "GABA";
    else if (sub === 'business') { recipe.base_key = "GABA + DHP"; recipe.activator = "Lemon Fresh"; }
    else if (sub === 'creative') recipe.base_key = "DHP";
    else if (sub === 'sport') recipe.base_key = "Puer";
    else if (sub === 'routine') recipe.base_key = "Pure GABA";

    if (scale_cns >= 7 && recipe.base_key === "Puer") {
        recipe.base_key = "GABA (Stress)";
    }
    
    if (had_caffeine) {
        recipe.tea_ml = Math.round((recipe.tea_ml / 2) * 10) / 10;
        if (["Puer", "DHP"].includes(recipe.base_key)) {
            recipe.base_key = "GABA (Decaf)";
        }
    }

    recipe.breathwork_protocol = recipe.base_key === "Puer" ? "fire" : "square";

    // Avatar determination
    let avatar = "ІДЕАЛЬНИЙ БАЛАНС";
    if (recipe.base_key.includes("GABA") && ["FOCUS", "RELAX"].includes(target_state) && scale_cns >= 7) {
        avatar = "АБСОЛЮТНИЙ ЧІЛ";
    } else if (recipe.base_key.includes("DHP") || recipe.base_key === "Da Hong Pao") {
        avatar = "ТВОРЧИЙ ПОТІК";
    } else if ((recipe.base_key.includes("Puer") || recipe.base_key.includes("Sagan")) && target_state === "ENERGY" && scale_cns <= 4) {
        avatar = "ТУРБО-РЕЖИМ";
    }
    
    recipe.avatar = avatar;

    return recipe;
}

function run_tests() {
    const num_tests = 100;
    const bases = {};
    const avatars = {};
    const tea_vols = [];
    
    const professions = ["coding", "study", "business", "creative", "sport", "routine"];
    const hd_types = ["Generator", "Projector", "Manifestor", "Reflector", "Manifesting Generator"];

    for (let i = 0; i < num_tests; i++) {
        const user = {
            weight: Math.floor(Math.random() * (110 - 50 + 1)) + 50,
            gender: Math.random() > 0.5 ? "male" : "female",
            hd_type: hd_types[Math.floor(Math.random() * hd_types.length)]
        };
        
        const scale_cns = Math.floor(Math.random() * 9) + 2;
        const scale_energy = Math.floor(Math.random() * 9) + 2;
        const scale_mental = Math.floor(Math.random() * 9) + 2;
        const had_caffeine = Math.random() > 0.5;
        const activity = professions[Math.floor(Math.random() * professions.length)];
        const format = Math.random() > 0.5 ? "long" : "shot";
        
        const recipe = determine_recipe(scale_cns, scale_energy, scale_mental, had_caffeine, activity, format, 20, user);
        
        bases[recipe.base_key] = (bases[recipe.base_key] || 0) + 1;
        avatars[recipe.avatar] = (avatars[recipe.avatar] || 0) + 1;
        tea_vols.push(recipe.tea_ml);
    }
    
    console.log("--- 100 STRESS TESTS RESULT ---");
    console.log("\nBases used:");
    Object.entries(bases).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`- ${k}: ${v}`));
    
    console.log("\nViral States generated:");
    Object.entries(avatars).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`- ${k}: ${v}`));
    
    const sum = tea_vols.reduce((a,b)=>a+b,0);
    console.log(`\nTea volume (ml): Min: ${Math.min(...tea_vols)}, Max: ${Math.max(...tea_vols)}, Avg: ${(sum/100).toFixed(1)}`);
}

run_tests();
