# Kurio — NFT Marketplace

Implementação do desafio frontend da Jungle Gaming: marketplace de NFTs em React + TypeScript, com roteamento via TanStack Router, estado remoto via TanStack Query, mocks via MSW e dados simulados via Socket.IO.

---

## Setup

### Pré-requisitos

- Node.js 18 ou superior
- npm 9 ou superior

### Instalação

```bash
# Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd "Desafio Frontend — Marketplace de NFTs"

# Instale as dependências
npm install

# Copie o service worker do MSW para a pasta public
node node_modules/msw/cli/init.js public
```

### Variáveis de ambiente

| Arquivo | Contexto | Conteúdo |
|---|---|---|
| `.env.development` | `npm run dev` | `VITE_MOCK=true` |
| `.env.production` | `npm run build` | `VITE_MOCK=false` |

Ambos os arquivos já estão incluídos no repositório. Nenhuma configuração adicional é necessária para rodar localmente.

---

## Comandos

```bash
# Desenvolvimento com mocks (MSW ativo)
npm run dev

# Build de produção
npm run build

# Preview do build de produção
npm run preview

# Verificação de tipos TypeScript
npm run typecheck

# Lint
npm run lint

# Testes E2E com Playwright
npm run test:e2e

# Testes E2E com interface visual
npm run test:e2e:ui
```

---

## Credenciais fictícias

Dois usuários estão disponíveis nos mocks. Use qualquer um para testar login, favoritos, carrinho, checkout e perfil.

| Usuário | E-mail | Senha |
|---|---|---|
| Alice Collector | `alice@kurio.dev` | `alice123` |
| Bob NFTer | `bob@kurio.dev` | `bob123` |

---

## Cenários de mock

Os mocks são controlados pelo MSW. O banco de dados em memória persiste no `localStorage` entre recarregamentos.

### Reset do estado

Para restaurar o banco ao estado inicial (fixtures originais), execute no console do navegador:

```js
// Importar e resetar (dev apenas)
// Abre o DevTools → Console e cole:
localStorage.removeItem("kurio_mock_db")
location.reload()
```

Ou clique em **Resetar dados** no painel de desenvolvedor (disponível em modo dev).

### Cenários disponíveis

Todos os cenários abaixo são reproduzíveis sem nenhuma configuração extra:

| Cenário | Como reproduzir |
|---|---|
| **Sucesso** | Fluxo normal: catálogo → detalhe → carrinho → checkout |
| **Resultado vazio** | Busque por um termo sem resultados, ex: `xyzabc` |
| **NFT não encontrado** | Acesse `/nft/nft-999` diretamente |
| **Sessão expirada** | No console: `localStorage.removeItem("session_token")` e navegue para `/profile` |
| **Conflito de cadastro** | Tente registrar com `alice@kurio.dev` |
| **Cupom inválido** | Use qualquer código diferente de `KURIO10` ou `GENESIS20` no carrinho |
| **Cupom válido** | Use `KURIO10` (10% de desconto) ou `GENESIS20` (20%) no carrinho |
| **Pagamento confirmado** | Conclua um checkout — 85% das tentativas resultam em confirmação |
| **Pagamento recusado** | Conclua um checkout — 15% das tentativas resultam em recusa |
| **Latência variável** | Os handlers MSW usam `delay({ min, max })` por padrão |
| **Erro de senha** | Em `/profile`, use uma senha atual incorreta |

### Eventos Socket.IO (planejados)

A integração Socket.IO está configurada no cliente (`socket.io-client` instalado). Os eventos `nft.updated` e `order.updated` serão emitidos via `@mswjs/socket.io-binding` em desenvolvimento.

---

## Fluxos principais para reproduzir

### Compra completa

1. Acesse `http://localhost:5173`
2. Clique em qualquer NFT para abrir o detalhe
3. Selecione uma edição e quantidade, clique em **Adicionar ao carrinho**
4. Acesse o carrinho via ícone no header
5. Opcionalmente aplique o cupom `KURIO10`
6. Clique em **Ir para pagamento**
7. Se não estiver logado, faça login com `alice@kurio.dev` / `alice123`
8. Revise o pedido, selecione a carteira e clique em **Revisar pedido**
9. Confirme clicando em **Confirmar compra**
10. Aguarde a tela de confirmação (a simulação leva ~2,5 segundos)

### Favoritos

1. Faça login
2. Na página inicial, clique no ♡ em qualquer card de NFT
3. O favorito é salvo por usuário e persiste após refresh

### Troca de usuário

1. Faça logout pelo menu do header
2. Faça login com o outro usuário
3. Os dados de carrinho, favoritos e pedidos são isolados por usuário

---

## Stack

| Responsabilidade | Tecnologia |
|---|---|
| Interface | React 19 |
| Linguagem | TypeScript 7 |
| Roteamento | TanStack Router |
| Estado remoto | TanStack Query |
| Cliente HTTP | Axios |
| Estilização | Tailwind CSS v4 |
| Mocking | MSW v2 |
| Tempo real | Socket.IO Client |
| Testes E2E | Playwright |
| Build | Vite 8 (rolldown) |

---

## Estrutura do projeto

```
src/
├── components/
│   ├── auth/          # LoginPage, RegisterPage
│   ├── cart/          # CartPage
│   ├── checkout/      # CheckoutPage, OrderConfirmationPage
│   ├── layout/        # Header, Footer, HomePage
│   ├── nft/           # NFTCard, NFTDetailPage
│   ├── profile/       # ProfilePage, WalletsPage
│   └── shared/        # Skeleton, ErrorState
├── hooks/             # useNFTs, useCart, useSession, useFavorites, ...
├── lib/               # axios, queryClient, queryKeys, decimal, nanoid, sessionLoader
├── mocks/
│   ├── browser.ts     # MSW worker setup
│   ├── db.ts          # Banco em memória + localStorage
│   ├── fixtures/      # NFTs, usuários e carteiras iniciais
│   └── handlers/      # auth, nfts, cart, favorites, quote, orders, profile
├── routes/            # Arquivo de rotas (TanStack Router file-based)
└── types/             # Contratos TypeScript completos
```

---

## Implantação (deploy)

O desafio recomenda Vercel. Passos:

1. Faça push do repositório para o GitHub
2. Acesse [vercel.com](https://vercel.com) e importe o repositório
3. Configure a variável de ambiente `VITE_MOCK=true` no painel da Vercel (para o build de demo com mocks)
4. O comando de build é `npm run build` e o diretório de saída é `dist`
5. Ative **Rewrite all routes to index.html** (SPA routing) — na Vercel isso é feito automaticamente para Vite

Para o `vercel.json` de rewrite de rotas SPA:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
