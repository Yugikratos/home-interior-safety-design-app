# Home Interior & Safety Design App

Phase 1 MVP for uploading home blueprints, defining rooms and design preferences, then viewing rule-based interior suggestions, safety recommendations, and a basic 2D SVG room layout.

## Stack

- Frontend: React + Vite + TypeScript
- Backend: Spring Boot + Java 17
- Database: PostgreSQL
- Auth: JWT

## Prerequisites

- Docker and Docker Compose
- Java 17+
- Maven 3.9+
- Node.js 20+

## Environment

Copy `.env.example` to `.env` and adjust values if needed.

```powershell
Copy-Item .env.example .env
```

## Run With Docker

```powershell
docker compose up --build
```

Services:

- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- PostgreSQL: localhost:5432

No default user is seeded. Open the frontend, choose `Register`, and create an account before logging in.

## Run Locally

Start PostgreSQL:

```powershell
docker compose up postgres
```

Start backend:

```powershell
cd backend
mvn spring-boot:run
```

Start frontend:

```powershell
cd frontend
npm install
npm run dev
```

## Build Checks

Backend:

```powershell
cd backend
mvn test
```

If Maven is not installed locally, run backend tests through Docker:

```powershell
cd backend
docker run --rm -v ${PWD}:/app -w /app maven:3.9.9-eclipse-temurin-17 mvn test
```

Frontend:

```powershell
cd frontend
npm install
npm run build
npm audit --audit-level=moderate
```

Docker image build:

```powershell
docker compose build
```

## API Overview

- `POST /auth/register`
- `POST /auth/login`
- `GET|POST /projects`
- `GET|PUT|DELETE /projects/{id}`
- `POST /projects/{id}/blueprint`
- `GET|POST /projects/{id}/rooms`
- `PUT|DELETE /projects/{id}/rooms/{roomId}`
- `GET|POST /projects/{id}/preferences`
- `GET /projects/{id}/suggestions`
- `GET /projects/{id}/safety`

## Current Phase 1 Behavior

- JWT auth protects all project APIs.
- Users can create, edit, delete, and view their own projects.
- Users can upload one blueprint per project.
- Users can add, edit, and delete rooms.
- Users can save design preferences.
- Suggestions and safety recommendations are rule-based, not AI-generated.
- 2D layout is rendered as SVG rectangles from room measurements.

## Validation And Upload Rules

- Blueprint uploads support PDF, PNG, JPG, and JPEG only.
- Maximum blueprint upload size is 10MB.
- Room length and width must be greater than zero.
- Supported room types: Bedroom, Living room, Kitchen, Bathroom, Dining room.
- Supported styles: Modern, Minimal, Classic, Industrial.
- Supported budgets: Low, Medium, High.

Uploaded blueprint files are stored locally under `backend/uploads` by default when running locally, and in the `backend_uploads` Docker volume when running through Docker Compose.
