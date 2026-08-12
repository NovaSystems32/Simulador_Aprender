// Carga los datos de demostración: 1 admin, 1 docente, 5 estudiantes,
// 1 curso de 6to año, 40 preguntas (10 por eje) y 2 evaluaciones.
// Es razonablemente idempotente: puede ejecutarse más de una vez sin
// duplicar usuarios, preguntas ni cursos.
//
// Uso:  npm run db:seed

import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { preguntasDemo } from "./preguntas-demo.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local. Copiá .env.example y completá los valores de tu proyecto Supabase."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD_DEMO = "Demo1234!";

const USUARIOS_DEMO = [
  { email: "admin@simulador-demo.edu.ar", rol: "admin", nombre: "Valeria", apellido: "Administradora" },
  { email: "docente@simulador-demo.edu.ar", rol: "docente", nombre: "Laura", apellido: "Fernández" },
  { email: "estudiante1@simulador-demo.edu.ar", rol: "estudiante", nombre: "Bruno", apellido: "Acosta" },
  { email: "estudiante2@simulador-demo.edu.ar", rol: "estudiante", nombre: "Camila", apellido: "Díaz" },
  { email: "estudiante3@simulador-demo.edu.ar", rol: "estudiante", nombre: "Enzo", apellido: "Gómez" },
  { email: "estudiante4@simulador-demo.edu.ar", rol: "estudiante", nombre: "Martina", apellido: "López" },
  { email: "estudiante5@simulador-demo.edu.ar", rol: "estudiante", nombre: "Tomás", apellido: "Pereyra" },
];

async function listarTodosLosUsuarios() {
  const usuarios = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    usuarios.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }
  return usuarios;
}

async function obtenerOCrearUsuarios() {
  const existentes = await listarTodosLosUsuarios();
  const porEmail = new Map(existentes.map((u) => [u.email, u]));
  const resultado = {};

  for (const datos of USUARIOS_DEMO) {
    let usuario = porEmail.get(datos.email);
    if (!usuario) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: datos.email,
        password: PASSWORD_DEMO,
        email_confirm: true,
        user_metadata: { rol: datos.rol, nombre: datos.nombre, apellido: datos.apellido },
      });
      if (error) throw error;
      usuario = data.user;
      console.log(`  creado usuario ${datos.email}`);
    } else {
      console.log(`  ya existía ${datos.email}`);
    }
    resultado[datos.email] = usuario;
  }
  return resultado;
}

