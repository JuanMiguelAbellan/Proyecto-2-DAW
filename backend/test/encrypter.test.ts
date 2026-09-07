import { hash, compare } from "../context/security/encrypter";

describe("encrypter", () => {
  it("hashea una contraseña y permite verificarla con compare", () => {
    const plano = "MiPassword123";
    const hasheada = hash(plano);

    expect(hasheada).not.toBe(plano);
    expect(compare(plano, hasheada)).toBe(true);
  });

  it("rechaza una contraseña incorrecta", () => {
    const hasheada = hash("MiPassword123");
    expect(compare("OtraCosa", hasheada)).toBe(false);
  });

  it("genera un hash distinto cada vez (salt aleatorio)", () => {
    const a = hash("MiPassword123");
    const b = hash("MiPassword123");
    expect(a).not.toBe(b);
  });
});
