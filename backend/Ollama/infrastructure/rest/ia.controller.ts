import express, { Request, Response } from "express";
import IaUseCases from "../../application/ia.usecases"
import { isAuth } from "../../../context/security/auth";
import IaRepositoryPostgres from "../db/ia.repository.Postgres";

const iaUsecases = new IaUseCases(new IaRepositoryPostgres)

const routerIA = express.Router();

routerIA.post("/generate", isAuth, async (req: Request, res: Response)=>{
    const { prompt } = req.body;
    const id = req.body.id
      let json = {
        model: "gemma3:latest",
        prompt: prompt,
        stream: false
      };
      try {
        const response = await fetch(`http://${process.env.OLLAMA_HOST}:11434/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json)
        });
    
        const texto = await response.text();
        if(texto.includes("[{")){
          //Si contiene esos caracteres cogemos lo que esté entre [{}] para añadir como preferencia
          const textoInsert = texto.substring(texto.indexOf("[{"), texto.indexOf("}]"))
          iaUsecases.addPreferencia(textoInsert, id)
        }
        if(texto.includes("[[{{")){
          //Si contiene esos caracteres cogemos lo que esté entre [{}] para reeemplazarlo por completo como preferencia
          const textoInsert = texto.substring(texto.indexOf("[[{{"), texto.indexOf("}}]]"))
          iaUsecases.editPreferencia(textoInsert, id)
        }

        const data = await response.json();
        
        res.json(data);
    
      } catch (error) {
        console.error("Error llamando a Ollama:", error);
        res.status(500).json({ error: "Error llamando a Ollama" });
      }
});

routerIA.post("/inicio", async (req: Request, res: Response)=>{
    const {usuario} = req.body;
    let prompt = "Comportamiento + info usuario"
    let json = {
        model: "gemma3:latest",
        prompt: prompt,
        stream: false
    }
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
})

export default routerIA;