async function obtenerOCrearInstitucion() {
  const nombre = "Instituto Educativo Demo";
  const { data: existente } = await supabase
    .from("instituciones")
    .select("*")
    .eq("nombre", nombre)
    .maybeSingle();
  if (existente) return existente;

  const { data, error } = await supabase
    .from("instituciones")
    .insert({ nombre })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function obtenerOCrearCurso(institucionId, docenteId) {
  const nombre = "6to Año";
  const division = "A";
  const anioLectivo = new Date().getFullYear();

  const { data: existente } = await supabase
    .from("cursos")
    .select("*")
    .eq("nombre", nombre)
    .eq("division", division)
    .eq("anio_lectivo", anioLectivo)
    .maybeSingle();
  if (existente) return existente;

  const { data, error } = await supabase
    .from("cursos")
    .insert({
      institucion_id: institucionId,
      nombre,
      division,
      anio_lectivo: anioLectivo,
      docente_titular_id: docenteId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function asegurarIntegrante(cursoId, perfilId, rolEnCurso) {
  const { data: existente } = await supabase
    .from("curso_integrantes")
    .select("id")
    .eq("curso_id", cursoId)
    .eq("perfil_id", perfilId)
    .maybeSingle();
  if (existente) return;

  const { error } = await supabase
    .from("curso_integrantes")
    .insert({ curso_id: cursoId, perfil_id: perfilId, rol_en_curso: rolEnCurso });
  if (error) throw error;
}

async function cargarPreguntas(autorId) {
  const { data: existentes, error: errorExistentes } = await supabase
    .from("preguntas")
    .select("codigo");
  if (errorExistentes) throw errorExistentes;

  const codigosExistentes = new Set((existentes ?? []).map((p) => p.codigo));
  const nuevas = preguntasDemo
    .filter((p) => !codigosExistentes.has(p.codigo))
    .map((p) => ({ ...p, autor_id: autorId, estado: "activa" }));

  if (nuevas.length > 0) {
    const { error } = await supabase.from("preguntas").insert(nuevas);
    if (error) throw error;
    console.log(`  insertadas ${nuevas.length} preguntas nuevas`);
  } else {
    console.log("  las preguntas ya estaban cargadas");
  }

  const { data: todas, error } = await supabase.from("preguntas").select("*");
  if (error) throw error;
  return todas;
}

async function obtenerOCrearEvaluacion(datos) {
  const { data: existente } = await supabase
    .from("evaluaciones")
    .select("*")
    .eq("nombre", datos.nombre)
    .eq("curso_id", datos.curso_id)
    .maybeSingle();
  if (existente) return existente;

  const { data, error } = await supabase.from("evaluaciones").insert(datos).select().single();
  if (error) throw error;
  return data;
}

async function asegurarAsignacion(evaluacionId, cursoId) {
  const { data: existente } = await supabase
    .from("asignaciones")
    .select("id")
    .eq("evaluacion_id", evaluacionId)
    .eq("curso_id", cursoId)
    .maybeSingle();
  if (existente) return;

  const { error } = await supabase
    .from("asignaciones")
    .insert({ evaluacion_id: evaluacionId, curso_id: cursoId });
  if (error) throw error;
}

async function asegurarPreguntasManual(evaluacionId, codigos, preguntas) {
  const { data: existentes } = await supabase
    .from("evaluacion_preguntas")
    .select("id")
    .eq("evaluacion_id", evaluacionId);
  if (existentes && existentes.length > 0) return;

  const filas = codigos.map((codigo, indice) => {
    const pregunta = preguntas.find((p) => p.codigo === codigo);
    if (!pregunta) throw new Error(`No se encontró la pregunta ${codigo}`);
    return { evaluacion_id: evaluacionId, pregunta_id: pregunta.id, orden: indice + 1 };
  });

  const { error } = await supabase.from("evaluacion_preguntas").insert(filas);
  if (error) throw error;
}

async function main() {
  console.log("Creando/verificando institución...");
  const institucion = await obtenerOCrearInstitucion();

  console.log("Creando/verificando usuarios de demostración...");
  const usuarios = await obtenerOCrearUsuarios();
  const docente = usuarios["docente@simulador-demo.edu.ar"];

  // Asegura institucion_id en los perfiles (el trigger no la conoce)
  for (const email of Object.keys(usuarios)) {
    await supabase
      .from("perfiles")
      .update({ institucion_id: institucion.id })
      .eq("id", usuarios[email].id);
  }

  console.log("Creando/verificando curso...");
  const curso = await obtenerOCrearCurso(institucion.id, docente.id);

  console.log("Agregando integrantes del curso...");
  await asegurarIntegrante(curso.id, docente.id, "docente");
  for (const email of Object.keys(usuarios)) {
    const datos = USUARIOS_DEMO.find((u) => u.email === email);
    if (datos.rol === "estudiante") {
      await asegurarIntegrante(curso.id, usuarios[email].id, "estudiante");
    }
  }

  console.log("Cargando banco de preguntas...");
  const preguntas = await cargarPreguntas(docente.id);

  console.log("Creando evaluaciones de demostración...");
  const ahora = new Date();
  const cierre = new Date(ahora.getTime() + 45 * 24 * 60 * 60 * 1000);

  const evaluacionAutomatica = await obtenerOCrearEvaluacion({
    nombre: "Simulacro Aprender Matemática - 1er Trimestre",
    descripcion:
      "Simulacro integral con preguntas de los cuatro ejes, seleccionadas automáticamente por el sistema.",
    curso_id: curso.id,
    tipo: "automatica",
    fecha_apertura: ahora.toISOString(),
    fecha_cierre: cierre.toISOString(),
    duracion_minutos: 90,
    cantidad_preguntas: 20,
    orden_aleatorio_preguntas: true,
    orden_aleatorio_opciones: true,
    intentos_max: 2,
    puntaje_aprobacion: 60,
    mostrar_resultado_inmediato: true,
    permitir_revision: true,
    mostrar_resoluciones: true,
    permitir_calculadora: false,
    permitir_hoja_formulas: false,
    descuento_por_incorrecta: false,
    config_automatica: {
      distribucion: [
        { eje: "numeros_operaciones", cantidad: 5 },
        { eje: "algebra_funciones", cantidad: 5 },
        { eje: "geometria_medida", cantidad: 5 },
        { eje: "estadistica_probabilidad", cantidad: 5 },
      ],
    },
    estado: "publicada",
    creado_por: docente.id,
  });
  await asegurarAsignacion(evaluacionAutomatica.id, curso.id);

  const evaluacionManual = await obtenerOCrearEvaluacion({
    nombre: "Evaluación Integradora - Geometría y Estadística",
    descripcion: "Evaluación armada manualmente por el/la docente sobre Geometría y Estadística.",
    curso_id: curso.id,
    tipo: "manual",
    fecha_apertura: ahora.toISOString(),
    fecha_cierre: cierre.toISOString(),
    duracion_minutos: 60,
    cantidad_preguntas: 10,
    orden_aleatorio_preguntas: true,
    orden_aleatorio_opciones: true,
    intentos_max: 1,
    puntaje_aprobacion: 60,
    mostrar_resultado_inmediato: true,
    permitir_revision: true,
    mostrar_resoluciones: true,
    permitir_calculadora: true,
    permitir_hoja_formulas: false,
    descuento_por_incorrecta: false,
    config_automatica: null,
    estado: "publicada",
    creado_por: docente.id,
  });
  await asegurarPreguntasManual(
    evaluacionManual.id,
    ["GEO-01", "GEO-02", "GEO-03", "GEO-04", "GEO-05", "EST-01", "EST-02", "EST-03", "EST-04", "EST-05"],
    preguntas
  );
  await asegurarAsignacion(evaluacionManual.id, curso.id);

  console.log("\nListo. Datos de demostración cargados.");
  console.log(`Contraseña para todos los usuarios demo: ${PASSWORD_DEMO}`);
}

main().catch((err) => {
  console.error("Error cargando datos de demostración:", err);
  process.exit(1);
});
