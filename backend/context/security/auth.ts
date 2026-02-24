import { NextFunction, Request, Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import Usuario from "../../Usuarios/domain/Usuario";
const SECRET_KEY: Secret = process.env.SECRET_KEY || "clave_secreta";

const decode = (token: string) => {
  return jwt.decode(token);
};

const createToken = (user: Usuario): string => {
  const payload = {
    email: user.email,
    id: user.id,
    nombre: user.nombre,
    preferencias: user.preferencias
  };
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1 days" });
};

const isAuth = (req: Request, response: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];
    const token: string | undefined = authHeader && authHeader.split(" ")[1];
    if (!token) { 
      return response.status(401).json({ mensaje: "No autorizado" }); 
    }
    if (token) {
      const decoded: any = jwt.verify(token, SECRET_KEY);
      //Para que cree el body aunque no venga en la petición, y así poder usarlo en los get
      if (!req.body) req.body = {};
      req.body.email = decoded.email;
      req.body.id= decoded.id;
      req.body.nombre= decoded.nombre;
      req.body.preferencias= decoded.preferencias;
      next();
    } else {
      response.status(401).json({ mensaje: "No autorizado" });
    }
  } catch (err) {
    console.error(err);
    response.status(401).json({ mensaje: "No autorizado" });
  }
};

export { decode, createToken, isAuth };