# Home Interior & Safety Design App

Phase 1 MVP for uploading home blueprints, defining rooms and design preferences, then viewing rule-based interior suggestions, safety recommendations, and a basic 2D SVG layout.

## 1. Overview

### 1.1 What This App Does

- Registers and authenticates users with JWT.
- Lets each user manage their own interior design projects.
- Stores blueprint uploads locally.
- Generates rule-based design suggestions and safety recommendations.
- Displays rooms in a simple colored 2D SVG layout.

### 1.2 Phase 1 Scope

- Included: React web app, Spring Boot API, PostgreSQL, JWT auth, local uploads, rule-based suggestions, safety checklist, 2D visualization.
- Not included: AI models, 3D visualization, mobile app, cloud file storage.

## 2. Architecture

### 2.1 Tech Stack

- Frontend: React + Vite + TypeScript
- Backend: Spring Boot + Java 17
- Database: PostgreSQL
- Auth: JWT
- Runtime: Docker Compose

### 2.2 Repository Structure

```text
frontend/              React app
frontend/src/pages     Login, register, dashboard, project detail
frontend/src/components UI components and project widgets
backend/               Spring Boot API
backend/src/main/java  Controllers, services, repositories, models
backend/src/test       Backend integration tests
docker-compose.yml     Postgres, backend, frontend services
.env.example           Example environment configuration
```

## 3. Setup

### 3.1 Prerequisites

- Docker and Docker Compose
- Java 17+
- Maven 3.9+
- Node.js 20+

### 3.2 Environment

Copy `.env.example` to `.env` and adjust values if needed.

```powershell
Copy-Item .env.example .env
```

No default user is seeded. Open the frontend, choose `Register`, and create an account before logging in.

## 4. Running The App

### 4.1 Docker

```powershell
docker compose up --build
```

Services:

- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- PostgreSQL: localhost:5432

### 4.2 Local Development

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

## 5. Features

### 5.1 Project Workflow

- Create, edit, delete, and view projects.
- Upload one blueprint per project.
- Add, edit, and delete rooms.
- Save design preferences.
- View rule-based suggestions and safety recommendations.

### 5.2 Frontend UX

- Sidebar navigation: Dashboard, Projects, Logout.
- Dashboard: project cards, active project count, loading states, create/edit/delete actions.
- Project detail sections: Blueprint Preview, Rooms, Preferences, Suggestions, Safety, 2D Layout.
- Rooms: card layout with type, dimensions, and actions.
- Suggestions: visual furniture chips for items such as bed, wardrobe, lighting, sofa, table, and TV unit.
- Safety: checklist with category badges for smoke detector, fire extinguisher, exit path, and electrical safety.
- Blueprint comparison: image blueprints display beside and behind the 2D layout with zoom and pan controls; PDF blueprints can be opened from the layout panel.

## 6. API Reference

### 6.1 Auth

- `POST /auth/register`
- `POST /auth/login`

### 6.2 Projects

- `GET /projects`
- `POST /projects`
- `GET /projects/{id}`
- `PUT /projects/{id}`
- `DELETE /projects/{id}`

### 6.3 Project Resources

- `POST /projects/{id}/blueprint`
- `GET /projects/{id}/blueprint/file`
- `GET /projects/{id}/rooms`
- `POST /projects/{id}/rooms`
- `PUT /projects/{id}/rooms/{roomId}`
- `DELETE /projects/{id}/rooms/{roomId}`
- `GET /projects/{id}/preferences`
- `POST /projects/{id}/preferences`
- `GET /projects/{id}/suggestions`
- `GET /projects/{id}/safety`

## 7. Validation And Storage

### 7.1 Validation Rules

- Blueprint uploads support PDF, PNG, JPG, and JPEG only.
- Maximum blueprint upload size is 10MB.
- Room length and width must be greater than zero.
- Supported room types: Bedroom, Living room, Kitchen, Bathroom, Dining room.
- Supported styles: Modern, Minimal, Classic, Industrial.
- Supported budgets: Low, Medium, High.

### 7.2 File Storage

Uploaded blueprint files are stored under `backend/uploads` when running locally and in the `backend_uploads` Docker volume when running through Docker Compose.

## 8. Verification

### 8.1 Backend

```powershell
cd backend
mvn test
```

If Maven is not installed locally:

```powershell
cd backend
docker run --rm -v ${PWD}:/app -w /app maven:3.9.9-eclipse-temurin-17 mvn test
```

### 8.2 Frontend

```powershell
cd frontend
npm install
npm run build
npm audit --audit-level=moderate
```

### 8.3 Docker

```powershell
docker compose build
docker compose up -d
```

## 9. Demo Flow

Register -> Login -> Create Project -> Upload Blueprint -> Add Rooms -> Save Preferences -> View Suggestions -> View Safety -> View 2D Layout.

## 10. Sample Screenshots

Screenshots will be added here after the Phase 1 walkthrough is captured.

- Dashboard
- Project detail
- Blueprint preview with 2D layout
