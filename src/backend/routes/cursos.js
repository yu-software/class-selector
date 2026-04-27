// GET /api/cursos/estado, /api/cursos/tomados, /api/cursos/faltantes, etc.

import { User } from "../../../db/User.js";
import { Course } from "../../../db/Course.js";
import { CourseHistory } from "../../../db/CourseHistory.js";
import { DegreeRequirement } from "../../../db/DegreeRequirement.js";
import { AcademicPlan } from "../../../db/AcademicPlan.js";

export default async function cursosRoutes(fastify) {
  // Middleware to check authentication
  fastify.addHook("preHandler", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ message: "Unauthorized" });
    }
  });

  /**
   * GET /api/cursos/estado
   * Retorna todo el estado académico del usuario en una sola llamada
   * Ideal para la vista de 2 paneles del frontend
   */
  fastify.get("/estado", async (request, reply) => {
    const userId = request.user.id;

    const usuario = User.getProfile(userId);
    if (!usuario) {
      return reply.code(404).send({ message: "User not found" });
    }

    const cursosTomados = CourseHistory.getCompletedCourses(userId);
    const cursosEnProgreso = CourseHistory.getInProgressCourses(userId);
    const requisitosCarrera = DegreeRequirement.getCurrentRequirements(
      usuario.declared_major,
    );
    const planAcademico = AcademicPlan.getPlanBySemester(userId);

    // Calcular cursos faltantes (requisitos - completados)
    const completedCourseIds = cursosTomados.map((c) => c.course_id);
    const cursosFaltantes = requisitosCarrera.filter(
      (req) => !completedCourseIds.includes(req.course_id),
    );

    // Calcular cursos sugeridos para el próximo semestre
    const cursosProximoSemestre = User.getSuggestedNextSemesterCourses(userId);

    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.name,
        email: usuario.email,
        carrera: usuario.declared_major,
        semestre_actual: usuario.current_semester,
        catalog_year: usuario.catalog_year,
      },
      cursos_tomados: cursosTomados.map((c) => ({
        id: c.course_id,
        codigo: c.course_code,
        nombre: c.course_name,
        creditos: c.credit_hours,
        nota: c.grade,
        semestre_tomado: c.semester_taken,
        ano_tomado: c.year_taken,
      })),
      cursos_en_progreso: cursosEnProgreso.map((c) => ({
        id: c.course_id,
        codigo: c.course_code,
        nombre: c.course_name,
        creditos: c.credit_hours,
        semestre_tomado: c.semester_taken,
        ano_tomado: c.year_taken,
      })),
      cursos_faltantes: cursosFaltantes.map((c) => ({
        id: c.course_id,
        codigo: c.course_code,
        nombre: c.course_name,
        creditos: c.credit_hours,
        tipo: c.requirement_type,
      })),
      cursos_proximo_semestre: cursosProximoSemestre,
      plan_academico: planAcademico,
    };
  });

  /**
   * GET /api/cursos/tomados
   * Retorna solo los cursos ya completados por el usuario
   */
  fastify.get("/tomados", async (request) => {
    const userId = request.user.id;
    const cursos = CourseHistory.getCompletedCourses(userId);

    return cursos.map((c) => ({
      id: c.course_id,
      codigo: c.course_code,
      nombre: c.course_name,
      creditos: c.credit_hours,
      nota: c.grade,
      semestre_tomado: c.semester_taken,
      ano_tomado: c.year_taken,
    }));
  });

  /**
   * GET /api/cursos/faltantes
   * Retorna los cursos que le faltan al usuario para completar su carrera
   */
  fastify.get("/faltantes", async (request, reply) => {
    const userId = request.user.id;
    const usuario = User.getProfile(userId);

    if (!usuario) {
      return reply.code(404).send({ message: "User not found" });
    }

    const requisitos = DegreeRequirement.getCurrentRequirements(
      usuario.declared_major,
    );
    const completados = CourseHistory.getCompletedCourses(userId);
    const completedCourseIds = completados.map((c) => c.course_id);

    const faltantes = requisitos.filter(
      (req) => !completedCourseIds.includes(req.course_id),
    );

    return faltantes.map((c) => ({
      id: c.course_id,
      codigo: c.course_code,
      nombre: c.course_name,
      creditos: c.credit_hours,
      tipo: c.requirement_type,
    }));
  });

  /**
   * GET /api/cursos/proximo-semestre
   * Retorna los cursos sugeridos para el próximo semestre
   * Basado en prerrequisitos cumplidos y disponibilidad
   */
  fastify.get("/proximo-semestre", async (request) => {
    const userId = request.user.id;
    const cursos = User.getSuggestedNextSemesterCourses(userId);

    return cursos;
  });

  /**
   * GET /api/cursos/plan
   * Retorna el plan académico del usuario (cursos planeados futuros)
   */
  fastify.get("/plan", async (request) => {
    const userId = request.user.id;
    const plan = AcademicPlan.getPlanBySemester(userId);

    return plan;
  });

  /**
   * GET /api/cursos/todos
   * Retorna el catálogo completo de cursos activos
   */
  fastify.get("/todos", async () => {
    const db = fastify.db;
    const cursos = db
      .prepare(
        `
      SELECT * FROM courses
      WHERE is_active = 1
      ORDER BY course_code
    `,
      )
      .all();

    return cursos.map((c) => ({
      id: c.id,
      codigo: c.course_code,
      nombre: c.course_name,
      creditos: c.credit_hours,
      descripcion: c.description,
    }));
  });
}
