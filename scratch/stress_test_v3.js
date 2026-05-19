const API_URL = "http://localhost:8000/api";

async function registerUser() {
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": "mock_data"
      },
      body: JSON.stringify({
        telegram_id: 999999,
        username: "stress_tester",
        weight: 70,
        gender: "male",
        birth_date: "1995-05-15",
        profession_type: "coding",
        taste_acid_pref: 5,
        taste_bitter_pref: 5,
        taste_sweet_pref: 5
      })
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function singleRequest(idx) {
  const start = Date.now();
  try {
    const res = await fetch(`${API_URL}/calculate`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": "mock_data"
      },
      body: JSON.stringify({
        telegram_id: 999999,
        specific_activity_id: "coding",
        scale_cns: 5,
        scale_energy: 5,
        scale_mental: 5,
        had_caffeine_recently: false,
        latitude: 50.45,
        longitude: 30.52
      })
    });
    return { status: res.status, duration: Date.now() - start, error: null };
  } catch (err) {
    return { status: 0, duration: Date.now() - start, error: err.message };
  }
}

async function runStressTest(numRequests = 100) {
  console.log("Registering test user...");
  const registered = await registerUser();
  console.log(`Registration successful: ${registered}`);
  
  if (!registered) {
    console.log("Failed to connect to backend. Is it running?");
    return;
  }

  console.log(`Starting ${numRequests} concurrent requests to /api/calculate...`);
  const start = Date.now();
  
  const promises = [];
  for (let i = 0; i < numRequests; i++) {
    promises.push(singleRequest(i));
  }
  
  const results = await Promise.all(promises);
  const totalTime = (Date.now() - start) / 1000;
  
  let successCount = 0;
  let totalDuration = 0;
  for (const r of results) {
    if (r.status === 200) successCount++;
    totalDuration += r.duration;
  }
  
  const errorCount = results.length - successCount;
  const avgDuration = totalDuration / results.length;
  
  console.log("\n--- Stress Test Results ---");
  console.log(`Total Requests: ${numRequests}`);
  console.log(`Total Time: ${totalTime.toFixed(2)} seconds`);
  console.log(`Successful (200 OK): ${successCount}`);
  console.log(`Failed/Errors: ${errorCount}`);
  console.log(`Average Response Time: ${avgDuration.toFixed(2)} ms`);
  
  if (errorCount > 0) {
    console.log("\nErrors seen:");
    for (const r of results) {
      if (r.status !== 200) {
        console.log(`Status: ${r.status}, Error: ${r.error}`);
        break;
      }
    }
  }
}

runStressTest(100);
