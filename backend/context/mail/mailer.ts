import nodemailer, { Transporter } from "nodemailer";
import "dotenv/config";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
    if (!process.env.SMTP_HOST) return null;
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
    }
    return transporter;
}

export async function enviarEmail(destino: string, asunto: string, html: string): Promise<void> {
    const t = getTransporter();
    if (!t) {
        // Sin SMTP configurado (ej. entorno local/tests): no bloqueamos el flujo,
        // solo dejamos constancia de lo que se habría enviado.
        console.log(`[mailer] SMTP no configurado. Email a ${destino} - ${asunto}\n${html}`);
        return;
    }
    await t.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: destino,
        subject: asunto,
        html
    });
}
