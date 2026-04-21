// POST para login, y register

import { User } from "../../../db/User.js";

export default async function authRoutes(fastify) {
  // Register endpoint
  fastify.post("/register", async (request, reply) => {
    try {
      const { email, password, name, catalog_year } = request.body;
      if (
        !email ||
        !password ||
        !name ||
        catalog_year === undefined ||
        catalog_year === null
      ) {
        return reply.code(400).send({ message: "Missing required fields" });
      }

      const parsedCatalogYear = Number.parseInt(catalog_year, 10);
      if (!Number.isInteger(parsedCatalogYear)) {
        return reply.code(400).send({ message: "Invalid catalog_year" });
      }

      const existingUser = User.findByEmail(email);
      if (existingUser) {
        return reply.code(409).send({ message: "Email already in use" });
      }

      const user = User.create({
        email,
        password,
        name,
        catalog_year: parsedCatalogYear,
      });
      return reply.code(201).send(user);
    } catch (err) {
      fastify.log.error({ err }, "Registration error");
      return reply.code(500).send({ message: "Server error" });
    }
  });

  // Login endpoint
  fastify.post("/login", async (request, reply) => {
    const { email, password } = request.body;
    if (!email || !password) {
      return reply.code(400).send({ message: "Missing email or password" });
    }

    const user = User.authenticate(email, password);
    if (!user) {
      return reply.code(401).send({ message: "Invalid credentials" });
    }

    const token = fastify.jwt.sign({ id: user.id });
    return { token };
  });
}
