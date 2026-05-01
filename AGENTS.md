# Repository Guidelines

## Project Structure & Module Organization

This repository contains a Phase 2 full-stack MVP.

- `frontend/`: React + Vite + TypeScript app. Source lives in `frontend/src`, with pages in `src/pages`, reusable UI in `src/components`, API calls in `src/api.ts`, and shared types in `src/types.ts`.
- `backend/`: Spring Boot Java app. Source lives in `backend/src/main/java/com/homeinterior`, organized by `controller`, `service`, `repository`, `model`, `dto`, `security`, `config`, and `exception`.
- `blueprint-processor/`: Python FastAPI service using OpenCV for blueprint room detection with edges, Hough wall lines, contours, and confidence scoring.
- `backend/src/test`: Spring Boot tests and test configuration.
- `assets/`: README screenshot placeholders and presentation images.
- `docker-compose.yml`: PostgreSQL, backend, frontend, and blueprint processor services.
- `.env.example`: safe sample environment values. Do not commit `.env`.

## Build, Test, and Development Commands

- `docker compose up -d`: run already-built PostgreSQL, backend, frontend, and blueprint processor services.
- `docker compose up --build`: rebuild and run PostgreSQL, backend, frontend, and blueprint processor.
- `docker compose build`: build service images without starting them.
- `cd frontend && npm install`: install frontend dependencies.
- `cd frontend && npm run dev`: run the Vite dev server.
- `cd frontend && npm run build`: type-check and build the frontend.
- `cd frontend && npm audit --audit-level=moderate`: check frontend dependency advisories.
- `cd backend && mvn spring-boot:run`: run the backend locally.
- `cd backend && mvn test`: run backend tests.
- `cd backend && docker run --rm -v ${PWD}:/app -w /app maven:3.9.9-eclipse-temurin-17 mvn test`: run backend tests when Maven is not installed locally.

## Coding Style & Naming Conventions

Use TypeScript strict mode and React function components. Name components in `PascalCase` and helpers/functions in `camelCase`. Keep API types in `types.ts` aligned with backend DTO responses.

Use Java 17 conventions in the backend: classes in `PascalCase`, methods and fields in `camelCase`, and package names lowercase. Keep controller logic thin; route business rules through services and repositories.

Room and furniture layout coordinates are persisted as percentages. Keep blueprint room mapping relative to the rendered blueprint image bounds, and keep furniture coordinates relative to the containing room. Blueprint auto-detection is an OpenCV helper, not an AI model. Keep Phase 2 intelligence rule-based and layout-aware.

## Testing Guidelines

Backend tests use Spring Boot Test, JUnit 5, Spring Security Test, MockMvc, and H2. Add tests for validation, ownership checks, authentication, uploads, and service behavior when changing backend APIs.

Frontend currently relies on TypeScript build checks. If adding a test runner, place component tests near components or under `frontend/src/__tests__`.

## Commit & Pull Request Guidelines

The history currently has only `Initial commit`, so use short imperative commits going forward, for example `Add upload validation` or `Fix expired token handling`.

Pull requests should include a concise summary, test commands run, linked issue if applicable, screenshots for UI changes, and notes for any API or environment changes.

## Security & Configuration Tips

Never commit secrets. Keep JWT and database values in `.env`. Blueprint uploads are local files, limited to PDF/PNG/JPG/JPEG and 10MB. Preserve per-user project ownership checks on every project-scoped API, including rooms and furniture.
