"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import PasswordField from "@/components/PasswordField";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setPending(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (updateError) {
      setError(`비밀번호 변경에 실패했습니다: ${updateError.message}`);
      return;
    }

    router.push("/login?result=" + encodeURIComponent("비밀번호가 변경됐습니다. 다시 로그인해주세요."));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="stack-form">
      <label>
        새 비밀번호 (6자 이상)
        <PasswordField
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
        />
      </label>
      {error && <p className="banner error">{error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
