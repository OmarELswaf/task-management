const SUPABASE_URL = "http://127.0.0.1:54321";
const ANON_KEY = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
  "Accept": "application/json",
};

async function main() {
  console.log("=== VERIFICATION ===\n");

  // 1. API reachable
  console.log("1. API Server Reachable:");
  let r = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers, method: "GET" });
  console.log(`   REST API: HTTP ${r.status} ${r.ok ? "OK" : "FAIL"}`);

  // 2. Database tables accessible
  console.log("\n2. Database Tables:");
  for (const table of ["projects", "tasks", "comments"]) {
    r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count`, {
      headers,
      method: "HEAD",
    });
    if (r.status === 200) {
      const cr = r.headers.get("content-range") || "0-0/0";
      console.log(`   ${table}: HTTP ${r.status} (${cr})`);
    } else {
      const text = await r.text();
      console.log(`   ${table}: HTTP ${r.status} - ${text.slice(0, 100)}`);
    }
  }

  // 3. Auth API - register a test user
  console.log("\n3. Auth API (Sign Up):");
  const randomId = Math.random().toString(36).slice(2, 8);
  const testEmail = `test_${randomId}@example.com`;
  r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: testEmail,
      password: "Test123456!",
    }),
  });
  const signupText = await r.text();
  if (r.ok) {
    const data = JSON.parse(signupText);
    console.log(`   Signup: HTTP ${r.status} - user ${data.email} created (auto-confirmed)`);
  } else {
    console.log(`   Signup: HTTP ${r.status} - ${signupText.slice(0, 200)}`);
  }

  // 4. Auth API - Sign in with test user
  console.log("\n4. Auth API (Sign In):");
  r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email: testEmail, password: "Test123456!" }),
  });
  const loginText = await r.text();
  if (r.ok) {
    const data = JSON.parse(loginText);
    console.log(`   Login: HTTP ${r.status} - access_token: ${data.access_token?.slice(0, 20)}...`);
    console.log(`   User ID: ${data.user?.id}`);
  } else {
    console.log(`   Login: HTTP ${r.status} - ${loginText.slice(0, 200)}`);
  }

  console.log("\n=== VERIFICATION COMPLETE ===");
}
main().catch(console.error);
