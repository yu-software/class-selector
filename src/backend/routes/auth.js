// POST para login, y register

import { User } from "../../../db/User.js";

export default async function authRoutes(fastify) {
  // Register endpoint
  // POST /api/auth/register
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

  /**
   * POST /api/auth/login-sso
   * Login mediante SSO universitario (sin contraseña)
   * Asume que la autenticación externa de la universidad ya validó al usuario
   *
   * Body: { student_id: string, name: string, semester: number }
   * - student_id: ID proporcionado por el sistema de la universidad
   * - name: Nombre del estudiante (validado externamente)
   * - semester: Semestre que va a cursar o está cursando
   */
  fastify.post("/login-sso", async (request, reply) => {
    try {
      const { student_id, name, semester } = request.body;

      // Validar campos requeridos
      if (!student_id || !name || semester === undefined) {
        return reply.code(400).send({
          message: "Missing required fields: student_id, name, semester",
        });
      }

      // Validar que semester sea un número entero válido
      const parsedSemester = Number.parseInt(semester, 10);
      if (
        !Number.isInteger(parsedSemester) ||
        parsedSemester < 1 ||
        parsedSemester > 8
      ) {
        return reply.code(400).send({
          message: "Invalid semester. Must be an integer between 1 and 8",
        });
      }

      // El student_id del SSO lo usamos como email para buscar/crear el usuario
      // Formato: student_id@university.edu (simulado)
      const email = `${student_id}@university.edu`;

      // Buscar si el usuario ya existe
      let user = User.findByEmail(email);

      if (user) {
        // Usuario existe - actualizar información si es necesario
        User.updateProfile(user.id, {
          name,
          current_semester: parsedSemester,
        });
        user = User.getProfile(user.id);
      } else {
        // Usuario nuevo - crear con datos del SSO
        // Nota: password se genera aleatorio porque no se usa en SSO
        user = User.create({
          email,
          password: Math.random().toString(36).slice(-8), // Password aleatorio (no se usa)
          name,
          current_semester: parsedSemester,
          catalog_year: new Date().getFullYear(),
          declared_major: "Undeclared", // Se puede actualizar después
        });
      }

      // Generar token JWT
      const token = fastify.jwt.sign({ id: user.id });

      return {
        token,
        user: {
          id: user.id,
          nombre: user.name,
          email: user.email,
          carrera: user.declared_major,
          semestre_actual: user.current_semester,
        },
      };
    } catch (err) {
      fastify.log.error({ err }, "SSO Login error");
      return reply.code(500).send({ message: "Server error" });
    }
  });
}
