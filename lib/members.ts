import { prisma } from "@/lib/prisma";

const MEMBER_NO_START = 600; // no ahli baharu (daftar web) mula dari sini

export async function nextMemberNo(): Promise<string> {
  const members = await prisma.member.findMany({ select: { memberNo: true } });
  const numbers = members
    .map((m) => parseInt(m.memberNo.replace(/\D/g, ""), 10))
    .filter((n) => !isNaN(n));
  const highest = numbers.length > 0 ? Math.max(...numbers) : 0;
  const next = Math.max(highest + 1, MEMBER_NO_START);
  return `PLT-${String(next).padStart(3, "0")}`;
}
