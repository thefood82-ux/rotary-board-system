import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 현재 로그인 세션을 쿠키로부터 읽기 위한 서버 클라이언트 (Server Component/Action 전용).
// lib/supabase-server.js(관리자 SECRET KEY, 데이터 조회/쓰기 전용)와는 별개다.
export async function createSupabaseSessionClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 일반 Server Component에서는 쿠키를 쓸 수 없다(읽기 전용 렌더링 중).
          // 세션 갱신은 proxy.js가 담당하므로 여기서는 무시해도 안전하다.
        }
      },
    },
  });
}
