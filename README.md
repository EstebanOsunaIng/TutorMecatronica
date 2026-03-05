# TuVir - Tutor Virtual de Mecatronica

Plataforma educativa fullstack con asistente IA, gestion de modulos por roles (Estudiante/Docente/Admin), base de conocimiento en PDF y analitica academica.

## Tabla de contenido

- Descripcion
- Arquitectura
- Tecnologias
- Funcionalidades principales
- Requisitos
- Instalacion y ejecucion
- Variables de entorno
- Scripts disponibles
- Seguridad implementada
- Flujo recomendado de demo
- Problemas comunes

## Descripcion

TuVir es una plataforma para procesos de aprendizaje en ingenieria mecatronica. Incluye:

- Gestion de usuarios por roles.
- Creacion y administracion de modulos academicos.
- Seguimiento de progreso.
- Chatbot IA contextual con soporte de imagenes.
- Base de conocimiento IA desde PDFs.
- Tour guiado de onboarding para nuevos usuarios.

Nota: el chatbot usa enfoque RAG (consulta documentos indexados). No reentrena el modelo base con tus datos.

## Arquitectura

Monorepo con dos aplicaciones:

- `frontend/`: SPA en React + Vite
- `backend/`: API REST en Node.js + Express + MongoDB

Estructura principal:

- `frontend/src/pages`: vistas por rol (`student`, `teacher`, `admin`)
- `frontend/src/components`: layout, chatbot, modulos, onboarding
- `backend/src/routes`: rutas API
- `backend/src/controllers`: logica de negocio
- `backend/src/models`: modelos MongoDB
- `backend/src/services`: IA, notificaciones, parsing, etc.

## Tecnologias

### Frontend

- React 19
- Vite
- React Router
- Axios
- TailwindCSS
- Recharts
- Driver.js (tour guiado)

### Backend

- Node.js (ESM)
- Express
- MongoDB + Mongoose
- JWT
- Bcrypt
- Multer
- Helmet
- CORS
- express-rate-limit
- Nodemailer

## Funcionalidades principales

### Autenticacion y roles

- Login/registro por roles.
- Recuperacion y cambio de contrasena.
- Control de acceso por rol y rutas protegidas.

### Modulos y contenido

- Creacion/edicion/publicacion de modulos.
- Niveles por modulo con contenido, recursos y actividades.
- Importacion de modulo desde PDF.

### Chatbot IA

- Chat con historial.
- Respuesta guiada paso a paso.
- Envio de imagenes (hasta 4 por mensaje).
- Soporte de dictado por voz (segun navegador/permisos).
- Integracion con contexto del modulo + base de conocimiento IA.

### Base de conocimiento IA

- Subida de PDFs (hasta 50MB).
- Procesamiento asincrono con progreso.
- Indexacion por chunks para recuperacion contextual.

### UX y onboarding

- Tour obligatorio para usuarios nuevos (solo una vez automatico).
- Relanzamiento manual del tutorial desde configuracion.
- Cierre de sesion por inactividad:
  - aviso al minuto final,
  - logout automatico a los 20 minutos sin actividad.

## Requisitos

- Node.js 18+ (recomendado 20+)
- MongoDB accesible
- npm 9+

## Instalacion y ejecucion

### 1) Instalar dependencias raiz

```bash
npm install
```

### 2) Backend

```bash
npm --prefix backend install
```

Crear `backend/.env` con las variables minimas (ver seccion siguiente).

### 3) Frontend

```bash
npm --prefix frontend install
```

### 4) Ejecutar proyecto completo

```bash
npm run dev
```

Servicios por defecto:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## Variables de entorno

### Backend (`backend/.env`)

```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/tutormecatronica
JWT_SECRET=coloca_un_secreto_largo_de_24_o_mas_caracteres
JWT_EXPIRES_IN=7d

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

MAIL_SERVICE=
MAIL_HOST=
MAIL_PORT=
MAIL_SECURE=
MAIL_USER=
MAIL_PASS=
MAIL_FROM=no-reply@tutormecatronica.com
```

Importante: `JWT_SECRET` es obligatorio y debe tener al menos 24 caracteres.

### Frontend (`frontend/.env`, opcional)

```env
VITE_API_URL=http://localhost:3001
```

Si se omite, se usan rutas relativas con proxy de Vite.

## Despliegue en Railway

Recomendado: desplegar `backend` y `frontend` como servicios separados.

Backend (variables minimas):

- `MONGO_URI`
- `JWT_SECRET` (24+ caracteres)
- `CORS_ORIGINS=https://<tu-frontend>.up.railway.app`

Frontend (variables minimas):

- `VITE_API_URL=https://<tu-backend>.up.railway.app`

Comandos:

- Backend start: `npm run start`
- Frontend start: `npm run start`

Chequeos rapidos post deploy:

1. `GET https://<backend>/health` responde `{ "ok": true }`.
2. Login desde frontend funciona sin errores CORS.
3. Llamadas autenticadas (`/api/users/me`) responden correctamente.

## Scripts disponibles

### Raiz

```bash
npm run dev
npm run dev:backend
npm run dev:frontend
```

### Backend

```bash
npm --prefix backend run dev
npm --prefix backend run start
npm --prefix backend run seed:admin
npm --prefix backend run migrate:user-pii
```

### Frontend

```bash
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run preview
```

## Seed de administrador

Crear admin inicial:

```bash
npm --prefix backend run seed:admin
```

Valores por defecto del seed:

- Email: `admin1@gmail.com`
- Password: `Admin12345!`

Variables de sobreescritura:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`
- `ADMIN_LASTNAME`
- `ADMIN_DOCUMENT`
- `ADMIN_PHONE`

## Seguridad implementada

- Restriccion de roles en rutas sensibles.
- Registro publico restringido (no permite crear ADMIN).
- JWT obligatorio y validacion de usuario activo.
- Rate limiting en autenticacion y registro.
- Hardening basico con Helmet.
- Validacion de firma real de archivos (PDF/imagen), no solo mimetype.
- Ownership checks para evitar edicion/eliminacion cruzada entre docentes.
- Cierre de sesion por inactividad con aviso previo.
- Auditoria de dependencias con `npm audit`.

## Flujo recomendado de demo

1. Login como estudiante/docente/admin.
2. Mostrar tour guiado automatico (cuenta nueva).
3. Navegar dashboard por rol.
4. Subir PDF a base IA y evidenciar progreso.
5. Usar chatbot con texto + imagenes.
6. Mostrar historial y contexto de respuestas.

## Problemas comunes

### El backend no inicia por JWT

Verifica `JWT_SECRET` en `backend/.env` (minimo 24 caracteres).

### Microfono no funciona

En HTTP por IP local algunos navegadores bloquean permisos. Usa `localhost` o HTTPS y revisa permisos del navegador/sistema.

### Error de CORS

Asegura que frontend y backend corran en hosts permitidos y con `VITE_API_URL` correcto.

### Chat IA no responde con contexto

Verifica:

- documento en estado `ready`,
- `chunksCount > 0`,
- `OPENAI_API_KEY` configurada.
