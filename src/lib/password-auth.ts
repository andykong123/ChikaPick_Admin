type PasswordCredentials = {
  email: string;
  password: string;
};

type PasswordAuthClient = {
  auth: {
    signInWithPassword: (
      credentials: PasswordCredentials,
    ) => Promise<{
      data?: unknown;
      error: { message?: string } | null;
    }>;
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message ?? "로그인에 실패했습니다.");
  }

  return data;
}
