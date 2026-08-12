// Banco de 40 preguntas originales de demostración para el simulador,
// distribuidas en 10 por cada eje matemático, con dificultades y
// capacidades variadas. Usadas por scripts/seed.mjs.

export const preguntasDemo = [
  // ---------------------------------------------------------------
  // EJE: Números y operaciones (10)
  // ---------------------------------------------------------------
  {
    codigo: "NUM-01",
    enunciado:
      "Un kiosco vende alfajores en cajas. En una caja, 3/4 partes son de chocolate. ¿Cuál de las siguientes fracciones es equivalente a 3/4?",
    opcion_a: "6/9",
    opcion_b: "9/12",
    opcion_c: "4/3",
    opcion_d: "12/9",
    respuesta_correcta: "B",
    explicacion:
      "Para hallar una fracción equivalente a 3/4 se multiplican numerador y denominador por el mismo número. Multiplicando por 3: (3×3)/(4×3) = 9/12. La opción A (6/9) equivale a 2/3, no a 3/4; C es la fracción invertida; D no simplifica a 3/4.",
    eje: "numeros_operaciones",
    contenido: "Fracciones y equivalencias",
    capacidad: "reconocimiento_conceptos",
    dificultad: "inicial",
  },
  {
    codigo: "NUM-02",
    enunciado:
      "En una librería, un cuaderno cuesta $2400. Por pago en efectivo se aplica un descuento del 15%. ¿Cuánto se paga por el cuaderno pagando en efectivo?",
    opcion_a: "$360",
    opcion_b: "$2040",
    opcion_c: "$2760",
    opcion_d: "$2044",
    respuesta_correcta: "B",
    explicacion:
      "El 15% de $2400 es 2400 × 0,15 = $360, que es el descuento. El precio final se obtiene restando ese descuento al precio original: 2400 − 360 = $2040. La opción A es solo el descuento, no el precio final; C suma en vez de restar.",
    eje: "numeros_operaciones",
    contenido: "Porcentajes, aumentos y descuentos",
    capacidad: "resolucion_problemas",
    dificultad: "medio",
  },
  {
    codigo: "NUM-03",
    enunciado:
      "El precio de una bicicleta aumentó un 20% en marzo y luego, sobre el nuevo precio, bajó un 10% en abril por una promoción. Si el precio original era de $150000, ¿cuál es el precio final?",
    opcion_a: "$150000",
    opcion_b: "$162000",
    opcion_c: "$165000",
    opcion_d: "$180000",
    respuesta_correcta: "B",
    explicacion:
      "Primero se aplica el aumento del 20%: 150000 × 1,20 = $180000. Luego, sobre ese nuevo precio se aplica el descuento del 10%: 180000 × 0,90 = $162000. Los aumentos y descuentos porcentuales sucesivos no se pueden sumar directamente (20% − 10% ≠ 10% neto), por eso $165000 es incorrecto.",
    eje: "numeros_operaciones",
    contenido: "Porcentajes, aumentos y descuentos",
    capacidad: "resolucion_problemas",
    dificultad: "avanzado",
  },
  {
    codigo: "NUM-04",
    enunciado:
      "La temperatura en Ushuaia fue de -3°C a la madrugada y subió 8°C hacia el mediodía. ¿Cuál fue la temperatura al mediodía?",
    opcion_a: "-11°C",
    opcion_b: "5°C",
    opcion_c: "11°C",
    opcion_d: "-5°C",
    respuesta_correcta: "B",
    explicacion:
      "Subir 8°C desde -3°C equivale a sumar: -3 + 8 = 5. La temperatura al mediodía fue de 5°C.",
    eje: "numeros_operaciones",
    contenido: "Números enteros",
    capacidad: "aplicacion_procedimientos",
    dificultad: "inicial",
  },
  {
    codigo: "NUM-05",
    enunciado:
      "Una fotocopiadora imprime 45 hojas en 3 minutos, a ritmo constante. A ese mismo ritmo, ¿cuántas hojas imprime en 7 minutos?",
    opcion_a: "90",
    opcion_b: "105",
    opcion_c: "135",
    opcion_d: "315",
    respuesta_correcta: "B",
    explicacion:
      "Es una situación de proporcionalidad directa. La cantidad de hojas por minuto es 45 ÷ 3 = 15 hojas/minuto. En 7 minutos imprime 15 × 7 = 105 hojas.",
    eje: "numeros_operaciones",
    contenido: "Proporcionalidad directa",
    capacidad: "interpretacion_informacion",
    dificultad: "medio",
  },
  {
    codigo: "NUM-06",
    enunciado:
      "Si 4 obreros tardan 12 días en levantar un muro trabajando al mismo ritmo, ¿cuántos días tardarían 6 obreros en levantar el mismo muro?",
    opcion_a: "18",
    opcion_b: "8",
    opcion_c: "6",
    opcion_d: "9",
    respuesta_correcta: "B",
    explicacion:
      "Es una situación de proporcionalidad inversa: a más obreros, menos días. El producto obreros × días se mantiene constante: 4 × 12 = 48. Con 6 obreros: 48 ÷ 6 = 8 días.",
    eje: "numeros_operaciones",
    contenido: "Proporcionalidad inversa",
    capacidad: "aplicacion_procedimientos",
    dificultad: "medio",
  },
  {
    codigo: "NUM-07",
    enunciado:
      "La distancia media de la Tierra al Sol es de aproximadamente 150 000 000 km. Expresada en notación científica, esa distancia es:",
    opcion_a: "1,5 × 10⁵ km",
    opcion_b: "1,5 × 10⁶ km",
    opcion_c: "1,5 × 10⁷ km",
    opcion_d: "1,5 × 10⁸ km",
    respuesta_correcta: "D",
    explicacion:
      "150 000 000 = 1,5 × 100 000 000 = 1,5 × 10⁸. Para pasar a notación científica se ubica la coma después de la primera cifra significativa y se cuenta cuántos lugares se desplazó (8 lugares).",
    eje: "numeros_operaciones",
    contenido: "Notación científica",
    capacidad: "aplicacion_procedimientos",
    dificultad: "avanzado",
  },
  {
    codigo: "NUM-08",
    enunciado: "¿Cuál es el valor de √81?",
    opcion_a: "8",
    opcion_b: "9",
    opcion_c: "40,5",
    opcion_d: "6561",
    respuesta_correcta: "B",
    explicacion: "9 × 9 = 81, por lo tanto √81 = 9.",
    eje: "numeros_operaciones",
    contenido: "Potencias y raíces",
    capacidad: "reconocimiento_conceptos",
    dificultad: "inicial",
  },
  {
    codigo: "NUM-09",
    enunciado:
      "En un curso de 30 estudiantes, la razón entre la cantidad de varones y de mujeres es 2:3. ¿Cuántas mujeres hay en el curso?",
    opcion_a: "12",
    opcion_b: "15",
    opcion_c: "18",
    opcion_d: "20",
    respuesta_correcta: "C",
    explicacion:
      "La razón 2:3 indica que el total se reparte en 2+3 = 5 partes iguales. Cada parte vale 30 ÷ 5 = 6 estudiantes. Las mujeres son 3 partes: 3 × 6 = 18.",
    eje: "numeros_operaciones",
    contenido: "Razones y proporciones",
    capacidad: "resolucion_problemas",
    dificultad: "medio",
  },
  {
    codigo: "NUM-10",
    enunciado:
      "Martín quiere estimar rápidamente, sin calculadora, cuánto pagará por 8 artículos que cuestan $1890 cada uno, para saber si le alcanza con $15000. El costo real es 1890 × 8 = $15120. ¿Cuál de las siguientes estrategias de redondeo da la estimación más precisa y la conclusión correcta?",
    opcion_a: "Redondear $1890 a $1900 y multiplicar por 8: aproximadamente $15200, no le alcanza",
    opcion_b: "Redondear $1890 a $2000 y multiplicar por 8: aproximadamente $16000, no le alcanza",
    opcion_c: "Redondear $1890 a $1800 y multiplicar por 8: aproximadamente $14400, le alcanza",
    opcion_d: "Redondear $1890 a $1000 y multiplicar por 8: aproximadamente $8000, le alcanza",
    respuesta_correcta: "A",
    explicacion:
      "El costo real es $15120, que supera los $15000 disponibles. Redondear a la centena más cercana ($1900) da la estimación más cercana al valor real (1900×8=$15200) y lleva a la conclusión correcta: no le alcanza. Las opciones C y D redondean de forma muy imprecisa y llevan a una conclusión errónea.",
    eje: "numeros_operaciones",
    contenido: "Aproximación y estimación",
    capacidad: "argumentacion",
    dificultad: "avanzado",
  },

  // ---------------------------------------------------------------
  // EJE: Álgebra y funciones (10)
  // ---------------------------------------------------------------
  {
    codigo: "ALG-01",
    enunciado:
      "Sofía tiene una edad que es el doble de la edad de su hermano menos 3 años. Si x representa la edad del hermano, ¿cuál expresión algebraica representa la edad de Sofía?",
    opcion_a: "2x − 3",
    opcion_b: "x − 3/2",
    opcion_c: "2(x − 3)",
    opcion_d: "3 − 2x",
    respuesta_correcta: "A",
    explicacion:
      "\"El doble de x\" se escribe 2x, y \"menos 3 años\" indica que a ese doble se le resta 3: 2x − 3.",
    eje: "algebra_funciones",
    contenido: "Lenguaje algebraico",
    capacidad: "comunicacion_matematica",
    dificultad: "inicial",
  },
  {
    codigo: "ALG-02",
    enunciado: "Resolvé la ecuación: 3x + 7 = 2x + 15",
    opcion_a: "x = 8",
    opcion_b: "x = -8",
    opcion_c: "x = 22/5",
    opcion_d: "x = 4",
    respuesta_correcta: "A",
    explicacion:
      "Se agrupan los términos con x de un lado y los números del otro: 3x − 2x = 15 − 7, lo que da x = 8.",
    eje: "algebra_funciones",
    contenido: "Ecuaciones de primer grado",
    capacidad: "aplicacion_procedimientos",
    dificultad: "medio",
  },
  {
    codigo: "ALG-03",
    enunciado:
      "En un cine, dos entradas de adulto y una de niño cuestan $9000; una entrada de adulto y tres de niño cuestan $9500. ¿Cuánto cuesta cada entrada de niño?",
    opcion_a: "$2000",
    opcion_b: "$1500",
    opcion_c: "$3500",
    opcion_d: "$2500",
    respuesta_correcta: "A",
    explicacion:
      "Llamando a al precio de la entrada de adulto y n al de la entrada de niño, el sistema es: 2a + n = 9000 y a + 3n = 9500. De la primera ecuación se despeja n = 9000 − 2a. Sustituyendo en la segunda: a + 3(9000 − 2a) = 9500 → a + 27000 − 6a = 9500 → −5a = −17500 → a = 3500. Luego, n = 9000 − 2×3500 = 2000. Se verifica en ambas ecuaciones: 2×3500 + 2000 = 9000 y 3500 + 3×2000 = 9500. La entrada de niño cuesta $2000.",
    eje: "algebra_funciones",
    contenido: "Sistemas de ecuaciones",
    capacidad: "aplicacion_procedimientos",
    dificultad: "avanzado",
  },
  {
    codigo: "ALG-04",
    enunciado:
      "Un taxi cobra una bajada de bandera de $800 más $250 por cada kilómetro recorrido. Julia dispone de $3000 para el viaje. ¿Cuál inecuación permite calcular la cantidad máxima de kilómetros (k) que puede recorrer?",
    opcion_a: "800 + 250k ≤ 3000",
    opcion_b: "800 + 250k ≥ 3000",
    opcion_c: "250 + 800k ≤ 3000",
    opcion_d: "800k + 250 ≤ 3000",
    respuesta_correcta: "A",
    explicacion:
      "El costo total es la bajada de bandera fija ($800) más $250 por cada kilómetro (250k). Como Julia no puede gastar más de $3000, el costo total debe ser menor o igual a ese valor: 800 + 250k ≤ 3000.",
    eje: "algebra_funciones",
    contenido: "Inecuaciones",
    capacidad: "modelizacion",
    dificultad: "medio",
  },
  {
    codigo: "ALG-05",
    enunciado:
      "Observá la secuencia de números: 4, 9, 14, 19, 24, ... ¿Cuál es el término siguiente y qué regla siguen los números?",
    opcion_a: "29; se suma 5 cada vez",
    opcion_b: "28; se suma 4 cada vez",
    opcion_c: "29; se multiplica por 2 cada vez",
    opcion_d: "30; se suma 6 cada vez",
    respuesta_correcta: "A",
    explicacion:
      "La diferencia entre términos consecutivos es siempre 5 (9−4=5, 14−9=5, 19−14=5, 24−19=5). El siguiente término es 24 + 5 = 29.",
    eje: "algebra_funciones",
    contenido: "Patrones y regularidades",
    capacidad: "interpretacion_informacion",
    dificultad: "inicial",
  },
  {
    codigo: "ALG-06",
    enunciado:
      "La siguiente tabla muestra el costo total y (en pesos) de alquilar bicicletas según la cantidad de horas x: para x=1, y=1200; para x=2, y=1900; para x=3, y=2600. Si el patrón se mantiene, ¿cuál es la función lineal que representa esta situación?",
    opcion_a: "y = 700x + 500",
    opcion_b: "y = 1200x",
    opcion_c: "y = 500x + 700",
    opcion_d: "y = 600x + 600",
    respuesta_correcta: "A",
    explicacion:
      "La pendiente es la variación de y cada vez que x aumenta en 1: (1900−1200)/(2−1) = 700. Usando el punto (1, 1200): 1200 = 700×1 + b, entonces b = 500. La función es y = 700x + 500.",
    eje: "algebra_funciones",
    contenido: "Función lineal y tabla de valores",
    capacidad: "analisis_graficos_tablas",
    dificultad: "medio",
  },
  {
    codigo: "ALG-07",
    enunciado:
      "La función y = -2x + 10 representa el nivel de agua (en cm) de un tanque que se está vaciando, donde x es el tiempo en horas desde que empezó a vaciarse. ¿Qué representan la pendiente y la ordenada al origen en este contexto?",
    opcion_a:
      "La pendiente indica que el tanque se vacía a razón de 2 cm por hora, y la ordenada al origen indica que el tanque tenía 10 cm de agua al empezar",
    opcion_b:
      "La pendiente indica que el tanque tenía 2 cm de agua al empezar, y la ordenada indica que se vacía 10 cm por hora",
    opcion_c:
      "La pendiente indica que el tanque se llena 2 cm por hora, y la ordenada indica que tenía 10 cm al final",
    opcion_d: "La pendiente y la ordenada al origen no tienen relación con la situación",
    respuesta_correcta: "A",
    explicacion:
      "En y = -2x + 10, la pendiente (-2) indica cuánto cambia el nivel de agua por cada hora que pasa: baja 2 cm por hora (el signo negativo indica que decrece). La ordenada al origen (10) es el valor de y cuando x=0, es decir, el nivel inicial de agua.",
    eje: "algebra_funciones",
    contenido: "Pendiente y ordenada al origen",
    capacidad: "interpretacion_informacion",
    dificultad: "avanzado",
  },
  {
    codigo: "ALG-08",
    enunciado: "¿Cuáles son las raíces de la función f(x) = x² − 5x + 6?",
    opcion_a: "x = 2 y x = 3",
    opcion_b: "x = -2 y x = -3",
    opcion_c: "x = 1 y x = 6",
    opcion_d: "x = 6 y x = -1",
    respuesta_correcta: "A",
    explicacion:
      "Factorizando: x² − 5x + 6 = (x−2)(x−3). El producto es cero cuando x=2 o x=3, que son las raíces de la función.",
    eje: "algebra_funciones",
    contenido: "Función cuadrática: raíces",
    capacidad: "aplicacion_procedimientos",
    dificultad: "medio",
  },
  {
    codigo: "ALG-09",
    enunciado:
      "Un jugador patea una pelota y su altura h (en metros) en función del tiempo t (en segundos) se modela con h(t) = -5t² + 20t. ¿En qué instante la pelota alcanza su altura máxima, y cuál es esa altura?",
    opcion_a: "t = 2 s, altura máxima 20 m",
    opcion_b: "t = 4 s, altura máxima 40 m",
    opcion_c: "t = 2 s, altura máxima 40 m",
    opcion_d: "t = 1 s, altura máxima 15 m",
    respuesta_correcta: "A",
    explicacion:
      "El instante de altura máxima corresponde al vértice de la parábola: t = -b/(2a) = -20/(2×(-5)) = 2 segundos. Reemplazando en la función: h(2) = -5×(2²) + 20×2 = -20 + 40 = 20 metros.",
    eje: "algebra_funciones",
    contenido: "Función cuadrática: vértice",
    capacidad: "modelizacion",
    dificultad: "avanzado",
  },
  {
    codigo: "ALG-10",
    enunciado:
      "Una población de bacterias se duplica cada hora. Si al comienzo hay 200 bacterias, ¿cuál función representa la cantidad de bacterias N después de t horas?",
    opcion_a: "N(t) = 200 + 2t",
    opcion_b: "N(t) = 200 · 2^t",
    opcion_c: "N(t) = 2 · 200^t",
    opcion_d: "N(t) = 200t²",
    respuesta_correcta: "B",
    explicacion:
      "Cuando una cantidad se duplica en intervalos iguales de tiempo, el crecimiento es exponencial: se multiplica por 2 elevado a la cantidad de intervalos transcurridos. Por eso N(t) = 200 · 2^t (a diferencia de un crecimiento lineal, que sumaría siempre la misma cantidad).",
    eje: "algebra_funciones",
    contenido: "Función exponencial",
    capacidad: "interpretacion_informacion",
    dificultad: "medio",
  },

  // ---------------------------------------------------------------
  // EJE: Geometría y medida (10)
  // ---------------------------------------------------------------
  {
    codigo: "GEO-01",
    enunciado: "Un ángulo mide 125°. ¿Cómo se clasifica?",
    opcion_a: "Agudo",
    opcion_b: "Recto",
    opcion_c: "Obtuso",
    opcion_d: "Llano",
    respuesta_correcta: "C",
    explicacion:
      "Un ángulo obtuso mide más de 90° y menos de 180°. Como 125° está en ese rango, se clasifica como obtuso.",
    eje: "geometria_medida",
    contenido: "Ángulos",
    capacidad: "reconocimiento_conceptos",
    dificultad: "inicial",
  },
  {
    codigo: "GEO-02",
    enunciado:
      "Un terreno rectangular mide 24 m de largo por 15 m de ancho. Se quiere cercar todo el perímetro con alambre. ¿Cuántos metros de alambre se necesitan?",
    opcion_a: "39 m",
    opcion_b: "78 m",
    opcion_c: "360 m",
    opcion_d: "180 m",
    respuesta_correcta: "B",
    explicacion:
      "El perímetro de un rectángulo es 2 × (largo + ancho) = 2 × (24 + 15) = 2 × 39 = 78 metros. (360 m² sería el área, no el perímetro).",
    eje: "geometria_medida",
    contenido: "Perímetro de figuras planas",
    capacidad: "aplicacion_procedimientos",
    dificultad: "medio",
  },
  {
    codigo: "GEO-03",
    enunciado:
      "Una escalera de 5 m de largo se apoya contra una pared. Si la base de la escalera está a 3 m de la pared, ¿a qué altura de la pared llega la parte superior de la escalera?",
    opcion_a: "2 m",
    opcion_b: "4 m",
    opcion_c: "8 m",
    opcion_d: "5,8 m",
    respuesta_correcta: "B",
    explicacion:
      "La escalera, la pared y el suelo forman un triángulo rectángulo, donde la escalera es la hipotenusa. Por el teorema de Pitágoras: 5² = 3² + h², entonces h² = 25 − 9 = 16, y h = 4 metros.",
    eje: "geometria_medida",
    contenido: "Teorema de Pitágoras",
    capacidad: "resolucion_problemas",
    dificultad: "avanzado",
  },
  {
    codigo: "GEO-04",
    enunciado:
      "Desde un punto en el suelo, a 20 m de la base de un edificio, el ángulo de elevación hasta la parte superior del edificio es de 40°. ¿Cuál expresión permite calcular la altura h del edificio?",
    opcion_a: "h = 20 · tan(40°)",
    opcion_b: "h = 20 / tan(40°)",
    opcion_c: "h = 20 · sen(40°)",
    opcion_d: "h = 20 · cos(40°)",
    respuesta_correcta: "A",
    explicacion:
      "En el triángulo rectángulo formado, el lado opuesto al ángulo de 40° es la altura h, y el lado adyacente es la distancia de 20 m. La tangente relaciona cateto opuesto sobre cateto adyacente: tan(40°) = h/20, por lo tanto h = 20 · tan(40°).",
    eje: "geometria_medida",
    contenido: "Razones trigonométricas",
    capacidad: "aplicacion_procedimientos",
    dificultad: "avanzado",
  },
  {
    codigo: "GEO-05",
    enunciado:
      "Un tanque de agua tiene forma de prisma rectangular (ortoedro) de 2 m de largo, 1,5 m de ancho y 1,2 m de altura. ¿Cuál es su volumen?",
    opcion_a: "3,6 m³",
    opcion_b: "4,7 m³",
    opcion_c: "2,7 m³",
    opcion_d: "9 m³",
    respuesta_correcta: "A",
    explicacion:
      "El volumen de un prisma rectangular se calcula multiplicando largo × ancho × altura: 2 × 1,5 × 1,2 = 3,6 m³.",
    eje: "geometria_medida",
    contenido: "Volumen",
    capacidad: "aplicacion_procedimientos",
    dificultad: "medio",
  },
  {
    codigo: "GEO-06",
    enunciado: "Un envase contiene 2,5 litros de aceite. ¿Cuántos mililitros contiene?",
    opcion_a: "25 ml",
    opcion_b: "250 ml",
    opcion_c: "2500 ml",
    opcion_d: "25000 ml",
    respuesta_correcta: "C",
    explicacion: "1 litro equivale a 1000 ml, entonces 2,5 litros = 2,5 × 1000 = 2500 ml.",
    eje: "geometria_medida",
    contenido: "Unidades de medida y conversión",
    capacidad: "aplicacion_procedimientos",
    dificultad: "inicial",
  },
  {
    codigo: "GEO-07",
    enunciado:
      "En un plano dibujado a escala 1:200, la distancia entre dos paredes de un aula es de 4 cm. ¿Cuál es la distancia real entre esas paredes?",
    opcion_a: "4 m",
    opcion_b: "8 m",
    opcion_c: "800 m",
    opcion_d: "0,08 m",
    respuesta_correcta: "B",
    explicacion:
      "La escala 1:200 significa que cada centímetro del plano representa 200 cm en la realidad. La distancia real es 4 cm × 200 = 800 cm, que equivale a 8 metros.",
    eje: "geometria_medida",
    contenido: "Escalas",
    capacidad: "interpretacion_informacion",
    dificultad: "medio",
  },
  {
    codigo: "GEO-08",
    enunciado:
      "Un poste de 3 m de altura proyecta una sombra de 2 m. En el mismo momento, un árbol cercano proyecta una sombra de 7 m. Usando semejanza de triángulos, ¿cuál es la altura aproximada del árbol?",
    opcion_a: "4,7 m",
    opcion_b: "10,5 m",
    opcion_c: "5,25 m",
    opcion_d: "14 m",
    respuesta_correcta: "B",
    explicacion:
      "Como el sol forma los mismos ángulos sobre ambos objetos en el mismo momento, los triángulos poste-sombra y árbol-sombra son semejantes, por lo que sus lados son proporcionales: 3/2 = h/7. Despejando: h = (3 × 7) / 2 = 10,5 m.",
    eje: "geometria_medida",
    contenido: "Semejanza de figuras",
    capacidad: "resolucion_problemas",
    dificultad: "avanzado",
  },
  {
    codigo: "GEO-09",
    enunciado:
      "En el plano de una vivienda dibujado a escala 1:100, la cocina tiene forma rectangular y mide 3 cm por 2,5 cm. ¿Cuál es el área real de la cocina?",
    opcion_a: "7,5 m²",
    opcion_b: "75 m²",
    opcion_c: "0,75 m²",
    opcion_d: "750 m²",
    respuesta_correcta: "A",
    explicacion:
      "Con escala 1:100, cada medida del plano se multiplica por 100 para obtener la medida real: 3 cm → 300 cm = 3 m, y 2,5 cm → 250 cm = 2,5 m. El área real es 3 m × 2,5 m = 7,5 m².",
    eje: "geometria_medida",
    contenido: "Interpretación de planos",
    capacidad: "analisis_graficos_tablas",
    dificultad: "medio",
  },
  {
    codigo: "GEO-10",
    enunciado: "¿Cuál de las siguientes propiedades es verdadera para todo paralelogramo?",
    opcion_a: "Sus cuatro ángulos son rectos",
    opcion_b: "Sus diagonales son siempre iguales",
    opcion_c: "Sus lados opuestos son paralelos e iguales",
    opcion_d: "Todos sus lados tienen la misma medida",
    respuesta_correcta: "C",
    explicacion:
      "Por definición, un paralelogramo es un cuadrilátero cuyos lados opuestos son paralelos entre sí y tienen igual longitud. Las propiedades de ángulos rectos, diagonales iguales o los cuatro lados iguales solo se cumplen en casos particulares (rectángulo, cuadrado), no en todo paralelogramo.",
    eje: "geometria_medida",
    contenido: "Figuras planas: cuadriláteros",
    capacidad: "reconocimiento_conceptos",
    dificultad: "inicial",
  },

  // ---------------------------------------------------------------
  // EJE: Estadística y probabilidad (10)
  // ---------------------------------------------------------------
  {
    codigo: "EST-01",
    enunciado:
      "Se preguntó a 25 estudiantes cuál es su materia favorita. Los resultados fueron: Matemática: 8, Lengua: 5, Educación Física: 7, Biología: 5. ¿Cuál es la frecuencia relativa de estudiantes que eligieron Educación Física?",
    opcion_a: "7%",
    opcion_b: "28%",
    opcion_c: "7/25",
    opcion_d: "B y C son correctas",
    respuesta_correcta: "D",
    explicacion:
      "La frecuencia relativa es el cociente entre la frecuencia absoluta y el total: 7/25 = 0,28, que expresado como porcentaje es 28%. Por lo tanto, tanto B (28%) como C (7/25) representan correctamente esa frecuencia relativa.",
    eje: "estadistica_probabilidad",
    contenido: "Frecuencia absoluta y relativa",
    capacidad: "analisis_graficos_tablas",
    dificultad: "inicial",
  },
  {
    codigo: "EST-02",
    enunciado:
      "Las notas de Tomás en cinco evaluaciones de Matemática fueron: 7, 8, 6, 9 y 5. ¿Cuál es su nota promedio (media)?",
    opcion_a: "6",
    opcion_b: "7",
    opcion_c: "8",
    opcion_d: "35",
    respuesta_correcta: "B",
    explicacion:
      "La media se calcula sumando todos los valores y dividiendo por la cantidad de datos: (7+8+6+9+5)/5 = 35/5 = 7.",
    eje: "estadistica_probabilidad",
    contenido: "Media aritmética",
    capacidad: "aplicacion_procedimientos",
    dificultad: "medio",
  },
  {
    codigo: "EST-03",
    enunciado:
      "Los tiempos (en minutos) que tardaron 7 estudiantes en resolver un problema fueron: 12, 15, 12, 18, 20, 12, 16. ¿Cuáles son la moda y la mediana de este conjunto de datos?",
    opcion_a: "Moda = 12, Mediana = 15",
    opcion_b: "Moda = 15, Mediana = 12",
    opcion_c: "Moda = 12, Mediana = 16",
    opcion_d: "Moda = 16, Mediana = 15",
    respuesta_correcta: "A",
    explicacion:
      "Ordenando los datos: 12, 12, 12, 15, 16, 18, 20. La moda es el valor que más se repite: 12 (aparece 3 veces). La mediana es el valor central de los 7 datos ordenados, es decir, el cuarto valor: 15.",
    eje: "estadistica_probabilidad",
    contenido: "Mediana y moda",
    capacidad: "aplicacion_procedimientos",
    dificultad: "medio",
  },
  {
    codigo: "EST-04",
    enunciado:
      "Dos equipos de vóley registraron las alturas de sus jugadores. El equipo A tiene un rango de 15 cm entre la altura mayor y la menor. El equipo B tiene un rango de 32 cm. ¿Qué se puede afirmar sobre la dispersión de alturas en ambos equipos?",
    opcion_a:
      "El equipo A tiene alturas más homogéneas (menos dispersas) que el equipo B",
    opcion_b: "El equipo B tiene alturas más homogéneas que el equipo A",
    opcion_c: "Ambos equipos tienen la misma dispersión de alturas",
    opcion_d: "No se puede determinar la dispersión de los datos con el rango",
    respuesta_correcta: "A",
    explicacion:
      "El rango mide la diferencia entre el valor máximo y el mínimo de un conjunto de datos. Un rango menor (como el del equipo A, 15 cm) indica que los datos están más agrupados entre sí, es decir, hay menor dispersión que en el equipo B, cuyo rango es mayor (32 cm).",
    eje: "estadistica_probabilidad",
    contenido: "Comparación de conjuntos de datos",
    capacidad: "argumentacion",
    dificultad: "avanzado",
  },
  {
    codigo: "EST-05",
    enunciado:
      "Un gráfico de barras muestra la cantidad de libros leídos por mes en una biblioteca escolar: Marzo: 40, Abril: 55, Mayo: 30, Junio: 65. ¿En qué mes se registró la mayor cantidad de libros leídos?",
    opcion_a: "Marzo",
    opcion_b: "Abril",
    opcion_c: "Mayo",
    opcion_d: "Junio",
    respuesta_correcta: "D",
    explicacion: "De los valores dados (40, 55, 30 y 65), el mayor corresponde a Junio, con 65 libros leídos.",
    eje: "estadistica_probabilidad",
    contenido: "Gráfico de barras",
    capacidad: "analisis_graficos_tablas",
    dificultad: "inicial",
  },
  {
    codigo: "EST-06",
    enunciado:
      "En un gráfico circular que representa cómo se distribuyen los 360° del gasto mensual de una familia, el sector \"Alimentación\" ocupa 90°. ¿Qué porcentaje del gasto total representa la Alimentación?",
    opcion_a: "90%",
    opcion_b: "45%",
    opcion_c: "25%",
    opcion_d: "9%",
    respuesta_correcta: "C",
    explicacion:
      "En un gráfico circular, los 360° representan el 100% del total. El porcentaje de un sector se calcula como (ángulo del sector / 360°) × 100: (90/360) × 100 = 25%.",
    eje: "estadistica_probabilidad",
    contenido: "Gráfico circular",
    capacidad: "analisis_graficos_tablas",
    dificultad: "medio",
  },
  {
    codigo: "EST-07",
    enunciado:
      "En una bolsa hay 4 bolitas rojas, 3 azules y 3 verdes. Si se saca una bolita al azar, ¿cuál es la probabilidad de que sea azul?",
    opcion_a: "3/10",
    opcion_b: "1/3",
    opcion_c: "3/7",
    opcion_d: "4/10",
    respuesta_correcta: "A",
    explicacion:
      "La probabilidad de un suceso es (casos favorables)/(casos posibles). Hay 3 bolitas azules de un total de 4+3+3 = 10 bolitas, por lo tanto la probabilidad es 3/10.",
    eje: "estadistica_probabilidad",
    contenido: "Probabilidad simple",
    capacidad: "aplicacion_procedimientos",
    dificultad: "medio",
  },
  {
    codigo: "EST-08",
    enunciado:
      "Se lanza un dado común de 6 caras. ¿Cuál de los siguientes sucesos es imposible?",
    opcion_a: "Obtener un número par",
    opcion_b: "Obtener un número mayor que 6",
    opcion_c: "Obtener un número menor que 6",
    opcion_d: "Obtener el número 1",
    respuesta_correcta: "B",
    explicacion:
      "Un dado común tiene las caras numeradas del 1 al 6. Como no existe ninguna cara con un número mayor que 6, ese suceso es imposible (probabilidad 0).",
    eje: "estadistica_probabilidad",
    contenido: "Espacio muestral y sucesos",
    capacidad: "reconocimiento_conceptos",
    dificultad: "inicial",
  },
  {
    codigo: "EST-09",
    enunciado:
      "Se lanzan dos monedas al mismo tiempo. ¿Cuál es la probabilidad de obtener exactamente una cara y una ceca (en cualquier orden)?",
    opcion_a: "1/4",
    opcion_b: "1/2",
    opcion_c: "3/4",
    opcion_d: "1/3",
    respuesta_correcta: "B",
    explicacion:
      "El espacio muestral al lanzar dos monedas tiene 4 resultados igualmente posibles: (cara,cara), (cara,ceca), (ceca,cara), (ceca,ceca). Los casos favorables a \"una cara y una ceca\" son 2: (cara,ceca) y (ceca,cara). La probabilidad es 2/4 = 1/2.",
    eje: "estadistica_probabilidad",
    contenido: "Probabilidad de sucesos compuestos",
    capacidad: "resolucion_problemas",
    dificultad: "avanzado",
  },
  {
    codigo: "EST-10",
    enunciado:
      "Una encuesta a 40 estudiantes de 6° año sobre su medio de transporte para ir a la escuela dio estos resultados: colectivo 18, a pie 10, bicicleta 8, auto 4. Un estudiante afirma: \"La mayoría de mis compañeros va a la escuela en colectivo\". Según los datos, ¿es correcta esta afirmación?",
    opcion_a:
      "Sí, porque colectivo es el medio más elegido y representa más del 50% del total",
    opcion_b:
      "No es del todo precisa: colectivo es el medio más elegido, pero no representa más del 50% del total",
    opcion_c: "No, porque \"a pie\" tiene más estudiantes que colectivo",
    opcion_d: "No, porque los datos no permiten determinar cuál es el medio más elegido",
    respuesta_correcta: "B",
    explicacion:
      "Colectivo es el medio de transporte más elegido (18 de 40 estudiantes), pero 18/40 = 45%, que es menos de la mitad. Decir \"la mayoría\" implica más del 50%, por lo que la afirmación no es del todo precisa: colectivo es el más popular, pero no una mayoría estricta.",
    eje: "estadistica_probabilidad",
    contenido: "Interpretación de encuestas",
    capacidad: "argumentacion",
    dificultad: "avanzado",
  },
];
