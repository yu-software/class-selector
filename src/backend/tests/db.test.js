/**
 * Tests: Backend ↔ Database Connection
 *
 * Uses Node.js built-in test runner (node:test) — no extra installs needed.
 *
 * HOW TO RUN:
 *   node src/backend/tests/db.test.js
 *
 * Or add to package.json scripts:
 *   "test:db": "node src/backend/tests/db.test.js"
 */

import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import {
  getDatabase,
  closeDatabase,
  initializeDatabase,
} from "../../../db/database.js";
import { User } from "../../../db/User.js";
import dbPlugin from "../plugins/db.js";
import authRoutes from "../routes/auth.js";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function buildApp() {
  const app = Fastify({ logger: false });
  app.decorate("config", {
    port: 3000,
    jwtSecret: "test-secret-key",
  });
  app.register(dbPlugin);
  // Minimal JWT mock so auth routes can call fastify.jwt.sign
  app.decorate("jwt", {
    sign: (payload) => `mock-token-${payload.id}`,
    verify: (token) => token,
  });
  app.register(authRoutes, { prefix: "/api/auth" });
  return app;
}

// ─── SETUP ────────────────────────────────────────────────────────────────────

before(() => {
  initializeDatabase();
});

after(() => {
  closeDatabase();
});

// ─── 1. CONNECTION TESTS ──────────────────────────────────────────────────────

describe("Database Connection", () => {
  test("should connect and return a database instance", () => {
    const db = getDatabase();
    assert.ok(db, "DB instance should not be null");
  });

  test("should return the same instance on multiple calls (singleton)", () => {
    const db1 = getDatabase();
    const db2 = getDatabase();
    assert.equal(db1, db2, "Should return the same DB instance");
  });

  test("should have foreign keys enabled", () => {
    const db = getDatabase();
    const result = db.pragma("foreign_keys", { simple: true });
    assert.equal(result, 1, "Foreign keys should be ON");
  });

  test("should have WAL journal mode enabled", () => {
    const db = getDatabase();
    const result = db.pragma("journal_mode", { simple: true });
    assert.equal(result, "wal", "Journal mode should be WAL");
  });

  test("should be able to run a basic query", () => {
    const db = getDatabase();
    const result = db.prepare("SELECT 1 + 1 AS sum").get();
    assert.equal(result.sum, 2, "Basic query should return 2");
  });
});

// ─── 2. TABLES EXIST ─────────────────────────────────────────────────────────

describe("Database Tables", () => {
  const expectedTables = [
    "users",
    "courses",
    "course_availability",
    "course_prerequisites",
    "degree_requirements",
    "course_history",
    "academic_plans",
  ];

  for (const tableName of expectedTables) {
    test(`table "${tableName}" should exist`, () => {
      const db = getDatabase();
      const result = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
        .get(tableName);
      assert.ok(result, `Table "${tableName}" should exist`);
    });
  }
});

// ─── 3. USERS TABLE - CRUD ────────────────────────────────────────────────────

