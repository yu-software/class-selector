// Plugin para inyectar la DB en el contexto de los resolvers

import { getDatabase } from "../../../db/database.js";

export default function dbPlugin(fastify, options, done) {
  fastify.decorate("db", getDatabase());
  done();
}
