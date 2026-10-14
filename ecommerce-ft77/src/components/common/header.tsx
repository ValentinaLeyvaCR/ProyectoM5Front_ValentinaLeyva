import spiderLogo from "../../assets/logo.png";

const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.classList.toggle("dark", isDark);

export function Header() {
  return (
    <header className="site-header">
  <div className="site-header__top">
    <div className="site-header__brand">
      <img src={spiderLogo} alt="SpiderShop" className="site-header__logo" />
    </div>

    <div className="site-header__info">
      <span>👤 userdemo@mail.com</span>
      <span>💗 --</span>
      <span>🛒 --</span>

      <button
        type="button"
        onClick={() => document.documentElement.classList.toggle("dark")}
      >
        ☀️ / 🌙
      </button>

      <div className="site-header__actions">
        <button className="site-header__button" type="button">Iniciar sesión</button>
        <button className="site-header__button site-header__button--primary" type="button">
          Registrarse
        </button>
        <button className="site-header__button" type="button">Cerrar sesión</button>
      </div>
    </div>
  </div>

  <nav className="site-header__nav" aria-label="Navegación principal">
    <button type="button">Inicio</button>
    <button type="button">Productos</button>
    <button type="button">Carrito</button>
    <button type="button">Favoritos</button>
  </nav>
</header>
  );
}