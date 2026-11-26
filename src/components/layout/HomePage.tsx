import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useNFTs } from "../../hooks/useNFTs";
import { useFavorites, useToggleFavorite } from "../../hooks/useFavorites";
import { useSession } from "../../hooks/useSession";
import { NFTCard } from "../nft/NFTCard";
import { NFTCardSkeleton } from "../shared/Skeleton";
import { ErrorState } from "../shared/ErrorState";
import type { NFTListParams } from "../../types";
import { Route } from "../../routes/index";

const CATEGORIES = [
  "Arte digital",
  "Fotografia",
  "Música",
  "Arte 3D",
  "Colecionáveis",
  "Generativa",
  "Jogos",
  "Assinaturas",
  "Utilidade",
];

const CATEGORY_COUNTS: Record<string, number> = {
  "Arte digital": 33,
  Fotografia: 12,
  Música: 65,
  "Arte 3D": 39,
  Colecionáveis: 23,
  Generativa: 17,
  Jogos: 19,
  Assinaturas: 13,
  Utilidade: 18,
};

const ARTICLES = [
  {
    date: "12 de setembro  |  Leitura de 6 min",
    title: "Como funciona a propriedade de NFTs",
    description: "Aprenda a colecionar, negociar e verificar ativos digitais.",
    image: "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=700",
  },
  {
    date: "13 de setembro  |  Leitura de 2 min",
    title: "10 artistas digitais para acompanhar",
    description: "Conheça criadores que moldam a cultura digital.",
    image: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=700",
  },
  {
    date: "15 de setembro  |  Leitura de 3 min",
    title: "Raridade, atributos e procedência",
    description: "Entenda raridade, procedência, direitos autorais e utilidade.",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=700",
  },
  {
    date: "15 de setembro  |  Leitura de 2 min",
    title: "Como proteger sua carteira",
    description: "Proteja sua carteira, seus ativos e sua identidade.",
    image:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=700",
  },
];

