import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { verifyToken } from "../../../context/security/auth";
import IaUseCases from "../../application/ia.usecases";
import IaRepositoryPostgres from "../db/ia.repository.Postgres";
import IaController from "../rest/ia.controller";

interface MensajeEntrante {
    prompt: string;
    mensajeVisible?: string;
    tipo?: string;
    idChat?: number;
    urlPDF?: string;
}

export default function setupChatWebSocket(server: Server): void {
    const iaUsecases = new IaUseCases(new IaRepositoryPostgres(), new IaController());
    const wss = new WebSocketServer({ server, path: "/ws/chat" });

    wss.on("connection", (ws: WebSocket, req) => {
        const url = new URL(req.url || "", "http://localhost");
        const token = url.searchParams.get("token") || "";
        const decoded = verifyToken(token);

        if (!decoded) {
            ws.send(JSON.stringify({ type: "error", message: "No autorizado" }));
            ws.close();
            return;
        }
        const idUsuario = decoded.id;

        ws.on("message", async (raw) => {
            let datos: MensajeEntrante;
            try {
                datos = JSON.parse(raw.toString());
            } catch {
                ws.send(JSON.stringify({ type: "error", message: "Mensaje mal formado" }));
                return;
            }

            try {
                const mensaje = await iaUsecases.getRespuesta(
                    datos.prompt,
                    datos.mensajeVisible || datos.prompt,
                    datos.tipo || "free",
                    idUsuario,
                    datos.idChat,
                    datos.urlPDF,
                    (texto: string) => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: "chunk", content: texto }));
                        }
                    }
                );
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "done", mensaje }));
                }
            } catch (error) {
                console.error("Error en chat WebSocket:", error);
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "error", message: "Error al generar la respuesta" }));
                }
            }
        });
    });
}
