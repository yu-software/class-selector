/* global process */
import Fastify from "fastify";
import dbPlugin from "./plugins/db.js";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import cursosRoutes from "./routes/cursos.js";
import { initializeDatabase } from "../../db/database.js";

export function buildApp(opts = {}) {
  const fastify = Fastify({ logger: false, ...opts });

  const jwtSecret = process.env.JWT_SECRET || "test-secret-for-testing";
  fastify.decorate("config", { jwtSecret });

  fastify.register(dbPlugin);
  fastify.register(authPlugin);

  fastify.register(authRoutes, { prefix: "/api/auth" });
  fastify.register(usersRoutes, { prefix: "/api/users" });
  fastify.register(cursosRoutes, { prefix: "/api/cursos" });

  initializeDatabase();

  return fastify;
}
