import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../build-app.js";
import { getDatabase } from "../../../db/database.js";

let app;

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  const db = getDatabase();
  db.prepare("DELETE FROM users WHERE email = ?").run("testuser@example.com");
});

afterAll(async () => {
  await app.close();
});

describe("POST /api/auth/register", () => {
  test("registro exitoso devuelve 201", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "Test User",
        email: "testuser@example.com",
        password: "securepass123",
        catalog_year: 2024,
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.email).toBe("testuser@example.com");
    expect(body.name).toBe("Test User");
  });

  test("registro con email ya existente devuelve 409", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "Test User",
        email: "testuser@example.com",
        password: "securepass123",
        catalog_year: 2024,
      },
    });

    expect(response.statusCode).toBe(409);
    const body = response.json();
    expect(body.message).toBe("Email already in use");
  });

  test("registro sin email o sin password devuelve 400", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "Test User",
        email: "testuser@example.com",
        password: "",
        catalog_year: 2024,
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  test("login con credenciales validas devuelve 200 y token", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "student@example.com",
        password: "password123",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.token).toBeDefined();
  });

  test("login con contraseña incorrecta devuelve 401", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "student@example.com",
        password: "badpassword",
      },
    });

    expect(response.statusCode).toBe(401);
  });

  test("login sin email y sin password devuelve 400", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "",
        password: "",
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("GET /api/cursos/estado", () => {
  test("Acceder sin token devuelve 401", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/cursos/estado",
    });

    expect(response.statusCode).toBe(401);
  });

  test("Acceder con token valido devuelve 200 y datas del usuario", async () => {
    const loginResponse = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "student@example.com",
        password: "password123",
      },
    });

    const { token } = loginResponse.json();
    expect(token).toBeDefined();

    const response = await app.inject({
      method: "GET",
      url: "/api/cursos/estado",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.usuario.email).toBe("student@example.com");
    expect(Array.isArray(body.cursos_tomados)).toBe(true);
  });
});
