# CodeVault

CodeVault is a full-stack code snippet management system for developers and teams. It supports secure authentication, private and team-scoped snippet sharing, public snippet discovery, inline review comments, notifications, fuzzy search, and a mobile-friendly React workspace.

## What’s Included

- Clean landing page and responsive workspace UI
- Cookie-based JWT authentication with remember-me support
- Optional two-factor authentication with backup codes
- Private, public, and team snippet visibility
- Team creation and invite-code joins
- Review comments and update notifications
- Fuzzy snippet search with filters for language, visibility, team, and scope
- Prisma + PostgreSQL schema designed for growth and indexed lookups
- CI workflow for frontend and backend validation

## Stack

### Frontend

- React 19
- React Router 7 
- Vite
- Plain CSS with reusable UI components
- `lucide-react` icons

### Backend

- Node.js
- Express 5
- Prisma ORM
- PostgreSQL
- `jsonwebtoken`
- `bcrypt`
- `helmet`
- `cors`
- `express-rate-limit`

## Project Structure

```text
CodeVault/
├── .github/workflows/ci.yml
├── frontend/codeVault/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── config/
│   ├── .env
│   └── package.json
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   ├── .env
│   └── package.json
└── README.md
```

## Core Concepts

### Snippet Visibility

- `PRIVATE`: visible only to the owner and explicitly granted editors
- `TEAM`: visible to members of the selected team
- `PUBLIC`: visible in the community library

### Team Roles

- `OWNER`: full control over the team and its team-shared snippets
- `ADMIN`: elevated team management access
- `MEMBER`: can view and contribute within team boundaries

### Notifications

Notifications are generated when:

- someone comments on a snippet you own or collaborate on
- a shared snippet is updated
- a new member joins your team

## Local Setup

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL

### 1. Clone and install

```bash
git clone <your-repo-url>
cd CodeVault
```

```bash
cd server
npm install
```

```bash
cd ../frontend/codeVault
npm install
```

### 2. Environment files

The repository now uses committed final env files instead of `.env.example` templates.

Backend: `server/.env`

```env
DATABASE_URL="postgresql://user:password@localhost:5432/codevault"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
COOKIE_SECURE="false"
COOKIE_SAMESITE="lax"
```

Frontend: `frontend/codeVault/.env`

```env
VITE_BACKEND_URL=http://localhost:3000
```

### 3. Prepare the database

```bash
cd server
npx prisma generate
npx prisma migrate dev
```

### 4. Start the apps

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd frontend/codeVault
npm run dev
```

Frontend runs on `http://localhost:5173`. Backend runs on `http://localhost:3000`.

## Useful Scripts

### Frontend

```bash
npm run dev
npm run lint
npm run build
npm run check
```

### Backend

```bash
npm run dev
npm run start
npm run prisma:generate
npm run prisma:validate
npm run check:imports
npm test
```

## Authentication Flow

### Login

`POST /api/auth/login`

Request body:

```json
{
  "email": "dev@example.com",
  "password": "super-secure-password",
  "rememberMe": true,
  "twoFactorCode": "123456"
}
```

Behavior:

- returns a session cookie on success
- returns `twoFactorRequired: true` when 2FA is enabled but no code is provided
- accepts either a 6-digit TOTP code or a backup code when 2FA is enabled

### Signup

`POST /api/auth/signup`

Request body:

```json
{
  "name": "Dev User",
  "email": "dev@example.com",
  "password": "super-secure-password",
  "rememberMe": true
}
```

Behavior:

- creates the user
- immediately creates a secure session cookie

### Session endpoints

- `GET /api/auth/me`
- `PUT /api/auth/me`
- `POST /api/auth/logout`

### Two-factor endpoints

- `POST /api/auth/2fa/setup`
- `POST /api/auth/2fa/enable`
- `POST /api/auth/2fa/disable`

`/2fa/setup` returns:

