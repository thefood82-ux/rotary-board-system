import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getCurrentTerm, getBoardMembers } from "@/lib/data";
import { formatTermYearLabel } from "@/lib/dates";
import BoardMemberTable from "@/components/BoardMemberTable";
import { createCurrentTermAction, addBoardMemberAction, updateBoardMemberAction, deleteBoardMemberAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MembersPage({ searchParams }) {
  await requireAdmin();
  const sp = (await searchParams) || {};
  const currentTerm = await getCurrentTerm();
  const members = currentTerm ? await getBoardMembers(currentTerm.id) : [];

  return (
    <main>
      <Link href="/" className="back-link">
        ← 홈으로
      </Link>
      <h1 className="page-title">명부 관리</h1>

      {sp.result && <p className="banner success">{sp.result}</p>}
      {sp.error && <p className="banner error">{sp.error}</p>}

      {!currentTerm ? (
        <section className="card">
          <p>아직 활성 회기(term)가 없습니다. 먼저 현재 회기를 만들어주세요 (예: "26-27").</p>
          <p className="hint">
            아래 폼 대신 Supabase 대시보드의 Table Editor에서 <code>terms</code> 테이블에 직접
            행(name, is_current=true)을 추가해도 됩니다.
          </p>
          <form action={createCurrentTermAction} className="inline-form">
            <input name="name" placeholder="예: 26-27" required />
            <button type="submit">현재 회기로 생성</button>
          </form>
        </section>
      ) : (
        <>
          <p className="meta-line">
            현재 회기: <strong>{formatTermYearLabel(currentTerm.name)}</strong>
          </p>
          <BoardMemberTable
            termId={currentTerm.id}
            members={members}
            addAction={addBoardMemberAction}
            updateAction={updateBoardMemberAction}
            deleteAction={deleteBoardMemberAction}
          />
        </>
      )}
    </main>
  );
}
