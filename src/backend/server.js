// Import the framework and instantiate it
import Fastify from "fastify";
import process from "process";
import { port, jwtSecret } from "./config.js";
import dbPlugin from "./plugins/db.js";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import { initializeDatabase } from "../../db/database.js";

const fastify = Fastify({
  logger: true,
});

// Expose config to plugins via fastify.decorate
const config = { port, jwtSecret };
fastify.decorate("config", config);

// Register plugins
fastify.register(dbPlugin);
fastify.register(authPlugin);

// Register routes
fastify.register(authRoutes, { prefix: "/api/auth" });
fastify.register(usersRoutes, { prefix: "/api/users" });

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
