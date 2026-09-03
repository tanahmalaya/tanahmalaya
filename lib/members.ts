import { prisma } from "@/lib/prisma";
import type { MemberType } from "@prisma/client";

// Ahli PLT (ahli penuh, wajib) guna siri "TM-", Ahli Bersekutu guna siri "PLT-".
const PREFIX: Record<MemberType, string> = {
  PLT: "TM-",
  BERSEKUTU: "PLT-",
};

export async function nextMemberNo(type: MemberType): Promise<string> {
  const prefix = PREFIX[type];
  const members = await prisma.member.findMany({
    where: { memberNo: { startsWith: prefix } },
    select: { memberNo: true },
  });
  const numbers = members
    .map((m) => parseInt(m.memberNo.slice(prefix.length).replace(/\D/g, ""), 10))
    .filter((n) => !isNaN(n));
  const highest = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `${prefix}${String(highest + 1).padStart(3, "0")}`;
}
