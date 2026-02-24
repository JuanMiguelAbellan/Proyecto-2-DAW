import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import Mensaje from "../../../Ollama/domain/Mensaje";
import 'dotenv/config';

export default class UsuarioController{
    async guardarDocsS3(documento:Mensaje, nombreArchivo:string):Promise<string>{
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