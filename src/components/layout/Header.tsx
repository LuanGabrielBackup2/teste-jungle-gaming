import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSession, useLogout } from "../../hooks/useSession";
import { useCartItemCount } from "../../hooks/useCart";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { data: session } = useSession();
  const logout = useLogout();
  const cartCount = useCartItemCount();

  return (
    <header className="header">
      <Link className="logo" to="/" onClick={() => setMenuOpen(false)}>
        KURIO<span>.</span>
      </Link>

      <button
        className="menu-toggle"
        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={menuOpen}
        aria-controls="main-nav"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      <nav
        id="main-nav"
        className={menuOpen ? "nav nav-open" : "nav"}
        aria-label="Navegação principal"
      >
        <Link to="/" onClick={() => setMenuOpen(false)}>
          Início
        </Link>
        <a href="/#mercado" onClick={() => setMenuOpen(false)}>
          Mercado
        </a>
        <a href="/#criadores" onClick={() => setMenuOpen(false)}>
          Criadores
        </a>
        <a href="/#aprenda" onClick={() => setMenuOpen(false)}>
          Aprenda
        </a>
      </nav>

      <div className="header-actions">
        {/* Cart */}
        <Link
          className="cart-link"
          to="/cart"
          aria-label={`Carrinho${cartCount > 0 ? ` — ${cartCount} ${cartCount === 1 ? "item" : "itens"}` : " vazio"}`}
        >
          ♧{" "}
          {cartCount > 0 && (
            <span aria-hidden="true">{cartCount > 99 ? "99+" : cartCount}</span>
          )}
        </Link>

        {/* Auth */}
        {session ? (
          <div className="relative">
            <button
              className="login-link flex items-center gap-2"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-label={`Menu do usuário — ${session.user.name}`}
            >
              {session.user.avatar ? (
                <img
                  src={session.user.avatar}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                  aria-hidden
                />
              ) : null}
              <span className="hidden sm:inline text-xs">
                {session.user.name.split(" ")[0]}
              </span>
              <span aria-hidden>▾</span>
            </button>

            {userMenuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                  aria-hidden
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-100 shadow-lg z-20 py-1"
                >
                  <Link
                    to="/profile"
                    role="menuitem"
                    className="block px-4 py-2 text-xs hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Meu perfil
                  </Link>
                  <Link
                    to="/wallets"
                    role="menuitem"
                    className="block px-4 py-2 text-xs hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Carteiras
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button
                    role="menuitem"
                    onClick={() => {
                      logout.mutate();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-gray-50"
                  >
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link className="login-link" to="/login">
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
