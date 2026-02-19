
export default class IaController{
  async generate(json):Promise<any>{
    try {
        const response = await fetch(`http://${process.env.OLLAMA_HOST}:11434/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json)
        });
  
        const data = await response.json();
        
        return data;
    
      } catch (error) {
        console.error("Error llamando a Ollama:", error);
        return null
      }
  }
  async guardarDocS3(documento:any):Promise<String>{
    return ""//key
  }
}