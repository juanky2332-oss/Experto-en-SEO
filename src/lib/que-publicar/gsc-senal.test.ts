// Pruebas de las señales de Search Console: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { agruparConsultas, casiPagina1, sinPaginaDedicada, chipGsc, mismaConsulta, type FilaConsulta } from "./gsc-senal.ts";
import { motivoDescarte, puntosSenal, type Candidato } from "./prioridad.ts";

const f = (consulta: string, pagina: string, impresiones: number, posicion: number, clics = 0): FilaConsulta => ({ consulta, pagina, impresiones, posicion, clics });

test("gsc: casi en página 1 = posición 8-30 con impresiones suficientes, sin marca propia", () => {
  const r = casiPagina1([
    f("erp para taller mecánico", "/erp-industria/", 40, 12.4),
    f("erp para taller mecánico", "/erp-industria/", 10, 14), // misma consulta: se agrupa
    f("albarán digital", "/blog/", 30, 3), // ya está arriba
    f("verifactu taller", "/x/", 100, 45), // demasiado lejos
    f("partes de trabajo", "/y/", 2, 15), // pocas impresiones
    f("transforma con ia", "/", 200, 9), // marca propia
  ]);
  assert.deepEqual(r.map((x) => x.consulta), ["erp para taller mecánico"]);
  assert.equal(r[0].impresiones, 50);
  assert.ok(r[0].posicion > 12.4 && r[0].posicion < 14); // ponderada por impresiones
});

test("gsc: consulta sin página dedicada = la página no cubre las palabras de la consulta", () => {
  const texto = (r: string) => ({ "/erp-industria/": "ERP para la industria erp industria", "/contacto/": "Contacto" })[r];
  const r = sinPaginaDedicada([
    f("erp taller mecánico precio", "/erp-industria/", 30, 6), // "precio" y "mecanico" no están en la página
    f("erp industria", "/erp-industria/", 90, 5), // centrada
    f("presupuesto taller", "/desconocida/", 50, 5), // página desconocida: no se afirma nada
    f("software taller barato", "/erp-industria/", 3, 5), // pocas impresiones
  ], texto);
  assert.deepEqual(r.map((x) => x.consulta), ["erp taller mecánico precio"]);
});

test("gsc: el chip usa solo datos reales y no activa el filtro de volumen inventado", () => {
  const chip = chipGsc({ impresiones: 50, posicion: 12.44 });
  assert.equal(chip, "GSC: 50 impresiones · posición 12,4");
  const c: Candidato = {
    titulo: "Cómo ampliar tu ERP para un taller mecánico", keyword: "erp taller mecánico", secundarias: [], intencion: "comercial", publico: "taller",
    pilar: "ERP", tipo: "guia", destino: "ampliar_pagina", destino_ref: "/erp-industria/", enlaces: [], cta: "Diagnóstico gratis", esfuerzo: "bajo", radar_id: null,
    por_que: [{ senal: "gsc_cerca", detalle: "«erp taller» sale en la posición 12,4 con 50 impresiones en 28 días (página /erp-industria/): ampliarla puede llevarla a la primera página.", gsc: { impresiones: 50, posicion: 12.4 } }],
  };
  assert.equal(motivoDescarte(c), null);
});

test("gsc: mismaConsulta compara palabras significativas y la señal pesa de forma acotada", () => {
  assert.equal(mismaConsulta("erp taller mecánico", "erp para taller"), true);
  assert.equal(mismaConsulta("albarán digital", "erp para taller"), false);
  const base = { destino_ref: "" };
  const gsc = puntosSenal({ ...base, por_que: [{ senal: "gsc_cerca", detalle: "x" }] }, {});
  const todas = puntosSenal({ ...base, por_que: [{ senal: "gsc_cerca", detalle: "x" }, { senal: "gsc_sin_pagina", detalle: "x" }, { senal: "plazo", detalle: "x" }, { senal: "radar", detalle: "x" }, { senal: "hueco_pilar", detalle: "x" }] }, {}, 100);
  assert.equal(gsc, 10);
  assert.equal(todas, 35); // tope de las señales
  assert.equal(agruparConsultas([f("", "/a/", 5, 9)]).length, 0);
});
