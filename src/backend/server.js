// Import the framework and instantiate it
import Fastify from "fastify";
import process from "process";
import { port, jwtSecret } from "./config.js";
import dbPlugin from "./plugins/db.js";
import authPlugin from "./plugins/auth.js";
// CORS will be registered dynamically below
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import cursosRoutes from "./routes/cursos.js";
import { initializeDatabase } from "../../db/database.js";

const fastify = Fastify({
  logger: true,
});

// Expose config to plugins via fastify.decorate
const config = { port, jwtSecret };
fastify.decorate("config", config);

// Register plugins
fastify.register(dbPlugin);
// Register CORS to allow the frontend to send the Authorization header
// Note: run `npm install @fastify/cors` before starting the server
fastify.register(import("@fastify/cors"), {
  origin: ["http://localhost:5174"],
  allowedHeaders: ["Authorization", "Content-Type"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
});

fastify.register(authPlugin);

// Register routes
fastify.register(authRoutes, { prefix: "/api/auth" });
fastify.register(usersRoutes, { prefix: "/api/users" });
fastify.register(cursosRoutes, { prefix: "/api/cursos" });

// Root health endpoint
fastify.get("/", async () => {
  return { message: "Class-Selector backend", status: "ok" };
});

// Debug endpoint to verify JWT decoding from the frontend
fastify.get("/debug/me", async (request, reply) => {
  try {
    await request.jwtVerify();
    return { user: request.user };
  } catch (err) {
    fastify.log.error({ err }, "JWT verification failed");
    return reply.code(401).send({ message: "Unauthorized" });
  }
});

// Initialize database before starting the server
initializeDatabase();

// Run the server!
fastify.listen({ port: config.port }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  fastify.log.info(`Server is running on port ${config.port}`);
});
