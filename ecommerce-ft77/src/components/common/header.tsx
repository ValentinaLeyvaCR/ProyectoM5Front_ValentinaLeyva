import spiderLogo from "../../assets/logo.png";
import { useAuth } from "../../contexts/auth/useAuth";
import { useTheme } from "../../contexts/theme/useTheme";
import { Link } from "react-router-dom";

interface HeaderProps {
  cartCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
}

export function Header({ cartCount, search, onSearchChange, onOpenCart, onOpenAdmin }: HeaderProps) {
  const { toggleTheme } = useTheme();
  const { user, profile, logout } = useAuth();
  return (
    <header className="site-header">
      <div className="site-header__top">
        <a className="site-header__brand" href="#inicio" aria-label="SpiderShop, inicio">
          <img src={spiderLogo} alt="SpiderShop" className="site-header__logo" />
        </a>
        <div className="site-header__info">
          <label className="site-header__search">
            <span aria-hidden="true">⌕</span>
            <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar productos" aria-label="Buscar productos" />
          </label>
          <button className="site-header__button" type="button" onClick={toggleTheme} aria-label="Cambiar tema">☀️ / 🌙</button>
          <div className="site-header__actions">
            {profile?.role === "admin" && <button className="site-header__button" type="button" onClick={onOpenAdmin}>Administración</button>}
            {user ? <>{profile?.role === "customer" && <Link className="site-header__button" to="/orders">Mis compras</Link>}<button className="site-header__button" type="button" onClick={() => void logout()}>Salir</button></> : <Link className="site-header__button" to="/login">Ingresar</Link>}
            <button className="site-header__button site-header__button--primary" type="button" onClick={onOpenCart}>🛒 Carrito ({cartCount})</button>
          </div>
        </div>
      </div>
      <nav className="site-header__nav" aria-label="Navegación principal">
        <a href="#inicio">Inicio</a>
        <a href="#productos">Productos</a>
      </nav>
    </header>
  );
}
