import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import pg from "pg";

const { Client } = pg;
const DB_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const MIGRATIONS_DIR = join(import.meta.dirname, "supabase", "migrations");

function splitStatements(sql) {
  const statements = [];
  let current = "";
  let i = 0;

  while (i < sql.length) {
    // Single-line comment
    if (sql[i] === "-" && sql[i + 1] === "-") {
      const end = sql.indexOf("\n", i);
      i = end === -1 ? sql.length : end + 1;
      continue;
    }
    // Block comment
    if (sql[i] === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? sql.length : end + 2;
      continue;
    }
    // Dollar-quoted string: $$...$$ or $tag$...$tag$
    if (sql[i] === "$") {
      let tagEnd = i + 1;
      while (tagEnd < sql.length && sql[tagEnd] !== "$") tagEnd++;
      if (tagEnd > i + 1 && tagEnd < sql.length) {
        const tag = sql.slice(i, tagEnd + 1);
        const close = sql.indexOf(tag, tagEnd + 1);
        if (close !== -1) {
          current += sql.slice(i, close + tag.length);
          i = close + tag.length;
          continue;
        }
      } else if (tagEnd === i + 1) {
        // $$
        const close = sql.indexOf("$$", i + 2);
        if (close !== -1) {
          current += sql.slice(i, close + 2);
          i = close + 2;
          continue;
        }
      }
    }
    // Single-quoted string
    if (sql[i] === "'") {
      const close = sql.indexOf("'", i + 1);
      if (close !== -1) {
        current += sql.slice(i, close + 1);
        i = close + 1;
        continue;
      }
    }
    // Semicolon ends a statement
    if (sql[i] === ";") {
      const trimmed = current.trim();
      if (trimmed.length > 0) statements.push(trimmed + ";");
      current = "";
      i++;
      continue;
    }
    current += sql[i];
    i++;
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) statements.push(trimmed + ";");

  return statements;
}

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log("Connected to database\n");

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    const statements = splitStatements(sql);

    console.log(`--- ${file} (${statements.length} statements) ---`);
    for (let i = 0; i < statements.length; i++) {
      try {
        await client.query(statements[i]);
        console.log(`  [OK] ${i + 1}`);
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log(`  [SKIP] ${i + 1}: already exists`);
        } else {
          console.log(`  [ERR] ${i + 1}: ${err.message.split("\n")[0].slice(0, 150)}`);
        }
      }
    }
    console.log("");
  }

  const res = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  console.log("Tables in public schema:");
  if (res.rows.length === 0) console.log("  (none)");
  else res.rows.forEach((r) => console.log(`  - ${r.table_name}`));

  await client.end();
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
