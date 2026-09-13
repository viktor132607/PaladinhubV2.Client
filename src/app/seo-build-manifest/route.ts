import { buildSeoBuildManifest, getSeoSnapshot } from "@/lib/seo-public";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const snapshot = await getSeoSnapshot();
  return Response.json(buildSeoBuildManifest(snapshot));
}
