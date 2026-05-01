# Home Interior & Safety Design App

Phase 1.6+ MVP for uploading home blueprints, tracing rooms from image blueprints, defining rooms and design preferences, manually mapping rooms on a blueprint, arranging furniture interactively, then viewing rule-based interior suggestions, safety recommendations, a polished 2D SVG layout, and a printable design summary.

## 1. Overview

### 1.1 What This App Does

- Registers and authenticates users with JWT.
- Lets each user manage their own interior design projects.
- Stores blueprint uploads locally.
- Generates rule-based design suggestions and safety recommendations.
- Displays rooms in a polished 2D SVG layout with furniture placeholders and safety markers.
- Lets users trace new rooms directly from PNG/JPG blueprints.
- Supports manual blueprint mapping for image blueprints.
- Supports interactive furniture placement inside mapped rooms.
- Lets users drag, resize, rotate, and delete furniture items with persisted percentage coordinates.
- Keeps unmapped rooms visible in a fallback area when only some rooms are mapped.
- Provides a printable browser summary for project handoff.

### 1.2 Phase 1.6+ Scope

- Included: React web app, Spring Boot API, PostgreSQL, JWT auth, local uploads, rule-based suggestions, safety checklist, 2D visualization, manual room tracing from PNG/JPG blueprints, manual blueprint mapping, interactive furniture layout editing, printable summary.
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
docker compose up --build -d
```

Services:

- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- PostgreSQL: localhost:5432

Check running containers:

```powershell
docker compose ps
```

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

Frontend npm commands use `frontend/package.json`. If you are at the repo root, either `cd frontend` first or use `npm --prefix frontend run dev`.

## 5. Features

### 5.1 Project Workflow

- Create, edit, delete, and view projects.
- Upload one blueprint per project.
- Add, edit, and delete rooms.
- Save design preferences.
- View rule-based suggestions and safety recommendations.
- Trace new rooms directly from uploaded PNG/JPG blueprints.
- Map room rectangles over uploaded PNG/JPG blueprints.
- Refine mapped rooms with drag, resize handles, snapping, alignment guides, and soft overlap warnings.
- Add furniture to selected mapped rooms and adjust furniture with drag, resize, rotate, and delete controls.
- Print a project summary from the browser.

### 5.2 Frontend UX

- Sidebar navigation: Dashboard, Projects, Logout.
- Dashboard: project cards, active project count, loading states, create/edit/delete actions.
- Project detail workspace: fixed sidebar, sticky top header, left mapping tools, central blueprint canvas, right rooms panel, results below canvas, setup forms at the bottom.
- Rooms: card layout with type, dimensions, and actions.
- Suggestions: grouped by room with visual furniture chips and rule-based explanation text.
- Safety: grouped by Fire, Smoke Detection, Exit Path, and Electrical Safety with priority labels.
- 2D layout: mapped rooms align over the faint blueprint image; unmapped rooms render in a fallback area with dashed borders and `Not mapped` labels.
- Layout helper: mapped and unmapped room lists show above the layout, and unmapped rooms include a `Map this room` action.
- Blueprint tracing: draw a rectangle over a PNG/JPG blueprint, enter room details, and create a room with saved mapping coordinates.
- Blueprint mapping: map existing rooms over PNG/JPG blueprints and reuse saved percentage coordinates in the 2D layout.
- Mapping precision: mapped room coordinates use the exact rendered blueprint image bounds, not the surrounding canvas.
- Room editing: mapped rooms can be selected, dragged, resized from corners, snapped to grid/edges, and persisted.
- Furniture editing: selected mapped rooms expose an Add Furniture panel for Bed, Sofa, Table, Wardrobe, and TV unit. Furniture can be selected, dragged within room bounds, resized, rotated, deleted, and reloaded from the backend.
- Export summary: browser print support with project details, rooms, preferences, suggestions, safety checklist, and printable layout.

## 6. API Reference

All project APIs require a JWT bearer token. Missing or invalid tokens return `401`; authenticated users can only access their own projects.

### 6.1 Auth

- `POST /auth/register` - create an account and return a JWT session.
- `POST /auth/login` - authenticate and return a JWT session.

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
- `POST /projects/{id}/rooms/{roomId}/furniture`
- `PUT /projects/{id}/rooms/{roomId}/furniture/{furnitureId}`
- `DELETE /projects/{id}/rooms/{roomId}/furniture/{furnitureId}`
- `GET /projects/{id}/preferences`
- `POST /projects/{id}/preferences`
- `GET /projects/{id}/suggestions`
- `GET /projects/{id}/safety`

## 7. Validation And Storage

### 7.1 Validation Rules

- Blueprint uploads support PDF, PNG, JPG, and JPEG only.
- Maximum blueprint upload size is 10MB.
- Room length and width must be greater than zero.
- Manual room mapping stores optional `mapX`, `mapY`, `mapWidth`, and `mapHeight` percentage coordinates relative to the rendered blueprint image.
- Rooms without mapping still appear in the 2D layout using automatic fallback placement.
- Furniture stores `xPercent`, `yPercent`, `widthPercent`, `heightPercent`, and `rotationAngle` relative to its room.
- Furniture is constrained to remain inside room bounds.
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

Run frontend commands from the `frontend/` directory:

```powershell
cd frontend
npm install
npm run build
npm audit --audit-level=moderate
```

Equivalent build command from the repo root:

```powershell
npm --prefix frontend run build
```

### 8.3 Docker

```powershell
docker compose up --build -d
docker compose ps
```

Expected checks:

- Frontend responds at `http://localhost:5173`.
- Backend health responds at `http://localhost:8080/health` with `{"status":"ok"}`.
- Unauthenticated `GET /projects` returns `401`.
- `npm audit --audit-level=moderate` reports no moderate-or-higher vulnerabilities.

