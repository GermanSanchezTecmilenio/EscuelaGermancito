# Escuela Germancito - Exámenes (Local)

Proyecto local con **Node.js + Express** y **MySQL** enfocado en **exámenes/quiz**.

La app usa **solo** la base de datos `germancito` (no se usa `employees`).

## Qué incluye

- Quiz/Examen (Biología Bloque III por defecto).
- Calificación en servidor (no expone respuestas correctas en `GET`).
- Retroalimentación:
  - Si una respuesta es incorrecta, se resalta en **amarillo** la correcta.
- Tiempo y folio:
  - Muestra **Tiempo** (duración) y **Folio** del intento.
- Volver a Practicar:
  - Limpia respuestas y reinicia el tiempo.
  - Reordena **preguntas** y **respuestas** aleatoriamente.
- Historial:
  - Visualiza calificaciones anteriores con **fecha y hora**.
- Actualizar examen:
  - Para reemplazar el examen, carga un archivo de Word (`.docx`).
  - Prompt sugerido: `Convierte el examen a archivo Word con el formato solicitado: Pregunta | A | B | C | D | Correcta. La columna Correcta contiene solo letras A-D`.

## Requisitos

- Node.js (LTS recomendado)
- MySQL local con una base `germancito` (vacía o creada; el servidor intenta crearla si hay permisos)

## Estructura

- `server.js`: backend Express + API REST + creación de esquema/seed
- `public/`: frontend del examen
- `data/`: seed del quiz (incluye respuestas correctas; no se sirve desde `/public`)
- `sql/quiz_schema.sql`: esquema del quiz (opcional/manual)

## Configuración

Variables de entorno (opcionales):

- `PORT` (default `3000`)
- `DB_HOST` (default `localhost`)
- `DB_USER` (default `root`)
- `DB_PASSWORD` (default `1234`)
- `DB_APP_NAME` (default `germancito`)
- `OPENAI_API_KEY` (opcional, para explicaciones tipo ChatGPT/OpenAI)
- `OPENAI_MODEL` (default `gpt-4o-mini`)
- `WEB_EXPLANATIONS` (default `1`): genera explicaciones gratis usando Wikipedia si OpenAI no está configurado
- `WEB_EXPLANATIONS_LANG` (default `es`)
- `WEB_EXPLANATIONS_MAX_QUESTIONS` (default `25`)
- `WEB_EXPLANATIONS_BATCH_SIZE` (default `4`)

### Opción A: `.env` (recomendado)

1. Copia `.env.example` a `.env`
2. Ajusta valores según tu MySQL local

### Opción B: variables de entorno (PowerShell)

```powershell
$env:DB_USER='root'
$env:DB_PASSWORD='1234'
$env:DB_APP_NAME='germancito'
npm start
```

## Base de datos (tablas del examen)

Al iniciar, el backend intenta crear automáticamente (si hay permisos):

- `quizzes`, `quiz_questions`, `quiz_options` (catálogo del examen)
- `quiz_results` (historial: fecha, calificación y fecha/hora de registro)

Opcional/manual: puedes crear el esquema ejecutando `sql/quiz_schema.sql`:

```bash
mysql -u root -p < sql/quiz_schema.sql
```

### Reiniciar (empezar de cero)

Opción A (recomendado, usa tus variables `.env`):

```bash
npm run db:reset
```

Opción B (SQL manual):

```bash
mysql -u root -p germancito < sql/reset_germancito.sql
```

Después, reinicia el servidor (`npm start`) para que se vuelvan a crear las tablas y se cargue el seed.

## Ejecutar

```bash
npm i
npm start
```

- Frontend: `http://localhost:3000/`
- API: `http://localhost:3000/api/...`

## Endpoints (API)

### Salud / utilidades

- `GET /api/health`
- `GET /api/weather?city=Mexico%20City`

### Quiz

- `GET /api/quizzes/bio-bloque-iii`
- `POST /api/quizzes/bio-bloque-iii/import`
- `GET /api/quizzes/bio-bloque-iii/history`
- `POST /api/quizzes/bio-bloque-iii/submit`

## Validación rápida (manual)

- `http://localhost:3000/api/health`
- `http://localhost:3000/api/quizzes/bio-bloque-iii`
- `http://localhost:3000/api/quizzes/bio-bloque-iii/history`
