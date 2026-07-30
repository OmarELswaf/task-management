const SUPABASE_URL = "http://127.0.0.1:54321";
const ANON_KEY = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
};

async function main() {
  // 1. REST API - list available tables/endpoints
  console.log("--- REST API: Root (OpenAPI spec) ---");
  let r = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers });
  console.log(`HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);

  // 2. Try to select from 'projects' table
  console.log("\n--- REST API: GET /rest/v1/projects ---");
  r = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=count`, { headers, method: "HEAD" });
  console.log(`HTTP ${r.status}`);
  const count = r.headers.get("content-range") || r.headers.get("x-total-count") || "N/A";
  console.log(`Content-Range: ${count}`);

  // 3. Auth endpoint - sign in
  console.log("\n--- Auth API: POST /auth/v1/token ---");
  r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@test.com", password: "test123456" }),
  });
  const authText = await r.text();
  console.log(`HTTP ${r.status}`);
  if (r.ok) {
    const data = JSON.parse(authText);
    console.log(`User: ${data.user?.email}, Session: ${!!data.session}`);
  } else {
    console.log(`Auth response: ${authText.slice(0, 300)}`);
  }

  // 4. Health check
  console.log("\n--- Health: GET /health ---");
  r = await fetch(`${SUPABASE_URL}/health`, { headers });
  console.log(`HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
}

main().catch(console.error);
