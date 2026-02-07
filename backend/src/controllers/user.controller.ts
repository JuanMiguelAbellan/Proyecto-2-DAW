import express, { Request, Response } from "express";

export const registro = async (req: Request, res: Response) => {
    // Lógica para registrar un nuevo usuario
    
    res.json({ message: "Usuario registrado exitosamente" });
};