```json
{
  "success": true,
  "data": {
    "secret": "BASE32SECRET",
    "otpauthUrl": "otpauth://totp/...",
    "backupCodes": ["1234-5678", "...."]
  }
}
```

## API Overview

All API responses follow this shape:

```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data": {},
  "meta": {}
}
```

Error responses:

```json
{
  "success": false,
  "message": "Meaningful error message"
}
```

### Auth

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Register and create a session |
| `POST` | `/api/auth/login` | Sign in, optionally complete 2FA |
| `POST` | `/api/auth/logout` | Clear the session cookie |
| `GET` | `/api/auth/me` | Get current user and summary |
| `PUT` | `/api/auth/me` | Update profile and session preference |
| `POST` | `/api/auth/2fa/setup` | Generate a TOTP secret and backup codes |
| `POST` | `/api/auth/2fa/enable` | Enable 2FA with a valid code |
| `POST` | `/api/auth/2fa/disable` | Disable 2FA with a valid code |

### Snippets

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/snippets` | Get accessible snippets for the current user |
| `GET` | `/api/snippets/:id` | Get a specific accessible snippet |
| `POST` | `/api/snippets` | Create a snippet |
| `PUT` | `/api/snippets/:id` | Update a snippet |
| `DELETE` | `/api/snippets/:id` | Delete a snippet |
| `GET` | `/api/snippets/public` | Browse public snippets |
| `GET` | `/api/snippets/:id/comments` | List comments for a snippet |
| `POST` | `/api/snippets/:id/comments` | Add a comment to a snippet |

### Snippet query parameters

Supported on `GET /api/snippets`:

- `q`
- `scope=workspace|mine|shared|team`
- `language`
- `visibility`
- `teamId`
- `page`
- `limit`
- `sortBy=createdAt|updatedAt|title|language`
- `sortOrder=asc|desc`

Supported on `GET /api/snippets/public`:

- `q`
- `language`
- `tag`
- `page`
- `limit`

### Teams

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/teams` | List the user’s teams |
| `POST` | `/api/teams` | Create a team |
| `POST` | `/api/teams/join` | Join a team with an invite code |

### Notifications

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/notifications` | List notifications |
| `PATCH` | `/api/notifications/:id/read` | Mark one notification as read |
| `PATCH` | `/api/notifications/read-all` | Mark all notifications as read |

## Database Notes

The Prisma schema includes:

- users with role, session, and 2FA state
- teams and team memberships
- snippets with visibility and ownership
- snippet collaborators
- comments
- notifications

Indexes are included for common growth paths:

- user + updated snippet lookups
- visibility + updated snippet lookups
- team snippet lookups
- language lookups
- title search
- notification reads
- comment history

The latest migration also creates PostgreSQL search indexes for:

- snippet title trigram matching
- snippet code trigram matching
- snippet tag array lookups

## Deployment

Deployment details live in [DEPLOYMENT.md](./DEPLOYMENT.md). The short version:

- Frontend: deploy `frontend/codeVault` to Vercel
- Backend: deploy `server` to Render or Railway
- Database: provision PostgreSQL and run `npx prisma migrate deploy`
- CI: GitHub Actions validates frontend lint/build and backend Prisma/module integrity

## CI

The workflow at `.github/workflows/ci.yml` runs on pushes and pull requests:

- frontend lint
- frontend production build
- Prisma client generation
- Prisma schema validation
- backend module import checks

## Contributor Notes

- Keep snippet visibility rules aligned across frontend filters and backend access checks.
- Use cookie-based auth only. Tokens are intentionally not stored in localStorage.
- When changing Prisma models, add a migration and regenerate the client.
- Prefer reusable UI components over page-local duplication.

## Current Validation

The project was validated with:

- `frontend/codeVault`: `npm run lint`, `npm run build`
- `server`: `npx prisma validate`, `npx prisma generate`, backend import checks
