import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import Mensaje from "../../domain/Mensaje";
import 'dotenv/config';


export default class IaController{
  async generate(json):Promise<any>{
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000)
        const response = await fetch(`http://${process.env.OLLAMA_HOST}:11434/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
          signal: controller.signal
        })
        clearTimeout(timeout);
  
        const data = await response.json();
        
        return data;
    
      } catch (error) {
        console.error("Error llamando a Ollama:", error);
        return null
      }
  }
  async guardarDocS3(documento:Mensaje, nombreArchivo:string):Promise<String>{
    // Cloudflare R2 en vez de AWS S3: misma API (S3-compatible), solo cambia
    // el endpoint/región y las credenciales. 10GB gratis, sin coste de salida.
    const accountId=process.env.R2_ACCOUNT_ID
    const accessKeyId=process.env.R2_ACCESS_KEY_ID
    const secretAccessKey=process.env.R2_SECRET_ACCESS_KEY
    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
      },
    });
    const bucket=process.env.R2_BUCKET
    const publicUrl=process.env.R2_PUBLIC_URL

    const params: PutObjectCommandInput = {
      Bucket: bucket,
      Key: `documentos/${nombreArchivo}`,
      Body: documento.contenido,
      ContentType: "text/plain",
    };
    const url = `${publicUrl}/documentos/${nombreArchivo}`;
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