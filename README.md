# class-selector

## Database Migration

To run all database migrations, use:

```
npm run db:migrate
```

This will execute all migration scripts in `db/migrations/` (via `run.js`). Use this command whenever you make changes to the database schema or need to apply new migrations.

## Code Formatting

To check code formatting using Prettier:

```
npm run format:check
```

To automatically fix formatting issues:

```
npm run format
```

Formatting is enforced in CI. Pull requests will fail if code is not properly formatted.

## Running Checks

To run linting, build, and database initialization checks:

```
npm test
```

This runs ESLint, the Vite build, and a minimal database initialization. Note: there is currently no automated test runner (e.g., Jest/Vitest) configured.

## Dangerous Scripts

The project includes a `db:reset` script that will reset or erase the database. For security, this script is restricted and will only run when the environment variable `ALLOW_DB_RESET` is explicitly set to `1`.

To run a reset locally (explicit consent required):

```
ALLOW_DB_RESET=1 npm run db:reset
```

Do NOT set this environment variable in CI or production environments. Use this only for local development and testing.

## Setup

1.  Install Node.js
2.  Clone the repository
3.  Install npm (npm install)
4.  npm run dev to run the project in local browser

## Windows note

If you or your teammates use Windows, install `cross-env` (already included in devDependencies) so environment variables work the same across platforms. Example commands:

```
npx cross-env MINIMAL_INIT=1 npm run db:init
npx cross-env ALLOW_DB_RESET=1 npm run db:reset
```

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.. Currently, two official plugins are availabl..

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
