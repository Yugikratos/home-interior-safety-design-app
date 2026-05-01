# Home Interior & Safety Design App

Phase 2 MVP for uploading home blueprints, detecting likely room areas from image blueprints, tracing rooms manually, refining mapped rooms, arranging furniture interactively or automatically, then viewing layout-aware interior suggestions, safety recommendations, a polished 2D SVG layout, and a printable design summary.

## 1. Overview

### 1.1 What This App Does

- Registers and authenticates users with JWT.
- Lets each user manage their own interior design projects.
- Stores blueprint uploads locally.
- Generates layout-aware design suggestions and safety recommendations.
- Displays rooms in a polished 2D SVG layout with furniture placeholders and safety markers.
- Lets users trace new rooms directly from PNG/JPG blueprints.
- Supports manual blueprint mapping for image blueprints.
- Provides an OpenCV blueprint processing service with edge detection, Hough line wall detection, enclosed contour filtering, and confidence scoring.
- Supports interactive furniture placement inside mapped rooms.
- Lets users drag, resize, rotate, and delete furniture items with persisted percentage coordinates.
- Auto-arranges furniture by room type using percentage coordinates.
- Scores each mapped room layout in real time from furniture utilization, spacing, wall alignment, and safety.
- Keeps unmapped rooms visible in a fallback area when only some rooms are mapped.
- Provides a printable browser summary for project handoff.

### 1.2 Phase 2 Scope

- Included: React web app, Spring Boot API, PostgreSQL, JWT auth, local uploads, OpenCV-based room detection for PNG/JPG blueprints, manual room tracing, manual blueprint mapping, interactive furniture layout editing, auto furniture arrangement, live room layout scoring, layout-aware suggestions, layout-based safety checks, 2D visualization, printable summary.
- Not included: AI models, ML training, door/window detection, 3D visualization, mobile app, cloud file storage, PDF auto-detection.

## 2. Architecture

### 2.1 Tech Stack

- Frontend: React + Vite + TypeScript
- Backend: Spring Boot + Java 17
- Blueprint processor: Python + FastAPI + OpenCV
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
blueprint-processor/   FastAPI OpenCV room detection service
docker-compose.yml     Postgres, backend, frontend, and blueprint processor services
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
docker compose up -d
```

Use this command for normal runs after the images have already been built.

Rebuild after code or dependency changes:

```powershell
docker compose up --build -d
```

Services:

- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- PostgreSQL: localhost:5432
- Blueprint processor: http://localhost:8000

Check running containers:

```powershell
docker compose ps
```

Stop the app:

```powershell
docker compose down
```

### 4.2 Local Development

Start PostgreSQL:

```powershell
docker compose up postgres
```

Start the blueprint processor locally through Docker when developing backend integration:

```powershell
docker compose up blueprint-processor
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
- View layout-aware suggestions and safety recommendations.
- Auto-detect likely room rectangles from uploaded PNG/JPG blueprints.
- Trace new rooms directly from uploaded PNG/JPG blueprints.
- Map room rectangles over uploaded PNG/JPG blueprints.
- Refine mapped rooms with drag, resize handles, snapping, alignment guides, and soft overlap warnings.
- Add or auto-arrange furniture in selected mapped rooms, then adjust furniture with drag, resize, rotate, and delete controls.
- Review live room scores for space utilization, spacing, wall alignment, and safety while editing furniture.
- Print a project summary from the browser.

### 5.2 Frontend UX

