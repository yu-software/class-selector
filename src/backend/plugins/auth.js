// Plugin de JWT (decorator user, verify token, etc)

import fastifyJwt from "@fastify/jwt";

export default async function authPlugin(fastify) {
  fastify.register(fastifyJwt, {
    secret: fastify.config.jwtSecret,
  });
}
