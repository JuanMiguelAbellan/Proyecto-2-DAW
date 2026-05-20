# Infraestructura — IADocuments (AWS Academy)

Guía de despliegue manual para entornos de AWS Academy. Cubre la configuración paso a paso de todos los servicios necesarios para poner en marcha la aplicación.

> **Nota previa:** Las credenciales de AWS Academy (Access Key, Secret Key, Session Token) cambian cada vez que se abre un nuevo lab. Hay que actualizarlas en GitHub Actions Secrets y en la configuración local del CLI antes de cada despliegue.

---

## Arquitectura del despliegue

```
Internet
   │
   ├─► S3 (frontend estático)          ← URL pública HTTP del bucket
   │
   └─► Elastic Beanstalk (backend)     ← URL pública HTTP de EB
           │
           ├─► RDS PostgreSQL          ← base de datos
           ├─► EC2 con Ollama          ← modelo de IA (llama3.2:1b, gemma3)
           └─► S3 bucket de documentos ← almacenamiento de PDFs
```

---

## Paso 1 — RDS PostgreSQL y S3 de documentos

### RDS

- Motor: **PostgreSQL**
- Instancia: `db.t3.micro` (capa gratuita)
- Base de datos inicial: `postgres`
- Usuario: `postgres`
- Contraseña: la que elijas (guárdala, la necesitarás en el paso 3)
- VPC: default
- Acceso público: sí (para poder conectar desde Elastic Beanstalk)
- Grupo de seguridad: permitir puerto **5432** desde el grupo de seguridad de EB

### S3 de documentos

- Nombre del bucket: `iadocss3` (o el que elijas, luego se configura en EB)
- Región: `us-east-1`
- Bloquear acceso público: **sí** (los documentos son privados, el backend accede con credenciales IAM)

---

## Paso 2 — EC2 con Ollama

- AMI: **Amazon Linux 2023**
- Tipo: `t3.large` (Ollama necesita al menos 4 GB de RAM para modelos pequeños)
- Almacenamiento: 20 GB
- IP elástica: asignar una para que no cambie al reiniciar
- Grupo de seguridad: abrir puerto **22** (SSH) y **11434** (Ollama API)

### Instalación de Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Configurar Ollama para escuchar en todas las interfaces

```bash
sudo nano /etc/systemd/system/ollama.service
```

Modificar el fichero para que quede así:

```ini
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
Environment="OLLAMA_HOST=0.0.0.0"
ExecStart=/usr/local/bin/ollama serve
User=ollama
Group=ollama
Restart=always
RestartSec=3
Environment="PATH=/usr/local/bin:/usr/bin:/usr/local/sbin:/usr/sbin"

[Install]
WantedBy=default.target
```

### Descargar los modelos

```bash
ollama pull llama3.2:1b
ollama pull gemma3:latest
```

### Reiniciar el servicio

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

Verificar que responde:

```bash
curl http://localhost:11434/api/tags
```

---

## Paso 3 — Elastic Beanstalk (backend)

- Nombre de la aplicación: `iadocs-backend`
- Plataforma: **Docker** (Amazon Linux 2023)
- VPC: default
- Sin grupo de seguridad personalizado (usa el de EB por defecto)
- Subir el backend como `.zip` (sin `node_modules/`, sin `dist/`, sin `.env`):

```bash
cd backend
zip -r ../backend.zip . --exclude "node_modules/*" --exclude "dist/*" --exclude ".env" --exclude "coverage/*"
```

### Variables de entorno en EB

Configurar en **Configuración → Actualizaciones, monitoreo y registro → Variables de entorno**:

