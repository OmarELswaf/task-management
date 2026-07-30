const SUPABASE_URL = "http://127.0.0.1:54321";
const ANON_KEY = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
  "Accept": "application/json",
};

async function main() {
  // Check what schemas/tables exist via the PostgREST API
  console.log("--- Querying PostgREST root with proper headers ---");
  let r = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers });
  console.log(`HTTP ${r.status}`);
  const text = await r.text();
  const openapi = JSON.parse(text);
  const paths = Object.keys(openapi.paths || {}).slice(0, 30);
  console.log(`Available paths (${paths.length}):`);
  paths.forEach(p => console.log(`  ${p}`));

  // Try rpc to get table list
  console.log("\n--- Try querying information_schema via REST ---");
  r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_tables`, {
    method: "POST",
    headers,
  });
  console.log(`HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);

  // Check if supabase_realtime is available
  console.log("\n--- Checking realtime ---");
  r = await fetch(`${SUPABASE_URL}/realtime/v1/`, { headers });
  console.log(`HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);

  // Check storage
  console.log("\n--- Checking storage ---");
  r = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, { headers });
  console.log(`HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
}
main().catch(console.error);
