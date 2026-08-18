"use client";

import React, {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

type LocationValue = {
  pathname: string;
  search: string;
  hash: string;
  state?: unknown;
};

type RouterContextValue = {
  location: LocationValue;
  navigate: (to: string | number, options?: NavigateOptions) => void;
};

type RouteCandidate = {
  pattern: string;
  element: ReactNode;
  layouts: ReactNode[];
};

type MatchedRoute = RouteCandidate & {
  params: Record<string, string>;
};

const RouterContext = createContext<RouterContextValue | null>(null);
const ParamsContext = createContext<Record<string, string>>({});
const OutletContext = createContext<ReactNode>(null);

function getCurrentLocation(): LocationValue {
  if (typeof window === "undefined") {
    return {
      pathname: "/",
      search: "",
      hash: "",
      state: undefined,
    };
  }

  return {
    pathname: window.location.pathname || "/",
    search: window.location.search || "",
    hash: window.location.hash || "",
    state: window.history.state?.usr,
  };
}

function normalizePath(path: string): string {
  if (!path) {
    return "/";
  }

  const [pathname] = path.split(/[?#]/);
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;

  return normalized.length > 1
    ? normalized.replace(/\/+$/, "")
    : normalized;
}

function joinPaths(base: string, path?: string): string {
  if (!path) {
    return normalizePath(base || "/");
  }

  if (path.startsWith("/")) {
    return normalizePath(path);
  }

  const cleanBase = base === "/" ? "" : base;
  return normalizePath(`${cleanBase}/${path}`);
}

function splitPattern(pattern: string): string[] {
  return normalizePath(pattern).split("/").filter(Boolean);
}

function matchPattern(
  pattern: string,
  pathname: string,
): Record<string, string> | null {
  const patternParts = splitPattern(pattern);
  const pathParts = splitPattern(pathname);
  const params: Record<string, string> = {};

  const wildcardIndex = patternParts.indexOf("*");
  const hasWildcard = wildcardIndex !== -1;
  const compareLength = hasWildcard
    ? wildcardIndex
    : patternParts.length;

  if (!hasWildcard && patternParts.length !== pathParts.length) {
    return null;
  }

  if (hasWildcard && pathParts.length < compareLength) {
    return null;
  }

  for (let index = 0; index < compareLength; index += 1) {
    const patternPart = patternParts[index];
    const pathPart = pathParts[index];

    if (patternPart?.startsWith(":")) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart ?? "");
      continue;
    }

    if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
}

function routeScore(pattern: string): number {
  return splitPattern(pattern).reduce((score, segment) => {
    if (segment === "*") {
      return score - 1000;
    }

    if (segment.startsWith(":")) {
      return score + 10;
    }

    return score + 100;
  }, 0);
}

function renderWithLayouts(candidate: MatchedRoute): ReactNode {
  let rendered = candidate.element;

  for (
    let index = candidate.layouts.length - 1;
    index >= 0;
    index -= 1
  ) {
    rendered = (
      <OutletContext.Provider value={rendered}>
        {candidate.layouts[index]}
      </OutletContext.Provider>
    );
  }

  return (
    <ParamsContext.Provider value={candidate.params}>
      {rendered}
    </ParamsContext.Provider>
  );
}

function buildCandidates(
  children: ReactNode,
  basePath = "/",
  layouts: ReactNode[] = [],
): RouteCandidate[] {
  const candidates: RouteCandidate[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    const props = child.props as {
      path?: string;
      index?: boolean;
      element?: ReactNode;
      children?: ReactNode;
    };

    const routePath = props.index
      ? basePath
      : joinPaths(basePath, props.path);

    const hasChildren = Boolean(props.children);
    const nextLayouts = props.element
      ? [...layouts, props.element]
      : layouts;

    if (hasChildren) {
      candidates.push(
        ...buildCandidates(
          props.children,
          routePath,
          nextLayouts,
        ),
      );
    }

    if (!hasChildren && props.element) {
      candidates.push({
        pattern: routePath,
        element: props.element,
        layouts,
      });
    }
  });

  return candidates;
}

export function BrowserRouter({
  children,
}: {
  children: ReactNode;
}) {
  const [location, setLocation] =
    useState<LocationValue>(getCurrentLocation);

  useEffect(() => {
    const handlePopState = () => {
      setLocation(getCurrentLocation());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const navigate = useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof window === "undefined") {
        return;
      }

      if (typeof to === "number") {
        window.history.go(to);
        return;
      }

      const method = options?.replace
        ? "replaceState"
        : "pushState";

      window.history[method](
        { usr: options?.state },
        "",
        to,
      );

      setLocation(getCurrentLocation());
    },
    [],
  );

  const value = useMemo(
    () => ({
      location,
      navigate,
    }),
    [location, navigate],
  );

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  );
}

