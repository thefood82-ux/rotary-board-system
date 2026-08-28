import "server-only";

// @supabase/supabase-js SDK가 신규 형식 키(sb_secret_...)를 다룰 때
// "JWT issued at future" 오류를 내는 문제가 있어, PostgREST를 fetch로 직접 호출한다.
// (accounting-system에서 이미 검증된 것과 동일한 방식)

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 없습니다. .env.local의 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY를 확인하세요."
    );
  }
  return { baseUrl: `${url.replace(/\/$/, "")}/rest/v1`, key };
}

// table: 테이블명, query: PostgREST 쿼리 파라미터 객체(select, eq 등은 문자열 배열로 조합)
export async function pgSelect(table, searchParams) {
  const { baseUrl, key } = getConfig();
  const qs = searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams(searchParams);
  const res = await fetch(`${baseUrl}/${table}?${qs.toString()}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase 조회 실패 [${table}]: HTTP ${res.status} ${body}`);
  }
  return res.json();
}

// 여러 행을 한 번에 삽입. onConflict 지정 시 "resolution=ignore-duplicates"로
// 중복 행은 조용히 건너뛰고, 실제로 새로 들어간 행만 반환한다(중복 삽입 방지용).
export async function pgInsertMany(table, rows, { onConflict } = {}) {
  if (!rows || rows.length === 0) return [];
  const { baseUrl, key } = getConfig();
  const qs = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : "";
  const prefer = onConflict ? "return=representation,resolution=ignore-duplicates" : "return=representation";
  const res = await fetch(`${baseUrl}/${table}${qs}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: prefer },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase 삽입 실패 [${table}]: HTTP ${res.status} ${body}`);
  }
  return res.json();
}

export async function pgInsertOne(table, row) {
  const [inserted] = await pgInsertMany(table, [row]);
  return inserted;
}

// 행을 삽입하거나, onConflict로 지정한 컬럼(들)이 이미 있으면 그 행을 수정한다(upsert).
export async function pgUpsertOne(table, row, { onConflict } = {}) {
  const { baseUrl, key } = getConfig();
  const qs = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : "";
  const res = await fetch(`${baseUrl}/${table}${qs}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase upsert 실패 [${table}]: HTTP ${res.status} ${body}`);
  }
  const [upserted] = await res.json();
  return upserted;
}

// 행을 수정한다. match는 PostgREST 필터 객체(예: { id: "eq.xxx" }), patch는 바꿀 컬럼만.
export async function pgUpdate(table, match, patch) {
  const { baseUrl, key } = getConfig();
  const qs = new URLSearchParams(match);
  const res = await fetch(`${baseUrl}/${table}?${qs.toString()}`, {
    method: "PATCH",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase 수정 실패 [${table}]: HTTP ${res.status} ${body}`);
  }
  return res.json();
}

// 행을 삭제한다. match는 PostgREST 필터 객체(예: { id: "eq.xxx" }).
export async function pgDelete(table, match) {
  const { baseUrl, key } = getConfig();
  const qs = new URLSearchParams(match);
  const res = await fetch(`${baseUrl}/${table}?${qs.toString()}`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "return=representation" },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase 삭제 실패 [${table}]: HTTP ${res.status} ${body}`);
  }
  return res.json();
}
