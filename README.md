# Simulador de Matemática — Arte Nuevo

Simulador educativo **independiente** de evaluaciones de Matemática, con formato similar al de las
Pruebas Aprender, para estudiantes de 6.º año de la escuela secundaria de Argentina. Identidad
visual de la institución Arte Nuevo (logo en `public/images/logo-arte-nuevo.png`, tokens de color
en `src/app/globals.css`).

> Simulador educativo independiente de Arte Nuevo. No pertenece ni representa a organismos
> gubernamentales. Todas las actividades son originales.

## Índice

1. [Tecnologías](#tecnologías)
2. [Instalación](#instalación)
3. [Configurar Supabase](#configurar-supabase)
4. [Cargar la base de datos y los datos de demostración](#cargar-la-base-de-datos-y-los-datos-de-demostración)
5. [Ejecutar el proyecto](#ejecutar-el-proyecto)
6. [Credenciales de demostración](#credenciales-de-demostración)
7. [Tests](#tests)
8. [Arquitectura](#arquitectura)
9. [Roles y funciones](#roles-y-funciones)

## Tecnologías

- **Next.js 16** (App Router) + **TypeScript** estricto
- **Tailwind CSS 4**
- **Supabase** (Postgres + Auth + Row Level Security)
- **Recharts** para gráficos
- **KaTeX** (`react-katex`) para fórmulas matemáticas
- **`@react-pdf/renderer`** para informes en PDF
- **Vitest** + Testing Library para tests unitarios/integración

## Instalación

Requisitos: Node.js 20+ y una cuenta gratuita en [supabase.com](https://supabase.com).

```bash
npm install
```

## Configurar Supabase

1. Creá un proyecto nuevo en [supabase.com](https://supabase.com/dashboard).
2. Copiá `.env.example` a `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

3. Completá `.env.local` con los datos de tu proyecto:
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`: **Project Settings → API**.
   - `SUPABASE_SERVICE_ROLE_KEY`: la misma pantalla, clave `service_role` (es secreta, nunca la subas
     a un repositorio ni la expongas al navegador).
   - `SUPABASE_DB_URL`: **Project Settings → Database → Connection string → URI**.

## Cargar la base de datos y los datos de demostración

Con `.env.local` completo:

```bash
npm run db:migrate   # crea todas las tablas, índices, funciones y políticas RLS
npm run db:seed      # carga institución, usuarios, curso, 40 preguntas y 2 evaluaciones demo
```

`db:migrate` ejecuta los archivos de `supabase/migrations/` en orden contra tu base (usa
`SUPABASE_DB_URL`). `db:seed` usa la API de administración de Supabase Auth (`SUPABASE_SERVICE_ROLE_KEY`)
para crear los usuarios de demostración y sus perfiles, cursos y evaluaciones. Ambos scripts son
razonablemente idempotentes: podés volver a correrlos sin duplicar datos.

## Ejecutar el proyecto

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

Para producción:

```bash
npm run build
npm run start
```

## Credenciales de demostración

**Solo para el entorno local/de desarrollo.** Contraseña para los 7 usuarios: `Demo1234!`

| Rol | Correo |
|---|---|
| Administrador | `admin@simulador-demo.edu.ar` |
| Docente | `docente@simulador-demo.edu.ar` |
| Estudiante | `estudiante1@simulador-demo.edu.ar` … `estudiante5@simulador-demo.edu.ar` |

## Tests

```bash
npm test          # corre una vez
npm run test:watch
```

Cubren la lógica de corrección automática (`src/lib/scoring.ts`), la selección aleatoria y el
armado de intentos (`src/lib/randomization.ts`), la generación/parseo de CSV y las reglas de
permisos por rol (`src/lib/permisos.ts`). Antes de dar por terminado un cambio, corré también:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Arquitectura

```
supabase/
  migrations/0001_init.sql   Esquema completo: tablas, índices, funciones, RLS
scripts/
  apply-migrations.mjs       Aplica las migraciones contra SUPABASE_DB_URL
  seed.mjs                   Carga los datos de demostración
  preguntas-demo.mjs         Las 40 preguntas originales del banco demo
src/
  app/
    login/                   Inicio de sesión
    estudiante/               Área del estudiante (rutas protegidas por rol)
    docente/                  Área docente (y admin, para banco/evaluaciones/reportes)
    admin/                    Administración (usuarios, cursos, configuración)
    api/intentos/             Route handlers server-only: rendición y corrección de exámenes
    api/reportes/             Exportación CSV/PDF
  components/                Componentes de UI compartidos
  lib/
    supabase/                 Clientes de Supabase (browser, server, admin/service-role)
    scoring.ts                 Corrección automática (función pura)
    randomization.ts           Selección aleatoria y barajado (función pura)
    intentos-server.ts         Arma el snapshot de preguntas y corrige intentos (solo servidor)
    permisos.ts                 Reglas de acceso por rol y ruta (función pura)
  proxy.ts                    Protección de rutas por rol (antes "middleware.ts" en Next 16)
tests/unit/                  Tests de Vitest
```

### Cómo se protege la respuesta correcta

Las políticas RLS no pueden ocultar columnas específicas de una fila. Por eso, todo el flujo de
"rendir una evaluación" (iniciar intento, obtener preguntas, autoguardar respuestas, entregar y
corregir) pasa por **Route Handlers** (`src/app/api/intentos/...`) que usan el cliente de Supabase
con **service role** (solo en servidor) y arman manualmente la respuesta JSON, quitando
`respuesta_correcta` y `explicacion` mientras el intento está `en_curso`. El resto de la aplicación
usa el cliente autenticado normal, sujeto a RLS.

## Roles y funciones

**Administrador**: usuarios, cursos, banco completo de preguntas, configuración general, todos los
resultados.

**Docente**: banco de preguntas propio (y consulta de las preguntas activas de otros docentes),
evaluaciones manuales o automáticas, asignación a cursos, incorporación de estudiantes, reportes
(CSV/PDF) filtrados por curso/evaluación.

**Estudiante**: evaluaciones asignadas, rendición cronometrada con guardado automático, marcado de
preguntas para revisar, resultados (cuando el/la docente los habilita), revisión de respuestas con
resolución paso a paso, historial de intentos.

## Configuraciones externas pendientes (a completar por vos)

- Crear el proyecto en Supabase y completar `.env.local` (ver arriba).
- Correr `npm run db:migrate` y `npm run db:seed` contra ese proyecto.
- Si vas a desplegar en producción, configurar las mismas variables de entorno en tu hosting
  (por ejemplo Vercel) y restringir la URL de callback de Auth en Supabase a tu dominio real.
