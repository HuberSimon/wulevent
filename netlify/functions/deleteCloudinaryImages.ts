import type { Handler } from "@netlify/functions";
import crypto from "crypto";
import process from "process";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY    = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

function extractPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match ? match[1] : null;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let imageUrls: string[] = [];
  try {
    imageUrls = JSON.parse(event.body ?? "{}").imageUrls ?? [];
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return { statusCode: 400, body: "imageUrls must be a non-empty array" };
  }

  const results: Record<string, string> = {};

  await Promise.all(
    imageUrls.map(async (url) => {
      const publicId = extractPublicId(url);
      if (!publicId) {
        results[url] = "skipped (no public_id)";
        return;
      }

      const timestamp = Math.round(Date.now() / 1000);
      const signature = crypto
        .createHash("sha1")
        .update(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`)
        .digest("hex");

      const body = new URLSearchParams({
        public_id: publicId,
        timestamp:  String(timestamp),
        api_key:    API_KEY,
        signature,
      });

      const res  = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
        { method: "POST", body }
      );
      const json = await res.json() as { result?: string };
      results[url] = json.result ?? "unknown";
    })
  );

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ results }),
  };
};