import request from "supertest";
import app from "../server";

// Estas pruebas solo cubren comportamiento que no depende de una base de
// datos real (el middleware isAuth corta antes de tocar la BD, y swagger es
// estático). La lógica de negocio con BD se prueba con mocks en
// usuario.usecases.test.ts / ia.usecases.test.ts.
describe("Rutas protegidas - sin token de autenticación", () => {
  it("GET /api/usuarios/getChats sin token debe devolver 401", async () => {
    const res = await request(app).get("/api/usuarios/getChats");
    expect(res.status).toBe(401);
  });

  it("GET /api/usuarios/me sin token debe devolver 401", async () => {
    const res = await request(app).get("/api/usuarios/me");
    expect(res.status).toBe(401);
  });

  it("POST /api/ia/nuevo sin token debe devolver 401", async () => {
    const res = await request(app).post("/api/ia/nuevo").send({});
    expect(res.status).toBe(401);
  });

  it("POST /api/ia/generate sin token debe devolver 401", async () => {
    const res = await request(app)
      .post("/api/ia/generate")
      .send({ prompt: "Hola", tipo: "free", idChat: 1 });
    expect(res.status).toBe(401);
  });

  it("GET /api/ia/mensajes/1 sin token debe devolver 401", async () => {
    const res = await request(app).get("/api/ia/mensajes/1");
    expect(res.status).toBe(401);
  });

  it("DELETE /api/ia/chat/1 sin token debe devolver 401", async () => {
    const res = await request(app).delete("/api/ia/chat/1");
    expect(res.status).toBe(401);
  });

  it("PATCH /api/usuarios/me sin token debe devolver 401", async () => {
    const res = await request(app).patch("/api/usuarios/me").send({ nombre: "Test" });
    expect(res.status).toBe(401);
  });

  it("PATCH /api/usuarios/subscripcion sin token debe devolver 401", async () => {
    const res = await request(app).patch("/api/usuarios/subscripcion").send({ plan: "pro" });
    expect(res.status).toBe(401);
  });

  it("POST /api/usuarios/cambiarPassword sin token debe devolver 401", async () => {
    const res = await request(app)
      .post("/api/usuarios/cambiarPassword")
      .send({ passwordActual: "old", passwordNueva: "new" });
    expect(res.status).toBe(401);
  });
});

describe("Rutas protegidas - con token inválido", () => {
  const fakeToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTk5OX0.invalid_signature";

  it("GET /api/usuarios/me con token inválido debe devolver 401", async () => {
    const res = await request(app).get("/api/usuarios/me").set("Authorization", fakeToken);
    expect(res.status).toBe(401);
  });

  it("GET /api/usuarios/getChats con token inválido debe devolver 401", async () => {
    const res = await request(app).get("/api/usuarios/getChats").set("Authorization", fakeToken);
    expect(res.status).toBe(401);
  });
});

describe("Validación de campos obligatorios (no llega a tocar la BD)", () => {
  it("POST /api/usuarios/login sin contraseña no devuelve 200", async () => {
    const res = await request(app).post("/api/usuarios/login").send({ email: "test@test.com" });
    expect(res.status).not.toBe(200);
  });
});

describe("Swagger UI", () => {
  it("GET /api/docs debe responder con HTML de Swagger UI", async () => {
    const res = await request(app).get("/api/docs/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });
});
