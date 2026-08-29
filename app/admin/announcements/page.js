import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getAnnouncements } from "@/lib/data";
import AnnouncementList from "@/components/AnnouncementList";
import { createAnnouncementAction, updateAnnouncementAction, deleteAnnouncementAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AnnouncementsAdminPage({ searchParams }) {
  await requireAdmin();
  const sp = (await searchParams) || {};
  const announcements = await getAnnouncements();

  return (
    <main>
      <Link href="/" className="back-link">
        ← 홈으로
      </Link>
      <h1 className="page-title">공지사항 관리</h1>

      {sp.result && <p className="banner success">{sp.result}</p>}
      {sp.error && <p className="banner error">{sp.error}</p>}

      <AnnouncementList
        announcements={announcements}
        addAction={createAnnouncementAction}
        updateAction={updateAnnouncementAction}
        deleteAction={deleteAnnouncementAction}
      />
    </main>
  );
}
