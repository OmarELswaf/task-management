const SUPABASE_URL = "http://127.0.0.1:54321";
const ANON_KEY = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

async function check(endpoint, label) {
  try {
    const res = await fetch(`${SUPABASE_URL}${endpoint}`, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    });
    console.log(`${label}: HTTP ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`  Response (first 300 chars): ${text.slice(0, 300)}`);
  } catch (e) {
    console.log(`${label}: ERROR - ${e.message}`);
  }
}

async function main() {
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Anon Key: ${ANON_KEY.slice(0, 20)}...`);
  console.log("");
  await check("/rest/v1/", "REST API root");
  await check("/auth/v1/", "Auth API root");
  await check("/", "Base URL");
}

main().catch(console.error);
