import express, { Request, Response } from "express";

const routerIA = express.Router();

routerIA.post("/generate", async (req: Request, res: Response)=>{
    const { prompt } = req.body;
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
    
        const data = await response.json();
        res.json(data);
    
      } catch (error) {
        console.error("Error llamando a Ollama:", error);
        res.status(500).json({ error: "Error llamando a Ollama" });
      }
});

export default routerIA;