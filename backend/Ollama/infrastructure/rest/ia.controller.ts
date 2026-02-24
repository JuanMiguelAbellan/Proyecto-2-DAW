import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import Mensaje from "../../domain/Mensaje";
import 'dotenv/config';


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
  async guardarDocS3(documento:Mensaje, nombreArchivo:string):Promise<String>{
    // 1. Configuración del cliente
    const region=process.env.AWS_REGION
    const accessKeyId=process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey=process.env.AWS_SECRET_ACCES_KEY
    const sessionToken=process.env.AWS_SESSION_TOKEN
    const s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: accessKeyId//${{ secrets.AWS_ACCESS_KEY_ID }}
        ,
        secretAccessKey: secretAccessKey //${{ secrets.AWS_SECRET_ACCESS_KEY }}
        ,
        sessionToken: sessionToken//${{ secrets.AWS_SESSION_TOKEN }}
      },
    });
    const s3Bucket=process.env.AWS_S3_BUCKET
    
    const params: PutObjectCommandInput = {
      Bucket: s3Bucket,
      Key: `documentos/${nombreArchivo}`,
      Body: documento.contenido,
      ContentType: "text/plain",
    };
    const url = `https://${s3Bucket}.s3.${region}.amazonaws.com/documentos/${nombreArchivo}`;
  try {
    const command = new PutObjectCommand(params);
    const response = await s3Client.send(command);
    console.log("Archivo subido exitosamente", response);
    return url
  } catch (error) {
    console.error("Error al subir archivo", error);
  }
  }
}