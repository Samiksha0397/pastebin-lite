import { nanoid } from "nanoid";
import { redis } from "../../../lib/redis";

export default async function handler(req, res) {
  try {
    // Allow only POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { content, expiresIn, maxViews } = req.body;

    // Validation
    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Invalid content" });
    }

    if (
      expiresIn !== undefined &&
      (!Number.isInteger(expiresIn) || expiresIn <= 0)
    ) {
      return res.status(400).json({ error: "Invalid expiresIn" });
    }

    if (
      maxViews !== undefined &&
      (!Number.isInteger(maxViews) || maxViews <= 0)
    ) {
      return res.status(400).json({ error: "Invalid maxViews" });
    }

    const id = nanoid(8);

    const pasteData = {
      content,
      remainingViews: maxViews ?? null,
      createdAt: Date.now(),
    };

    // Save to Redis
    await redis.set(`paste:${id}`, JSON.stringify(pasteData));

    if (expiresIn) {
      await redis.expire(`paste:${id}`, expiresIn);
    }

    const baseUrl = `https://${req.headers.host}`;

    return res.status(201).json({
      id,
      url: `${baseUrl}/p/${id}`,
    });
  } catch (error) {
    console.error("Paste API error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


