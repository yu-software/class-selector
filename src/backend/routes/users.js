// GET /profile, PUT /profile

import { User } from "../../../db/User.js";

export default async function usersRoutes(fastify) {
  // Middleware to check authentication
  fastify.addHook("preHandler", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ message: "Unauthorized" });
    }
  });

  // Get user profile
  fastify.get("/profile", async (request, reply) => {
    const profile = User.getProfile(request.user.id);
    if (!profile) {
      return reply.code(404).send({ message: "User not found" });
    }
    return profile;
  });

  // Update user profile
  fastify.put(
    "/profile",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            declared_major: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { name, declared_major } = request.body;
      const updatedUser = User.updateProfile(request.user.id, {
        name,
        declared_major,
      });
      if (!updatedUser) {
        return reply.code(404).send({ message: "User not found" });
      }
      // Sanitize user to avoid exposing password_hash
      return User.getProfile(request.user.id);
    },
  );
}