export function HomePage() {
  // ── URL state (survives refresh + browser history) ──────────────────────────
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });

  const category = search.category ?? "";
  const sort = search.sort ?? "recent";
  const page = search.page ?? 1;
  const q = search.q ?? "";

  // ── Local state (non-URL) ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("Todos os NFTs");
  const [email, setEmail] = useState("");
  const [searchInput, setSearchInput] = useState(q);

  // ── Data ────────────────────────────────────────────────────────────────────
  const params: NFTListParams = {
    category: category || undefined,
    sort,
    page,
    limit: 9,
    q: q || undefined,
  };

  const { data, isLoading, isError, refetch } = useNFTs(params);
  const { data: session } = useSession();
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const favoritedIds = new Set(favorites?.map((f) => f.nftId) ?? []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  function setCategory(cat: string) {
    navigate({
      search: (prev) => ({
        ...prev,
        category: cat || undefined,
        page: undefined,
      }),
    });
  }

  function setSort(s: NFTListParams["sort"]) {
    navigate({
      search: (prev) => ({
        ...prev,
        sort: s,
        page: undefined,
      }),
    });
  }

  function setPage(p: number) {
    navigate({
      search: (prev) => ({ ...prev, page: p }),
    });
    document.getElementById("mercado")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      search: (prev) => ({
        ...prev,
        q: searchInput || undefined,
        page: undefined,
      }),
    });
  }

  function handleToggleFavorite(nftId: string, isFavorited: boolean) {
    if (!session) {
      navigate({ to: "/login", search: { redirect: "/" } });
      return;
    }    toggleFavorite.mutate({ nftId, isFavorited });
  }

  const nfts = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero" id="inicio">
        <div className="hero-content">
          <span className="eyebrow">O FUTURO DA ARTE É SEU</span>
          <h1>
            SEJA DONO DO FUTURO DA <span>ARTE DIGITAL</span>
          </h1>
          <p>
            Descubra NFTs selecionados de criadores do mundo todo e colecione
            arte digital verificada.
          </p>
          <a className="button button-light" href="#mercado">
            EXPLORAR <span>↗</span>
          </a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-art-image" />
          <span className="hero-art-label">NFT EM DESTAQUE</span>
          <span className="hero-art-number">01 / 04</span>
        </div>
        <div className="hero-bottom" aria-hidden="true">
          <span>01 — LANÇAMENTOS GÊNESIS</span>
          <span>ARTE DIGITAL SELECIONADA E MUITO MAIS</span>
        </div>
      </section>

      {/* ── Market ───────────────────────────────────────────────────────── */}
      <section className="market section" id="mercado">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EXPLORE O UNIVERSO KURIO</span>
            <h2>Descubra NFTs</h2>
            <p>Encontre obras únicas e colecione o que inspira você.</p>
          </div>
          <a className="text-link" href="#colecoes">
            Explorar coleções ↗
          </a>
        </div>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="mb-6 flex gap-2 max-w-md"
          role="search"
        >
          <input
            type="search"
            placeholder="Buscar NFTs, criadores..."
            aria-label="Buscar NFTs"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 border border-gray-200 px-4 py-2 text-sm outline-none focus:border-[#a4c65b]"
          />
          <button type="submit" className="outline-button px-4 py-2 text-xs">
            Buscar
          </button>
        </form>

        <div className="market-layout">
          {/* ── Filters sidebar ──────────────────────────────────────────── */}
          <aside className="filters" aria-label="Filtros">
            <h3>Categorias</h3>
            <button
              className={`filter${!category ? " active" : ""}`}
              onClick={() => setCategory("")}
              aria-pressed={!category}
            >
              Todos <span>({data?.total ?? "…"})</span>
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`filter${category === cat ? " active" : ""}`}
                onClick={() => setCategory(cat)}
                aria-pressed={category === cat}
              >
                {cat}
                <span>({CATEGORY_COUNTS[cat]})</span>
              </button>
            ))}

            <div className="filter-block">
              <h3>Faixa de preço</h3>
              <p>Preço: 0,02 - 12,30 ETH</p>
              <input
                aria-label="Faixa de preço máximo"
                type="range"
                min="0"
                max="100"
                defaultValue="65"
              />
              <button className="filter-apply">Aplicar</button>
            </div>

            <div className="filter-block">
              <h3>Rede</h3>
              <label>
                <input type="checkbox" defaultChecked /> Ethereum{" "}
                <span>(119)</span>
              </label>
              <label>
                <input type="checkbox" /> Polygon <span>(78)</span>
              </label>
              <label>
                <input type="checkbox" /> Solana <span>(86)</span>
              </label>
            </div>
          </aside>

          {/* ── NFT grid ─────────────────────────────────────────────────── */}
          <div className="market-content">
            <div className="market-toolbar">
              <div className="tabs" role="tablist" aria-label="Filtrar por tipo">
                {["Todos os NFTs", "Novos lançamentos", "Em alta"].map(
                  (tab) => (
                    <button
                      key={tab}
                      role="tab"
                      aria-selected={activeTab === tab}
                      className={`tab${activeTab === tab ? " active-tab" : ""}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>
              <label className="sort-label" htmlFor="sort-select">
                Ordenar por:
                <select
                  id="sort-select"
                  value={sort ?? "recent"}
                  onChange={(e) => setSort(e.target.value as NFTListParams["sort"])}
                >
                  <option value="recent">Listados recentemente</option>
                  <option value="price_asc">Menor preço</option>
                  <option value="price_desc">Maior preço</option>
                  <option value="popular">Mais populares</option>
                </select>
              </label>            </div>

            {/* Grid */}
            {isError ? (
              <ErrorState
                message="Não foi possível carregar os NFTs."
                onRetry={() => refetch()}
              />
            ) : (
              <>
                <div
                  className="nft-grid"
                  aria-label="Catálogo de NFTs"
                  aria-busy={isLoading}
                >
                  {isLoading
                    ? Array.from({ length: 9 }).map((_, i) => (
                        <NFTCardSkeleton key={i} />
                      ))
                    : nfts.length > 0
                    ? nfts.map((nft) => (
                        <NFTCard
                          key={nft.id}
                          nft={nft}
                          isFavorited={favoritedIds.has(nft.id)}
                          onToggleFavorite={handleToggleFavorite}
                          isAuthenticated={!!session}
                        />
                      ))
                    : !isLoading && (
                        <p className="empty-state" role="status">
                          Nenhum NFT encontrado.{" "}
                          <button
                            className="text-[#a4c65b] font-semibold"
                            onClick={() => setCategory("")}
                          >
                            Limpar filtros
                          </button>
                        </p>
                      )}
                </div>

                {/* Pagination */}
                {!isLoading && totalPages > 1 && (
                  <nav
                    className="flex justify-center items-center gap-3 mt-10"
                    aria-label="Paginação"
                  >
                    <button
                      className="outline-button px-4 py-2 text-xs disabled:opacity-40"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      aria-label="Página anterior"
                    >
                      ←
                    </button>
                    <span className="text-xs text-gray-500">
                      Página {page} de {totalPages}
                    </span>
                    <button
                      className="outline-button px-4 py-2 text-xs disabled:opacity-40"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                      aria-label="Próxima página"
                    >
                      →
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Collections ──────────────────────────────────────────────────── */}
      <section className="collections section" id="colecoes">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CURADORIA KURIO</span>
            <h2>Coleções em destaque</h2>
            <p>Explore novos artistas, coleções verificadas e obras digitais.</p>
          </div>
          <a className="text-link" href="#mercado">
            Ver mercado ↗
          </a>
        </div>
        <div className="collection-grid">
          <article className="collection-card collection-large">
            <img
              src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1000"
              alt="Arte abstrata colorida — Coleção Gênesis"
            />
            <div>
              <span>COLEÇÃO 01</span>
              <h3>
                Lançamentos gênesis
                <br />
                de edição limitada
              </h3>
              <a href="#mercado">Explorar ↗</a>
            </div>
          </article>
          <article className="collection-card">
            <img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800"
              alt="Arte digital generativa — Coleção 02"
            />
            <div>
              <span>COLEÇÃO 02</span>
              <h3>Arte digital selecionada</h3>
              <a href="#mercado">Explorar ↗</a>
            </div>
          </article>
        </div>
      </section>

      {/* ── Journal ──────────────────────────────────────────────────────── */}
      <section className="journal section" id="aprenda">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CONHECIMENTO PARA COLECIONADORES</span>
            <h2>Diário da Cunhagem</h2>
            <p>
              Histórias, guias e insights para colecionadores sobre o universo
              da propriedade digital.
            </p>
          </div>
          <a className="text-link" href="#aprenda">
            Ver todos os artigos ↗
          </a>
        </div>
        <div className="journal-grid">
          {ARTICLES.map((article) => (
            <article className="journal-card" key={article.title}>
              <img src={article.image} alt="" role="presentation" />
              <span>{article.date}</span>
              <h3>{article.title}</h3>
              <p>{article.description}</p>
              <a href="#aprenda">Ler mais ↗</a>
            </article>
          ))}
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────────────────────────────── */}
      <section className="newsletter">
        <div>
          <span className="eyebrow">FIQUE POR DENTRO</span>
          <h2>Antecipe-se ao próximo lançamento</h2>
          <p>
            Receba lançamentos selecionados, histórias de criadores e novidades
            do mercado.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setEmail("");
          }}
        >
          <input
            type="email"
            placeholder="Digite seu e-mail..."
            aria-label="Seu e-mail para newsletter"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Enviar ↗</button>
        </form>
      </section>

      {/* ── Benefits ─────────────────────────────────────────────────────── */}
      <section className="benefits section" id="criadores">
        <article>
          <span aria-hidden="true">◇</span>
          <h3>Segurança da carteira</h3>
          <p>
            Proteja sua carteira e colecione arte digital verificada com
            confiança.
          </p>
        </article>
        <article>
          <span aria-hidden="true">✳</span>
          <h3>Criadores em destaque</h3>
          <p>
            Conheça artistas, estúdios e comunidades que moldam a cultura
            digital.
          </p>
        </article>
        <article>
          <span aria-hidden="true">◷</span>
          <h3>Alertas de lançamentos</h3>
          <p>
            Receba calendários de cunhagem, novidades de listas de acesso e
            análises do mercado.
          </p>
        </article>
      </section>
    </>
  );
}

// No unused imports
