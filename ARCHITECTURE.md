# Arquitetura — Kurio NFT Marketplace

Documento de decisões técnicas, estratégias de estado, contratos REST e limitações conhecidas.

---

## Contratos REST

Base URL: `/api` (interceptada pelo MSW em desenvolvimento)

### Sessão e conta

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/auth/register` | Cria conta. Body: `{ name, email, password }`. Retorna `Session`. Conflito → 409. |
| `POST` | `/auth/login` | Autentica. Body: `{ email, password }`. Retorna `Session`. Credenciais inválidas → 401. |
| `GET` | `/auth/session` | Valida token do header `Authorization: Bearer <token>`. Retorna `Session` ou 401. |
| `DELETE` | `/auth/session` | Logout. Invalida o token. Retorna 204. |

### NFTs

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/nfts` | Listagem paginada. Params: `q`, `category`, `network`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`. |
| `GET` | `/nfts/:id` | Detalhe. 404 se inexistente. |

### Favoritos (autenticado)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/favorites` | Lista favoritos do usuário autenticado. |
| `POST` | `/favorites` | Body: `{ nftId }`. 409 se já favoritado. |
| `DELETE` | `/favorites/:nftId` | Remove favorito. 204. |

### Carrinho (guest ou autenticado)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/cart` | Retorna carrinho. Guest identificado pela ausência de token. |
| `POST` | `/cart/items` | Body: `{ nftId, editionId, quantity }`. 409 se indisponível. |
| `PATCH` | `/cart/items/:nftId/:editionId` | Body: `{ quantity }`. Atualiza quantidade e refresca preço. |
| `DELETE` | `/cart/items/:nftId/:editionId` | Remove item. |

### Cotação

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/quote` | Body: `QuoteRequest`. Valida preços, disponibilidade, cupom. Retorna `Quote` com flags `priceChanged` e `availabilityChanged`. |

Cupons válidos nos mocks: `KURIO10` (10%), `GENESIS20` (20%).

### Pedidos (autenticado)

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/orders` | Body: `CreateOrderPayload` com `idempotencyKey`. Mesma chave retorna o mesmo pedido (idempotência). |
| `GET` | `/orders` | Lista pedidos do usuário. |
| `GET` | `/orders/:id` | Detalhe de um pedido. |

### Perfil (autenticado)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/profile` | Dados do usuário. |
| `PATCH` | `/profile` | Body: `{ name?, bio?, avatar? }`. |
| `POST` | `/profile/password` | Body: `{ currentPassword, newPassword }`. 400 se senha atual errada. |
| `GET` | `/wallets` | Lista carteiras do usuário. |
| `PUT` | `/wallets` | Body: `UpsertWalletPayload`. Cria ou substitui por `label` (primary/secondary). |

---

## Eventos Socket.IO

Dois eventos obrigatórios planejados (implementação pendente — ver limitações):

### `nft.updated`
```ts
{
  id: string;        // ID único do evento (deduplicação)
  resourceId: string; // nftId afetado
  version: number;   // Versão crescente — eventos antigos são descartados
  data: {
    editions: NFTEdition[];
  };
}
```
**Comportamento:** atualiza preço e disponibilidade no catálogo, detalhe e carrinho. O checkout bloqueia confirmação se a cotação estiver desatualizada.

### `order.updated`
```ts
{
  id: string;
  resourceId: string; // orderId
  version: number;
  data: {
    status: "pending" | "confirmed" | "refused";
    txHash?: string;
  };
}
```
**Comportamento:** atualiza o estado do pedido na tela de confirmação. Eventos duplicados ou com versão menor que o estado atual são ignorados.

---

## Política de sessão

- O token é armazenado em `localStorage` como `session_token`.
- Cada request inclui `Authorization: Bearer <token>` via interceptor do Axios.
- Uma resposta 401 dispara `window.dispatchEvent(new CustomEvent("session:expired"))`, que o router escuta para redirecionar ao login preservando o contexto.
- Logout limpa o token e remove do cache do TanStack Query todas as queries privadas (cart, favorites, orders, profile, wallets).
- Ao fazer login, o carrinho do guest é mesclado ao carrinho do usuário autenticado (itens não duplicados, respeitando `maxPerOrder`).

---

## Estado do carrinho

- O carrinho é armazenado no servidor mock (db.ts → localStorage).
- Visitantes não autenticados têm carrinho sob a chave `"guest"`.
- Ao autenticar, o carrinho guest é mesclado ao do usuário.
- `useCart` tem `staleTime: 0` para sempre refletir mudanças em tempo real.
- Eventos `nft.updated` via Socket.IO atualizam preço e disponibilidade dos itens em cache sem re-fetch completo.

