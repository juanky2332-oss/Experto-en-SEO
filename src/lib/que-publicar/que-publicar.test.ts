// Pruebas de «Qué publicar»: npm test (node --test con type-stripping).
import { test } from "node:test";
import assert from "node:assert/strict";
import { motivoDescarte, pareceNombrePersona, puntuar, encaje, mismoTema, PESOS_VACIOS, type Candidato, type Contexto } from "./prioridad.ts";
import { calcularPesos, proponerExclusiones, type Feedback } from "./aprender.ts";

const base: Candidato = {
  titulo: "Control de calidad con visión artificial en una pyme de fabricación", keyword: "control de calidad con visión artificial",
  secundarias: ["visión artificial fabricación"], intencion: "informacional", publico: "jefe de producción", pilar: "Calidad", tipo: "empresa",
  destino: "articulo", destino_ref: "/ia-fabricacion-industrial/", enlaces: [], cta: "Pide tu diagnóstico gratis", por_que: [{ senal: "hueco_pilar", detalle: "pilar sin artículos" }],
  esfuerzo: "medio", radar_id: null,
};
const ctx: Contexto = {
  categoriaPilar: { Calidad: "ia-en-la-industria", "Actualidad IA": "actualidad-ia", "Murcia y Región de Murcia": "ia-en-la-industria" },
  programados: [{ titulo: "ERP para un taller pequeño: qué necesita de verdad y cuánto cuesta", keyword: "ERP para talleres,ERP taller pequeño,programa de gestión para taller" }],
  publicados: [{ titulo: "Cómo calcular el coste hora-máquina y presupuestar con margen en un taller", keyword: "coste hora máquina" }],
  conversiones: {}, pesos: PESOS_VACIOS,
};

test("filtro: descarta marcas internas", () => {
  assert.match(motivoDescarte({ ...base, titulo: "Automatiza facturas con n8n en tu taller" }) ?? "", /marca/);
  assert.match(motivoDescarte({ ...base, keyword: "chatgpt para talleres" }) ?? "", /marca/);
  assert.match(motivoDescarte({ ...base, secundarias: ["claude para empresas"] }) ?? "", /marca/);
  assert.match(motivoDescarte({ ...base, titulo: "Qué cambia con GPT-6 en la fábrica" }) ?? "", /marca/);
  assert.equal(motivoDescarte(base), null);
});

test("filtro: descarta nombres de persona y cifras de volumen", () => {
  assert.equal(pareceNombrePersona("Entrevista a Juan Carlos sobre el taller"), true);
  assert.equal(pareceNombrePersona("Cómo trabaja Pedro Martínez en su taller"), true);
  assert.equal(pareceNombrePersona("Ayudas para pymes industriales de la Región de Murcia"), false);
  assert.equal(pareceNombrePersona("Automatización e IA para la industria en Molina de Segura"), false);
  assert.match(motivoDescarte({ ...base, por_que: [{ senal: "hueco_pilar", detalle: "1.200 búsquedas al mes" }] }) ?? "", /volumen/);
});

test("prioridad: industria > Murcia > IA general", () => {
  assert.equal(encaje(base, ctx.categoriaPilar), 40);
  assert.equal(encaje({ ...base, titulo: "Novedades de la IA para empresas", keyword: "novedades ia empresas", pilar: "Actualidad IA" }, ctx.categoriaPilar), 10);
  assert.equal(encaje({ ...base, titulo: "Consultoría de IA en Murcia: cómo elegir", keyword: "consultoría ia murcia", pilar: "Actualidad IA" }, ctx.categoriaPilar), 25);
  const ind = puntuar(base, ctx).prioridad;
  const gen = puntuar({ ...base, titulo: "Novedades de la IA para empresas", keyword: "novedades ia empresas", pilar: "Actualidad IA" }, ctx).prioridad;
  assert.ok(ind > gen);
});

test("prioridad: lo programado se descarta y lo publicado se penaliza", () => {
  const prog = puntuar({ ...base, titulo: "Qué ERP necesita un taller pequeño", keyword: "erp para talleres" }, ctx);
  assert.ok(prog.descartar);
  const pub = puntuar({ ...base, titulo: "Coste hora máquina en un taller", keyword: "coste hora máquina" }, ctx);
  assert.equal(pub.penalizacion, 25);
  assert.equal(pub.descartar, null);
  assert.ok(mismoTema("control de stock de repuestos", "control stock repuestos"));
  assert.ok(!mismoTema("control de calidad", "control de stock"));
  // palabras genéricas («pyme», «industrial», «cambia») no bastan para darlo por programado
  assert.ok(!mismoTema("Actualidad IA: qué cambia de verdad para una pyme industrial", "Verifactu en una pyme industrial: qué cambia en tu facturación y qué revisar"));
});

test("prioridad: conversiones de la página destino suman como mucho 5", () => {
  const sin = puntuar(base, ctx).prioridad;
  const con = puntuar(base, { ...ctx, conversiones: { "/ia-fabricacion-industrial/": 300 } }).prioridad;
  assert.equal(con - sin, 5);
});

test("aprender: tres «no interesa» en un pilar lo bajan y la palabra se propone para excluir", () => {
  const ahora = Date.now();
  const fb: Feedback[] = [1, 2, 3].map(() => ({ created_at: new Date(ahora), voto: "no_interesa", pilar: "Calidad", destino: "articulo", tipo: "empresa", fuente: "hueco_pilar", tokens: ["calidad", "vision"] }));
  const pesos = calcularPesos(fb, ahora);
  assert.equal(pesos.pilar["Calidad"], -6);
  const antes = puntuar(base, ctx).prioridad;
  const despues = puntuar(base, { ...ctx, pesos }).prioridad;
  assert.equal(antes - despues, 15); // tope ±15
  assert.deepEqual(proponerExclusiones(fb).sort(), ["calidad", "vision"]);
  assert.deepEqual(proponerExclusiones(fb, ["visión artificial"]), ["calidad"]);
});

test("aprender: vida media de 60 días y tope ±15", () => {
  const ahora = Date.now();
  const viejo = calcularPesos([{ created_at: new Date(ahora - 60 * 864e5), voto: "mas_como_esto", pilar: "Calidad", destino: null, tipo: null, fuente: null, tokens: [] }], ahora);
  assert.equal(viejo.pilar["Calidad"], 1);
  const muchos = calcularPesos(Array.from({ length: 20 }, () => ({ created_at: new Date(ahora), voto: "mas_como_esto" as const, pilar: "Calidad", destino: null, tipo: null, fuente: null, tokens: [] })), ahora);
  assert.equal(muchos.pilar["Calidad"], 15);
});
