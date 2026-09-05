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
  private getR2Client(): S3Client {
    // Cloudflare R2 en vez de AWS S3: misma API (S3-compatible), solo cambia
    // el endpoint/región y las credenciales. 10GB gratis, sin coste de salida.
    return new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      },
    });
  }

  private async subirArchivoR2(body: Buffer | string, key: string, contentType: string): Promise<string> {
    const s3Client = this.getR2Client()
    const bucket = process.env.R2_BUCKET
    const publicUrl = process.env.R2_PUBLIC_URL

    const params: PutObjectCommandInput = {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    };
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    return `${publicUrl}/${key}`
  }

  async guardarDocS3(documento:Mensaje, nombreArchivo:string):Promise<String>{
    try {
      const url = await this.subirArchivoR2(documento.contenidoDoc || documento.contenido, `documentos/${nombreArchivo}`, "text/plain")
      console.log("Archivo subido exitosamente:", url)
      return url
    } catch (error) {
      console.error("Error al subir archivo", error);
    }
  }

  async subirPDF(buffer: Buffer, nombreOriginal: string): Promise<string> {
    const nombreLimpio = nombreOriginal.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `documentos/pdfs/${Date.now()}-${nombreLimpio}`
    return this.subirArchivoR2(buffer, key, "application/pdf")
  }
}