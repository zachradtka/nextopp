"use server";

import { generateObject } from "ai";
import * as z from "zod";
import { getAiModelId, isAiParsingEnabled } from "@/lib/ai";
import { requireUserId } from "@/lib/auth-optional";
import { getFirecrawlConfig, isFirecrawlEnabled } from "@/lib/firecrawl";
import {
  parsedJobPostingJsonSchema,
  parsedJobPostingSchema,
  type ParsedJobPosting,
} from "@/lib/validations/parse-job-posting";

type ParseJobPostingInput =
  | { sourceType: "url"; value: string }
  | { sourceType: "text"; value: string };

export type ParseJobPostingErrorCode =
  | "invalid_input"
  | "url_unreachable"
  | "url_blocked"
  | "couldnt_extract"
  | "ai_provider_error"
  | "timeout"
  | "not_configured";

export type ParseJobPostingResult =
  | { data: ParsedJobPosting; error?: undefined; code?: undefined }
  | { data?: undefined; error: string; code: ParseJobPostingErrorCode };

class FirecrawlScrapeError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly upstreamStatusCode?: number
  ) {
    super(message);
    this.name = "FirecrawlScrapeError";
  }
}

const DEFAULT_PARSE_TIMEOUT_MS = 30_000;
const FIRECRAWL_EXCTRACTION_PROMPT = `
Extract job posting details into structured data.

Rules:
- Only include fields you can infer from the page.
- Leave fields undefined when they are unknown.
- Use one of these exact values for workMode: remote, hybrid, onsite.
- Use one of these exact values for employmentType: full-time, part-time, contract, internship.
- Use one of these exact values for experienceLevel: intern, junior, mid, senior, staff, principal.
- Use salaryMin and salaryMax as yearly whole-number amounts in USD when the posting gives a clear annual range.
- Use datePosted in YYYY-MM-DD format only when the exact date is available.
- Put the main job posting text in jobDescription when available.
- Do not invent details.
`;

// Validates URL for safe processing with Firecrawl (prevent SSRF by blocking localhost/private IPs)
function validateJobPostingUrl(url: string): { valid: true } | { valid: false; error: string } {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: "Enter a valid job posting URL." };
  }

  const hostname = parsed.hostname || "";
  const lowerHostname = hostname.toLowerCase();

  // Block localhost and loopback addresses
  if (
    lowerHostname === "localhost" ||
    lowerHostname === "127.0.0.1" ||
    lowerHostname === "::1" ||
    lowerHostname.startsWith("[::ffff:127.")
  ) {
    return { valid: false, error: "Cannot parse job postings from localhost." };
  }

  // Block private IP ranges
  const ipMatch = hostname.match(
    /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|fe80:|fc[0-9a-f]{2}:)/i
  );
  if (ipMatch) {
    return { valid: false, error: "Cannot parse job postings from private IP addresses." };
  }

  // Block reserved IPs
  const reservedIps = [
    "0",
    "255",
    "169.254",
    "224",
    "225",
    "226",
    "227",
    "228",
    "229",
    "230",
    "231",
    "232",
    "233",
    "234",
    "235",
    "236",
    "237",
    "238",
    "239",
  ];
  if (reservedIps.some((ip) => hostname.startsWith(ip + "."))) {
    return { valid: false, error: "Cannot parse job postings from reserved IP addresses." };
  }

  return { valid: true };
}

function buildPrompt(input: ParseJobPostingInput) {
  return `
${FIRECRAWL_EXCTRACTION_PROMPT}

The user pasted the following raw job posting text. Extract as much structured data as you can:

${input.value}
`;
}

