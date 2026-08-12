// Respaldo de solo-lectura: exporta TODAS las filas y columnas de las tablas
// de la aplicación a un archivo JSON local, con marca de tiempo, antes de
// ejecutar cualquier operación destructiva. No modifica datos.
//
// Uso:  node scripts/backup-completo.mjs

import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Faltan variables de entorno en .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TABLAS = [
  "instituciones",
  "perfiles",
  "cursos",
  "curso_integrantes",
  "preguntas",
  "evaluaciones",
  "evaluacion_preguntas",
  "asignaciones",
  "intentos",
  "intento_preguntas",
  "respuestas_estudiante",
  "resultado_desglose",
  "configuraciones",
];

async function main() {
  const backup = { generado_en: new Date().toISOString(), tablas: {} };

  for (const tabla of TABLAS) {
    const { data, error } = await supabase.from(tabla).select("*");
    if (error) throw new Error(`${tabla}: ${error.message}`);
    backup.tablas[tabla] = data;
    console.log(`  ${tabla}: ${data.length} fila(s)`);
  }

  // Usuarios de Supabase Auth (sin password hashes, la API admin no las expone)
  const authUsers = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    authUsers.push(
      ...data.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        user_metadata: u.user_metadata,
      }))
    );
    if (data.users.length < 200) break;
    page += 1;
  }
  backup.auth_users = authUsers;
  console.log(`  auth.users: ${authUsers.length} fila(s)`);

  const dir = path.join(__dirname, "..", "backups");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(dir, `backup-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(backup, null, 2), "utf-8");
  console.log("\nRespaldo guardado en:", outPath);
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
