import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth/useAuth";
import "../styles/auth.css";

interface AuthPageProps { mode: "login" | "register"; }

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === "register";
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (isRegister) await register(email, password);
      else await login(email, password);
      navigate("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo completar la solicitud.");
    } finally { setBusy(false); }
  }

  async function signInWithGoogle() {
    setBusy(true);
    setError("");
    try { await loginWithGoogle(); navigate("/"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo iniciar sesión con Google."); }
    finally { setBusy(false); }
  }

  return <main className="auth-page">
    <section className="auth-card">
      <p className="catalog-kicker">SPIDERSHOP</p>
      <h1>{isRegister ? "Crear cuenta" : "Iniciar sesión"}</h1>
      <p>{isRegister ? "Regístrate para continuar con tu compra." : "Ingresa para acceder a tu cuenta."}</p>
      <form onSubmit={submit}>
        <label>Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Contraseña<input type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="site-header__button site-header__button--primary auth-submit" disabled={busy} type="submit">{busy ? "Procesando…" : isRegister ? "Registrarme" : "Ingresar"}</button>
      </form>
      <button className="site-header__button auth-google" disabled={busy} type="button" onClick={signInWithGoogle}>Continuar con Google</button>
      <p className="auth-switch">{isRegister ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"} <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Inicia sesión" : "Regístrate"}</Link></p>
      <Link className="auth-back" to="/">Volver a la tienda</Link>
    </section>
  </main>;
}
