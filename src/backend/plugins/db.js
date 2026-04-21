// Plugin para inyectar la DB en el contexto de los resolvers

import { getDatabase } from "../../../db/database.js";

export default function dbPlugin(fastify, options, done) {
  // Expose DB only on the request object to avoid global exposure
  fastify.decorateRequest("db", null);

  fastify.addHook("onRequest", async (request, reply) => {
    request.db = getDatabase();
    reply.raw.on("close", () => {
      if (request.db) {
        request.db.close();
      }
    });
  });

  done();
}
