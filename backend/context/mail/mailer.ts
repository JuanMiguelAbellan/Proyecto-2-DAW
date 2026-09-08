import "dotenv/config";

export async function enviarEmail(destino: string, asunto: string, html: string): Promise<void> {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        // Sin API key configurada (ej. entorno local/tests): no bloqueamos el
        // flujo, solo dejamos constancia de lo que se habría enviado.
        console.log(`[mailer] BREVO_API_KEY no configurada. Email a ${destino} - ${asunto}\n${html}`);
        return;
    }

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            sender: { email: process.env.MAIL_FROM },
            to: [{ email: destino }],
            subject: asunto,
            htmlContent: html
        })
    });

    if (!res.ok) {
        const texto = await res.text();
        throw new Error(`Brevo API error ${res.status}: ${texto}`);
    }
}
