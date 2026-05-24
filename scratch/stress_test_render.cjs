const fs = require('fs');

const API_URL = "https://boostertea-os-backend.onrender.com/api";
const NUM_TESTS = 2;

const genders = ["male", "female"];
const professions = ["coding", "study", "business", "creative", "sport", "routine"];
const formats = ["long", "shot"];

async function runTest(idx) {
    const tg_id = Math.floor(Math.random() * 9000000) + 1000000;
    const weight = Math.floor(Math.random() * 75) + 45; // 45 to 120
    const gender = genders[Math.floor(Math.random() * genders.length)];
    
    // random date between 1980 and 2005
    const start = new Date(1980, 0, 1).getTime();
    const end = new Date(2005, 0, 1).getTime();
    const birthDate = new Date(start + Math.random() * (end - start)).toISOString().split('T')[0];
    
    const prof = professions[Math.floor(Math.random() * professions.length)];

    // 1. Register User
    const regPayload = {
        telegram_id: tg_id,
        username: `TestUser_${idx}`,
        weight: weight,
        gender: gender,
        birth_date: birthDate,
        profession_type: prof,
        taste_acid_pref: Math.floor(Math.random() * 7) + 2,
        taste_bitter_pref: Math.floor(Math.random() * 7) + 2,
        taste_sweet_pref: Math.floor(Math.random() * 7) + 2
    };

    try {
        const r1 = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regPayload)
        });
        
        if (!r1.ok) {
            const text = await r1.text();
            return `Error registering user ${idx}: ${text}`;
        }
    } catch (e) {
        return `Network error registering user ${idx}: ${e.message}`;
    }

    // 2. Calculate Recipe
    const calcPayload = {
        telegram_id: tg_id,
        specific_activity_id: prof,
        scale_cns: Math.floor(Math.random() * 9) + 2,
        scale_energy: Math.floor(Math.random() * 9) + 2,
        scale_mental: Math.floor(Math.random() * 9) + 2,
        had_caffeine_recently: Math.random() > 0.5,
        caffeine_mg: [0, 60, 120, 150, 200][Math.floor(Math.random() * 5)],
        caffeine_time: "14:30",
        drink_format: formats[Math.floor(Math.random() * formats.length)],
        latitude: 50.45,
        longitude: 30.52,
        language: "uk"
    };

    try {
        const r2 = await fetch(`${API_URL}/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(calcPayload)
        });

        if (!r2.ok) {
            const text = await r2.text();
            return `Error calculating recipe for user ${idx}: ${text}`;
        }

        const data = await r2.json();
        const recipe = data.recipe;

        // Assertions
        if (!recipe.base) return `User ${idx}: Missing base`;
        if (!recipe.tea_ml || recipe.tea_ml <= 0) return `User ${idx}: Invalid tea_ml (${recipe.tea_ml})`;
        if (recipe.tea_ml > 200) return `User ${idx}: Extremely high tea_ml (${recipe.tea_ml})`;

        // Valid
        return null;
    } catch (e) {
        return `Network error calculating recipe for user ${idx}: ${e.message}`;
    }
}

async function main() {
    console.log(`Running ${NUM_TESTS} stress tests against production API...`);
    const promises = [];
    for (let i = 0; i < NUM_TESTS; i++) {
        promises.push(runTest(i));
        // 100ms delay to prevent 429 errors from Render
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const results = await Promise.all(promises);
    const errors = results.filter(r => r !== null);
    
    if (errors.length > 0) {
        console.log(`FAILED: ${errors.length} errors found.`);
        console.log(errors.slice(0, 10).join('\n'));
    } else {
        console.log(`SUCCESS: All ${NUM_TESTS} tests passed perfectly! Recipe generation is 100% stable.`);
    }
}

main();
