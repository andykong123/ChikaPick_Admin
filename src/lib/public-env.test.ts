import assert from "node:assert/strict";
import { test } from "node:test";

import { adminApiBaseUrl, supabasePublicConfig } from "./public-env.ts";

test("public environment requires explicit API and Supabase configuration", () => {
  const previousApi = process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL;
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  try {
    delete process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL;
    assert.throws(() => adminApiBaseUrl(), /NEXT_PUBLIC_CHIKAPICK_API_BASE_URL/);

    process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com///";
    assert.equal(adminApiBaseUrl(), "https://api.example.com");

    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable";
    assert.throws(() => supabasePublicConfig(), /NEXT_PUBLIC_SUPABASE_URL/);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    assert.deepEqual(supabasePublicConfig(), {
      url: "https://project.supabase.co",
      publishableKey: "publishable",
    });
  } finally {
    restore("NEXT_PUBLIC_CHIKAPICK_API_BASE_URL", previousApi);
    restore("NEXT_PUBLIC_SUPABASE_URL", previousUrl);
    restore("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", previousKey);
  }
});

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
