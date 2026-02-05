<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TutorMecatronica (Frontend + Backend)

Arquitectura fullstack con React (frontend) y Node/Express + MongoDB (backend).

## Estructura

- `frontend/`: React + Tailwind + Vite
- `backend/`: API REST con Express + MongoDB

## Requisitos

- Node.js
- MongoDB local o remoto

## Configuracion

1) Backend

- `cd backend`
- `npm install`
- Copia `backend/.env.example` a `backend/.env` y configura `MONGO_URI` y `JWT_SECRET`
- `npm run dev`

## Seed de superadmin (opcion B)

Genera un usuario ADMIN por defecto:

- `cd backend`
- `npm run seed:admin`

Defaults:
- email: `admin@tutormecatronica.com`
- password: `Admin12345!`

Puedes sobrescribir con variables de entorno:
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_LASTNAME`, `ADMIN_DOCUMENT`, `ADMIN_PHONE`

2) Frontend

- `cd frontend`
- `npm install`
- `npm run dev`

## Comando unico (raiz)

- `cd TutorMecatronica`
- `npm install`
- `npm run dev`

Frontend en `http://localhost:3000` (proxy `/api` hacia `http://localhost:3001`).
