# SDE Challenge - Message App

A full-stack message application built with Nx monorepo, featuring Next.js frontend and NestJS backend.

## Features

- User authentication (sign-up, sign-in) with JWT tokens
- Automatic token refresh via Axios interceptors
- Create, read, update, delete messages (max 240 characters)
- Filter messages by tag, author, and date range
- Cursor-based pagination with infinite scroll
- List virtualization for performance
- Optimistic UI updates for edit/delete operations
- Ownership-based edit/delete permissions

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- TanStack Query for data fetching/caching
- Axios with interceptors for API calls
- Tailwind CSS with shadcn/ui components
- react-cool-virtual for list virtualization

### Backend
- NestJS
- MongoDB with Mongoose
- JWT authentication (@nestjs/jwt)
- bcrypt for password hashing
- class-validator for DTO validation

### Infrastructure
- Nx monorepo
- Docker Compose for MongoDB
- Shared types library

## Prerequisites

- Node.js 18+
- npm 9+
- Docker and Docker Compose

## Quick Start

### 1. Clone and Install Dependencies

```bash
cd sde-challenge-fs
npm install
```

### 2. Start MongoDB

```bash
docker-compose up -d
```

### 3. Configure Environment

Backend environment is pre-configured in `apps/sde-back-end/.env`. For production, update:

```bash
# apps/sde-back-end/.env
MONGODB_URI=mongodb://admin:password123@localhost:27017/sde_messages?authSource=admin
JWT_SECRET=your-production-secret-key
JWT_ACCESS_TOKEN_TTL=3600
JWT_REFRESH_TOKEN_TTL=86400
PORT=3001
```

Frontend environment:

```bash
# apps/sde-front-end/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Run the Applications

#### Option A: Run both in parallel
```bash
npx nx run-many -t serve -p sde-front-end sde-back-end
```

#### Option B: Run separately
```bash
# Terminal 1 - Backend
npx nx serve sde-back-end

# Terminal 2 - Frontend
npx nx serve sde-front-end
```

### 5. Access the App

- Frontend: http://localhost:4200
- Backend API: http://localhost:3001/api

## Available Commands

```bash
# Development
npx nx serve sde-front-end    # Start frontend dev server
npx nx serve sde-back-end     # Start backend dev server
npx nx run-many -t serve      # Start all apps

# Build
npx nx build sde-front-end    # Build frontend
npx nx build sde-back-end     # Build backend
npx nx run-many -t build      # Build all

# Testing
npx nx test sde-back-end      # Run backend tests
npx nx test sde-front-end     # Run frontend tests

# Linting
npx nx lint sde-front-end     # Lint frontend
npx nx lint sde-back-end      # Lint backend
npx nx run-many -t lint       # Lint all

# Generate
npx nx g @nx/js:library my-lib --directory=libs/my-lib  # New library
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/sign-up | Register new user |
| POST | /api/auth/sign-in | Login |
| POST | /api/auth/refresh-token | Refresh access token |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Get current user |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/messages | List messages (with filters) |
| POST | /api/messages | Create message |
| GET | /api/messages/:id | Get single message |
| PATCH | /api/messages/:id | Update message (owner only) |
| DELETE | /api/messages/:id | Delete message (owner only) |

### Query Parameters for GET /api/messages
- `tag` - Filter by tag (general, announcement, question, idea, feedback)
- `authorId` - Filter by author ID
- `fromDate` - Filter by start date (ISO string)
- `toDate` - Filter by end date (ISO string)
- `cursor` - Pagination cursor (message ID)
- `limit` - Page size (default: 20, max: 50)

## Project Structure

```
sde-challenge-fs/
├── apps/
│   ├── sde-front-end/         # Next.js frontend
│   │   └── src/
│   │       ├── app/           # App Router pages
│   │       ├── components/    # React components
│   │       ├── lib/           # API clients, hooks
│   │       └── providers/     # Context providers
│   └── sde-back-end/          # NestJS backend
│       └── src/
│           └── app/
│               └── modules/   # Feature modules
├── libs/
│   └── shared-types/          # Shared TypeScript types
├── docker-compose.yml
└── .env.example
```

## Development Notes

### Token Flow
1. On sign-in/sign-up: Access token set as httpOnly cookie, refresh token returned in response body
2. Frontend stores refresh token in localStorage
3. On 401 response: Axios interceptor automatically calls refresh endpoint
4. New tokens are set, and the original request is retried

### Database Indexes
The Message collection has indexes on:
- `tag` + `_id` (compound, for tag filtering with pagination)
- `authorId` + `_id` (compound, for author filtering with pagination)
- `createdAt` (for date sorting)

```
