const DEFAULT_FIRECRAWL_API_URL = "https://api.firecrawl.dev/v2";
const DEFAULT_FIRECRAWL_TIMEOUT_MS = 30_000;
const DEFAULT_FIRECRAWL_MAX_AGE_MS = 0;

export function getFirecrawlConfig() {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    apiUrl: process.env.FIRECRAWL_API_URL?.trim() || DEFAULT_FIRECRAWL_API_URL,
    timeoutMs: parsePositiveInt(
      process.env.FIRECRAWL_TIMEOUT_MS,
      DEFAULT_FIRECRAWL_TIMEOUT_MS
    ),
    maxAgeMs: parseNonNegativeInt(
      process.env.FIRECRAWL_MAX_AGE_MS,
      DEFAULT_FIRECRAWL_MAX_AGE_MS
    ),
    proxy: process.env.FIRECRAWL_PROXY?.trim() || "auto",
  };
}

export function isFirecrawlEnabled() {
  return getFirecrawlConfig() !== null;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}
