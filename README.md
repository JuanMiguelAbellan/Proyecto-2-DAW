# IADocuments

Asistente de IA para trabajar con tus propios documentos: sube un PDF, extrae su texto y pregúntale directamente al modelo sobre su contenido, con historial de conversación persistido y un modelo de lenguaje que corre en tu propia infraestructura (sin depender de una API de terceros).

## Por qué existe

Nace como Trabajo de Fin de Grado (2º DAW) con un objetivo concreto: que analizar un documento largo (un contrato, un informe, un manual) no dependa de copiar y pegar fragmentos en un chat genérico, sino de un producto donde el documento, la conversación y el usuario viven juntos y con contexto persistente.

## Funcionalidades

- **Autenticación propia** con JWT (registro, login, sesión) — sin depender de un proveedor externo.
- **Gestión de documentos**: subida de PDF, extracción de texto (`pdf-parse`) y visor integrado (`VisorPDF`).
- **Chats con contexto**: cada usuario puede tener varios chats, cada uno con su historial de mensajes persistido en PostgreSQL.
- **Dos modos de respuesta**: conversación libre o respuesta anclada al contenido de un documento subido.
- **IA autoalojada**: el backend habla con [Ollama](https://ollama.com) (modelo `qwen2.5:3b`, elegido por su soporte de español) en lugar de una API de pago de terceros — control total sobre coste, privacidad de los documentos y latencia.
- **Accesibilidad configurable** (`AjustesAccesibilidad`) y ajustes de cuenta.
- **Flujo de suscripción/pago** modelado en el frontend (`PasarelaPago`, `Subscripcion`), pensado como un producto con plan de negocio real, no solo una demo técnica.
- **Documentación de API** autogenerada con Swagger (`/api/docs`).

## Arquitectura

Backend organizado en arquitectura hexagonal (domain / application / infrastructure) por cada módulo funcional:

```
backend/
├─ Usuarios/           # dominio de autenticación y cuentas
│  ├─ domain/
│  ├─ application/
│  └─ infrastructure/  # rest + persistencia
├─ Ollama/             # dominio de chats e integración con el LLM
│  ├─ domain/          # Mensaje, contrato del repositorio
│  ├─ application/     # casos de uso (generar respuesta, gestionar chats)
│  └─ infrastructure/  # rest + persistencia Postgres
└─ context/            # infraestructura transversal (BD, seguridad/JWT)
```

```
Cliente (React + Vite)
      │  HTTPS / JSON
      ▼
Express + TypeScript API  ──►  PostgreSQL (usuarios, chats, mensajes)
      │
      └──────────────►  Ollama (Railway) — qwen2.5:3b
                              │
                              └──►  Cloudflare R2 — almacenamiento de PDFs subidos
```

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite, `pdfjs-dist` para el visor de PDF |
| Backend | Node.js, Express 5, TypeScript |
| Base de datos | PostgreSQL |
| Autenticación | JWT + bcrypt |
| IA | Ollama autoalojado (`qwen2.5:3b`) |
| Almacenamiento | Cloudflare R2 (`@aws-sdk/client-s3`, API compatible con S3) |
| Documentación API | Swagger / OpenAPI |
| Tests | Jest + Supertest |
| Infraestructura | Docker, GitHub Actions (CI/CD) |

## Puesta en marcha local

Requisitos: Docker y Docker Compose.

```bash
git clone https://github.com/JuanMiguelAbellan/Proyecto-2-DAW.git
cd Proyecto-2-DAW
cp backend/.env.example backend/.env   # completar variables (BD, JWT, R2, Ollama)
docker compose up
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:8080/api`
- Documentación interactiva de la API: `http://localhost:8080/api/docs`

## Tests

```bash
cd backend
npm test        # Jest + Supertest, cobertura en /coverage
```

## Despliegue

Desplegado en producción sobre Railway (backend, Postgres y Ollama en tres servicios separados, con red privada entre ellos) y Vercel (frontend). El almacenamiento de documentos usa Cloudflare R2.

La guía original de despliegue manual en AWS Academy (RDS, Elastic Beanstalk, EC2 con Ollama y S3) queda como referencia histórica en [`Documentación/doc-infraestructura.md`](./Documentación/doc-infraestructura.md), pero ya no es el entorno real del proyecto.

## Roadmap

- [ ] Streaming de la respuesta del modelo token a token (WebSockets) en lugar de esperar la respuesta completa.
- [ ] RAG real sobre varios documentos (embeddings + búsqueda semántica) en lugar de inyectar el texto completo en el prompt.
- [ ] Migrar el frontend a TypeScript de forma completa.

## Autor

Juan Miguel Abellán — [GitHub](https://github.com/JuanMiguelAbellan)
