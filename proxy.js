import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Next.js 16: middleware.js가 proxy.js로 이름이 바뀌었다. 여기서는 낙관적 체크만 한다
// (쿠키만 확인, DB 조회 없음) — 실제 승인/관리자 권한 검사는 각 페이지/Server Action의
// lib/dal.js(requireUser/requireApprovedMember/requireAdmin)에서 다시 한번 확인한다.
// (accounting-system의 proxy.js와 동일한 구조 — 이유는 그쪽 주석 참고)
//
// getUser()가 아니라 getSession()을 쓴다: getUser()는 매 요청마다 Supabase Auth 서버에
// 네트워크로 재검증하러 가는데, 이 프록시는 애초에 "낙관적" 리다이렉트 가드일 뿐이고
// 진짜 검증은 dal.js가 페이지 렌더링 때 getUser()로 다시 하므로 여기서 또 네트워크를
// 탈 필요가 없다. getSession()은 쿠키의 JWT를 로컬에서 서명 검증만 하고 끝난다.
export async function proxy(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { pathname } = request.nextUrl;
  // 로그인 없이 접근 가능한 화면: 홈(비로그인 시 로그인/가입 링크만 보여줌), 로그인, 회원가입.
  // 확장자가 있는 경로(/rotarylogo.png 등 public/ 정적 파일)도 항상 통과시킨다 —
  // 안 그러면 비로그인 방문자에게 헤더 로고 같은 정적 자산이 로그인 페이지로 리다이렉트돼버린다.
  const isStaticAsset = /\.[^/]+$/.test(pathname);
  const isPublicPath =
    isStaticAsset || pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/status";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
