
export default class IaController{
  async generate(json):Promise<String>{
    try {
        const response = await fetch(`http://${process.env.OLLAMA_HOST}:11434/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json)
        });
  
        const data = await response.json();
        
        return data.json(data);
    
      } catch (error) {
        console.error("Error llamando a Ollama:", error);
        return null
      }
  }  
}