export const Router = BrowserRouter;

export function Route(_props: {
  path?: string;
  index?: boolean;
  element?: ReactNode;
  children?: ReactNode;
}) {
  return null;
}

export function Routes({
  children,
}: {
  children: ReactNode;
}) {
  const { location } = useRouterContext();

  const candidates = useMemo(
    () =>
      buildCandidates(children).sort(
        (left, right) =>
          routeScore(right.pattern) -
          routeScore(left.pattern),
      ),
    [children],
  );

  const candidate = candidates.reduce<MatchedRoute | null>(
    (match, route) => {
      if (match) {
        return match;
      }

      const params = matchPattern(
        route.pattern,
        location.pathname,
      );

      return params
        ? {
            ...route,
            params,
          }
        : null;
    },
    null,
  );

  return candidate
    ? renderWithLayouts(candidate)
    : null;
}

export function Outlet() {
  return <>{useContext(OutletContext)}</>;
}

function useRouterContext(): RouterContextValue {
  const context = useContext(RouterContext);

  if (!context) {
    throw new Error("Router context is missing.");
  }

  return context;
}

export function useNavigate() {
  return useRouterContext().navigate;
}

export function useLocation() {
  return useRouterContext().location;
}

export function useParams<
  T extends Record<string, string | undefined>,
>(): T {
  return useContext(ParamsContext) as T;
}

type SearchParamsInput =
  | URLSearchParams
  | Record<string, string>
  | string
  | ((
      previous: URLSearchParams,
    ) =>
      | URLSearchParams
      | Record<string, string>
      | string);

export function useSearchParams(): [
  URLSearchParams,
  (next: SearchParamsInput) => void,
] {
  const { location, navigate } = useRouterContext();

  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const setSearchParams = (
    next: SearchParamsInput,
  ) => {
    const resolved =
      typeof next === "function"
        ? next(new URLSearchParams(params))
        : next;

    const nextParams =
      typeof resolved === "string"
        ? new URLSearchParams(resolved)
        : resolved instanceof URLSearchParams
          ? resolved
          : new URLSearchParams(resolved);

    const query = nextParams.toString();

    navigate(
      `${location.pathname}${
        query ? `?${query}` : ""
      }`,
    );
  };

  return [params, setSearchParams];
}

export function Link({
  to,
  href,
  children,
  onClick,
  replace,
  state,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  to?: string;
  href?: string;
  replace?: boolean;
  state?: unknown;
}) {
  const navigate = useNavigate();
  const target = to ?? href ?? "#";

  return (
    <a
      {...props}
      href={target}
      onClick={(event) => {
        onClick?.(event);

        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey ||
          props.target
        ) {
          return;
        }

        event.preventDefault();
        navigate(target, {
          replace,
          state,
        });
      }}
    >
      {children}
    </a>
  );
}

export function NavLink({
  to,
  end,
  className,
  children,
  ...props
}: Omit<
  React.ComponentProps<typeof Link>,
  "className"
> & {
  to: string;
  end?: boolean;
  className?:
    | string
    | ((args: { isActive: boolean }) => string);
}) {
  const { pathname } = useLocation();
  const target = normalizePath(to);
  const current = normalizePath(pathname);

  const isActive = end
    ? current === target
    : current === target ||
      current.startsWith(`${target}/`);

  const resolvedClassName =
    typeof className === "function"
      ? className({ isActive })
      : className;

  return (
    <Link
      to={to}
      className={resolvedClassName}
      {...props}
    >
      {children}
    </Link>
  );
}

export function Navigate({
  to,
  replace,
  state,
}: {
  to: string;
  replace?: boolean;
  state?: unknown;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, {
      replace,
      state,
    });
  }, [navigate, replace, state, to]);

  return null;
}

export const createBrowserRouter = (
  _routes?: unknown,
) => ({});

export function RouterProvider({
  children,
}: {
  children?: ReactNode;
}) {
  return <>{children}</>;
}