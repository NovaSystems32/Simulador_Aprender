import path from "node:path";
import { NextResponse } from "next/server";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { crearClienteServidor } from "@/lib/supabase/server";

export const runtime = "nodejs";

const LOGO_PATH = path.join(process.cwd(), "public", "images", "logo-cajal.png");

// Mismos tokens institucionales que src/app/globals.css (react-pdf no puede leer CSS,
// así que se repiten acá en formato hex literal).
const estilos = StyleSheet.create({
  pagina: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  encabezado: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  logo: { width: 40, height: 40 },
  franjaInstitucional: { height: 4, backgroundColor: "#ab2c2b", marginBottom: 16 },
  titulo: { fontSize: 16, fontWeight: 700, color: "#174277" },
  subtitulo: { fontSize: 10, color: "#667085" },
  filaResumen: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16, borderBottom: 1, borderColor: "#dce3ec", paddingBottom: 12 },
  bloqueResumen: { width: "16%" },
  etiquetaResumen: { fontSize: 8, color: "#667085" },
  valorResumen: { fontSize: 13, fontWeight: 700, color: "#1f2937" },
  filaTabla: { flexDirection: "row", borderBottom: 1, borderColor: "#e7eff8", paddingVertical: 4 },
  encabezadoTabla: { flexDirection: "row", borderBottom: 1, borderColor: "#2871cd", paddingVertical: 4, fontWeight: 700, backgroundColor: "#e7eff8", color: "#174277" },
  celda: { flex: 1 },
  pie: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 8, color: "#667085", textAlign: "center" },
});

export async function GET(request: Request) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cursoId = searchParams.get("curso");
  const evaluacionId = searchParams.get("evaluacion");

  let consulta = supabase
    .from("intentos")
    .select(
      "numero_intento, estado, porcentaje_obtenido, aprobado, perfiles!intentos_estudiante_id_fkey(nombre, apellido), evaluaciones!inner(nombre, curso_id)"
    )
    .in("estado", ["entregado", "expirado"]);

  if (evaluacionId) consulta = consulta.eq("evaluacion_id", evaluacionId);
  else if (cursoId) consulta = consulta.eq("evaluaciones.curso_id", cursoId);

  const { data } = await consulta;

  interface Fila {
    numero_intento: number;
    porcentaje_obtenido: number | null;
    aprobado: boolean | null;
    perfiles: { nombre: string; apellido: string } | null;
    evaluaciones: { nombre: string } | null;
  }
  const filas = (data ?? []) as unknown as Fila[];

  const total = filas.length;
  const promedio = total ? filas.reduce((s, f) => s + (f.porcentaje_obtenido ?? 0), 0) / total : 0;
  const aprobados = filas.filter((f) => f.aprobado).length;
  const aprobacion = total ? (aprobados / total) * 100 : 0;

  const documento = (
    <Document>
      <Page size="A4" style={estilos.pagina}>
        <View style={estilos.encabezado}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer, no es un <img> HTML y no soporta alt */}
          <Image src={LOGO_PATH} style={estilos.logo} />
          <View>
            <Text style={estilos.titulo}>Informe de resultados — Simulador Aprender Matemática</Text>
            <Text style={estilos.subtitulo}>
              Instituto Santiago Ramón y Cajal · Generado el {new Date().toLocaleString("es-AR")}
            </Text>
          </View>
        </View>
        <View style={estilos.franjaInstitucional} />

        <View style={estilos.filaResumen}>
          <View style={estilos.bloqueResumen}>
            <Text style={estilos.etiquetaResumen}>Intentos</Text>
            <Text style={estilos.valorResumen}>{total}</Text>
          </View>
          <View style={estilos.bloqueResumen}>
            <Text style={estilos.etiquetaResumen}>Promedio</Text>
            <Text style={estilos.valorResumen}>{promedio.toFixed(1)}%</Text>
          </View>
          <View style={estilos.bloqueResumen}>
            <Text style={estilos.etiquetaResumen}>Aprobación</Text>
            <Text style={estilos.valorResumen}>{aprobacion.toFixed(1)}%</Text>
          </View>
        </View>

        <View style={estilos.encabezadoTabla}>
          <Text style={estilos.celda}>Estudiante</Text>
          <Text style={estilos.celda}>Evaluación</Text>
          <Text style={estilos.celda}>Intento</Text>
          <Text style={estilos.celda}>Porcentaje</Text>
          <Text style={estilos.celda}>Aprobado</Text>
        </View>
        {filas.map((f, i) => (
          <View key={i} style={estilos.filaTabla}>
            <Text style={estilos.celda}>
              {f.perfiles?.nombre} {f.perfiles?.apellido}
            </Text>
            <Text style={estilos.celda}>{f.evaluaciones?.nombre}</Text>
            <Text style={estilos.celda}>#{f.numero_intento}</Text>
            <Text style={estilos.celda}>{f.porcentaje_obtenido}%</Text>
            <Text style={estilos.celda}>{f.aprobado ? "Sí" : "No"}</Text>
          </View>
        ))}

        <Text style={estilos.pie}>
          Instituto Santiago Ramón y Cajal — Simulador educativo independiente. No pertenece ni
          representa a organismos gubernamentales.
        </Text>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(documento);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="reporte.pdf"`,
    },
  });
}
