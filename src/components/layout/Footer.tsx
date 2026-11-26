import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link className="logo" to="/">
            KURIO<span>.</span>
          </Link>
          <h2>Feito para colecionadores,<br />criadores e cultura.</h2>
          <p>contato@email.com</p>
          <p>+55 11 4002 8922</p>
        </div>
        <div className="footer-column">
          <h3>Meu perfil</h3>
          <Link to="/profile">Meu perfil</Link>
          <Link to="/profile">Minha coleção</Link>
          <Link to="/profile">Atividade</Link>
          <Link to="/profile">Estúdio do criador</Link>
          <Link to="/profile">Lista de interesse</Link>
        </div>
        <div className="footer-column">
          <h3>Central de ajuda</h3>
          <a href="/#aprenda">Como comprar NFTs</a>
          <a href="/#aprenda">Carteira e segurança</a>
          <a href="/#aprenda">Política do mercado</a>
          <a href="/#aprenda">Denunciar item</a>
        </div>
        <div className="footer-column">
          <h3>Coleções</h3>
          <a href="/#mercado">Arte digital</a>
          <a href="/#mercado">Fotografia</a>
          <a href="/#mercado">Música</a>
          <a href="/#mercado">Arte 3D</a>
          <a href="/#mercado">Utilidade</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Kurio. Propriedade digital para todos.</span>
        <span className="wallets">
          METAMASK&nbsp; • &nbsp;WALLETCONNECT&nbsp; • &nbsp;COINBASE
        </span>
      </div>
    </footer>
  );
}
