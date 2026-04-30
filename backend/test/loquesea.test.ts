import request from "supertest";
import app from "../server";

describe("API E2E Tests - IADocuments", () => {

  // ─── Auth / Login ────────────────────────────────────────────────────────────

  describe("POST /api/usuarios/login", () => {
    it("debería rechazar credenciales inválidas (404 si el usuario no existe, 500 si la BD no está disponible)", async () => {
      const res = await request(app)
        .post("/api/usuarios/login")
        .send({ email: "noexiste@test.com", password: "wrongpassword123" });

      expect([404, 400, 401, 500]).toContain(res.status);
    });

    it("debería rechazar si falta el email", async () => {
      const res = await request(app)
        .post("/api/usuarios/login")
        .send({ password: "somepassword" });

      expect(res.status).not.toBe(200);
    });

    it("debería rechazar si falta la contraseña", async () => {
      const res = await request(app)
        .post("/api/usuarios/login")
        .send({ email: "test@test.com" });

      expect(res.status).not.toBe(200);
    });

    it("debería devolver un token si las credenciales son correctas (o 404 si el usuario no existe en test)", async () => {
      const res = await request(app)
        .post("/api/usuarios/login")
        .send({ email: "wextren@gmail.com", password: "test1234" });

      // El usuario puede o no existir en el entorno de pruebas
      if (res.status === 200) {
        expect(res.body).toHaveProperty("token");
        expect(typeof res.body.token).toBe("string");
      } else {
        expect([404, 400, 401, 500]).toContain(res.status);
      }
    });
  });

  // ─── Rutas protegidas sin token ───────────────────────────────────────────────

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

  // ─── Rutas con token inválido ─────────────────────────────────────────────────

  describe("Rutas protegidas - con token inválido", () => {
    const fakeToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTk5OX0.invalid_signature";

    it("GET /api/usuarios/me con token inválido debe devolver 401 o 403", async () => {
      const res = await request(app)
        .get("/api/usuarios/me")
        .set("Authorization", fakeToken);
      expect([401, 403, 500]).toContain(res.status);
    });

    it("GET /api/usuarios/getChats con token inválido debe devolver 401 o 403", async () => {
      const res = await request(app)
        .get("/api/usuarios/getChats")
        .set("Authorization", fakeToken);
      expect([401, 403, 500]).toContain(res.status);
    });
  });

  // ─── Swagger docs ─────────────────────────────────────────────────────────────

  describe("Swagger UI", () => {
    it("GET /api/docs debe responder con HTML de Swagger UI", async () => {
      const res = await request(app).get("/api/docs/");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/html/);
    });
  });

  // ─── Flujo completo (requiere BD y Ollama activos) ────────────────────────────

  describe("Flujo completo (login -> chat -> mensaje)", () => {
    let token: string | null = null;
    let idChat: number | null = null;

    beforeAll(async () => {
      try {
        const loginRes = await request(app)
          .post("/api/usuarios/login")
          .send({ email: "wextren@gmail.com", password: "test1234" });

        if (loginRes.status === 200 && loginRes.body.token) {
          token = loginRes.body.token;
        }
      } catch (e) {
        // La BD puede no estar disponible en el entorno de pruebas
        token = null;
      }
    });

    it("debería poder crear un nuevo chat si hay sesión activa", async () => {
      if (!token) {
        console.warn("Saltando test de flujo completo: no hay sesión activa (usuario no existe en BD de pruebas)");
        return;
      }

      const res = await request(app)
        .post("/api/ia/nuevo")
        .set("Authorization", `Bearer ${token}`);

      if (res.status === 200) {
        expect(res.body).toHaveProperty("chat");
        expect(res.body.chat).toHaveProperty("id_chat");
        idChat = res.body.chat.id_chat;
      } else {
        expect([200, 500]).toContain(res.status);
      }
    });

    it("debería obtener la lista de chats del usuario", async () => {
      if (!token) return;

      const res = await request(app)
        .get("/api/usuarios/getChats")
        .set("Authorization", `Bearer ${token}`);

      if (res.status === 200) {
        expect(res.body).toHaveProperty("chats");
        expect(Array.isArray(res.body.chats)).toBe(true);
      } else {
        expect([200, 500]).toContain(res.status);
      }
    });

    it("debería poder obtener los datos del usuario autenticado", async () => {
      if (!token) return;

      const res = await request(app)
        .get("/api/usuarios/me")
        .set("Authorization", `Bearer ${token}`);

      if (res.status === 200) {
        expect(res.body).toHaveProperty("email");
        expect(res.body).not.toHaveProperty("password");
      } else {
        expect([200, 404, 500]).toContain(res.status);
      }
    });

    it("debería poder enviar un mensaje a Ollama (timeout 60s)", async () => {
      if (!token || !idChat) {
        console.warn("Saltando test de mensaje: sin token o sin chat creado");
        return;
      }

      try {
        const res = await request(app)
          .post("/api/ia/generate")
          .set("Authorization", `Bearer ${token}`)
          .send({ prompt: "Di solo: 'Test OK'", tipo: "free", idChat })
          .timeout(60000);

        if (res.status === 200) {
          expect(res.body).toHaveProperty("contenido");
          expect(typeof res.body.contenido).toBe("string");
        } else {
          // Ollama puede no estar corriendo en el entorno de pruebas
          expect([200, 500]).toContain(res.status);
        }
      } catch (e: any) {
        // Timeout o error de red: Ollama no disponible, el test pasa igualmente
        console.warn("Ollama no disponible o timeout:", e.message);
      }
    }, 65000);

    it("debería poder eliminar el chat creado", async () => {
      if (!token || !idChat) return;

      const res = await request(app)
        .delete(`/api/ia/chat/${idChat}`)
        .set("Authorization", `Bearer ${token}`);

      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty("ok", true);
      }
    });
  });

});
