# Finance Dashboard Full Stack

Production-ready finance dashboard with Node.js/Express backend and React frontend. Includes JWT authentication, RBAC, transaction CRUD, analytics dashboard APIs, validation, and tests.

## Tech Stack

- Backend: Node.js + Express + MongoDB + Mongoose
- Auth: JWT + bcrypt password hashing
- Validation: express-validator
- Frontend: React (Create React App) + Axios + React Router
- Testing: Jest + Supertest + mongodb-memory-server
- API Docs: Swagger UI

## Features

- User management: registration, login, hashed passwords
- Fixed admin account from environment variables (`ADMIN_EMAIL` + `ADMIN_PASSWORD`), auto-seeded on server start
- Fixed admin cannot be created, deleted, or downgraded via API
- RBAC roles:
  - viewer: read-only transactions
  - analyst: read + dashboard analytics
  - admin: fixed system account with full CRUD access
- Support/Helpcare:
  - Users can create support tickets and view only their own
  - Admin can view all tickets and resolve them
- Transaction management:
  - Create, list, update, soft delete
  - Filtering by type, category, date range
  - Pagination and keyword search
- Dashboard analytics:
  - Total income
  - Total expenses
  - Net balance
  - Category-wise totals
  - Monthly trends with net values
  - Last 5 transactions
- Frontend app with:
  - Login/register flows
  - JWT storage in localStorage
  - Role-based routing and UI
  - Dashboard, transactions, and support pages
  - Filtering, pagination, and admin edit/delete
- Global error handling and clean JSON responses
- Rate limiting and secure headers with Helmet

## Project Structure

```text
src/
  config/
  controllers/
  middleware/
  models/
  routes/
  utils/
  validators/
frontend/
  src/
    pages/
    components/
    context/
    services/
tests/
```

## Backend Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` using `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/finance_dashboard
MONGO_MAX_RETRIES=5
MONGO_RETRY_DELAY_MS=3000
MONGO_SERVER_SELECTION_TIMEOUT_MS=5000
JWT_SECRET=replace_with_secure_secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=replace_with_secure_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
ADMIN_EMAIL=admin@example.com
ADMIN_NAME=System Administrator
ADMIN_PASSWORD=replace_with_secure_admin_password
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=
SERVER_PUBLIC_URL=http://localhost:5000
SERVE_FRONTEND=false
NODE_ENV=development
```

3. Start development server:

```bash
npm run dev
```

4. API health check:

```http
GET http://localhost:5000/health
```

## Frontend Setup

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

2. Create frontend `.env` from `.env.example`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

3. Start frontend dev server:

```bash
npm start
```

Frontend runs at:

- `http://localhost:3000`

## Run Both (2 terminals)

1. Backend terminal:

```bash
npm run dev
```

2. Frontend terminal:

```bash
cd frontend
npm start
```

## API Documentation

Swagger UI:

- `http://localhost:5000/api-docs`

## Key Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/transactions`
- `GET /api/transactions/:id`
- `POST /api/transactions`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/dashboard`
- `POST /api/support`
- `GET /api/support/my`
- `GET /api/support`
- `PUT /api/support/:id`

## Testing

Run all tests:

```bash
npm test
```

Included tests:

- Unauthorized access
- Invalid token handling
- Expired token
- Role violations
- Invalid input
- Edge cases (empty data, large values, pagination)

## Postman Collection

Import:

- `Finance-Dashboard.postman_collection.json`

## Security Notes

- Environment variables are loaded with dotenv
- Keep secrets only in local `.env` and never commit real credentials
- No hardcoded DB credentials
- Passwords are hashed before storage
- JWT is required for protected routes
- Rate limiting is enabled for `/api/*`
- Requests are sanitized to reduce NoSQL injection risks
- CORS uses environment-driven dynamic origin allowlisting

## RBAC Matrix

- `viewer`: read-only transactions
- `analyst`: transactions + dashboard analytics
- `admin`: full control (users, transactions, support administration)

## Production Build + Deploy

Build frontend:

```bash
cd frontend
npm run build
```

Serve React static build from backend (optional):

- Set `SERVE_FRONTEND=true` in backend environment
- Backend serves `frontend/build` and falls back to `index.html`

## Cloud Deployment (Safe Secret Handling)

Use this pattern when deploying to any cloud host (Render, Railway, Azure, etc.):

1. Keep local `.env` for development only.
2. Do not upload or commit real credentials.
3. Set production secrets in your hosting provider's Environment Variables panel.

Required variables in hosting platform:

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `ADMIN_EMAIL`
- `ADMIN_NAME`
- `ADMIN_PASSWORD`
- `NODE_ENV=production`

Recommended:

- Use a dedicated production MongoDB user with limited permissions.
- Rotate secrets if they were ever exposed.
- Keep `.env.example` with placeholders only.

## Vercel Deployment Guide

For this project structure, the cleanest production setup is:

1. Deploy frontend on Vercel.
2. Deploy backend API on a Node host (Render, Railway, Azure App Service).
3. Point frontend to backend using REACT_APP_API_URL.

Why this is recommended:

- Your backend is an Express server with database connection and middleware stack.
- Vercel works best with serverless functions, while this backend is currently structured as a long-running Node service.

Frontend deployment on Vercel:

1. Import repository into Vercel.
2. Set project root to frontend.
3. Framework preset: Create React App.
4. Build command: npm run build.
5. Output directory: build.
6. Add environment variable REACT_APP_API_URL with your deployed backend URL + /api.

Backend environment variables (set on your backend host, not in Vercel frontend):

- MONGO_URI
- JWT_SECRET
- JWT_EXPIRES_IN
- ADMIN_EMAIL
- ADMIN_NAME
- ADMIN_PASSWORD
- NODE_ENV=production

Final verification:

1. Open frontend URL from Vercel.
2. Login with admin and non-admin users.
3. Verify transactions list, dashboard summary, and RBAC behavior.
4. Confirm no secrets are exposed in repository files.

Note on Login Behavior: The backend is hosted on Render’s free tier, which may enter a sleep state after inactivity. Due to this, the first login attempt may occasionally fail or take longer as the server wakes up (cold start). Subsequent attempts work normally once the service is active. To improve reliability, a health check and retry strategy can be implemented. This behavior is expected in free-tier deployments and not related to authentication logic.
