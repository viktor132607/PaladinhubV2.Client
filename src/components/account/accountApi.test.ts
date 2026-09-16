import { beforeEach, describe, expect, it, vi } from "vitest";
const { fetchBackend, readApiJson } = vi.hoisted(() => ({
  fetchBackend: vi.fn(),
  readApiJson: vi.fn(),
}));
vi.mock("@/config/api", () => ({ fetchBackend, readApiJson }));
import { accountForm, accountPost } from "./accountApi";
describe("account requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchBackend.mockResolvedValue({ status: 200 });
    readApiJson.mockResolvedValue({ message: "Saved" });
  });
  it("submits JSON for account security without placing credentials in a URL", async () => {
    await accountPost("/api/account/manage/email-2fa", {
      password: "example",
      enabled: true,
    });
    expect(fetchBackend).toHaveBeenCalledWith(
      "/api/account/manage/email-2fa",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ password: "example", enabled: true }),
      }),
    );
  });
  it("preserves multipart avatar uploads without a manually supplied boundary", async () => {
    const data = new FormData();
    data.append("file", new Blob(["image"]), "avatar.png");
    await accountForm("/api/account/UploadAvatar", data);
    expect(fetchBackend).toHaveBeenCalledWith("/api/account/UploadAvatar", {
      method: "POST",
      body: data,
    });
  });
  it("propagates payment and verification rejection instead of returning success", async () => {
    readApiJson.mockRejectedValue(new Error("Payment is not completed"));
    await expect(
      accountPost("/api/account/wallet/confirm", { sessionId: "unpaid" }),
    ).rejects.toThrow("Payment is not completed");
  });
});
