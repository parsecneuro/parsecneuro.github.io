import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const sourceUrl = process.env.POSTS_FEED_URL?.trim();
const outputPath = resolve("assets/data/posts-feed.json");
const sourceLabel = (() => {
  try { return new URL(sourceUrl).hostname || "configured-feed"; } catch (_) { return "configured-feed"; }
})();

if (!sourceUrl) {
  console.log("POSTS_FEED_URL is not configured. Leaving the existing feed file unchanged.");
  process.exit(0);
}

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function stripHtml(value = "") {
  return decodeXml(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstTag(block, names) {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
    if (match) return match[1].trim();
  }
  return "";
}

function getLink(block) {
  const atomAlternate = block.match(/<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (atomAlternate) return decodeXml(atomAlternate[1]);
  const atomAny = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);
  if (atomAny) return decodeXml(atomAny[1]);
  return stripHtml(firstTag(block, ["link"]));
}

function normalizeDate(value) {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.valueOf()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

function makeExcerpt(value, maxLength = 520) {
  const clean = stripHtml(String(value || ""));
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).replace(/\s+\S*$/, "").trim()}…`;
}

function normalizePost(item, index) {
  const title = stripHtml(item.title || item.name || "Untitled post");
  const excerpt = makeExcerpt(item.excerpt || item.description || item.summary || item.content_text || item.content || "");
  const url = String(item.url || item.external_url || item.link || "").trim();
  const rawTags = item.tags || item.categories || item.category || [];
  const tags = Array.isArray(rawTags)
    ? rawTags.map((tag) => stripHtml(typeof tag === "string" ? tag : tag.name || "")).filter(Boolean).slice(0, 5)
    : String(rawTags).split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 5);
  const date = normalizeDate(item.date || item.date_published || item.published || item.pubDate || item.updated);
  const id = String(item.id || item.guid || `${date}-${title}-${index}`).replace(/\s+/g, "-").slice(0, 180);
  return { id, date, title, excerpt, url, tags, sample: false };
}

function parseJson(text) {
  const payload = JSON.parse(text);
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.posts)
      ? payload.posts
      : Array.isArray(payload.items)
        ? payload.items
        : [];
  return items.map(normalizePost);
}

function parseXml(text) {
  const blocks = [
    ...(text.match(/<item\b[\s\S]*?<\/item>/gi) || []),
    ...(text.match(/<entry\b[\s\S]*?<\/entry>/gi) || [])
  ];

  return blocks.map((block, index) => {
    const categories = [...block.matchAll(/<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/gi)]
      .map((match) => stripHtml(match[1]))
      .filter(Boolean);
    const categoryTerms = [...block.matchAll(/<category\b[^>]*term=["']([^"']+)["'][^>]*\/?\s*>/gi)]
      .map((match) => stripHtml(match[1]))
      .filter(Boolean);

    return normalizePost({
      id: stripHtml(firstTag(block, ["guid", "id"])),
      title: firstTag(block, ["title"]),
      excerpt: firstTag(block, ["description", "summary", "content", "content:encoded"]),
      url: getLink(block),
      date: stripHtml(firstTag(block, ["pubDate", "published", "updated", "dc:date"])),
      tags: [...new Set([...categories, ...categoryTerms])]
    }, index);
  });
}

const response = await fetch(sourceUrl, {
  headers: {
    accept: "application/json, application/feed+json, application/rss+xml, application/atom+xml, text/xml;q=0.9, */*;q=0.8",
    "user-agent": "NeurofolioFeedSync/1.0 (+GitHub Actions)"
  }
});

if (!response.ok) {
  throw new Error(`Feed request failed: ${response.status} ${response.statusText}`);
}

const text = await response.text();
const contentType = response.headers.get("content-type") || "";
let posts;

try {
  posts = contentType.includes("json") || /^[\s\n]*[\[{]/.test(text) ? parseJson(text) : parseXml(text);
} catch (error) {
  throw new Error(`Could not parse the configured feed: ${error.message}`);
}

posts = posts
  .filter((post) => post.title || post.excerpt)
  .filter((post, index, all) => all.findIndex((candidate) => candidate.id === post.id) === index)
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 40);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: sourceLabel,
  posts
}, null, 2)}\n`, "utf8");

console.log(`Wrote ${posts.length} posts to ${outputPath}.`);
