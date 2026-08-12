import Link from "next/link";
import { EncabezadoPublico } from "@/components/EncabezadoPublico";
import { PiePagina } from "@/components/PiePagina";
import { Logo } from "@/components/Logo";

const EJES = [
  {
    titulo: "Números y operaciones",
    detalle: "Fracciones, porcentajes, proporcionalidad, notación científica y más.",
  },
  {
    titulo: "Álgebra y funciones",
    detalle: "Ecuaciones, funciones lineales, cuadráticas y exponenciales.",
  },
  {
    titulo: "Geometría y medida",
    detalle: "Perímetro, área, volumen, semejanza, Pitágoras y trigonometría.",
  },
  {
    titulo: "Estadística y probabilidad",
    detalle: "Lectura de gráficos, medidas de tendencia central y probabilidad.",
  },
];

export default function PaginaInicio() {
  return (
    <>
      <EncabezadoPublico />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-violeta-100 via-amarillo-100/40 to-fondo px-4 py-16">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <Logo tamano="lg" />
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-violeta-800 sm:text-4xl">
              Simulador de Matemática
            </h1>
            <p className="mt-3 text-lg text-texto-secundario">
              Práctica para las Pruebas Aprender – 6.º año
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-texto-secundario">
              Practicá con situaciones problemáticas de opción múltiple, al estilo de las evaluaciones
              nacionales, administrá tu tiempo y conocé qué contenidos necesitás reforzar.
            </p>
            <div className="mt-8">
              <Link href="/login" className="btn-primario px-6 py-3 text-base">
                Ingresar al simulador
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-center text-xl font-bold text-violeta-800">Ejes de contenido</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {EJES.map((eje) => (
              <div key={eje.titulo} className="tarjeta">
                <h3 className="font-semibold text-violeta-800">{eje.titulo}</h3>
                <p className="mt-1 text-sm text-texto-secundario">{eje.detalle}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PiePagina />
    </>
  );
}
