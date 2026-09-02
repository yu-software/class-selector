# Class Selector

Academic progress tracker for university students. Students log in to see their completed courses, in-progress courses, remaining degree requirements, and a semester-by-semester academic plan.

## Tech Stack

- **Frontend**: React 19 + Vite (multi-page: login, signup, home)
- **Backend**: Fastify with JWT authentication
- **Database**: SQLite via better-sqlite3

## Getting Started

### Prerequisites

- Node.js 18+

### Setup

```bash
git clone git@github.com:AdayGuedes/class-selector.git
cd class-selector
npm install
```

Create a `.env` file in the project root:

```
PORT=3005
JWT_SECRET=your-secret-key-here
```

Initialize the database with sample data:

```bash
npm run db:init
```

This creates a test user: `student@example.com` / `password123`

### Running

Start both servers in separate terminals:

```bash
npm run backend:dev    # API server on http://localhost:3005
npm run dev            # Vite dev server on http://localhost:5174
```

Open http://localhost:5174/login.html in your browser.

## Project Structure

```
src/
├── backend/
│   ├── server.js          # Fastify app entry point
│   ├── config.js          # Environment variables
│   ├── plugins/           # JWT and database plugins
│   └── routes/            # API routes (auth, cursos, users)
├── frontend/
│   ├── login.html         # Login page entry
│   ├── LoginPage.jsx      # Login form component
│   ├── home.html          # Dashboard entry
│   ├── HomePage.jsx       # Dashboard component
│   ├── signup/            # Registration page
│   └── home/              # Dashboard styles
db/
├── database.js            # SQLite connection and schema
├── init-db.js             # Database seeding script
├── migrations/            # Schema migrations
└── *.js                   # Data models (User, Course, etc.)
```

## API Endpoints

| Method | Endpoint                | Auth | Description            |
| ------ | ----------------------- | ---- | ---------------------- |
| POST   | `/api/auth/login`       | No   | Returns JWT token      |
| POST   | `/api/auth/register`    | No   | Creates new user       |
| GET    | `/api/cursos/estado`    | JWT  | Full academic status   |
| GET    | `/api/cursos/tomados`   | JWT  | Completed courses      |
| GET    | `/api/cursos/faltantes` | JWT  | Remaining requirements |
| GET    | `/api/cursos/plan`      | JWT  | Academic plan          |

## Scripts

| Command               | Description                    |
| --------------------- | ------------------------------ |
| `npm run dev`         | Start Vite dev server          |
| `npm run backend:dev` | Start Fastify backend          |
| `npm run db:init`     | Initialize DB with sample data |
| `npm run db:migrate`  | Run database migrations        |
| `npm run format`      | Format code with Prettier      |
| `npm test`            | Lint + build + DB check        |
