# AGENTS.md

## Structure

Two independent packages — separate `node_modules`, lockfiles, and installs (not an npm workspace):

- **Root** — Angular 21 frontend (zoneless, standalone components, Vitest, Tailwind)
- **`backend/`** — NestJS 11 API (MySQL/TypeORM, JWT auth, Jest)

Frontend serves on `:4200`, backend on `:3000`. No proxy — frontend hardcodes `http://localhost:3000` in `src/environments/environment.ts`.

## Commands

### Frontend (root)

```bash
npm start              # ng serve (dev server)
npm run build          # production build → dist/
npm test               # Vitest via ng test
```

### Backend (from `backend/`)

```bash
npm run start:dev      # nest start --watch
npm test               # Jest (unit, rootDir=src, *.spec.ts)
npm run test:e2e       # Jest with test/jest-e2e.json (*.e2e-spec.ts)
npm run lint           # eslint --fix
npm run build          # nest build → backend/dist/
```

Run both `npm install` (root and backend) before starting.

## Database

- MySQL must be running locally. TypeORM `synchronize: true` auto-creates tables.
- Connection settings in `backend/.env` (also defaults in `app.module.ts`): host `localhost`, db `luxury_service`, user `root`, pass `Victus2025`.
- Seed sample data: `node backend/setup-db.js` (raw SQL, hardcoded credentials matching .env). Alternatively `POST /orders/seed-sample-orders`.
- Order IDs are `varchar(64)` strings formatted `ORD-YYYYMMDD-NNN` — never auto-increment.

## Auth & Roles

- Login: `POST /auth/login` → `{ access_token, user }`. Frontend stores both in `localhost`; `authInterceptor` attaches `Authorization: Bearer`.
- Roles (Spanish, stored as enum strings): `RECEPCIONISTA`, `JEFE_DE_PATIO`, `TECNICO`, `LUBRICADOR`, `GERENTE_COMERCIAL`, `ADMINISTRADOR`, `SUPER_ADMIN`.
- `AdminGuard` verifies JWT manually (not via passport) and accepts `ADMINISTRADOR`, `SUPER_ADMIN`, or `ADMIN`.
- `UserRole` entity enum includes alias entries (`ADMIN = 'ADMINISTRADOR'`, `USER = 'RECEPCIONISTA'`) — only the 7 real roles are persisted.

## Conventions

- Domain language is Spanish: order steps ("pasos" 1–6), UI text, and API error messages.
- Frontend is **zoneless** (`provideZonelessChangeDetection`) — no zone.js; avoid zone-dependent patterns.
- Prettier: `printWidth: 100`, `singleQuote: true`, Angular HTML parser. Applies to both packages.
- Backend Jest `rootDir` is `src/` — spec files live alongside source in `backend/src/`.
- No CI workflows or pre-commit hooks configured.