| Clave | Valor |
|---|---|
| `POSTGRES_HOST` | endpoint de tu RDS (sin puerto) |
| `POSTGRES_PORT` | `5432` |
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | contraseña del RDS |
| `POSTGRES_DB` | `postgres` |
| `SECRET_KEY` | cualquier texto largo y aleatorio |
| `OLLAMA_HOST` | IP elástica de la EC2 con Ollama |
| `AWS_REGION` | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | del apartado AWS Details del lab |
| `AWS_SECRET_ACCESS_KEY` | del apartado AWS Details del lab |
| `AWS_SESSION_TOKEN` | del apartado AWS Details del lab |
| `AWS_S3_BUCKET` | `iadocss3` (nombre del bucket de documentos) |
| `FRONTEND_URL` | dejar vacío por ahora, se rellena en el paso 4 |

> **Importante:** Los nombres de las variables no pueden contener espacios. Si EB muestra error al desplegar, revisar que ningún nombre tiene espacios o caracteres especiales.

Cuando el entorno esté en estado **Ok** y la URL de EB cargue el Swagger (`/api/docs`), el backend está listo.

---

## Paso 4 — S3 para el frontend

### Crear el bucket

- Nombre: `iadoc-frontend` (o el que elijas)
- Región: `us-east-1`
- Bloquear acceso público: **desactivar** (el frontend es público)

### Activar alojamiento de sitio web estático

Ir a **Propiedades → Alojamiento de sitios web estáticos → Editar**:
- Activar alojamiento estático
- Documento de índice: `index.html`
- Documento de error: `index.html` (necesario para que el router de React funcione)

### Política de bucket

En **Permisos → Política de bucket**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::iadoc-frontend/*"
    }
  ]
}
```

> Sustituir `iadoc-frontend` por el nombre real de tu bucket si es diferente.

### Compilar el frontend apuntando al backend de EB

```bash
cd /ruta/al/proyecto/frontend
VITE_API_URL=http://<url-de-elastic-beanstalk>/ npm run build
```

La URL de EB tiene el formato: `http://iadoc-backend-env.eba-xxxxxxxx.us-east-1.elasticbeanstalk.com/`  
**Importante:** incluir la barra `/` al final.

### Subir el build a S3

Primero configurar el AWS CLI con las credenciales del lab:

```bash
~/.local/bin/aws configure
```

Introducir:
- AWS Access Key ID: (del apartado AWS Details del lab)
- AWS Secret Access Key: (del apartado AWS Details del lab)
- Default region: `us-east-1`
- Default output format: (Enter, dejar vacío)

Configurar también el session token:

```bash
~/.local/bin/aws configure set aws_session_token <SESSION_TOKEN_DEL_LAB>
```

Sincronizar el build con el bucket:

```bash
~/.local/bin/aws s3 sync /ruta/al/proyecto/frontend/dist s3://iadoc-frontend --region us-east-1
```

### Actualizar FRONTEND_URL en Elastic Beanstalk

Una vez subido el frontend, copiar la URL del bucket S3 (aparece en **Propiedades → Alojamiento de sitios web estáticos**) y configurarla en EB como variable de entorno `FRONTEND_URL`. Esto permite que el backend incluya los headers CORS correctos.

---

## Paso 5 — Actualizar GitHub Actions Secrets

Para que el CI/CD funcione con el nuevo lab, actualizar en **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Valor |
|---|---|
| `AWS_ACCESS_KEY_ID` | del apartado AWS Details del lab |
| `AWS_SECRET_ACCESS_KEY` | del apartado AWS Details del lab |
| `AWS_SESSION_TOKEN` | del apartado AWS Details del lab |

---

## Verificación final

Abrir la URL del bucket S3 en el navegador. La aplicación debe cargar, permitir registro/login y responder a las peticiones de IA.

Si hay errores:
- **502 / no carga el frontend**: revisar que `VITE_API_URL` en el build apunta a la URL correcta de EB con `/` al final
- **Error en la IA**: verificar que Ollama está corriendo en la EC2 (`systemctl status ollama`) y que el modelo está descargado (`ollama list`)
- **Error de base de datos**: revisar que el grupo de seguridad del RDS permite conexiones desde la IP de EB en el puerto 5432
- **Error de S3**: revisar que las credenciales AWS en EB son las del lab actual (no las de un lab anterior caducado)