## 9. Demo Flow

Register -> Login -> Create Project -> Upload Blueprint -> Trace Rooms From Blueprint or Add Rooms Manually -> Map Existing Rooms If Needed -> Refine Room Position With Drag/Resize -> Add Furniture -> Drag/Resize/Rotate Furniture -> Save Preferences -> Generate Suggestions -> View Safety Recommendations -> View 2D Layout -> Print Summary.

## 10. Sample Screenshots

Screenshots can be added under the `assets/` folder after running the Phase 1 walkthrough.

### Dashboard

![Dashboard](assets/dashboard.png)

### Project Detail

![Project Detail](assets/project-detail.png)

### Blueprint Preview With 2D Layout

![Blueprint Layout](assets/blueprint-layout.png)

### Partial Mapping Fallback Layout

![Partial Mapping Layout](assets/partial-mapping-layout.png)

### Manual Blueprint Mapping

![Manual Mapping](assets/manual-mapping.png)

### Interactive Furniture Layout Editing

![Furniture Editing](assets/furniture-editing.png)

### Trace Rooms From Blueprint

![Blueprint Tracing](assets/blueprint-tracing.png)

### Phase 1.5 Result Dashboard

![Result Dashboard](assets/result-dashboard.png)

### Suggestions And Safety Checklist

![Suggestions Safety](assets/suggestions-safety.png)

### Printable Summary

![Printable Summary](assets/print-summary.png)

### How To Capture Screenshots

- Run the app with `docker compose up --build -d`.
- Open `http://localhost:5173`.
- Register or log in.
- Create a sample project.
- Upload a sample blueprint.
- Use Trace new room on a PNG/JPG blueprint, or add rooms manually.
- Draw room rectangles in Manual Blueprint Mapping.
- Use `Map this room` from the 2D layout for any unmapped rooms.
- Select a mapped room and add furniture from the Add Furniture panel.
- Drag, resize, rotate, and delete furniture items to capture the interactive layout editor.
- Save preferences.
- Generate suggestions.
- Open each page and save screenshots into `/assets`.

Screenshots are intentionally not generated automatically because they depend on local browser rendering and sample blueprint data.
