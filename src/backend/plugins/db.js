// Plugin para inyectar la DB en el contexto de los resolvers

import { getDatabase, closeDatabase } from "../../../db/database.js";

export default function dbPlugin(fastify, options, done) {
  // Expose DB only on the request object to avoid global exposure
  fastify.decorateRequest("db", null);

  fastify.addHook("onRequest", async (request) => {
    request.db = getDatabase();
  });

  // Close shared DB when the Fastify instance is closing
  fastify.addHook("onClose", async () => {
    closeDatabase();
  });

  done();
}
