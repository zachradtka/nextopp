import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

const SUPPORTED_AI_PROVIDERS = ["anthropic", "google", "openai"] as const;

type SupportedAiProvider = (typeof SUPPORTED_AI_PROVIDERS)[number];

const DEFAULT_MODELS: Record<SupportedAiProvider, string> = {
  anthropic: "claude-3-5-sonnet-latest",
  google: "gemini-2.5-flash",
  openai: "gpt-4.1-mini",
};

function getProviderKey(provider: SupportedAiProvider) {
  switch (provider) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "google":
      return process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    case "openai":
      return process.env.OPENAI_API_KEY;
  }
}

export function getAiProviderConfig() {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (!provider || !SUPPORTED_AI_PROVIDERS.includes(provider as SupportedAiProvider)) {
    return null;
  }

  const typedProvider = provider as SupportedAiProvider;
  const apiKey = getProviderKey(typedProvider);

  if (!apiKey) {
    return null;
  }

  return {
    provider: typedProvider,
    model: process.env.AI_MODEL?.trim() || DEFAULT_MODELS[typedProvider],
  };
}

export function isAiParsingEnabled() {
  return getAiProviderConfig() !== null;
}

export function getAiLanguageModel() {
  const config = getAiProviderConfig();

  if (!config) {
    throw new Error("AI parsing is not configured.");
  }

  switch (config.provider) {
    case "anthropic":
      return anthropic(config.model);
    case "google":
      return google(config.model);
    case "openai":
      return openai(config.model);
  }
}
