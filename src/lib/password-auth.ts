import { adminApiBaseUrl } from "./public-env.ts";

type PasswordCredentials = {
  email: string;
  password: string;
};

type PasswordAuthClient = {
  auth: {
    setSession: (session: {
      access_token: string;
      refresh_token: string;
    }) => Promise<{ error: { message?: string } | null }>;
  };
};

export async function signInWithAdminPassword(
  supabase: PasswordAuthClient,
  credentials: PasswordCredentials,
) {
  const email = credentials.email.trim();
  const password = credentials.password;

  if (!email || !password) {
    throw new Error("이메일과 비밀번호를 입력해 주세요.");
  }

  const response = await fetch(`${adminApiBaseUrl()}/api/v1/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    data?: {
      session?: {
        access_token?: string;
        refresh_token?: string;
      };
    };
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message ?? "로그인에 실패했습니다.");
  }

  const session = payload.data?.session;
  if (!session?.access_token || !session.refresh_token) {
    throw new Error("로그인 세션을 확인하지 못했습니다.");
  }

  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (error) throw new Error(error.message ?? "로그인에 실패했습니다.");

  return payload.data;
}
