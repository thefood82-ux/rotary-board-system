import Link from "next/link";
import { getPendingProfiles } from "@/lib/data";
import { approveProfileAction, rejectProfileAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const pending = await getPendingProfiles();

  return (
    <main className="page">
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
      <h1>가입 승인 관리</h1>

      {sp.result && <p className="banner success">{sp.result}</p>}
      {sp.error && <p className="banner error">{sp.error}</p>}

      {pending.length === 0 ? (
        <p>대기 중인 가입 신청이 없습니다.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>이메일</th>
              <th>선택한 명부 인물</th>
              <th>신청일</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pending.map((p) => (
              <tr key={p.id}>
                <td>{p.email}</td>
                <td>{p.board_members ? `${p.board_members.name} (${p.board_members.position})` : "-"}</td>
                <td>{new Date(p.created_at).toLocaleString("ko-KR")}</td>
                <td className="row-actions">
                  <form action={approveProfileAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit">승인</button>
                  </form>
                  <form action={rejectProfileAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit">반려</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
