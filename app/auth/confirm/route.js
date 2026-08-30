import { NextResponse } from "next/server";
import { createSupabaseSessionClient } from "@/lib/supabase-session";

// 비밀번호 재설정 메일의 링크가 최종적으로 오는 곳.
// token_hash/type을 세션 쿠키로 교환한 뒤 next(기본 /reset-password)로 보낸다.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/reset-password";

  if (token_hash && type) {
    const supabase = await createSupabaseSessionClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("재설정 링크가 유효하지 않거나 만료됐습니다.")}`
  );
}
