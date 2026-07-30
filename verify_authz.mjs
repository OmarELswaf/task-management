const SUPABASE_URL = "http://127.0.0.1:54321";
const HEADERS = {
  "Content-Type": "application/json",
  "Accept": "application/json",
};

async function main() {
  // Sign in to get JWT
  let r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ email: "test@test.com", password: "Test123456!" }),
  });

  if (!r.ok) {
    // Register first
    r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ email: "test@test.com", password: "Test123456!" }),
    });
    console.log("Signup:", r.status, (await r.text()).slice(0, 200));

    // Try login again
    r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ email: "test@test.com", password: "Test123456!" }),
    });
  }

  const { access_token, user } = await r.json();
  console.log("Login OK:", user?.email, "token:", access_token?.slice(0, 20) + "...");

  // Now test table access with JWT + anon key
  const PUBLISHABLE = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

  console.log("\n--- Table queries ---");
  for (const table of ["projects", "tasks", "comments"]) {
    // With publishable key only
    r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count`, {
      method: "HEAD",
      headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${PUBLISHABLE}` },
    });
    console.log(`${table} (publishable key): HTTP ${r.status}`);

    // With JWT
    r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count`, {
      method: "HEAD",
      headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${access_token}` },
    });
    console.log(`${table} (JWT):            HTTP ${r.status}, Content-Range: ${r.headers.get("content-range") || "N/A"}`);

    // Full body of failure
    if (!r.ok) {
      const body = await r.text();
      if (body) console.log(`  Response: ${body.slice(0, 200)}`);
    }
  }

  // Test projects SELECT
  console.log("\n--- Projects SELECT with JWT ---");
  r = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
    headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${access_token}` },
  });
  console.log(`HTTP ${r.status}: ${await r.text()}`);
}
main().catch(console.error);
