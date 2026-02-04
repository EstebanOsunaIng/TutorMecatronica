<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TutorMecatronica (Front + Backend)

Este repo quedo separado en:

- `frontend/`: app React (Vite)
- `backend/`: API Node (Express) que encapsula Gemini (la API key ya no vive en el navegador)

## Requisitos

- Node.js

## Ejecutar en local

Opcion rapida (un solo comando desde la raiz):

- `cd TutorMecatronica`
- `npm install`
- `npm run dev`

1) Backend

- `cd backend`
- `npm install`
- Copia `backend/.env.example` a `backend/.env` y define `OPENAI_API_KEY`
- `npm run dev`

2) Frontend (en otra terminal)

- `cd frontend`
- `npm install`
- `npm run dev`

El frontend corre en `http://localhost:3000` y hace proxy a `/api/*` hacia `http://localhost:3001`.
