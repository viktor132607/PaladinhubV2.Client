"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import {
  Link,
  useNavigate,
} from "@/router/nextCompat";

type ShippingForm = {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
};

type ShippingResponse = {
  ok?: boolean;
  shipping?: ShippingForm;
  redirect?: string;
  message?: string;
};

type CsrfResponse = {
  token?: string;
};

const initialForm: ShippingForm = {
  fullName: "",
  address: "",
  city: "",
  postalCode: "",
  country: "Bulgaria",
  phone: "",
  email: "",
};

function normalizeShipping(
  value: unknown,
): ShippingForm {
  const source =
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    fullName: String(
      source.fullName ??
        source.FullName ??
        "",
    ),

    address: String(
      source.address ??
        source.Address ??
        "",
    ),

    city: String(
      source.city ??
        source.City ??
        "",
    ),

    postalCode: String(
      source.postalCode ??
        source.PostalCode ??
        "",
    ),

    country:
      String(
        source.country ??
          source.Country ??
          "Bulgaria",
      ) || "Bulgaria",

    phone: String(
      source.phone ??
        source.Phone ??
        "",
    ),

    email: String(
      source.email ??
        source.Email ??
        "",
    ),
  };
}

function validate(
  form: ShippingForm,
): string[] {
  const errors: string[] = [];

  const fullName =
    form.fullName.trim();

  const address =
    form.address.trim();

  const city =
    form.city.trim();

  const postalCode =
    form.postalCode.trim();

  const country =
    form.country.trim();

  const phone =
    form.phone.trim();

  const email =
    form.email.trim();

  if (!fullName) {
    errors.push(
      "Full name is required.",
    );
  } else if (fullName.length > 80) {
    errors.push(
      "Full name must be 80 characters or fewer.",
    );
  }

  if (!address) {
    errors.push(
      "Address is required.",
    );
  } else if (address.length > 120) {
    errors.push(
      "Address must be 120 characters or fewer.",
    );
  }

  if (!city) {
    errors.push(
      "City is required.",
    );
  } else if (city.length > 60) {
    errors.push(
      "City must be 60 characters or fewer.",
    );
  }

  if (!postalCode) {
    errors.push(
      "Postal code is required.",
    );
  } else if (postalCode.length > 20) {
    errors.push(
      "Postal code must be 20 characters or fewer.",
    );
  }

  if (!country) {
    errors.push(
      "Country is required.",
    );
  } else if (country.length > 60) {
    errors.push(
      "Country must be 60 characters or fewer.",
    );
  }

  if (!phone) {
    errors.push(
      "Phone is required.",
    );
  }

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    errors.push(
      "Enter a valid email address.",
    );
  }

  return errors;
}

