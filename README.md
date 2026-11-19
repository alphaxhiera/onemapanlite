# OneMapan

OneMapan is a full-stack directory and event-management application for a Buddhist community. It manages members (*umat*), QiuDao records, viharas (fotang), pandita (Dian Chuan Shi), institutions, events/occurrences, role-based access, reporting, and Excel import/export.

## Contents

- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Quick start (local)](#quick-start-local)
- [Default login](#default-login)
- [Configuration](#configuration)
- [Database](#database)
- [Authentication and roles](#authentication-and-roles)
- [API overview](#api-overview)
- [Frontend pages](#frontend-pages)
- [Scripts](#scripts)
- [Build and verification](#build-and-verification)
- [Deployment](#deployment)
- [Security notes](#security-notes)

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15 (Pages Router), React 18, Chakra UI 2, TanStack Query 5, Formik/Yup, FullCalendar, jsPDF/XLSX |
| Backend | Node.js, Express 5, TypeScript, JWT, bcrypt, multer, ExcelJS, Helmet, express-rate-limit |
| Database | SQLite via Prisma 6 (`file:` URL), single file, no separate database server |
| Auth | HS256 JWT carrying `role`, `scope`, `area`, `fotang_id`, and feature permissions |

## Repository layout

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # data model (SQLite)
│   │   ├── migrations/                # one fresh SQLite baseline migration
│   │   ├── migrations_postgres_archive/  # old PostgreSQL migrations (historical only)
│   │   └── seed.ts                    # reference data + default roles
│   ├── scripts/createAdmin.ts         # bootstrap admin account
│   ├── src/                           # Express API
│   └── data/*.csv                     # provinces, cities, districts, localities, fotang, pandita
├── frontend/src/pages/                # Next.js pages
├── docker-compose.yml                 # backend + frontend (SQLite volume)
├── deployment_guide.md                # VPS / Docker deployment runbook
├── .env.example                       # Docker Compose environment template
└── run.bat                            # Windows local development launcher
```

## Quick start (local)

Prerequisites: Node.js 20+ and npm.

### Windows (one command)

Double-click **`run.bat`** or run:

```bat
run.bat
```

It installs missing dependencies, applies migrations, seeds the database on first run, creates the bootstrap admin, and starts both servers in separate windows. It then opens <http://localhost:3000>.

### Manual setup

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed          # first run only: reference data and roles
npm run admin         # first run only: local admin account
npm run dev           # http://localhost:2025

# Frontend (second terminal)
cd frontend
npm install
npm run dev           # http://localhost:3000
```

Check the API with <http://localhost:2025/healthz> → `{"status":"ok"}`.

## Default login

Created by `npm run admin`:

| Username | Password |
| --- | --- |
| `admin` | `Admin@1234` |

Override with `ADMIN_USERNAME` / `ADMIN_PASSWORD` environment variables. The script is idempotent: re-running it will not duplicate the account. **Do not use these credentials in production.**

## Configuration

Backend reads `backend/.env` (or environment variables). For local development the defaults in `run.bat` are sufficient.

| Variable | Required | Default / example | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | `file:./onemapan.db` (local), `file:/app/data/onemapan.db` (Docker) | SQLite file path. Relative paths resolve next to `prisma/schema.prisma`. |
| `JWT_SECRET` | yes | min. 32 chars | Token signing key; the app refuses to start with a missing/placeholder value. |
| `JWT_EXPIRES_IN` | no | `1d` | Token lifetime. |
| `PORT` | no | `2025` | API port. |
| `HOST` | no | `0.0.0.0` | API bind address; use `127.0.0.1` behind a reverse proxy. |
| `SERVER_BASE_URL` | yes | `http://localhost:2025` | Public API base URL used for uploaded image links. |
| `ALLOWED_ORIGINS` | no | `http://localhost:3000` | Comma-separated CORS allow-list. |
| `TRUST_PROXY` | no | `1` behind Nginx | Required for correct per-IP rate limiting. |
| `UPLOAD_MAX_FILE_SIZE` | no | `5242880` | Max upload size in bytes. |
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:2025` | Browser API base URL, inlined at build time. |

Docker Compose reads the root `.env` (copy `.env.example`). It contains only `JWT_SECRET`, URLs, and optional tuning values — no database credentials.

## Database

- SQLite file: `backend/prisma/onemapan.db` locally, `/app/data/onemapan.db` in Docker (named volume `db_data`).
- Prisma 6 keeps enums and `Role.permissions Json` on SQLite. Native PostgreSQL types were removed and case-insensitive search is implemented with `COLLATE NOCASE` in the baseline migration.
- `npm run seed` imports reference CSVs in foreign-key order and creates the default roles: `Super Admin`, `Ketua Lembaga`, `Sekjen Lembaga`, `Admin`, `Admin Vihara`, `User`. It skips reference data if provinces already exist.
- The old PostgreSQL migration history is archived in `backend/prisma/migrations_postgres_archive/` and is not used.
- SQLite is single-writer: run only one backend instance per database file. Back up with `sqlite3 onemapan.db ".backup ..."` or a file copy while the app is stopped. See [deployment_guide.md](deployment_guide.md#210-backups).

## Authentication and roles

- `POST /login` returns a JWT. Send it as `Authorization: Bearer <token>` on protected routes.
- Token scopes: `nasional`, `wilayah`, `fotang`, `self`. Scope is derived from role permissions and the user's QiuDao/vihara.
- `Super Admin`, `Ketua Lembaga`, and `Sekjen Lembaga` have national access; `Admin` is wilayah-scoped; `Admin Vihara` is vihara-scoped; regular `User` accounts are self-scoped.
- Data writes are additionally scope-checked in controllers (e.g. events may only be edited in the user's wilayah; master data changes require national access).
- Expired or invalid tokens clear local session data and redirect to `/login`.

## API overview

All routes except `/register`, `/login`, `/healthz`, and `/uploads/*` require a valid JWT.

| Prefix | Description |
| --- | --- |
| `/healthz` | Liveness check (does not touch the database). |
| `/register`, `/login`, `/change-password` | Credential creation, login, password change. |
| `/profile/user` | Member CRUD with paging, search, and filters. |
| `/profile/qiudao` | QiuDao CRUD and filtered listing. |
| `/profile/location` | Location CRUD plus province/city/district/locality lookups. |
| `/fotang`, `/dianchuanshi`, `/institution` | Master data; writes require national access. |
| `/event` | Event CRUD, filtered listing, poster upload (`multipart/form-data`, field `poster`). |
| `/dashboard/stats` | Scope-filtered counts for the dashboard. |
| `/import/umat`, `/import/qiudao` | Excel import (scope enforced while resolving viharas). |
| `/export/umat`, `/export/qiudao` | Excel export (national scope only). |
| `/role` | Roles, permissions, and user-role assignment (national access; Super Admin only for Super Admin roles). |
| `/uploads/*` | Stored poster images. |

## Frontend pages

| Area | Pages |
| --- | --- |
| Overview | `/dashboard`, `/report` |
| Events | `/event`, `/event/editEvent` |
| People | `/umat`, `/umat/addUmat`, `/umat/editUmat`, `/qiudao`, `/qiudao/addQiudao`, `/qiudao/editQiudao` |
| Master data | `/fotang`, `/dianchuanshi`, `/institution` (+ add/edit pages) |
| Administration | `/role`, `/settings`, `/login`, `/register` |

## Scripts

Run from `backend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start API with nodemon. |
| `npm run build` | Compile TypeScript to `dist/`. |
| `npm run seed` | Seed reference data and default roles. |
| `npm run admin` | Create/bootstrap the local admin account. |
| `npx prisma migrate deploy` | Apply pending SQLite migrations. |
| `npx prisma generate` | Regenerate Prisma Client after schema changes. |

Run from `frontend/`: `npm run dev`, `npm run build`, `npm start`, `npm run lint`.

## Build and verification

```bash
cd backend  && npx prisma generate && npx tsc --noEmit && npm run build
cd frontend && npm run build
```

Smoke test: start the app, call `/healthz`, log in with the admin account, then create/read a record in each module.

## Deployment

For bare VPS (PM2 + Nginx) and Docker deployment, backups, SSL, environment reference, and troubleshooting, see **[deployment_guide.md](deployment_guide.md)**.

## Security notes

- Set a strong, unique `JWT_SECRET` (≥32 chars) before any non-local use; changing it invalidates all existing tokens.
- The seeded admin password is for local testing only. Remove or rotate that account and delete unused default roles in production.
- Uploaded files are validated by magic bytes (JPEG/PNG for posters, ZIP signature for Excel imports).
- Rate limits: 10 requests / 15 min on login, register, change-password; 30 / 15 min on uploads. Set `TRUST_PROXY=1` behind a proxy so limits apply per client IP.
- Do not expose ports 2025 or 3000 publicly; place Nginx in front and bind them to loopback.
