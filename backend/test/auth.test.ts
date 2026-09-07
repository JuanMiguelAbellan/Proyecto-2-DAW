import jwt from "jsonwebtoken";
import { createToken, verifyToken, decode, isAuth } from "../context/security/auth";

const SECRET_KEY = process.env.SECRET_KEY || "clave_secreta";

describe("auth", () => {
  describe("createToken / verifyToken", () => {
    it("crea un token que verifyToken puede decodificar con los datos del usuario", () => {
      const token = createToken({ id: 7, email: "a@a.com", nombre: "Ana", preferencias: null } as any);
      const payload = verifyToken(token);

      expect(payload).not.toBeNull();
      expect(payload.id).toBe(7);
      expect(payload.email).toBe("a@a.com");
    });

    it("devuelve null si el token está mal firmado", () => {
      const tokenFalso = jwt.sign({ id: 1 }, "clave_incorrecta");
      expect(verifyToken(tokenFalso)).toBeNull();
    });

    it("devuelve null si el token está mal formado", () => {
      expect(verifyToken("esto-no-es-un-jwt")).toBeNull();
    });
  });

  describe("decode", () => {
    it("decodifica el payload sin verificar la firma", () => {
      const token = jwt.sign({ id: 42 }, "cualquier-clave");
      expect((decode(token) as any).id).toBe(42);
    });
  });

  describe("isAuth (middleware)", () => {
    function mockRes() {
      const res: any = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    }

    it("rechaza con 401 si no hay cabecera Authorization", () => {
      const req: any = { headers: {} };
      const res = mockRes();
      const next = jest.fn();

      isAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("rechaza con 401 si el token es inválido", () => {
      const req: any = { headers: { authorization: "Bearer token-invalido" } };
      const res = mockRes();
      const next = jest.fn();

      isAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("deja pasar y añade los datos del usuario a req.body si el token es válido", () => {
      const token = jwt.sign({ id: 3, email: "b@b.com", nombre: "Bea", preferencias: null }, SECRET_KEY);
      const req: any = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();
      const next = jest.fn();

      isAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.id).toBe(3);
      expect(req.body.email).toBe("b@b.com");
    });
  });
});
