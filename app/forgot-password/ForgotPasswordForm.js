"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setPending(true);

    const supabase = createSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });

    setPending(false);

    if (resetError) {
      setError(`재설정 메일 발송에 실패했습니다: ${resetError.message}`);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <p className="banner success">
        입력하신 이메일로 비밀번호 재설정 링크를 보냈습니다. 메일함을 확인해주세요.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="stack-form">
      <label>
        이메일
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
      </label>
      {error && <p className="banner error">{error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "전송 중..." : "재설정 링크 보내기"}
      </button>
    </form>
  );
}
