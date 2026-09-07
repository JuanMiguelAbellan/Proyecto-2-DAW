import IaUseCases from "../Ollama/application/ia.usecases";
import IaReposiroty from "../Ollama/domain/ia.repository";
import IaController from "../Ollama/infrastructure/rest/ia.controller";

function crearRepoFalso(overrides: Partial<IaReposiroty> = {}): IaReposiroty {
  return {
    crearChat: jest.fn(),
    getMensajes: jest.fn().mockResolvedValue([]),
    contarMensajes: jest.fn().mockResolvedValue(0),
    actualizarTituloChat: jest.fn(),
    guardarMensajeUsuario: jest.fn().mockResolvedValue(1),
    guardarRespuesta: jest.fn().mockResolvedValue(1),
    guardarDocumentoRespuesta: jest.fn(),
    actualizarDocumento: jest.fn(),
    esPropietarioMensaje: jest.fn().mockResolvedValue(true),
    getDocumentos: jest.fn(),
    addPreferencia: jest.fn(),
    editPreferencia: jest.fn(),
    eliminarChat: jest.fn(),
    ...overrides,
  } as unknown as IaReposiroty;
}

function crearControllerFalso(overrides: Partial<IaController> = {}): IaController {
  return {
    generate: jest.fn().mockResolvedValue({ response: "general" }),
    chat: jest.fn().mockResolvedValue({ message: { role: "assistant", content: "Respuesta de prueba" } }),
    guardarDocS3: jest.fn().mockResolvedValue("clave-s3"),
    subirPDF: jest.fn().mockResolvedValue("https://r2.example.com/doc.pdf"),
    ...overrides,
  } as unknown as IaController;
}

describe("IaUseCases.getRespuesta", () => {
  it("responde con un mensaje normal cuando Ollama contesta", async () => {
    const repo = crearRepoFalso();
    const controller = crearControllerFalso();
    const usecases = new IaUseCases(repo, controller);

    const mensaje = await usecases.getRespuesta("Hola", "Hola", "free", 1);

    expect(mensaje.contenido).toBe("Respuesta de prueba");
    expect(mensaje.tipo).toBe("normal");
  });

  it("devuelve un mensaje de error si Ollama no responde", async () => {
    const repo = crearRepoFalso();
    const controller = crearControllerFalso({ chat: jest.fn().mockResolvedValue(null) });
    const usecases = new IaUseCases(repo, controller);

    const mensaje = await usecases.getRespuesta("Hola", "Hola", "free", 1);

    expect(mensaje.contenido).toBe("Error al contactar con Ollama");
  });

  it("incluye el historial previo del chat en los mensajes enviados a Ollama", async () => {
    const repo = crearRepoFalso({
      getMensajes: jest.fn().mockResolvedValue([
        { rol: "usuario", contenido: "Primer mensaje" },
        { rol: "ia", contenido: "Primera respuesta" },
      ]),
    });
    const controller = crearControllerFalso();
    const usecases = new IaUseCases(repo, controller);

    await usecases.getRespuesta("Segunda pregunta", "Segunda pregunta", "free", 1, 10);

    const mensajesEnviados = (controller.chat as jest.Mock).mock.calls[0][0];
    // system + 2 mensajes de historial + el mensaje actual
    expect(mensajesEnviados).toHaveLength(4);
    expect(mensajesEnviados[1]).toEqual({ role: "user", content: "Primer mensaje" });
    expect(mensajesEnviados[2]).toEqual({ role: "assistant", content: "Primera respuesta" });
  });

  it("clasifica el documento cuando el prompt referencia uno", async () => {
    const repo = crearRepoFalso();
    const controller = crearControllerFalso({ generate: jest.fn().mockResolvedValue({ response: "legal" }) });
    const usecases = new IaUseCases(repo, controller);

    const mensaje = await usecases.getRespuesta(
      "[Documento: contrato.pdf] Resume esto",
      "Resume esto",
      "free",
      1,
      10
    );

    expect(controller.generate).toHaveBeenCalled();
    expect(mensaje.tipoDoc).toBe("legal");
  });

  it("cae en 'general' si la clasificación falla", async () => {
    const repo = crearRepoFalso();
    const controller = crearControllerFalso({ generate: jest.fn().mockRejectedValue(new Error("timeout")) });
    const usecases = new IaUseCases(repo, controller);

    const mensaje = await usecases.getRespuesta("[Documento: x.pdf] Resume", "Resume", "free", 1, 10);

    expect(mensaje.tipoDoc).toBe("general");
  });

  it("marca el mensaje como documento cuando la IA usa el marcador //* *//", async () => {
    const repo = crearRepoFalso();
    const controller = crearControllerFalso({
      chat: jest.fn().mockResolvedValue({
        message: { role: "assistant", content: "//*Contenido del documento generado*//Aquí tienes tu documento" },
      }),
    });
    const usecases = new IaUseCases(repo, controller);

    const mensaje = await usecases.getRespuesta("Genera un doc", "Genera un doc", "free", 1);

    expect(mensaje.tipo).toBe("documento");
    expect(mensaje.contenidoDoc).toBe("Contenido del documento generado");
    expect(controller.guardarDocS3).toHaveBeenCalled();
  });
});

describe("IaUseCases.guardarPDFAnotado", () => {
  it("rechaza si el mensaje no pertenece al usuario (protección IDOR)", async () => {
    const repo = crearRepoFalso({ esPropietarioMensaje: jest.fn().mockResolvedValue(false) });
    const controller = crearControllerFalso();
    const usecases = new IaUseCases(repo, controller);

    const url = await usecases.guardarPDFAnotado(5, 999, Buffer.from("pdf"), "anotado.pdf");

    expect(url).toBeNull();
    expect(controller.subirPDF).not.toHaveBeenCalled();
  });

  it("sube el PDF y actualiza el documento si el usuario es el propietario", async () => {
    const repo = crearRepoFalso({ esPropietarioMensaje: jest.fn().mockResolvedValue(true) });
    const controller = crearControllerFalso();
    const usecases = new IaUseCases(repo, controller);

    const url = await usecases.guardarPDFAnotado(5, 1, Buffer.from("pdf"), "anotado.pdf");

    expect(url).toBe("https://r2.example.com/doc.pdf");
    expect(repo.actualizarDocumento).toHaveBeenCalledWith(5, "https://r2.example.com/doc.pdf");
  });
});
