// Aplica todos los archivos .sql de supabase/migrations, en orden, contra la
// base de datos indicada en SUPABASE_DB_URL (.env.local).
//
// Uso:  npm run db:migrate

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const { Client } = pg;

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error(
      "Falta SUPABASE_DB_URL en .env.local. Copiá .env.example y completá los valores de tu proyecto Supabase."
    );
    process.exit(1);
  }

  const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");
  const archivos = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (archivos.length === 0) {
    console.log("No hay migraciones para aplicar.");
    return;
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    for (const archivo of archivos) {
      console.log(`Aplicando ${archivo}...`);
      const sql = await readFile(path.join(migrationsDir, archivo), "utf8");
      await client.query(sql);
      console.log(`  OK ${archivo}`);
    }
    console.log("Migraciones aplicadas correctamente.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Error aplicando migraciones:", err.message);
  process.exit(1);
});
