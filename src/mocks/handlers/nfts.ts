import { http, HttpResponse, delay } from "msw";
import { db } from "../db";
import type { NFTListParams, PaginatedNFTs } from "../../types";

export const nftHandlers = [
  // GET /api/nfts
  http.get("/api/nfts", async ({ request }) => {
    await delay({ min: 200, max: 600 });

    const url = new URL(request.url);
    const params: NFTListParams = {
      q: url.searchParams.get("q") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
      network: url.searchParams.get("network") ?? undefined,
      minPrice: url.searchParams.get("minPrice") ?? undefined,
      maxPrice: url.searchParams.get("maxPrice") ?? undefined,
      sort: (url.searchParams.get("sort") as NFTListParams["sort"]) ?? "recent",
      page: Number(url.searchParams.get("page") ?? 1),
      limit: Number(url.searchParams.get("limit") ?? 12),
    };

    let results = [...db.nfts];

    // Filter
    if (params.q) {
      const q = params.q.toLowerCase();
      results = results.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          n.creator.name.toLowerCase().includes(q)
      );
    }
    if (params.category) {
      results = results.filter((n) => n.category === params.category);
    }
    if (params.network) {
      results = results.filter((n) => n.network === params.network);
    }
    if (params.minPrice) {
      const min = parseFloat(params.minPrice);
      results = results.filter((n) =>
        n.editions.some((e) => parseFloat(e.price) >= min)
      );
    }
    if (params.maxPrice) {
      const max = parseFloat(params.maxPrice);
      results = results.filter((n) =>
        n.editions.some((e) => parseFloat(e.price) <= max)
      );
    }

    // Sort
    switch (params.sort) {
      case "price_asc":
        results.sort(
          (a, b) =>
            parseFloat(a.editions[0].price) - parseFloat(b.editions[0].price)
        );
        break;
      case "price_desc":
        results.sort(
          (a, b) =>
            parseFloat(b.editions[0].price) - parseFloat(a.editions[0].price)
        );
        break;
      case "popular":
        results.sort((a, b) => a.id.localeCompare(b.id));
        break;
      default: // recent
        results.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    const total = results.length;
    const page = params.page ?? 1;
    const limit = params.limit ?? 12;
    const start = (page - 1) * limit;
    const data = results.slice(start, start + limit);

    const response: PaginatedNFTs = {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };

    return HttpResponse.json(response);
  }),

  // GET /api/nfts/:id
  http.get("/api/nfts/:id", async ({ params }) => {
    await delay({ min: 150, max: 400 });

    const nft = db.nfts.find((n) => n.id === params.id);
    if (!nft) {
      return HttpResponse.json(
        { code: "NOT_FOUND", message: "NFT não encontrado" },
        { status: 404 }
      );
    }
    return HttpResponse.json(nft);
  }),
];