- Sidebar navigation: Dashboard, Projects, Logout.
- Dashboard: project cards, active project count, loading states, create/edit/delete actions.
- Project detail workspace: fixed sidebar, sticky top header, left mapping tools, central blueprint canvas, right rooms panel, results below canvas, setup forms at the bottom.
- Rooms: card layout with type, dimensions, and actions.
- Suggestions: grouped by room with visual furniture chips, room-size logic, placed-furniture context, and explanation text.
- Safety: grouped by Fire, Smoke Detection, Exit Path, and Electrical Safety with High/Medium/Low priorities and layout-aware warnings.
- 2D layout: mapped rooms align over the faint blueprint image; unmapped rooms render in a fallback area with dashed borders and `Not mapped` labels.
- Layout helper: mapped and unmapped room lists show above the layout, and unmapped rooms include a `Map this room` action.
- Auto detection: click `Auto Detect Rooms` to call the Python OpenCV service. It uses Canny edges, Hough line wall detection, enclosed contour filtering, and confidence scoring. Detected rectangles are saved as editable mapped rooms named `Detected Room N`.
- Blueprint tracing: draw a rectangle over a PNG/JPG blueprint, enter room details, and create a room with saved mapping coordinates.
- Blueprint mapping: map existing rooms over PNG/JPG blueprints and reuse saved percentage coordinates in the 2D layout.
- Mapping precision: mapped room coordinates use the exact rendered blueprint image bounds, not the surrounding canvas.
- Room editing: mapped rooms can be selected, dragged, resized from corners, snapped to grid/edges, and persisted.
- Furniture editing: selected mapped rooms expose an Add Furniture panel for Bed, Sofa, Table, Wardrobe, and TV unit. Furniture can be auto-arranged, selected, dragged within room bounds, resized, rotated, deleted, and reloaded from the backend.
- Layout intelligence: selected mapped rooms show a debounced live score card and structured suggestions such as overlap warnings, wall alignment improvements, unused-space suggestions, and center-path safety risks.
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
- `POST /projects/{id}/blueprint/detect`
- `GET /projects/{id}/rooms`
- `POST /projects/{id}/rooms`
- `PUT /projects/{id}/rooms/{roomId}`
- `DELETE /projects/{id}/rooms/{roomId}`
- `POST /projects/{id}/rooms/{roomId}/furniture`
- `PUT /projects/{id}/rooms/{roomId}/furniture/{furnitureId}`
- `DELETE /projects/{id}/rooms/{roomId}/furniture/{furnitureId}`
- `POST /projects/{id}/rooms/{roomId}/furniture/auto-arrange`
- `GET /projects/{id}/rooms/{roomId}/layout-score`
- `GET /projects/{id}/preferences`
- `POST /projects/{id}/preferences`
- `GET /projects/{id}/suggestions`
- `GET /projects/{id}/safety`

## 7. Validation And Storage

### 7.1 Validation Rules

- Blueprint uploads support PDF, PNG, JPG, and JPEG only.
- Auto detection supports PNG and JPG only.
- Maximum blueprint upload size is 10MB.
- Room length and width must be greater than zero.
- Manual room mapping stores optional `mapX`, `mapY`, `mapWidth`, and `mapHeight` percentage coordinates relative to the rendered blueprint image.
- Rooms without mapping still appear in the 2D layout using automatic fallback placement.
- Furniture stores `xPercent`, `yPercent`, `widthPercent`, `heightPercent`, and `rotationAngle` relative to its room.
- Furniture is constrained to remain inside room bounds.
- Auto Arrange replaces the selected room's furniture with a room-type-specific starter layout.
- Layout scoring returns `overallScore`, `space`, `spacing`, `alignment`, `safety`, unused-space percentage, and structured `warning`, `improve`, or `suggestion` messages.
- Safety checks include smoke detector coverage, extinguisher placement, exit path clearance, furniture overlap, and overcrowding.
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

Register -> Login -> Create Project -> Upload Blueprint -> Auto Detect Rooms or Trace Rooms From Blueprint -> Refine Room Position With Drag/Resize -> Add Furniture or Auto Arrange -> Drag/Resize/Rotate Furniture -> Watch Room Score and Live Suggestions -> Save Preferences -> Generate Suggestions -> View Safety Recommendations -> View 2D Layout -> Print Summary.

## 10. Sample Screenshots

Screenshots can be added under the `assets/` folder after running the Phase 2 walkthrough.

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

### Phase 2 Result Dashboard

![Result Dashboard](assets/result-dashboard.png)

### Suggestions And Safety Checklist

![Suggestions Safety](assets/suggestions-safety.png)

### Printable Summary

![Printable Summary](assets/print-summary.png)

### How To Capture Screenshots

- Run the app with `docker compose up -d`.
- Open `http://localhost:5173`.
- Register or log in.
- Create a sample project.
- Upload a sample blueprint.
- Click `Auto Detect Rooms` on a PNG/JPG blueprint, or use Trace new room.
- Draw room rectangles in Manual Blueprint Mapping.
- Use `Map this room` from the 2D layout for any unmapped rooms.
- Select a mapped room and add furniture or click `Auto Arrange` from the Add Furniture panel.
- Move or resize furniture and capture the live Room Score card and issue highlights.
- Drag, resize, rotate, and delete furniture items to capture the interactive layout editor.
- Save preferences.
- Generate suggestions.
- Open each page and save screenshots into `/assets`.

Screenshots are intentionally not generated automatically because they depend on local browser rendering and sample blueprint data.
