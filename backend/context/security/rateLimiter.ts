import { Request, Response, NextFunction } from "express";

interface Bucket { count: number; resetAt: number }

const buckets = new Map<string, Bucket>();

export function tomarToken(clave: string, maxPeticiones: number, ventanaMs: number): boolean {
    const ahora = Date.now();
    const bucket = buckets.get(clave);
    if (!bucket || ahora > bucket.resetAt) {
        buckets.set(clave, { count: 1, resetAt: ahora + ventanaMs });
        return true;
    }
    if (bucket.count >= maxPeticiones) return false;
    bucket.count++;
    return true;
}

export function limitarPeticionesIA(maxPeticiones: number, ventanaMs: number) {
    return (req: Request, res: Response, next: NextFunction) => {
        const clave = req.body?.id ? `user:${req.body.id}` : `ip:${req.ip}`;
        if (!tomarToken(clave, maxPeticiones, ventanaMs)) {
            res.status(429).json({ error: "Demasiadas peticiones, espera un momento antes de volver a intentarlo" });
            return;
        }
        next();
    };
}
