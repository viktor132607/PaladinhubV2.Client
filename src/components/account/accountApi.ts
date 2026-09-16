import { fetchBackend, readApiJson } from "@/config/api";
export type Profile = {
  fullName: string;
  userName: string;
  email: string;
  emailConfirmed: boolean;
  phoneNumber: string | null;
  phoneNumberConfirmed: boolean;
  avatarPath: string | null;
  twoFactorEnabled: boolean;
  emailTwoFactorEnabled: boolean;
  authenticatorEnabled: boolean;
};
export async function accountGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  return readApiJson<T>(
    await fetchBackend(path, { cache: "no-store", signal }),
  );
}
export async function accountPost<
  T = { message: string; recoveryCodes?: string[] },
>(path: string, body: unknown = {}): Promise<T> {
  return readApiJson<T>(
    await fetchBackend(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}
export async function accountForm<T = { message: string; path?: string }>(
  path: string,
  body: Record<string, string> | FormData,
): Promise<T> {
  return readApiJson<T>(
    await fetchBackend(path, {
      method: "POST",
      body: body instanceof FormData ? body : new URLSearchParams(body),
    }),
  );
}
