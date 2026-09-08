import UsuarioUseCases from "../Usuarios/application/usuario.usecases";
import { hash } from "../context/security/encrypter";
import UsuarioRepository from "../Usuarios/domain/usuario.repository";
import UsuarioController from "../Usuarios/infrastructure/rest/usuario.controller";

function crearRepoFalso(overrides: Partial<UsuarioRepository> = {}): UsuarioRepository {
  return {
    login: jest.fn(),
    registro: jest.fn(),
    existeEmail: jest.fn().mockResolvedValue(false),
    insertarDoc: jest.fn(),
    editarPrefencias: jest.fn(),
    contarDocsMes: jest.fn().mockResolvedValue(0),
    getUsuario: jest.fn(),
    getChats: jest.fn(),
    getHistorial: jest.fn(),
    editarInfo: jest.fn(),
    cambiarPassword: jest.fn(),
    cambiarPlan: jest.fn(),
    guardarTokenVerificacion: jest.fn(),
    verificarEmail: jest.fn(),
    guardarTokenReset: jest.fn(),
    resetearPasswordConToken: jest.fn(),
    ...overrides,
  } as unknown as UsuarioRepository;
}

const controllerFalso = { guardarDocsS3: jest.fn() } as unknown as UsuarioController;

describe("UsuarioUseCases", () => {
  describe("login", () => {
    it("lanza un error si falta la contraseña", async () => {
      const usecases = new UsuarioUseCases(crearRepoFalso(), controllerFalso);
      await expect(usecases.login({ email: "a@a.com" })).rejects.toThrow("Falta password");
    });

    it("lanza un error si el usuario no existe", async () => {
      const repo = crearRepoFalso({ login: jest.fn().mockResolvedValue(null) });
      const usecases = new UsuarioUseCases(repo, controllerFalso);
      await expect(usecases.login({ email: "a@a.com", password: "x" })).rejects.toThrow("Usuario no encontrado");
    });

    it("lanza un error si la contraseña no coincide", async () => {
      const repo = crearRepoFalso({
        login: jest.fn().mockResolvedValue({ email: "a@a.com", password: hash("correcta") }),
      });
      const usecases = new UsuarioUseCases(repo, controllerFalso);
      await expect(usecases.login({ email: "a@a.com", password: "incorrecta" })).rejects.toThrow();
    });

    it("devuelve el usuario si la contraseña coincide", async () => {
      const usuarioBD = { email: "a@a.com", password: hash("correcta"), id: 1 };
      const repo = crearRepoFalso({ login: jest.fn().mockResolvedValue(usuarioBD) });
      const usecases = new UsuarioUseCases(repo, controllerFalso);
      const resultado = await usecases.login({ email: "a@a.com", password: "correcta" });
      expect(resultado).toBe(usuarioBD);
    });
  });

  describe("registro", () => {
    it("lanza un error si falta la contraseña", async () => {
      const usecases = new UsuarioUseCases(crearRepoFalso(), controllerFalso);
      await expect(usecases.registro({ email: "a@a.com" })).rejects.toThrow("Falta password");
    });

    it("guarda la contraseña hasheada, no en claro", async () => {
      const registro = jest.fn().mockImplementation((u) => Promise.resolve({ ...u, id: 5 }));
      const repo = crearRepoFalso({ registro });
      const usecases = new UsuarioUseCases(repo, controllerFalso);

      await usecases.registro({ email: "a@a.com", password: "plano123" });

      const usuarioGuardado = registro.mock.calls[0][0];
      expect(usuarioGuardado.password).not.toBe("plano123");
    });

    it("rechaza el registro si el email ya existe, sin llegar a insertar", async () => {
      const registro = jest.fn();
      const repo = crearRepoFalso({ existeEmail: jest.fn().mockResolvedValue(true), registro });
      const usecases = new UsuarioUseCases(repo, controllerFalso);

      await expect(usecases.registro({ email: "a@a.com", password: "plano123" })).rejects.toThrow(
        "Ya existe una cuenta con ese email"
      );
      expect(registro).not.toHaveBeenCalled();
    });

    it("no falla si el envío del email de verificación falla (registro ya guardado)", async () => {
      const repo = crearRepoFalso({
        registro: jest.fn().mockResolvedValue({ id: 5, email: "a@a.com", nombre: "Ana" }),
      });
      const usecases = new UsuarioUseCases(repo, controllerFalso);

      await expect(usecases.registro({ email: "a@a.com", password: "plano123" })).resolves.toBeDefined();
    });

    it("genera y guarda un token de verificación de email tras crear el usuario", async () => {
      const registro = jest.fn().mockResolvedValue({ id: 5, email: "a@a.com", nombre: "Ana" });
      const guardarTokenVerificacion = jest.fn();
      const repo = crearRepoFalso({ registro, guardarTokenVerificacion });
      const usecases = new UsuarioUseCases(repo, controllerFalso);

      await usecases.registro({ email: "a@a.com", password: "plano123" });

      expect(guardarTokenVerificacion).toHaveBeenCalledTimes(1);
      const [idUsuario, token] = guardarTokenVerificacion.mock.calls[0];
      expect(idUsuario).toBe(5);
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(20);
    });
  });

  describe("cambiarPassword", () => {
    it("lanza un error si la contraseña actual no coincide", async () => {
      const repo = crearRepoFalso({
        getUsuario: jest.fn().mockResolvedValue({ id: 1, password: hash("correcta") }),
      });
      const usecases = new UsuarioUseCases(repo, controllerFalso);
      await expect(usecases.cambiarPassword("incorrecta", "nueva", 1)).rejects.toThrow("Contraseña actual incorrecta");
    });

    it("actualiza la contraseña si la actual es correcta", async () => {
      const cambiarPassword = jest.fn();
      const repo = crearRepoFalso({
        getUsuario: jest.fn().mockResolvedValue({ id: 1, password: hash("correcta") }),
        cambiarPassword,
      });
      const usecases = new UsuarioUseCases(repo, controllerFalso);
      await usecases.cambiarPassword("correcta", "nueva1234", 1);

      expect(cambiarPassword).toHaveBeenCalledTimes(1);
      const [nuevoHash] = cambiarPassword.mock.calls[0];
      expect(nuevoHash).not.toBe("nueva1234");
    });
  });

  describe("resetearPassword", () => {
    it("delega en el repositorio con la contraseña ya hasheada", async () => {
      const resetearPasswordConToken = jest.fn().mockResolvedValue(true);
      const repo = crearRepoFalso({ resetearPasswordConToken });
      const usecases = new UsuarioUseCases(repo, controllerFalso);

      const ok = await usecases.resetearPassword("token-abc", "nuevaPass123");

      expect(ok).toBe(true);
      const [token, hashPassword] = resetearPasswordConToken.mock.calls[0];
      expect(token).toBe("token-abc");
      expect(hashPassword).not.toBe("nuevaPass123");
    });

    it("devuelve false si el token es inválido o ha caducado", async () => {
      const repo = crearRepoFalso({ resetearPasswordConToken: jest.fn().mockResolvedValue(false) });
      const usecases = new UsuarioUseCases(repo, controllerFalso);
      expect(await usecases.resetearPassword("token-malo", "nuevaPass123")).toBe(false);
    });
  });

  describe("insertarDoc (límite de documentos por plan)", () => {
    it("permite subir si no se ha alcanzado el límite del plan free", async () => {
      const insertarDoc = jest.fn();
      const repo = crearRepoFalso({ contarDocsMes: jest.fn().mockResolvedValue(4), insertarDoc });
      const controller = { guardarDocsS3: jest.fn().mockResolvedValue("key") } as unknown as UsuarioController;
      const usecases = new UsuarioUseCases(repo, controller);

      await usecases.insertarDoc({ id: 1, planSubscripcion: "free" }, { titulo: "doc" });

      expect(insertarDoc).toHaveBeenCalledTimes(1);
    });

    it("rechaza si se ha alcanzado el límite del plan free", async () => {
      const repo = crearRepoFalso({ contarDocsMes: jest.fn().mockResolvedValue(5) });
      const usecases = new UsuarioUseCases(repo, controllerFalso);

      await expect(
        usecases.insertarDoc({ id: 1, planSubscripcion: "free" }, { titulo: "doc" })
      ).rejects.toThrow("límite");
    });

    it("permite más documentos en el plan pro que en el free", async () => {
      const insertarDoc = jest.fn();
      const repo = crearRepoFalso({ contarDocsMes: jest.fn().mockResolvedValue(10), insertarDoc });
      const controller = { guardarDocsS3: jest.fn().mockResolvedValue("key") } as unknown as UsuarioController;
      const usecases = new UsuarioUseCases(repo, controller);

      await usecases.insertarDoc({ id: 1, planSubscripcion: "pro" }, { titulo: "doc" });

      expect(insertarDoc).toHaveBeenCalledTimes(1);
    });
  });
});
