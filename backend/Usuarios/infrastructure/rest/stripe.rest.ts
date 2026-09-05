import express, { Request, Response } from "express";
import Stripe from "stripe";
import { isAuth } from "../../../context/security/auth";
import UsuarioUseCases from "../../application/usuario.usecases";
import UsuarioRepositoryPostgres from "../db/usuario.repository.Postgres";
import UsuarioController from "./usuario.controller";

const usuarioUseCases = new UsuarioUseCases(new UsuarioRepositoryPostgres(), new UsuarioController());

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Precios fijados en el servidor: el cliente solo elige el plan, nunca el importe.
const PRECIOS: Record<string, number> = {
    pro: 999,          // 9,99 € / mes
    pro_anual: 9999,   // 99,99 € / año
    empresa: 2499,     // 24,99 € / mes
};

const routerStripe = express.Router();

/**
 * @swagger
 * /api/usuarios/crear-payment-intent:
 *   post:
 *     summary: Crea un PaymentIntent de Stripe para contratar un plan
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan: { type: string, enum: [pro, pro_anual] }
 *     responses:
 *       200:
 *         description: Client secret para confirmar el pago con Stripe.js
 *       400:
 *         description: Plan no válido
 */
routerStripe.post("/crear-payment-intent", isAuth, async (req: Request, res: Response) => {
    const { plan } = req.body;
    const idUsuario = req.body.id;
    const importe = PRECIOS[plan];
    if (!importe) {
        res.status(400).json({ error: "Plan no válido" });
        return;
    }
    try {
        const paymentIntent = await getStripe().paymentIntents.create({
            amount: importe,
            currency: "eur",
            automatic_payment_methods: { enabled: true },
            metadata: { idUsuario: String(idUsuario), plan },
        });
        res.json({
            clientSecret: paymentIntent.client_secret,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        });
    } catch (error: any) {
        console.error("Error creando PaymentIntent:", error.message);
        res.status(500).json({ error: "Error al iniciar el pago" });
    }
});

// El webhook necesita el cuerpo en crudo (sin parsear como JSON) para poder
// verificar la firma de Stripe. Por eso NO vive en este router (que se monta
// después de express.json()) sino que server.ts lo registra aparte, en la
// ruta exacta, con express.raw(), antes del parseo JSON global.
export async function stripeWebhookHandler(req: Request, res: Response) {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;
    try {
        event = getStripe().webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
    } catch (error: any) {
        console.error("Firma de webhook de Stripe inválida:", error.message);
        res.status(400).send(`Webhook Error: ${error.message}`);
        return;
    }

    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { idUsuario, plan } = paymentIntent.metadata;
        if (idUsuario && plan) {
            try {
                await usuarioUseCases.cambiarPlan(plan, Number(idUsuario));
                console.log(`Plan ${plan} activado para el usuario ${idUsuario} tras pago confirmado`);
            } catch (error) {
                console.error("Error activando el plan tras el pago:", error);
            }
        }
    }

    res.json({ received: true });
}

export default routerStripe;
