//This file is the form with the component

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (response.status === 200) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        window.location.href = "home.html";
      } else {
        setError("Credenciales inválidas. Por favor, inténtelo de nuevo.");
      }
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <main className="app-root">
      <h1>Class Selector — Login</h1>
      <div className="login-root">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Iniciar sesión</h2>
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
          {error && <p>{error}</p>}
          <button type="submit" className="login-button">
            Entrar
          </button>
          <p>
            ¿No tienes cuenta? <a href="signup/signup.html">Registrarse</a>
          </p>
        </form>
      </div>
    </main>
  );
}
