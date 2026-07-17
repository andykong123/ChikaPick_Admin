"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabasePublicConfig } from "./public-env.ts";

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const { publishableKey, url } = supabasePublicConfig();

  browserClient = createClient(
    url,
    publishableKey,
    {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  );

  return browserClient;
}
