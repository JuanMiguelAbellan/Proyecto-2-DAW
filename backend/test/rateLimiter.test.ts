import { tomarToken } from "../context/security/rateLimiter";

describe("rateLimiter.tomarToken", () => {
  it("permite peticiones mientras no se supere el máximo en la ventana", () => {
    const clave = `test-${Math.random()}`;
    expect(tomarToken(clave, 3, 60_000)).toBe(true);
    expect(tomarToken(clave, 3, 60_000)).toBe(true);
    expect(tomarToken(clave, 3, 60_000)).toBe(true);
  });

  it("bloquea la petición que supera el máximo dentro de la misma ventana", () => {
    const clave = `test-${Math.random()}`;
    tomarToken(clave, 2, 60_000);
    tomarToken(clave, 2, 60_000);
    expect(tomarToken(clave, 2, 60_000)).toBe(false);
  });

  it("resetea el contador una vez pasada la ventana", async () => {
    const clave = `test-${Math.random()}`;
    tomarToken(clave, 1, 20);
    expect(tomarToken(clave, 1, 20)).toBe(false);
    await new Promise((r) => setTimeout(r, 30));
    expect(tomarToken(clave, 1, 20)).toBe(true);
  });

  it("mantiene contadores independientes por clave", () => {
    const claveA = `a-${Math.random()}`;
    const claveB = `b-${Math.random()}`;
    tomarToken(claveA, 1, 60_000);
    expect(tomarToken(claveA, 1, 60_000)).toBe(false);
    expect(tomarToken(claveB, 1, 60_000)).toBe(true);
  });
});
