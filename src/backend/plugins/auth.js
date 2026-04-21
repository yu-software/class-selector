// Plugin de JWT (decorator user, verify token, etc)

import fastifyJwt from "@fastify/jwt";
import fp from "fastify-plugin";

export default fp(async function authPlugin(fastify) {
  fastify.register(fastifyJwt, {
    secret: fastify.config.jwtSecret,
  });
});
