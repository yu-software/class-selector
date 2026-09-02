// src/frontend/HomePage.jsx
import { useState, useEffect } from "react";

export default function HomePage() {
  const [usuario, setUsuario] = useState(null);
  const [cursosTomados, setCursosTomados] = useState([]);
  const [cursosEnProgreso, setCursosEnProgreso] = useState([]);
  const [cursosFaltantes, setCursosFaltantes] = useState([]);
  const [planAcademico, setPlanAcademico] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarDatos() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "login.html";
          return;
        }
        const response = await fetch("/api/cursos/estado", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 200) {
          const data = await response.json();
          setUsuario(data.usuario);
          setCursosTomados(data.cursos_tomados);
          setCursosEnProgreso(data.cursos_en_progreso);
          setCursosFaltantes(data.cursos_faltantes);
          setPlanAcademico(data.plan_academico);
        } else if (response.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "login.html";
        }
      } catch (error) {
        setError(error.message);
      }
    }
    cargarDatos();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }

  // Mientras carga (usuario es null y no hay error)
  if (!usuario && !error) {
    return <p>Cargando...</p>;
  }

  return (
    <>
      <header className="header">
        <nav>
          <button
            type="button"
            className="header-link"
            onClick={() =>
              document
                .querySelector(".plan-section")
                .scrollIntoView({ behavior: "smooth" })
            }
          >
            Plan Academico
          </button>
          <button className="header-link" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>
      <main className="main-content">
        {error && <p>{error}</p>}
        <div className="student-info">
          <h1>{usuario.nombre}</h1>
          <p>Semestre: {usuario.semestre_actual}</p>
          <p>Carrera: {usuario.carrera}</p>
        </div>
        <div className="courses-section">
          <div className="courses-column">
            <h2>Clases Tomadas</h2>
            <ul className="course-list">
              {cursosTomados.map((item) => (
                <li className="course-item" key={item.id}>
                  <strong>{item.codigo}</strong> - {item.nombre}
                  <br />
                  <small>
                    Credits: {item.creditos} | Grade: {item.nota} |{" "}
                    {item.semestre_tomado} {item.ano_tomado}
                  </small>
                </li>
              ))}
            </ul>
          </div>
          {cursosEnProgreso.length > 0 && (
            <div className="courses-column">
              <h2>Clases en Progreso</h2>
              <ul className="course-list">
                {cursosEnProgreso.map((item) => (
                  <li className="course-item" key={item.id}>
                    <strong>{item.codigo}</strong> - {item.nombre}
                    <br />
                    <small>
                      Credits: {item.creditos} | {item.semestre_tomado}{" "}
                      {item.ano_tomado}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="courses-column">
            <h2>Clases Restantes</h2>
            <ul className="course-list">
              {cursosFaltantes.map((item) => (
                <li className="course-item" key={item.id}>
                  <strong>{item.codigo}</strong> - {item.nombre}
                  <br />
                  <small>
                    Credits: {item.creditos} | Type: {item.tipo}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="plan-section">
          <h2>Plan Académico</h2>
          <div className="plan-container">
            {planAcademico.map((semestre) => (
              <div
                key={`${semestre.semester}_${semestre.year}`}
                className="semester-plan"
              >
                <h3>
                  {semestre.semester} {semestre.year}
                </h3>
                <ul>
                  {semestre.courses.map((item) => (
                    <li className="plan-course" key={item.id}>
                      <strong>{item.code}</strong> - {item.name} (
                      {item.creditHours} credits)
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
