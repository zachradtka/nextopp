export function getAiModelId() {
  const model = process.env.AI_MODEL?.trim();
  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();

  if (!model || !apiKey) {
    return null;
  }

  return model;
}

export function isAiParsingEnabled() {
  return getAiModelId() !== null;
}