describe("Users Table - CRUD", () => {
  beforeEach(() => {
    const db = getDatabase();
    db.prepare("DELETE FROM users").run();
  });

  test("should insert a user successfully", () => {
    const db = getDatabase();
    const result = db
      .prepare(
        `INSERT INTO users (email, password_hash, name, catalog_year)
         VALUES (?, ?, ?, ?)`,
      )
      .run("test@york.edu", "hashed_pw", "Test User", 2024);
    assert.ok(result.lastInsertRowid > 0, "Should return a valid row ID");
  });

  test("should retrieve a user by email", () => {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO users (email, password_hash, name, catalog_year)
       VALUES (?, ?, ?, ?)`,
    ).run("juan@york.edu", "hashed_pw", "Juan Pinzon", 2024);

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get("juan@york.edu");
    assert.ok(user, "User should be found");
    assert.equal(user.email, "juan@york.edu");
    assert.equal(user.name, "Juan Pinzon");
  });

  test("should enforce unique email constraint", () => {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO users (email, password_hash, name, catalog_year)
       VALUES (?, ?, ?, ?)`,
    ).run("duplicate@york.edu", "hashed_pw", "User One", 2024);

    assert.throws(() => {
      db.prepare(
        `INSERT INTO users (email, password_hash, name, catalog_year)
         VALUES (?, ?, ?, ?)`,
      ).run("duplicate@york.edu", "hashed_pw2", "User Two", 2024);
    }, "Should throw on duplicate email");
  });

  test("should delete a user", () => {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO users (email, password_hash, name, catalog_year)
       VALUES (?, ?, ?, ?)`,
    ).run("delete@york.edu", "hashed_pw", "To Delete", 2024);

    db.prepare("DELETE FROM users WHERE email = ?").run("delete@york.edu");
    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get("delete@york.edu");
    assert.equal(user, undefined, "User should be deleted");
  });
});

// ─── 4. AUTH ROUTES ↔ DATABASE ───────────────────────────────────────────────

describe("Auth Routes ↔ Database", () => {
  let app;

  before(async () => {
    app = buildApp();
    await app.ready();
    // Clean users table before auth tests
    getDatabase().prepare("DELETE FROM users").run();
  });

  after(async () => {
    await app.close();
  });

  test("POST /api/auth/register - should create a user in the DB", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "register@york.edu",
        password: "password123",
        name: "Register Test",
        catalog_year: 2024,
      },
    });

    assert.equal(response.statusCode, 201, "Should return 201 Created");
    const body = JSON.parse(response.body);
    assert.ok(body.id, "Response should include user id");
    assert.equal(body.email, "register@york.edu");

    // Verify user actually exists in DB
    const dbUser = getDatabase()
      .prepare("SELECT * FROM users WHERE email = ?")
      .get("register@york.edu");
    assert.ok(dbUser, "User should exist in the database");
  });

  test("POST /api/auth/register - should return 400 if fields are missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "missing@york.edu",
        // missing password, name, catalog_year
      },
    });
    assert.equal(response.statusCode, 400, "Should return 400 Bad Request");
  });

  test("POST /api/auth/register - should return 409 if email already exists", async () => {
    // First registration
    await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "duplicate@york.edu",
        password: "password123",
        name: "First User",
        catalog_year: 2024,
      },
    });

    // Second registration with same email
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "duplicate@york.edu",
        password: "password456",
        name: "Second User",
        catalog_year: 2024,
      },
    });
    assert.equal(response.statusCode, 409, "Should return 409 Conflict");
  });

  test("POST /api/auth/login - should return token for valid credentials", async () => {
    // Register first
    await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "login@york.edu",
        password: "mypassword",
        name: "Login Test",
        catalog_year: 2024,
      },
    });

    // Now login
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "login@york.edu",
        password: "mypassword",
      },
    });

    assert.equal(response.statusCode, 200, "Should return 200 OK");
    const body = JSON.parse(response.body);
    assert.ok(body.token, "Response should include a token");
  });

  test("POST /api/auth/login - should return 401 for wrong password", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "login@york.edu",
        password: "wrongpassword",
      },
    });
    assert.equal(response.statusCode, 401, "Should return 401 Unauthorized");
  });

  test("POST /api/auth/login - should return 400 if fields are missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "login@york.edu",
        // missing password
      },
    });
    assert.equal(response.statusCode, 400, "Should return 400 Bad Request");
  });
});

// ─── 5. DB PLUGIN ────────────────────────────────────────────────────────────

describe("DB Plugin", () => {
  test("should inject db into request object", async () => {
    const app = Fastify({ logger: false });
    app.register(dbPlugin);

    app.get("/test-db", async (request) => {
      assert.ok(request.db, "request.db should be defined");
      return { ok: true };
    });

    await app.ready();
    const response = await app.inject({ method: "GET", url: "/test-db" });
    assert.equal(response.statusCode, 200);
    await app.close();
  });
});
