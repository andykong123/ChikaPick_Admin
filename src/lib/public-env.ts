function requiredPublicValue(value: string | undefined, name: string) {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`${name} 환경 변수가 설정되지 않았습니다.`);
  }
  return normalized;
}

export function adminApiBaseUrl() {
  return requiredPublicValue(
    process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL,
    "NEXT_PUBLIC_CHIKAPICK_API_BASE_URL",
  ).replace(/\/+$/, "");
}

export function supabasePublicConfig() {
  return {
    url: requiredPublicValue(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
    publishableKey: requiredPublicValue(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ),
  };
}
