const configuredBackendUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  "http://localhost:10000";

export const BACKEND_BASE_URL = configuredBackendUrl
  .replace(/\/api\/?$/i, "")
  .replace(/\/+$/, "");

export const API_BASE_URL = BACKEND_BASE_URL;

const encode = (value: string | number): string =>
  encodeURIComponent(String(value));

export const backendUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${BACKEND_BASE_URL}${normalizedPath}`;
};

export const backendEndpoints = {
  health: "/health",

  home: {
    index: "/api/home",
    merchandise: "/api/home/merchandise",
    privacy: "/api/home/privacy",
    discussion: "/api/home/discussion",
  },

  merchandise: {
    index: "/api/merchandise",
    list: "/api/merchandise/List",
  },

  product: {
    index: "/api/products",
    categories: "/api/products/categories",

    details: (id: string) =>
      `/api/products/${encode(id)}`,

    createModel: "/api/products/Create",
    create: "/api/products",

    editModel: (id: string) =>
      `/api/products/${encode(id)}/edit`,

    edit: (id: string) =>
      `/api/products/${encode(id)}`,

    deleteModel: (id: string) =>
      `/api/products/${encode(id)}/delete`,

    delete: (id: string) =>
      `/api/products/${encode(id)}`,

    addReview: (productId: string) =>
      `/api/products/${encode(productId)}/reviews`,

    deleteReview: (
      productId: string,
      reviewId: number,
    ) =>
      `/api/products/${encode(productId)}` +
      `/reviews/${encode(reviewId)}`,
  },

  cart: {
    index: "/api/cart/my-cart",
    addItem: "/api/cart/items",

    // Временно остава като функция, защото съществуващият
    // ProductDetails компонент я извиква с productId.
    add: (_id: string) => "/api/cart/items",

    increase: (id: string) =>
      `/api/cart/Increase?id=${encode(id)}`,

    decrease: (id: string) =>
      `/api/cart/Decrease?id=${encode(id)}`,

    remove: (id: string) =>
      `/api/cart/RemoveProduct?id=${encode(id)}`,

    cancel: "/api/cart/Cancel",
    mini: "/api/cart/Mini",
    count: "/api/cart/CountJson",
    archive: "/api/cart/archive",

    details: (id: string) =>
      `/api/cart/archive/${encode(id)}`,
  },

  checkout: {
    start: "/api/checkout/Start",
    shipping: "/api/checkout/Shipping",
    payment: "/api/checkout/Payment",
    review: "/api/checkout/Review",
    placeOrder: "/api/checkout/PlaceOrder",
    card: "/api/checkout/Card",
    finalizeCard: "/api/checkout/Card/Finalize",
    registered: "/api/checkout/Registered",
    success: "/api/checkout/Success",
    failure: "/api/checkout/Failure",
  },

  auth: {
    csrf: "/api/auth/csrf",
    me: "/api/auth/me",
    register: "/api/auth/register",
    login: "/api/auth/login",
    loginWithTwoFactor: "/api/auth/2fa",
    loginWithRecoveryCode: "/api/auth/recovery-code",
    changePassword: "/api/auth/change-password",
    logout: "/api/auth/logout",
  },

  account: {
    myAccount: "/api/account/MyAccount",
    overview: "/api/account/Overview",
    details: "/api/account/AccountDetails",
    settings: "/api/account/Settings",
    privacy: "/api/account/Privacy",
    connections: "/api/account/Connections",

    redeemCode: "/api/account/RedeemCode",
    devTopUp: "/api/account/DevTopUp",

    uploadAvatar: "/api/account/UploadAvatar",
    setUploadedAvatar: "/api/account/SetUploadedAvatar",
    deleteUpload: "/api/account/DeleteUpload",
    setDefaultAvatar: "/api/account/SetDefaultAvatar",

    security: "/api/account/Security",
    enable2fa: "/api/account/Enable2FA",
    disable2fa: "/api/account/Disable2FA",
    generateRecoveryCode:
      "/api/account/GenerateRecoveryCode",
    toggleRequire2fa:
      "/api/account/ToggleRequire2FA",
    logoutAllDevices:
      "/api/account/LogoutAllDevices",

    markPhoneVerified:
      "/api/account/MarkPhoneVerified",

    editProfile: "/api/account/EditProfile",
    editEmail: "/api/account/EditEmail",
    editPhone: "/api/account/EditPhone",
    removePhone: "/api/account/RemovePhone",
    editBattleTag: "/api/account/EditBattleTag",
    addAddress: "/api/account/AddAddress",
    editAddress: "/api/account/EditAddress",
    connectProvider: "/api/account/ConnectProvider",
    removeApp: "/api/account/RemoveApp",

    transactions:
      "/api/account/TransactionHistory",

    /*
     * PaymentMethodsController в текущия backend архив
     * все още е с [Route("Account")], а не с
     * [Route("api/account")].
     */
    paymentMethods: "/Account/PaymentMethods",
    addPaymentMethod: "/Account/AddPaymentMethod",
    addStripePaymentMethod:
      "/Account/AddPaymentMethodStripe",

    removePaymentMethod: (id: string) =>
      `/Account/PaymentMethods/${encode(id)}`,

    setDefaultPaymentMethod:
      "/Account/SetDefaultPaymentMethod",

    login: "/api/auth/login",
    logout: "/api/auth/logout",
  },

  discussions: {
    index: "/api/discussions",

    details: (id: string) =>
      `/api/discussions/${encode(id)}`,

    create: "/api/discussions",

    delete: (id: string) =>
      `/api/discussions/${encode(id)}`,

    like: (id: string) =>
      `/api/discussions/${encode(id)}/like`,

    addComment: (id: string) =>
      `/api/discussions/${encode(id)}/comments`,

    likeComment: (
      postId: string,
      commentId: string,
    ) =>
      `/api/discussions/${encode(postId)}` +
      `/comments/${encode(commentId)}/like`,
  },

  talents: {
    section: (section: string) =>
      `/talents/${encode(section.toLowerCase())}`,

    all: (section: string) =>
      `/talents/all/${encode(section.toLowerCase())}`,

    tree: (
      key: string,
      section?: string,
    ) => {
      const basePath =
        `/talents/tree/${encode(key)}`;

      return section
        ? `${basePath}?section=${encode(section)}`
        : basePath;
    },

    save: (key: string) =>
      `/api/talents/${encode(key)}`,
  },

  paladin: {
    index: "/api/paladin",

    overview: (section: string) =>
      `/api/paladin/${encode(
        section.toLowerCase(),
      )}/overview`,

    gear: (section: string) =>
      `/api/paladin/${encode(
        section.toLowerCase(),
      )}/gear`,

    stats: (section: string) =>
      `/api/paladin/${encode(
        section.toLowerCase(),
      )}/stats`,

    rotation: (section: string) =>
      `/api/paladin/${encode(
        section.toLowerCase(),
      )}/rotation`,

    consumables: (section: string) =>
      `/api/paladin/${encode(
        section.toLowerCase(),
      )}/consumables`,

    talents: (section: string) =>
      `/api/paladin/${encode(
        section.toLowerCase(),
      )}/talents`,

    page: (
      section: string,
      slug: string,
    ) =>
      `/api/paladin/${encode(
        section.toLowerCase(),
      )}/${encode(slug.toLowerCase())}`,
  },

  pageBuilder: {
    renderBlock: "/api/blocks/render",
    renderLayout: "/api/blocks/render-layout",

    presets: "/api/presets",

    preset: (id: number) =>
      `/api/presets/${encode(id)}`,

    presetPreview: (id: number) =>
      `/api/presets/${encode(id)}/preview`,

    pages: "/Admin/api/pages",

    pageHead: (id: number) =>
      `/Admin/api/pages/${encode(id)}/head`,

    pageLayout: (id: number) =>
      `/Admin/api/pages/${encode(id)}/layout`,
  },

  admin: {
    database: "/Admin/api/database",

    items: {
      createModel: "/Admin/api/items/create",
      create: "/Admin/api/items",

      editModel: (id: string | number) =>
        `/Admin/api/items/${encode(id)}/edit`,

      edit: (id: string | number) =>
        `/Admin/api/items/${encode(id)}`,

      details: (id: string | number) =>
        `/Admin/api/items/${encode(id)}`,

      deleteModel: (id: string | number) =>
        `/Admin/api/items/${encode(id)}/delete`,

      delete: (id: string | number) =>
        `/Admin/api/items/${encode(id)}`,
    },

    spells: {
      createModel: "/Admin/api/spells/create",
      create: "/Admin/api/spells",

      editModel: (id: string | number) =>
        `/Admin/api/spells/${encode(id)}/edit`,

      edit: (id: string | number) =>
        `/Admin/api/spells/${encode(id)}`,

      details: (id: string | number) =>
        `/Admin/api/spells/${encode(id)}`,

      deleteModel: (id: string | number) =>
        `/Admin/api/spells/${encode(id)}/delete`,

      delete: (id: string | number) =>
        `/Admin/api/spells/${encode(id)}`,
    },

    pageBuilder: {
      createModel: "/Admin/PageBuilder/Create",
      create: "/Admin/api/pages",

      editModel: (id: number) =>
        `/Admin/PageBuilder/Edit?id=${encode(id)}`,

      deleteModel: (
        section: string,
        slug: string,
      ) =>
        "/Admin/PageBuilder/DeleteConfirm" +
        `?section=${encode(section)}` +
        `&slug=${encode(slug)}`,

      delete: "/Admin/api/pages",
    },

    promoCodes: {
      index: "/Admin/api/promo-codes",
      createModel:
        "/Admin/api/promo-codes/create",
      create: "/Admin/api/promo-codes",

      deactivate: (id: string) =>
        `/Admin/api/promo-codes/${encode(id)}` +
        "/deactivate",
    },
  },
} as const;

export const openBackendRoute = (
  path: string,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign(backendUrl(path));
};

type CsrfResponse = {
  token?: string | null;
};

const mutatingMethods = new Set([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

let csrfTokenPromise: Promise<string> | null = null;

async function requestCsrfToken(): Promise<string> {
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = (async () => {
    const response = await fetch(
      backendUrl(backendEndpoints.auth.csrf),
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      },
    );

    const data =
      await readApiJson<CsrfResponse>(response);

    if (!data?.token) {
      throw new Error("CSRF token is missing.");
    }

    return data.token;
  })().catch((error) => {
    csrfTokenPromise = null;
    throw error;
  });

  return csrfTokenPromise;
}

export function clearCachedCsrfToken(): void {
  csrfTokenPromise = null;
}

export async function fetchBackend(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const method =
    (init.method || "GET").toUpperCase();

  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (
    mutatingMethods.has(method) &&
    !headers.has("X-CSRF-TOKEN")
  ) {
    const csrfToken = await requestCsrfToken();

    headers.set("X-CSRF-TOKEN", csrfToken);
  }

  return fetch(backendUrl(path), {
    ...init,
    method,
    headers,
    credentials: "include",
  });
}

function extractErrorMessage(
  payload: unknown,
  fallback: string,
): string {
  if (
    payload === null ||
    typeof payload !== "object"
  ) {
    return typeof payload === "string" &&
      payload.trim()
      ? payload
      : fallback;
  }

  const data = payload as Record<string, unknown>;

  for (const key of [
    "message",
    "title",
    "detail",
    "error",
  ]) {
    const value = data[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value;
    }
  }

  const validationErrors = data.errors;

  if (
    validationErrors &&
    typeof validationErrors === "object"
  ) {
    for (const value of Object.values(
      validationErrors,
    )) {
      if (
        Array.isArray(value) &&
        typeof value[0] === "string"
      ) {
        return value[0];
      }

      if (
        typeof value === "string" &&
        value.trim()
      ) {
        return value;
      }
    }
  }

  return fallback;
}

export async function readApiJson<T>(
  response: Response,
): Promise<T> {
  const fallbackMessage =
    `Request failed with status ${response.status}`;

  if (
    response.status === 204 ||
    response.status === 205
  ) {
    if (!response.ok) {
      throw new Error(fallbackMessage);
    }

    return null as T;
  }

  const rawBody = await response.text();

  if (!rawBody.trim()) {
    if (!response.ok) {
      throw new Error(fallbackMessage);
    }

    return null as T;
  }

  const contentType =
    response.headers.get("content-type") || "";

  let payload: unknown = rawBody;

  if (
    contentType.includes("application/json") ||
    rawBody.trimStart().startsWith("{") ||
    rawBody.trimStart().startsWith("[")
  ) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = rawBody;
    }
  }

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(
        payload,
        fallbackMessage,
      ),
    );
  }

  return payload as T;
}