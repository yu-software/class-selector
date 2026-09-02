import { useState } from "react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [catalog_year, setCatalogYear] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ name, email, password, catalog_year }),
      });
      if (response.status === 201) {
        window.location.href = "../login.html";
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <main className="app-root">
      <h1>Class Selector - Sign up</h1>
      <div className="signup-root">
        <form className="signup-form" onSubmit={handleSubmit}>
          <h2>Registrese</h2>
          <input
            type="text"
            placeholder="Nombre"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="number"
            placeholder="Catalog Year"
            value={catalog_year}
            onChange={(e) => setCatalogYear(e.target.value)}
          />
          {error && <p>{error}</p>}
          <button type="submit" className="Signup-button">
            Registrarse
          </button>
          <p>
            ¿Ya tienes cuenta? <a href="../login.html">Iniciar sesión</a>
          </p>
        </form>
      </div>
    </main>
  );
}