---

## Estratégia de cache (TanStack Query)

| Query | staleTime | gcTime | Notas |
|---|---|---|---|
| `session` | 5 min | 10 min | Re-fetch silencioso no focus |
| `nfts` | 2 min | 10 min | Invalidado por eventos `nft.updated` |
| `nft/:id` | 2 min | 10 min | Invalidado por eventos `nft.updated` |
| `cart` | 0 | 10 min | Sempre re-fetch; atualizado via `setQueryData` nas mutations |
| `favorites` | 2 min | 10 min | Update otimista com rollback em falha |
| `quote` | 4 min | 5 min | Expiração alinhada com o TTL do servidor (5 min) |
| `orders` | 2 min | 10 min | Polling a cada 2s enquanto `status === "pending"` |
| `profile` | 2 min | 10 min | Atualizado via `setQueryData` após PATCH |
| `wallets` | 2 min | 10 min | Invalidado após upsert |

**Cancelamento:** todas as queries passam `signal` para o Axios. Requests obsoletos são cancelados automaticamente ao trocar de parâmetros.

**Isolamento por usuário:** ao fazer logout, `removeQueries` é chamado para cart, favorites, orders, profile e wallets. Ao trocar de usuário, nenhum dado privado do usuário anterior permanece em cache.

---

## Reconciliação REST ↔ Socket.IO

Após reconexão do socket:

1. O cliente invalida as queries ativas (`nfts`, `nft/:id`, `cart`, `order/:id` em andamento).
2. O TanStack Query re-fetcha automaticamente as queries com `refetchOnWindowFocus: true`.
3. Eventos recebidos com `version` menor que o estado em cache são descartados.
4. Eventos com `id` já processado na sessão atual são ignorados (Set de IDs vistos).

---

## Idempotência de pedidos

O campo `idempotencyKey` (nanoid de 32 caracteres) é gerado no cliente antes de enviar o pedido. O servidor mock:
- Retorna o pedido existente se a mesma chave for reenviada (timeout + retry seguro).
- Retorna 409 se a mesma chave for usada com conteúdo diferente.

---

## Mocking com MSW

- Os handlers vivem em `src/mocks/handlers/` e são registrados em `src/mocks/browser.ts`.
- O banco em memória (`src/mocks/db.ts`) é o único ponto de verdade durante os mocks.
- Persistência via `localStorage` sob a chave `kurio_mock_db`.
- Reset: remover `kurio_mock_db` do localStorage e recarregar.
- O MSW é ativado apenas quando `VITE_MOCK=true` (`.env.development`).
- Componentes e hooks **não contêm** lógica de negócio simulada — toda a simulação fica nos handlers.

**Limitação do Socket.IO em mocks:** o `@mswjs/socket.io-binding` ainda não está integrado. Os eventos em tempo real são simulados via `setTimeout` no handler de pedidos (confirmação após ~2,5s) e via polling no `useOrder`. A integração completa do socket será feita na próxima iteração.

---

## Desvios do Figma

- **shadcn/ui:** os componentes não foram migrados para shadcn/ui ainda. A identidade visual segue os tokens do Figma (cores `#a4c65b`, `#20271f`, fontes Manrope e DM Sans) implementados em CSS e Tailwind, mas sem usar os primitivos do shadcn.
- **Telas mobile específicas:** perfil, carteiras e confirmação de pedido seguem o mesmo padrão visual do desktop adaptado (sem frame mobile específico no Figma para essas telas — conforme permitido pelo enunciado).
- **Regressão visual Playwright:** baselines ainda não geradas (dependem de ambiente de CI estável).
- **Auditoria Lighthouse:** não executada nesta versão — requer build de produção com servidor estático e perfis mobile/desktop configurados.

---

## Limitações conhecidas

| Item | Status |
|---|---|
| Socket.IO eventos em tempo real | Simulado via polling/setTimeout — integração MSW Socket.IO pendente |
| shadcn/ui | Não integrado — visual implementado diretamente em Tailwind/CSS |
| Testes Playwright | Estrutura criada, suítes de teste pendentes |
| Auditoria Lighthouse | Pendente |
| Filtro de preço (slider) | UI presente, sem query param na URL ainda |
| Filtros de rede (checkbox) | UI presente, sem query param na URL ainda |
