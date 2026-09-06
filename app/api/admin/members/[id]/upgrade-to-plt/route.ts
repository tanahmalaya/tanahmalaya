export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { nextMemberNo } from "@/lib/members";

// Admin naik taraf Ahli Bersekutu jadi Ahli PLT (ahli penuh) - dapat no ahli
// baharu siri "TM-", no lama disimpan dalam noAhliLama, dan akuanSelangor
// ditanda true kerana admin sendiri yang sahkan kelayakan (bukan borang awam).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const member = await prisma.member.findUnique({ where: { id: params.id } });
  if (!member || member.type !== "BERSEKUTU") {
    return NextResponse.json({ error: "Ahli bukan Ahli Bersekutu" }, { status: 400 });
  }

  const newMemberNo = await nextMemberNo("PLT");

  await prisma.member.update({
    where: { id: params.id },
    data: {
      type: "PLT",
      memberNo: newMemberNo,
      noAhliLama: member.memberNo,
      akuanSelangor: true,
      status: "AKTIF",
    },
  });

  return NextResponse.redirect(new URL("/admin/members", req.url));
}
