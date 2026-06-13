/**
 * BoosterTea Liquid OS — Full Production Stress Test (Node.js)
 * Тестує production API: https://boostertea-os-backend.onrender.com
 */

const API_URL = "https://boostertea-os-backend.onrender.com/api";
const NUM_USERS = 100;

const genders = ["male", "female"];
const professions = ["coding", "study", "business", "creative", "sport", "routine"];
const formats = ["long", "shot", "tea"];
const languages = ["uk", "en", "ru", "es"];
const sensitivities = ["normal", "high"];
const caffeine_amounts = [0, 60, 120, 150, 200];

const results = {
  pass: 0, fail: 0,
  errors: [], warnings: [], edge_cases: [],
  endpoint_stats: {},
  base_distribution: {},
  recipe_stats: {},
};

function logPass(ep) {
  results.pass++;
  if (!results.endpoint_stats[ep]) results.endpoint_stats[ep] = { ok: 0, fail: 0 };
  results.endpoint_stats[ep].ok++;
}
function logFail(ep, msg) {
  results.fail++;
  if (!results.endpoint_stats[ep]) results.endpoint_stats[ep] = { ok: 0, fail: 0 };
  results.endpoint_stats[ep].fail++;
  results.errors.push(`[${ep}] ${msg}`);
}
function logWarn(msg) { results.warnings.push(`⚠️  ${msg}`); }
function logEdge(msg) { results.edge_cases.push(`🔬 ${msg}`); }

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randDate(yearMin, yearMax) {
  const y = rand(yearMin, yearMax);
  const m = String(rand(1, 12)).padStart(2, '0');
  const d = String(rand(1, 28)).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function makeUser(idx, opts = {}) {
  const g = opts.gender || choice(genders);
  return {
    telegram_id: 70000000 + idx,
    username: `ProdTest_${idx}`,
    weight: opts.weight || rand(45, 130),
    gender: g,
    birth_date: randDate(1975, 2004),
    profession_type: choice(professions),
    taste_acid_pref: rand(1, 10),
    taste_bitter_pref: rand(1, 10),
    taste_sweet_pref: rand(1, 10),
    caffeine_sensitivity: opts.sensitivity || choice(sensitivities),
    smoker: opts.smoker !== undefined ? opts.smoker : choice([true, false]),
    oral_contraceptives: (opts.contraceptives !== undefined) ? opts.contraceptives : (g === 'female' ? choice([true, false]) : false),
    target_bedtime: opts.bedtime || `${String(rand(21, 23)).padStart(2, '0')}:${choice(['00', '30'])}`,
    last_period_date: g === 'female' ? randDate(2026, 2026).replace(/\d{4}/, '2026') : null,
  };
}

function makeCalc(tgId, opts = {}) {
  return {
    telegram_id: tgId,
    specific_activity_id: opts.prof || choice(professions),
    scale_cns: opts.cns || rand(2, 10),
    scale_energy: opts.energy || rand(2, 10),
    scale_mental: opts.mental || rand(2, 10),
    had_caffeine_recently: opts.hadCaff !== undefined ? opts.hadCaff : choice([true, false]),
    caffeine_mg: opts.caffMg !== undefined ? opts.caffMg : choice(caffeine_amounts),
    caffeine_time: opts.caffTime || `${String(rand(8, 22)).padStart(2, '0')}:00`,
    drink_format: opts.fmt || choice(formats),
    latitude: rand(46, 52) + Math.random(),
    longitude: rand(22, 38) + Math.random(),
    language: opts.lang || choice(languages),
  };
}

async function post(endpoint, body) {
  const r = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  return { status: r.status, data: await r.json().catch(() => r.text()) };
}

async function get(endpoint) {
  const r = await fetch(`${API_URL}${endpoint}`, { signal: AbortSignal.timeout(20000) });
  return { status: r.status, data: await r.json().catch(() => r.text()) };
}

// ─── Phase 1: Register + Calculate 100 users ───
async function phase1() {
  process.stdout.write("📦 Phase 1: Register + Calculate 100 users ");
  const registered = [];
  const batchSize = 10;

  for (let batch = 0; batch < NUM_USERS / batchSize; batch++) {
    const batchTasks = [];
    for (let i = 0; i < batchSize; i++) {
      const idx = batch * batchSize + i;
      batchTasks.push((async () => {
        const user = makeUser(idx);
        const tgId = user.telegram_id;

        // Register
        let reg;
        try {
          reg = await post('/register', user);
          if (reg.status === 200) {
            logPass('register');
          } else {
            logFail('register', `User ${idx}: HTTP ${reg.status} — ${JSON.stringify(reg.data).slice(0, 150)}`);
            return null;
          }
        } catch (e) {
          logFail('register', `User ${idx}: ${e.message}`);
          return null;
        }

        // Calculate
        try {
          const calcData = makeCalc(tgId);
          const calc = await post('/calculate', calcData);
          if (calc.status === 200) {
            const recipe = calc.data?.recipe || {};
            const warnings = [];

            if (!recipe.base) { logFail('calculate', `User ${idx}: Missing base`); return null; }
            if (!recipe.tea_ml || recipe.tea_ml <= 0) { logFail('calculate', `User ${idx}: Invalid tea_ml=${recipe.tea_ml}`); return null; }
            if (recipe.tea_ml > 500) warnings.push(`tea_ml=${recipe.tea_ml} (weight=${user.weight}kg)`);
            if (!recipe.activator) { logFail('calculate', `User ${idx}: Missing activator`); return null; }
            if (!recipe.instructions) { logFail('calculate', `User ${idx}: Missing instructions`); return null; }
            if (!recipe.avatar_name) { logFail('calculate', `User ${idx}: Missing avatar_name`); return null; }
            if (!recipe.stats) { logFail('calculate', `User ${idx}: Missing stats`); return null; }
            if (!calc.data?.challenge_day) warnings.push(`Missing challenge_day`);

            if (warnings.length) warnings.forEach(w => logWarn(`User ${idx}: ${w}`));

            const bk = recipe.base_key || '??';
            results.base_distribution[bk] = (results.base_distribution[bk] || 0) + 1;
            results.recipe_stats[calcData.drink_format] = (results.recipe_stats[calcData.drink_format] || 0) + 1;

            logPass('calculate');
            return tgId;
          } else {
            logFail('calculate', `User ${idx}: HTTP ${calc.status} — ${JSON.stringify(calc.data).slice(0, 150)}`);
            return null;
          }
        } catch (e) {
          logFail('calculate', `User ${idx}: ${e.message}`);
          return null;
        }
      })());
    }
    const res = await Promise.all(batchTasks);
    registered.push(...res.filter(Boolean));
    process.stdout.write('.');
  }
  console.log(` ✔ ${registered.length} registered`);
  return registered;
}

// ─── Phase 2: All profession × format × language combos ───
async function phase2() {
  console.log("🔀 Phase 2: Profession × Format × Language combos...");
  let ok = 0, fail = 0;
  const tasks = [];

  for (const prof of professions) {
    for (const fmt of formats) {
      for (const lang of ['uk', 'en']) {
        const idx = 80000 + professions.indexOf(prof) * 100 + formats.indexOf(fmt) * 10 + ['uk','en'].indexOf(lang);
        tasks.push((async () => {
          const tgId = 80000000 + idx;
          const u = makeUser(idx);
          u.telegram_id = tgId;
          await post('/register', u).catch(() => {});
          try {
            const r = await post('/calculate', makeCalc(tgId, { prof, fmt, lang }));
            if (r.status === 200 && r.data?.recipe?.base && r.data?.recipe?.tea_ml > 0) {
              ok++; logPass('combo');
            } else {
              fail++;
              logFail('combo', `prof=${prof} fmt=${fmt} lang=${lang}: HTTP ${r.status}`);
            }
          } catch (e) { fail++; logFail('combo', `${prof}/${fmt}/${lang}: ${e.message}`); }
        })());
      }
    }
  }
  await Promise.all(tasks);
  logEdge(`Combos: ${ok} OK / ${fail} FAIL`);
  console.log(`   ✔ Done (${ok} OK, ${fail} FAIL)`);
}

// ─── Phase 3: Edge Cases ───
async function phase3() {
  console.log("🔬 Phase 3: Engine edge cases...");

  // Edge A: Max weight
  {
    const u = makeUser(90001, { weight: 130, gender: 'male' });
    u.telegram_id = 90100001;
    await post('/register', u).catch(() => {});
    const r = await post('/calculate', makeCalc(90100001, { cns: 10, energy: 10, mental: 10 })).catch(() => ({ status: 0, data: {} }));
    if (r.status === 200) {
      logEdge(`Edge A (130kg max): tea_ml=${r.data?.recipe?.tea_ml}`);
      logPass('edge_max_weight');
    } else logFail('edge_max_weight', `HTTP ${r.status}`);
  }

  // Edge B: Min weight
  {
    const u = makeUser(90002, { weight: 45, gender: 'female' });
    u.telegram_id = 90100002;
    await post('/register', u).catch(() => {});
    const r = await post('/calculate', makeCalc(90100002, { cns: 2, energy: 2, mental: 2 })).catch(() => ({ status: 0, data: {} }));
    if (r.status === 200) {
      logEdge(`Edge B (45kg min): tea_ml=${r.data?.recipe?.tea_ml}`);
      logPass('edge_min_weight');
    } else logFail('edge_min_weight', `HTTP ${r.status}`);
  }

  // Edge C: Smoker + high caffeine
  {
    const u = makeUser(90003, { smoker: true, sensitivity: 'normal' });
    u.telegram_id = 90100003;
    await post('/register', u).catch(() => {});
    const r = await post('/calculate', makeCalc(90100003, { caffMg: 200, caffTime: '06:00' })).catch(() => ({ status: 0, data: {} }));
    if (r.status === 200) { logEdge(`Edge C (smoker+200mg caff 6am): OK`); logPass('edge_smoker'); }
    else logFail('edge_smoker', `HTTP ${r.status}`);
  }

  // Edge D: Oral contraceptives slow metabolism
  {
    const u = makeUser(90004, { gender: 'female', contraceptives: true });
    u.telegram_id = 90100004;
    await post('/register', u).catch(() => {});
    const r = await post('/calculate', makeCalc(90100004, { caffMg: 120, caffTime: '08:00' })).catch(() => ({ status: 0, data: {} }));
    if (r.status === 200) { logEdge(`Edge D (OC+120mg caff): OK`); logPass('edge_oc'); }
    else logFail('edge_oc', `HTTP ${r.status}`);
  }

  // Edge E: Near bedtime (curfew) + sport
  {
    const now = new Date();
    const h = now.getHours();
    const m = (now.getMinutes() + 25) % 60;
    const bedtime = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    const u = makeUser(90005, { bedtime });
    u.telegram_id = 90100005;
    await post('/register', u).catch(() => {});
    const r = await post('/calculate', makeCalc(90100005, { prof: 'sport' })).catch(() => ({ status: 0, data: {} }));
    if (r.status === 200) {
      const base = r.data?.recipe?.base_key;
      const exp = r.data?.recipe?.explanation || '';
      const curfewOk = !['DHP', 'Puer'].includes(base);
      logEdge(`Edge E (curfew near bedtime ${bedtime}): base=${base}, curfew_triggered=${curfewOk}`);
      logPass('edge_curfew');
    } else logFail('edge_curfew', `HTTP ${r.status}`);
  }

  // Edge F: Female late luteal (PMDD, day ~25)
  {
    const today = new Date();
    const periodStart = new Date(today);
    periodStart.setDate(today.getDate() - 24);
    const dateStr = periodStart.toISOString().split('T')[0];
    const u = makeUser(90006, { gender: 'female' });
    u.telegram_id = 90100006;
    u.last_period_date = dateStr;
    await post('/register', u).catch(() => {});
    const r = await post('/calculate', makeCalc(90100006, { prof: 'routine' })).catch(() => ({ status: 0, data: {} }));
    if (r.status === 200) {
      logEdge(`Edge F (PMDD late luteal day~25): base=${r.data?.recipe?.base_key}, supplement=${r.data?.recipe?.supplement}`);
      logPass('edge_pmdd');
    } else logFail('edge_pmdd', `HTTP ${r.status}`);
  }

  // Edge G: Unknown activity → fallback
  {
    const u = makeUser(90007);
    u.telegram_id = 90100007;
    await post('/register', u).catch(() => {});
    const c = makeCalc(90100007);
    c.specific_activity_id = 'unknown_xyz';
    const r = await post('/calculate', c).catch(() => ({ status: 0, data: {} }));
    if (r.status === 200) {
      logEdge(`Edge G (unknown activity fallback): base=${r.data?.recipe?.base_key}`);
      logPass('edge_unknown_activity');
    } else logFail('edge_unknown_activity', `HTTP ${r.status}`);
  }

  // Edge H: Unregistered user → expect 404
  {
    const r = await post('/calculate', makeCalc(99988877)).catch(() => ({ status: 0, data: {} }));
    if (r.status === 404) {
      logEdge(`Edge H (unregistered → 404): ✅`);
      logPass('edge_404');
    } else {
      logFail('edge_404', `Expected 404, got ${r.status}`);
    }
  }

  // Edge I: Max CNS for each profession
  for (const prof of professions) {
    const u = makeUser(91000 + professions.indexOf(prof));
    u.telegram_id = 91000000 + professions.indexOf(prof);
    await post('/register', u).catch(() => {});
    const r = await post('/calculate', makeCalc(u.telegram_id, { prof, cns: 10, energy: 10, mental: 10 })).catch(() => ({ status: 0 }));
    if (r.status === 200) logPass(`edge_maxstress_${prof}`);
    else logFail(`edge_maxstress_${prof}`, `HTTP ${r.status}`);
  }

  // Edge J: All langs for single user
  {
    const u = makeUser(92001);
    u.telegram_id = 92000001;
    await post('/register', u).catch(() => {});
    for (const lang of languages) {
      const r = await post('/calculate', makeCalc(u.telegram_id, { lang })).catch(() => ({ status: 0 }));
      if (r.status === 200) {
        const recipe = r.data?.recipe;
        if (recipe?.base && recipe?.instructions) logPass(`edge_lang_${lang}`);
        else logFail(`edge_lang_${lang}`, `Incomplete recipe for lang=${lang}`);
      } else logFail(`edge_lang_${lang}`, `HTTP ${r.status}`);
    }
  }

  console.log("   ✔ Done");
}

// ─── Phase 4: Other Endpoints ───
async function phase4(tgId) {
  console.log("🌐 Phase 4: Other API endpoints...");

  // /stats
  const stats = await get('/stats').catch(() => ({ status: 0, data: {} }));
  if (stats.status === 200 && stats.data.total_users !== undefined && stats.data.total_checkins !== undefined) {
    logEdge(`/stats: users=${stats.data.total_users}, checkins=${stats.data.total_checkins}`);
    logPass('stats');
  } else logFail('stats', `HTTP ${stats.status}: ${JSON.stringify(stats.data).slice(0, 100)}`);

  // /locations
  const locs = await get('/locations').catch(() => ({ status: 0, data: {} }));
  if (locs.status === 200) {
    const ls = locs.data.locations || [];
    logEdge(`/locations: ${ls.length} locations found`);
    if (ls.length === 0) logWarn('No locations found — may need seeding');
    for (const loc of ls) {
      for (const f of ['id', 'name', 'lat', 'lon', 'status']) {
        if (loc[f] === undefined) logWarn(`Location missing field '${f}'`);
      }
    }
    logPass('locations');
  } else logFail('locations', `HTTP ${locs.status}`);

  // /order/generate_code
  const code = await get('/order/generate_code').catch(() => ({ status: 0, data: {} }));
  if (code.status === 200 && code.data.short_code && code.data.short_code.includes('-')) {
    logEdge(`/order/generate_code: ${code.data.short_code}`);
    logPass('order_generate_code');
  } else logFail('order_generate_code', `HTTP ${code.status}: ${JSON.stringify(code.data)}`);

  // /b2b/certify
  const cert = await post('/b2b/certify', { telegram_id: tgId, point_id: 'test-point-1', score: 100, passed: true }).catch(() => ({ status: 0, data: {} }));
  if (cert.status === 200 && cert.data.cert_id) {
    logEdge(`/b2b/certify: cert_id=${cert.data.cert_id}`);
    logPass('b2b_certify');
  } else logFail('b2b_certify', `HTTP ${cert.status}: ${JSON.stringify(cert.data).slice(0, 100)}`);

  // /b2b/haccp
  const haccp = await post('/b2b/haccp', {
    telegram_id: tgId, point_id: 'test-point-1', shift_type: 'OPENING',
    fridge_temp_ok: true, pumps_washed: true, expiry_checked: true, notes: 'Stress Test'
  }).catch(() => ({ status: 0, data: {} }));
  if (haccp.status === 200) { logPass('b2b_haccp'); }
  else logFail('b2b_haccp', `HTTP ${haccp.status}: ${JSON.stringify(haccp.data).slice(0, 100)}`);

  // /b2b/scan_qr
  const scan = await post('/b2b/scan_qr', { barista_id: tgId, client_id: tgId, point_id: 'test-point-1' }).catch(() => ({ status: 0, data: {} }));
  if (scan.status === 200 && scan.data.challenge_day !== undefined) { logPass('b2b_scan_qr'); }
  else if (scan.status === 404) { logPass('b2b_scan_qr'); logWarn('b2b/scan_qr: client not found'); }
  else logFail('b2b_scan_qr', `HTTP ${scan.status}: ${JSON.stringify(scan.data).slice(0, 100)}`);

  // /b2b/status (after certify user is barista)
  const st = await post('/b2b/status', { telegram_id: tgId, point_id: 'test-point-1', status: 'OPEN' }).catch(() => ({ status: 0, data: {} }));
  if ([200, 403, 404].includes(st.status)) { logPass('b2b_status'); }
  else logFail('b2b_status', `HTTP ${st.status}: ${JSON.stringify(st.data).slice(0, 100)}`);

  // /v1/b2b/pulse
  const pulse = await get('/v1/b2b/pulse?company_id=test-co').catch(() => ({ status: 0, data: {} }));
  if (pulse.status === 200 && ['ok', 'insufficient_data'].includes(pulse.data.status)) { logPass('b2b_pulse'); }
  else logFail('b2b_pulse', `HTTP ${pulse.status}: ${JSON.stringify(pulse.data).slice(0, 100)}`);

  // /v1/feedback/ema
  const ema = await post('/v1/feedback/ema', { log_id: '00000000-0000-0000-0000-000000000000', effectiveness_score: 8, taste_score: 7, comment: 'stress' }).catch(() => ({ status: 0, data: {} }));
  if ([200, 404].includes(ema.status)) { logPass('ema_feedback'); }
  else logFail('ema_feedback', `HTTP ${ema.status}: ${JSON.stringify(ema.data).slice(0, 100)}`);

  // /referral/claim — same user (should fail gracefully)
  const ref = await post('/referral/claim', { referrer_id: tgId, referral_id: tgId }).catch(() => ({ status: 0, data: {} }));
  if ([200, 404].includes(ref.status)) { logPass('referral_claim'); }
  else logFail('referral_claim', `HTTP ${ref.status}: ${JSON.stringify(ref.data).slice(0, 100)}`);

  console.log("   ✔ Done");
}

// ─── Phase 5: Concurrent Load ───
async function phase5(registeredIds) {
  console.log("⚡ Phase 5: 20 concurrent calculate requests...");
  const ids = registeredIds.slice(0, 20);
  const t0 = Date.now();
  const tasks = ids.map(tid => post('/calculate', makeCalc(tid)));
  const responses = await Promise.allSettled(tasks);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
  let ok = 0;
  for (const r of responses) {
    if (r.status === 'fulfilled' && r.value.status === 200) { ok++; logPass('concurrent'); }
    else { logFail('concurrent', r.reason?.message || `HTTP ${r.value?.status}`); }
  }
  logEdge(`Concurrent 20 requests: ${ok}/${ids.length} OK in ${elapsed}s`);
  if (parseFloat(elapsed) > 15) logWarn(`Concurrent load: ${elapsed}s — possible performance issue on Render free tier`);
  console.log(`   ✔ Done (${ok} OK, ${elapsed}s)`);
}

// ─── Phase 6: Duplicate Register ───
async function phase6() {
  console.log("♻️  Phase 6: Duplicate register (idempotency)...");
  const u = makeUser(99001);
  u.telegram_id = 99900001;
  const r1 = await post('/register', u).catch(() => ({ status: 0 }));
  const r2 = await post('/register', u).catch(() => ({ status: 0 }));
  if (r1.status === 200 && r2.status === 200) {
    logEdge('Duplicate register: idempotent ✅');
    logPass('duplicate_register');
  } else logFail('duplicate_register', `r1=${r1.status}, r2=${r2.status}`);
  console.log("   ✔ Done");
}

// ─── Phase 7: Streak Logic ───
async function phase7() {
  console.log("🏆 Phase 7: Streak logic...");
  const u = makeUser(99002);
  u.telegram_id = 99900002;
  await post('/register', u).catch(() => {});
  const r1 = await post('/calculate', makeCalc(u.telegram_id)).catch(() => ({ status: 0, data: {} }));
  const r2 = await post('/calculate', makeCalc(u.telegram_id)).catch(() => ({ status: 0, data: {} }));
  const d1 = r1.data?.challenge_day;
  const d2 = r2.data?.challenge_day;
  logEdge(`Streak: first=${d1}, second same-day=${d2}`);
  if (d1 >= 1 && d1 <= 21 && d2 >= 1 && d2 <= 21) logPass('streak');
  else logFail('streak', `challenge_day out of range: d1=${d1}, d2=${d2}`);
  console.log("   ✔ Done");
}

// ─── MAIN ───
async function main() {
  console.log('\n' + '='.repeat(62));
  console.log('   🧬 BoosterTea Liquid OS — Production Stress Test (Node.js)');
  console.log('='.repeat(62));
  console.log(`   Target: ${API_URL}`);
  console.log(`   Users:  ${NUM_USERS}`);
  console.log(`   Time:   ${new Date().toLocaleTimeString()}`);
  console.log('='.repeat(62) + '\n');

  // Health check
  try {
    const h = await get('/stats');
    if (h.status !== 200) { console.error(`❌ FATAL: Backend offline`); process.exit(1); }
    console.log(`✅ Production backend online — Users: ${h.data.total_users}, Checkins: ${h.data.total_checkins}\n`);
  } catch (e) {
    console.error(`❌ FATAL: ${e.message}`);
    process.exit(1);
  }

  const registered = await phase1();
  await phase2();
  await phase3();
  if (registered.length > 0) await phase4(registered[0]);
  if (registered.length >= 20) await phase5(registered);
  await phase6();
  await phase7();

  // ── REPORT ──
  const total = results.pass + results.fail;
  const pct = total > 0 ? ((results.pass / total) * 100).toFixed(1) : 0;

  console.log('\n' + '='.repeat(62));
  console.log('   📊 STRESS TEST REPORT');
  console.log('='.repeat(62));
  console.log(`\n   Total checks:   ${total}`);
  console.log(`   ✅ PASSED:       ${results.pass}`);
  console.log(`   ❌ FAILED:       ${results.fail}`);
  console.log(`   📈 Success rate: ${pct}%`);

  console.log('\n── Endpoint Summary ──────────────────────────────────────────');
  for (const [ep, stat] of Object.entries(results.endpoint_stats).sort()) {
    const icon = stat.fail === 0 ? '✅' : '❌';
    console.log(`   ${icon} ${ep.padEnd(38)} OK=${String(stat.ok).padStart(3)}  FAIL=${stat.fail}`);
  }

  if (Object.keys(results.base_distribution).length) {
    console.log('\n── Recipe Base Distribution ──────────────────────────────────');
    for (const [base, cnt] of Object.entries(results.base_distribution).sort((a,b) => b[1]-a[1])) {
      const bar = '█'.repeat(Math.min(cnt, 35));
      console.log(`   ${base.padEnd(32)} ${String(cnt).padStart(3)} ${bar}`);
    }
  }

  if (Object.keys(results.recipe_stats).length) {
    console.log('\n── Drink Format Distribution ─────────────────────────────────');
    for (const [fmt, cnt] of Object.entries(results.recipe_stats)) {
      console.log(`   ${fmt.padEnd(12)}: ${cnt}`);
    }
  }

  if (results.edge_cases.length) {
    console.log('\n── Edge Case Results ─────────────────────────────────────────');
    results.edge_cases.forEach(e => console.log(`   ${e}`));
  }

  if (results.warnings.length) {
    console.log('\n── ⚠️  Warnings ──────────────────────────────────────────────');
    results.warnings.forEach(w => console.log(`   ${w}`));
  }

  if (results.errors.length) {
    console.log(`\n── ❌ Errors (${results.errors.length}) ──────────────────────────────────────`);
    results.errors.slice(0, 30).forEach(e => console.log(`   ${e}`));
    if (results.errors.length > 30) console.log(`   ... та ще ${results.errors.length - 30} помилок`);
  }

  console.log('\n' + '='.repeat(62));
  if (results.fail === 0) console.log('   🎉 ВСІ ТЕСТИ ПРОЙШЛИ! Система стабільна.');
  else if (results.fail < 10) console.log('   ⚠️  МАЙЖЕ ОК — незначні проблеми, дивіться вище.');
  else console.log('   🚨 КРИТИЧНІ ПРОБЛЕМИ — перегляньте помилки вище.');
  console.log('='.repeat(62) + '\n');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
