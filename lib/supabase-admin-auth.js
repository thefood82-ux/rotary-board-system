import "server-only";

// Supabase Auth Admin API(사용자 생성)를 fetch로 직접 호출한다.
// lib/supabase-server.js와 같은 이유(SDK가 신규 sb_secret_ 키를 다룰 때 오류)로 fetch 사용.
// 반드시 서버 전용(SECRET KEY 사용) — 절대 브라우저에 노출 금지.

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 없습니다. .env.local의 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY를 확인하세요."
    );
  }
  return { baseUrl: `${url.replace(/\/$/, "")}/auth/v1/admin`, key };
}

async function adminFetch(path, options = {}) {
  const { baseUrl, key } = getConfig();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...options.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase Auth Admin API 실패 [${path}]: HTTP ${res.status} ${body}`);
  }
  return res.json();
}

// 이메일 확인 절차 없이 바로 로그인 가능한 상태로 계정을 만든다.
// (프로젝트 규모가 22명뿐이라 이메일 확인 절차를 생략하기로 결정 — 2026-08-29)
export async function createAuthUser({ email, password }) {
  return adminFetch(`/users`, {
    method: "POST",
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
}
