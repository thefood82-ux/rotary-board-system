"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/lib/mutations";

// Server Action은 URL을 알면 누구나 직접 POST할 수 있으므로, UI에서 버튼을 숨겼더라도
// 반드시 서버에서 다시 한번 관리자 권한을 확인한다.

export async function createAnnouncementAction(formData) {
  const { user } = await requireAdmin();
  const title = (formData.get("title") || "").toString().trim();
  const content = (formData.get("content") || "").toString().trim();

  if (!title || !content) {
    redirect(`/admin/announcements?error=${encodeURIComponent("제목과 내용을 입력해주세요.")}`);
    return;
  }

  try {
    await createAnnouncement({ title, content, createdBy: user.id });
  } catch (err) {
    redirect(`/admin/announcements?error=${encodeURIComponent(err.message)}`);
    return;
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/");
  redirect(`/admin/announcements?result=${encodeURIComponent("공지사항을 등록했습니다.")}`);
}

export async function updateAnnouncementAction(formData) {
  await requireAdmin();
  const id = formData.get("id");
  const title = (formData.get("title") || "").toString().trim();
  const content = (formData.get("content") || "").toString().trim();

  if (!id || !title || !content) {
    redirect(`/admin/announcements?error=${encodeURIComponent("제목과 내용을 입력해주세요.")}`);
    return;
  }

  try {
    await updateAnnouncement({ id, title, content });
  } catch (err) {
    redirect(`/admin/announcements?error=${encodeURIComponent(err.message)}`);
    return;
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/");
  redirect(`/admin/announcements?result=${encodeURIComponent("공지사항을 수정했습니다.")}`);
}

export async function deleteAnnouncementAction(formData) {
  await requireAdmin();
  const id = formData.get("id");
  if (!id) {
    redirect(`/admin/announcements?error=${encodeURIComponent("잘못된 요청입니다.")}`);
    return;
  }

  try {
    await deleteAnnouncement({ id });
  } catch (err) {
    redirect(`/admin/announcements?error=${encodeURIComponent(err.message)}`);
    return;
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/");
  redirect(`/admin/announcements?result=${encodeURIComponent("공지사항을 삭제했습니다.")}`);
}
