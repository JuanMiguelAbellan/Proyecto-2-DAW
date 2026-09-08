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
    guardarFragmentos: jest.fn(),
    buscarFragmentosRelevantes: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as IaReposiroty;
}

function crearControllerFalso(overrides: Partial<IaController> = {}): IaController {
  return {
    generate: jest.fn().mockResolvedValue({ response: "general" }),
    chat: jest.fn().mockResolvedValue({ message: { role: "assistant", content: "Respuesta de prueba" } }),
    guardarDocS3: jest.fn().mockResolvedValue("clave-s3"),
    subirPDF: jest.fn().mockResolvedValue("https://r2.example.com/doc.pdf"),
    embed: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
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

  it("clasifica el documento cuando se adjunta uno nuevo", async () => {
    const repo = crearRepoFalso();
    const controller = crearControllerFalso({ generate: jest.fn().mockResolvedValue({ response: "legal" }) });
    const usecases = new IaUseCases(repo, controller);

    const mensaje = await usecases.getRespuesta(
      "Resume esto",
      "Resume esto",
      "free",
      1,
      10,
      undefined,
      "Texto completo del contrato de alquiler...",
      "contrato.pdf"
    );

    expect(controller.generate).toHaveBeenCalled();
    expect(mensaje.tipoDoc).toBe("legal");
  });

  it("cae en 'general' si la clasificación falla", async () => {
    const repo = crearRepoFalso();
    const controller = crearControllerFalso({ generate: jest.fn().mockRejectedValue(new Error("timeout")) });
    const usecases = new IaUseCases(repo, controller);

    const mensaje = await usecases.getRespuesta("Resume", "Resume", "free", 1, 10, undefined, "Texto del documento", "x.pdf");

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

  it("indexa (chunking + embeddings) un documento recién adjuntado en vez de solo reenviarlo", async () => {
    const repo = crearRepoFalso();
    const embed = jest.fn().mockImplementation((textos: string[]) => Promise.resolve(textos.map(() => [0.1, 0.2])));
    const controller = crearControllerFalso({ embed });
    const usecases = new IaUseCases(repo, controller);

    const textoLargo = "a".repeat(2500); // debe partirse en varios fragmentos
    await usecases.getRespuesta("Resume esto", "Resume esto", "free", 1, 10, undefined, textoLargo, "doc.pdf");
    // ingestarDocumento es fire-and-forget: dejamos que su cadena de promesas (mocks) se asiente
    await new Promise((resolve) => setImmediate(resolve));

    expect(embed).toHaveBeenCalled();
    const fragmentosEnviados = embed.mock.calls[0][0];
    expect(fragmentosEnviados.length).toBeGreaterThan(1);

    expect(repo.guardarFragmentos).toHaveBeenCalledTimes(1);
    const [idChatGuardado, , nombreDocGuardado, fragmentosGuardados] = (repo.guardarFragmentos as jest.Mock).mock.calls[0];
    expect(idChatGuardado).toBe(10);
    expect(nombreDocGuardado).toBe("doc.pdf");
    expect(fragmentosGuardados.length).toBe(fragmentosEnviados.length);
  });

  it("incluye un extracto directo del documento recién adjuntado en el prompt actual", async () => {
    const repo = crearRepoFalso();
    const controller = crearControllerFalso();
    const usecases = new IaUseCases(repo, controller);

    await usecases.getRespuesta("Resume esto", "Resume esto", "free", 1, 10, undefined, "Contenido del documento adjuntado", "doc.pdf");

    const mensajesEnviados = (controller.chat as jest.Mock).mock.calls[0][0];
    const mensajeUsuario = mensajesEnviados[mensajesEnviados.length - 1];
    expect(mensajeUsuario.content).toContain("Contenido del documento adjuntado");
  });

  it("en turnos sin documento nuevo, recupera solo los fragmentos relevantes (RAG) en vez del documento completo", async () => {
    const repo = crearRepoFalso({
      buscarFragmentosRelevantes: jest.fn().mockResolvedValue([
        { contenido: "Fragmento relevante sobre el plazo del contrato", nombreDoc: "contrato.pdf" },
      ]),
    });
    const controller = crearControllerFalso();
    const usecases = new IaUseCases(repo, controller);

    await usecases.getRespuesta("¿Cuál es el plazo?", "¿Cuál es el plazo?", "free", 1, 10);

    expect(repo.buscarFragmentosRelevantes).toHaveBeenCalledWith(10, expect.any(Array), expect.any(Number));
    const mensajesEnviados = (controller.chat as jest.Mock).mock.calls[0][0];
    const mensajeUsuario = mensajesEnviados[mensajesEnviados.length - 1];
    expect(mensajeUsuario.content).toContain("Fragmento relevante sobre el plazo del contrato");
    expect(mensajeUsuario.content).toContain("¿Cuál es el plazo?");
  });

  it("no busca fragmentos si el mensaje no pertenece a un chat", async () => {
    const repo = crearRepoFalso();
    const controller = crearControllerFalso();
    const usecases = new IaUseCases(repo, controller);

    await usecases.getRespuesta("Hola", "Hola", "free", 1);

    expect(repo.buscarFragmentosRelevantes).not.toHaveBeenCalled();
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
