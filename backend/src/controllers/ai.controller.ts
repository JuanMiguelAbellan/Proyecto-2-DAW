import { log } from "node:console";
import express, { Request, Response } from "express";

export const generateAI = async (req: Request, res: Response) => {
  const { prompt } = req.body;
  let json = {
    model: "gemma3:latest",
    prompt: prompt,
    stream: false
  };
  log( json );
  try {
    const response = await fetch(`http://${process.env.OLLAMA_HOST}:11434/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json)
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error("Error llamando a Ollama:", error);
    res.status(500).json({ error: "Error llamando a Ollama" });
  }
};
//"format": "json" 
//"context": [105, 2364, 107, ...] //--> Para continuar una conversacion sin tener que enviar todo el historial (que lo devuelve al final de la respuesta)
//"system": "Eres un asistente especializado en..." //--> Instrucciones del sistema
//"image": ["<base64>"] //--> Para modelos que soporten entrada de imagen
//"max_new_tokens": 150 //--> Longitud máxima de la respuesta
//"temperature": 0.7 //--> Creatividad
//"top_p": 0.9 //--> Probabilidad acumulada cuanto mayor, más creatividad
//"top_k": 50 //--> nº de tokens candidatos a considerar por el top_p cuanto mayor, más variado por defecto 0 sin limite
//"repetition_penalty": 1.2 //--> Penalización por repetición
//"presence_penalty": 0.2 //--> Penalización si ya se habló del tema cuanto mayor, mas evita repetir temas
//"frequency_penalty": 0.2 //--> Penalización por frecuencia de palabras
//"stop": ["\n", ###] //--> Secuencias de parada para cortar respuestas largas