function hasMeaningfulParsedData(data: ParsedJobPosting) {
  return Object.entries(data).some(([key, value]) => {
    if (value == null) {
      return false;
    }

    if (key === "url") {
      return false;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    return true;
  });
}

function normalizeWhitespace(value?: string) {
  return value?.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim() || undefined;
}

function normalizeSalary(value?: number) {
  if (value == null || !Number.isFinite(value)) {
    return undefined;
  }

  const rounded = Math.round(value);
  return rounded >= 0 ? rounded : undefined;
}

function getParseTimeoutMs() {
  const rawValue = process.env.AI_PARSE_TIMEOUT_MS;

  if (!rawValue) {
    return DEFAULT_PARSE_TIMEOUT_MS;
  }

  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : DEFAULT_PARSE_TIMEOUT_MS;
}

async function generateParsedTextPosting(input: Extract<ParseJobPostingInput, { sourceType: "text" }>) {
  const model = getAiModelId();

  if (!model) {
    throw new Error("AI parsing is not configured.");
  }

  const result = await generateObject({
    model,
    timeout: { totalMs: getParseTimeoutMs() },
    schema: parsedJobPostingSchema,
    schemaName: "parsed_job_posting",
    schemaDescription: "Structured job posting details for an application tracker",
    prompt: buildPrompt(input),
  });

  return result.object;
}

type FirecrawlScrapeResponse = {
  success: boolean;
  data?: {
    json?: unknown;
    warning?: string;
    metadata?: {
      title?: string;
      statusCode?: number;
      sourceURL?: string;
      error?: string;
    };
  };
};

async function scrapeJobPostingWithFirecrawl(url: string): Promise<ParsedJobPosting> {
  const config = getFirecrawlConfig();

  if (!config) {
    throw new Error("Firecrawl is not configured.");
  }

  const response = await fetch(`${config.apiUrl}/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      onlyMainContent: true,
      timeout: config.timeoutMs,
      maxAge: config.maxAgeMs,
      proxy: config.proxy,
      blockAds: true,
      removeBase64Images: true,
      formats: [
        {
          type: "json",
          prompt: FIRECRAWL_EXCTRACTION_PROMPT,
          schema: parsedJobPostingJsonSchema,
        },
      ],
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as FirecrawlScrapeResponse;

  if (!response.ok || !payload.success) {
    throw new FirecrawlScrapeError(
      `Firecrawl scrape failed (${response.status}): ${
        payload.data?.metadata?.error || "Unknown error"
      }`,
      response.status,
      payload.data?.metadata?.statusCode
    );
  }

  const parsed = parsedJobPostingSchema.safeParse(payload.data?.json ?? {});

  if (!parsed.success) {
    throw new Error(
      `Firecrawl returned invalid structured data: ${z.prettifyError(parsed.error)}`
    );
  }

  return parsed.data;
}

function normalizeParsedJobPosting(
  data: ParsedJobPosting,
  input: ParseJobPostingInput
): ParsedJobPosting {
  const normalized: ParsedJobPosting = {
    ...data,
    company: normalizeWhitespace(data.company),
    role: normalizeWhitespace(data.role),
    location: normalizeWhitespace(data.location),
    salaryMin: normalizeSalary(data.salaryMin),
    salaryMax: normalizeSalary(data.salaryMax),
    department: normalizeWhitespace(data.department),
    jobId: normalizeWhitespace(data.jobId),
    contactName: normalizeWhitespace(data.contactName),
    jobDescription: normalizeWhitespace(data.jobDescription),
  };

  if (input.sourceType === "url") {
    normalized.url = input.value;
  }

  if (input.sourceType === "text" && !normalized.jobDescription) {
    normalized.jobDescription = normalizeWhitespace(input.value);
  }

  if (
    normalized.salaryMin != null &&
    normalized.salaryMax != null &&
    normalized.salaryMin > normalized.salaryMax
  ) {
    [normalized.salaryMin, normalized.salaryMax] = [
      normalized.salaryMax,
      normalized.salaryMin,
    ];
  }

  return normalized;
}

export async function parseJobPosting(
  input: ParseJobPostingInput
): Promise<ParseJobPostingResult> {
  await requireUserId();

  const value = input.value.trim();
  const aiModelId = getAiModelId();
  const firecrawlConfig = getFirecrawlConfig();
  const startedAt = Date.now();

  if (!value) {
    return {
      code: "invalid_input",
      error:
        input.sourceType === "url"
          ? "Paste a job posting URL to auto-fill the form."
          : "Paste a job description to auto-fill the form.",
    };
  }

  if (input.sourceType === "url") {
    const urlValidation = validateJobPostingUrl(value);
    if (!urlValidation.valid) {
      return { code: "invalid_input", error: urlValidation.error };
    }
  }

  if (input.sourceType === "url" && !isFirecrawlEnabled()) {
    return { code: "not_configured", error: "URL parsing is not configured." };
  }

  if (input.sourceType === "text" && !isAiParsingEnabled()) {
    return { code: "not_configured", error: "Text parsing is not configured." };
  }

  try {
    const parsed =
      input.sourceType === "url"
        ? await scrapeJobPostingWithFirecrawl(value)
        : await generateParsedTextPosting({ ...input, value });
    const data = normalizeParsedJobPosting(parsed, { ...input, value });

    if (!hasMeaningfulParsedData(data)) {
      return {
        code: "couldnt_extract",
        error:
          input.sourceType === "url"
            ? "Couldn't find job posting details on that page."
            : "Couldn't find job posting details in that text.",
      };
    }

    return { data };
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    console.error("Failed to parse job posting", {
      provider: input.sourceType === "url" ? "firecrawl" : "ai-gateway",
      model: input.sourceType === "text" ? aiModelId ?? "unknown" : undefined,
      sourceType: input.sourceType,
      timeoutMs:
        input.sourceType === "url"
          ? firecrawlConfig?.timeoutMs
          : getParseTimeoutMs(),
      durationMs,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return classifyParseError(error, input);
  }
}

function classifyParseError(
  error: unknown,
  input: ParseJobPostingInput
): { error: string; code: ParseJobPostingErrorCode } {
  const errorMessage =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  const isTimeout =
    errorMessage.includes("timed out") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("abort");

  if (isTimeout) {
    return {
      code: "timeout",
      error:
        input.sourceType === "url"
          ? "Fetching that URL took too long."
          : "AI parsing took too long.",
    };
  }

  if (input.sourceType === "url" && error instanceof FirecrawlScrapeError) {
    const upstream = error.upstreamStatusCode;

    if (
      upstream === 401 ||
      upstream === 403 ||
      upstream === 407 ||
      upstream === 429 ||
      upstream === 451
    ) {
      return {
        code: "url_blocked",
        error: "That site is blocking automated fetches.",
      };
    }

    if (upstream === 404 || upstream === 410) {
      return {
        code: "url_unreachable",
        error: "That URL returned not-found.",
      };
    }

    if (typeof upstream === "number" && upstream >= 500) {
      return {
        code: "url_unreachable",
        error: "The job site returned a server error.",
      };
    }

    return {
      code: "url_unreachable",
      error: "Couldn't reach that URL.",
    };
  }

  if (input.sourceType === "url") {
    return {
      code: "url_unreachable",
      error: "Couldn't reach that URL.",
    };
  }

  return {
    code: "ai_provider_error",
    error: "AI parsing failed. Please try again.",
  };
}
