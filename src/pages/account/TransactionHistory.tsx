"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AccountSideNav from "@/components/account/AccountSideNav";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import { useSearchParams } from "@/router/nextCompat";

type TransactionItem = {
  dateUtc: string;
  purchase: string;
  total: string;
  status: string;
};

type TransactionHistoryResponse = {
  items: TransactionItem[];
  page: number;
  totalPages: number;
  region: Region;
};

const regions = [
  "Europe",
  "Americas",
  "Asia",
  "All",
] as const;

type Region = (typeof regions)[number];

const emptyHistory: TransactionHistoryResponse = {
  items: [],
  page: 1,
  totalPages: 1,
  region: "Europe",
};

function asRecord(
  value: unknown,
): Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function property(
  source: Record<string, unknown>,
  camelCaseName: string,
  pascalCaseName: string,
): unknown {
  return (
    source[camelCaseName] ??
    source[pascalCaseName]
  );
}

function normalizeRegion(
  value: unknown,
): Region {
  const region = String(
    value ?? "",
  ).trim();

  return regions.includes(
    region as Region,
  )
    ? (region as Region)
    : "Europe";
}

function normalizePositiveInteger(
  value: unknown,
  fallback: number,
): number {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

function normalizeTransactionItem(
  value: unknown,
): TransactionItem | null {
  const source = asRecord(value);

  const dateUtc = String(
    property(
      source,
      "dateUtc",
      "DateUtc",
    ) ?? "",
  ).trim();

  const purchase = String(
    property(
      source,
      "purchase",
      "Purchase",
    ) ?? "",
  ).trim();

  const total = String(
    property(
      source,
      "total",
      "Total",
    ) ?? "",
  ).trim();

  const status = String(
    property(
      source,
      "status",
      "Status",
    ) ?? "",
  ).trim();

  if (
    !dateUtc &&
    !purchase &&
    !total &&
    !status
  ) {
    return null;
  }

  return {
    dateUtc,
    purchase,
    total,
    status,
  };
}

function normalizeHistory(
  payload: unknown,
): TransactionHistoryResponse {
  const source = asRecord(payload);

  const rawItems = property(
    source,
    "items",
    "Items",
  );

  const items = Array.isArray(rawItems)
    ? rawItems
        .map(normalizeTransactionItem)
        .filter(
          (
            item,
          ): item is TransactionItem =>
            item !== null,
        )
    : [];

  const totalPages =
    normalizePositiveInteger(
      property(
        source,
        "totalPages",
        "TotalPages",
      ),
      1,
    );

  const page = Math.min(
    normalizePositiveInteger(
      property(
        source,
        "page",
        "Page",
      ),
      1,
    ),
    totalPages,
  );

  return {
    items,
    page,
    totalPages,
    region: normalizeRegion(
      property(
        source,
        "region",
        "Region",
      ),
    ),
  };
}

async function loadHistory(
  page: number,
  region: Region,
  signal?: AbortSignal,
): Promise<TransactionHistoryResponse> {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: "10",
    region,
  });

  const response = await fetchBackend(
    `${backendEndpoints.account.transactions}?${query.toString()}`,
    {
      method: "GET",
      cache: "no-store",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  const payload =
    await readApiJson<unknown>(
      response,
    );

  return normalizeHistory(payload);
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

export default function TransactionHistory() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const requestedPage =
    normalizePositiveInteger(
      searchParams.get("page"),
      1,
    );

  const requestedRegion =
    normalizeRegion(
      searchParams.get("region"),
    );

  const [history, setHistory] =
    useState<TransactionHistoryResponse>({
      ...emptyHistory,
      page: requestedPage,
      region: requestedRegion,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async (
      signal?: AbortSignal,
    ): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const result =
          await loadHistory(
            requestedPage,
            requestedRegion,
            signal,
          );

        if (signal?.aborted) {
          return;
        }

        setHistory(result);
      } catch (caught) {
        if (
          signal?.aborted ||
          isAbortError(caught)
        ) {
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : "Transaction history could not be loaded.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [
      requestedPage,
      requestedRegion,
    ],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    void load(controller.signal);

    return () => {
      controller.abort();
    };
  }, [load]);

  const pages = useMemo(
    () =>
      Array.from(
        {
          length:
            history.totalPages,
        },
        (_, index) => index + 1,
      ),
    [history.totalPages],
  );

  const navigate = (
    page: number,
    region: Region =
      requestedRegion,
  ): void => {
    setSearchParams({
      page: String(
        Math.max(1, page),
      ),
      region,
    });
  };

  const currentPage =
    history.page;

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#0f1216] px-4 py-8 text-[#e9ecef]">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-semibold">
          Transaction History
        </h1>

        <div className="flex flex-col gap-6 lg:flex-row">
          <AccountSideNav active="TransactionHistory" />

          <section className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-end gap-3 border-b border-[#313a45]">
              <span className="border-b-2 border-blue-500 px-4 py-3 font-semibold text-white">
                Purchases
              </span>

              <span className="px-4 py-3 text-[#68717d]">
                Gift Claims
              </span>

              <span className="px-4 py-3 text-[#68717d]">
                Virtual Wallet
              </span>

              <label className="mb-2 ml-auto flex items-center gap-2 text-sm text-[#a8b0bd]">
                Region

                <select
                  value={requestedRegion}
                  disabled={loading}
                  onChange={(event) => {
                    navigate(
                      1,
                      normalizeRegion(
                        event.target.value,
                      ),
                    );
                  }}
                  className="rounded-md border border-[#46515e] bg-[#151a1f] px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {regions.map(
                    (region) => (
                      <option
                        key={region}
                        value={region}
                      >
                        {region}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            {error ? (
              <div
                className="mb-4 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-200"
                role="alert"
              >
                <p>{error}</p>

                <button
                  type="button"
                  onClick={() => {
                    void load();
                  }}
                  disabled={loading}
                  className="mt-3 rounded-md border border-red-300/40 px-3 py-2 font-semibold hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Try again
                </button>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-xl border border-[#313a45] bg-[#1a1f24] shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-left">
                  <thead className="bg-[#171c21] text-[#cfd6df]">
                    <tr>
                      <th
                        scope="col"
                        className="w-[18%] px-4 py-3"
                      >
                        Date
                      </th>

                      <th
                        scope="col"
                        className="px-4 py-3"
                      >
                        Purchase
                      </th>

                      <th
                        scope="col"
                        className="w-[14%] px-4 py-3"
                      >
                        Total
                      </th>

                      <th
                        scope="col"
                        className="w-[14%] px-4 py-3"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#262e38]">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-10 text-center text-[#a8b0bd]"
                        >
                          Loading transactions...
                        </td>
                      </tr>
                    ) : null}

                    {!loading &&
                    history.items.length ===
                      0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-10 text-center text-[#a8b0bd]"
                        >
                          No transactions found
                          for this region.
                        </td>
                      </tr>
                    ) : null}

                    {!loading
                      ? history.items.map(
                          (
                            item,
                            index,
                          ) => (
                            <tr
                              key={`${item.dateUtc}-${item.purchase}-${index}`}
                              className="hover:bg-[#20262d]"
                            >
                              <td className="px-4 py-4">
                                {formatDate(
                                  item.dateUtc,
                                )}
                              </td>

                              <td className="px-4 py-4">
                                {item.purchase ||
                                  "—"}
                              </td>

                              <td className="px-4 py-4 font-semibold">
                                {item.total ||
                                  "—"}
                              </td>

                              <td className="px-4 py-4">
                                <StatusBadge
                                  status={
                                    item.status
                                  }
                                />
                              </td>
                            </tr>
                          ),
                        )
                      : null}
                  </tbody>
                </table>
              </div>
            </div>

            {!loading &&
            history.totalPages > 1 ? (
              <nav
                className="mt-5 flex flex-wrap justify-center gap-2"
                aria-label="Transaction history pages"
              >
                <PageButton
                  disabled={
                    currentPage <= 1
                  }
                  onClick={() => {
                    navigate(
                      currentPage - 1,
                    );
                  }}
                >
                  Previous
                </PageButton>

                {pages.map((page) => (
                  <PageButton
                    key={page}
                    active={
                      page ===
                      currentPage
                    }
                    onClick={() => {
                      navigate(page);
                    }}
                  >
                    {page}
                  </PageButton>
                ))}

                <PageButton
                  disabled={
                    currentPage >=
                    history.totalPages
                  }
                  onClick={() => {
                    navigate(
                      currentPage + 1,
                    );
                  }}
                >
                  Next
                </PageButton>
              </nav>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function formatDate(
  value: string,
): string {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return value;
  }

  return parsed.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.trim().toLowerCase();

  const classes =
    normalized === "complete" ||
    normalized === "completed"
      ? "border-[#265b39] bg-[#163620] text-[#7dff9a]"
      : normalized === "pending"
        ? "border-[#8a6d10] bg-[#3a3009] text-[#ffd66e]"
        : normalized === "failed"
          ? "border-[#7a2b2b] bg-[#3a1212] text-[#ff8e8e]"
          : normalized ===
                "refunded" ||
              normalized ===
                "cancelled" ||
              normalized ===
                "canceled"
            ? "border-[#69517a] bg-[#2c1d36] text-[#d8a7ff]"
            : "border-[#4a515b] bg-[#2c2f36] text-[#cfd6df]";

  return (
    <span
      className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-bold ${classes}`}
    >
      {status || "Unknown"}
    </span>
  );
}

function PageButton({
  children,
  active = false,
  disabled = false,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={
        active
          ? "page"
          : undefined
      }
      className={`rounded-md border px-3 py-2 text-sm ${
        active
          ? "border-[#3a5c8a] bg-[#284b7a] text-white"
          : "border-[#2c343d] bg-[#151a1f] text-[#cfd6df] hover:bg-[#20262d]"
      } disabled:cursor-not-allowed disabled:bg-[#0f1216] disabled:text-[#6c757d]`}
    >
      {children}
    </button>
  );
}