async function getCsrfToken(): Promise<string> {
  const response =
    await fetchBackend(
      backendEndpoints.auth.csrf,
      {
        cache: "no-store",
      },
    );

  const payload =
    await readApiJson<CsrfResponse>(
      response,
    );

  if (!payload?.token) {
    throw new Error(
      "The server did not return a CSRF token.",
    );
  }

  return payload.token;
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

export default function Shipping() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState<ShippingForm>(
      initialForm,
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [errors, setErrors] =
    useState<string[]>([]);

  const load = useCallback(
    async (
      signal?: AbortSignal,
    ): Promise<void> => {
      setLoading(true);
      setErrors([]);

      try {
        const response =
          await fetchBackend(
            backendEndpoints.checkout
              .shipping,
            {
              method: "GET",
              cache: "no-store",
              signal,

              headers: {
                Accept:
                  "application/json",
              },
            },
          );

        const shipping =
          await readApiJson<ShippingForm>(
            response,
          );

        if (signal?.aborted) {
          return;
        }

        setForm(
          normalizeShipping(shipping),
        );
      } catch (caught) {
        if (
          signal?.aborted ||
          isAbortError(caught)
        ) {
          return;
        }

        setErrors([
          caught instanceof Error
            ? caught.message
            : "Shipping details could not be loaded.",
        ]);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    void load(controller.signal);

    return () => {
      controller.abort();
    };
  }, [load]);

  const update = (
    field: keyof ShippingForm,
    value: string,
  ): void => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const validationErrors =
      validate(form);

    if (
      validationErrors.length > 0
    ) {
      setErrors(validationErrors);
      return;
    }

    const normalized: ShippingForm = {
      fullName:
        form.fullName.trim(),

      address:
        form.address.trim(),

      city:
        form.city.trim(),

      postalCode:
        form.postalCode.trim(),

      country:
        form.country.trim(),

      phone:
        form.phone.trim(),

      email:
        form.email.trim(),
    };

    setSaving(true);
    setErrors([]);

    try {
      const csrfToken =
        await getCsrfToken();

      const response =
        await fetchBackend(
          backendEndpoints.checkout
            .shipping,
          {
            method: "POST",
            cache: "no-store",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              "X-CSRF-TOKEN":
                csrfToken,
            },

            body: JSON.stringify(
              normalized,
            ),
          },
        );

      const result =
        await readApiJson<ShippingResponse>(
          response,
        );

      if (result?.ok === false) {
        throw new Error(
          result.message ||
            "Shipping details could not be saved.",
        );
      }

      setForm(
        normalizeShipping(
          result?.shipping ??
            normalized,
        ),
      );

      navigate(
        result?.redirect ||
          "/Checkout/Payment",
      );
    } catch (caught) {
      setErrors([
        caught instanceof Error
          ? caught.message
          : "Shipping details could not be saved.",
      ]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#0f1216] px-4 py-8 text-[#e9ecef]">
      <section className="mx-auto max-w-3xl rounded-xl border border-[#313a45] bg-[#1a1f24] p-6 shadow-xl sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff5fb3]">
          Checkout
        </p>

        <h1 className="mt-2 text-3xl font-semibold">
          Shipping Details
        </h1>

        <p className="mt-2 text-sm text-[#a8b0bd]">
          Enter the delivery
          information used for this
          order.
        </p>

        {errors.length > 0 ? (
          <div
            className="mt-5 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-red-200"
            role="alert"
          >
            <ul className="list-disc space-y-1 pl-5">
              {errors.map(
                (error, index) => (
                  <li
                    key={`${error}-${index}`}
                  >
                    {error}
                  </li>
                ),
              )}
            </ul>
          </div>
        ) : null}

        <form
          onSubmit={submit}
          className="mt-6 space-y-5"
          noValidate
        >
          <Field
            label="Full name"
            htmlFor="shipping-full-name"
            required
          >
            <input
              id="shipping-full-name"
              name="fullName"
              value={form.fullName}
              onChange={(event) => {
                update(
                  "fullName",
                  event.target.value,
                );
              }}
              maxLength={80}
              autoComplete="name"
              required
              disabled={
                loading || saving
              }
              className={inputClass}
            />
          </Field>

          <Field
            label="Address"
            htmlFor="shipping-address"
            required
          >
            <input
              id="shipping-address"
              name="address"
              value={form.address}
              onChange={(event) => {
                update(
                  "address",
                  event.target.value,
                );
              }}
              maxLength={120}
              autoComplete="street-address"
              required
              disabled={
                loading || saving
              }
              className={inputClass}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-3">
            <Field
              label="City"
              htmlFor="shipping-city"
              required
            >
              <input
                id="shipping-city"
                name="city"
                value={form.city}
                onChange={(event) => {
                  update(
                    "city",
                    event.target.value,
                  );
                }}
                maxLength={60}
                autoComplete="address-level2"
                required
                disabled={
                  loading || saving
                }
                className={inputClass}
              />
            </Field>

            <Field
              label="Postal code"
              htmlFor="shipping-postal-code"
              required
            >
              <input
                id="shipping-postal-code"
                name="postalCode"
                value={form.postalCode}
                onChange={(event) => {
                  update(
                    "postalCode",
                    event.target.value,
                  );
                }}
                maxLength={20}
                autoComplete="postal-code"
                required
                disabled={
                  loading || saving
                }
                className={inputClass}
              />
            </Field>

            <Field
              label="Country"
              htmlFor="shipping-country"
              required
            >
              <input
                id="shipping-country"
                name="country"
                value={form.country}
                onChange={(event) => {
                  update(
                    "country",
                    event.target.value,
                  );
                }}
                maxLength={60}
                autoComplete="country-name"
                required
                disabled={
                  loading || saving
                }
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Phone"
              htmlFor="shipping-phone"
              required
            >
              <input
                id="shipping-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={(event) => {
                  update(
                    "phone",
                    event.target.value,
                  );
                }}
                autoComplete="tel"
                required
                disabled={
                  loading || saving
                }
                className={inputClass}
              />
            </Field>

            <Field
              label="Email"
              htmlFor="shipping-email"
            >
              <input
                id="shipping-email"
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => {
                  update(
                    "email",
                    event.target.value,
                  );
                }}
                autoComplete="email"
                disabled={
                  loading || saving
                }
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#313a45] pt-5">
            <Link
              to="/Cart/MyCart"
              className="rounded-md border border-[#46515e] px-5 py-2.5 font-semibold hover:bg-[#252b33]"
            >
              Back to cart
            </Link>

            <button
              type="submit"
              disabled={
                loading || saving
              }
              className="rounded-md bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : loading
                  ? "Loading..."
                  : "Continue"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

const inputClass =
  "w-full rounded-md border border-[#46515e] bg-[#0f1216] px-3 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60";

function Field({
  label,
  htmlFor,
  required = false,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block"
    >
      <span className="mb-2 block text-sm font-medium text-[#d4dae2]">
        {label}
        {required ? " *" : ""}
      </span>

      {children}
    </label>
  );
}