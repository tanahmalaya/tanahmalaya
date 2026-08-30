// Julat poskod Malaysia ikut negeri (rujuk: Postal codes in Malaysia, Wikipedia).
// Poskod yang jatuh dalam GAP antara julat (cth 03000, 99999) automatik tak sah
// - tak wujud negeri mana pun untuk poskod tu.
//
// Zon 50000-68999 (KL/Selangor/Putrajaya) sengaja digabung sebab sempadan pos
// kawasan ni tak ikut sempadan pentadbiran negeri dengan tepat (banyak alamat
// Selangor sebenar guna poskod dalam julat "KL" secara rasmi, dan sebaliknya)
// - kalau dipisah ketat, risiko tolak alamat SAH terlalu tinggi di Lembah Klang.
type PostcodeRange = { min: number; max: number; states: string[] };

const RANGES: PostcodeRange[] = [
  { min: 1000, max: 2000, states: ["Perlis"] },
  { min: 5000, max: 9810, states: ["Kedah"] },
  { min: 10000, max: 14400, states: ["Pulau Pinang"] },
  { min: 15000, max: 18500, states: ["Kelantan"] },
  { min: 20000, max: 24300, states: ["Terengganu"] },
  { min: 25000, max: 28800, states: ["Pahang"] },
  { min: 30000, max: 36810, states: ["Perak"] },
  { min: 39000, max: 39200, states: ["Pahang"] }, // Cameron Highlands
  { min: 40000, max: 48300, states: ["Selangor"] },
  { min: 49000, max: 49000, states: ["Pahang"] }, // Fraser's Hill
  { min: 50000, max: 68999, states: ["Kuala Lumpur", "Selangor", "Putrajaya"] },
  { min: 69000, max: 69000, states: ["Pahang"] }, // Genting Highlands
  { min: 70000, max: 73509, states: ["Negeri Sembilan"] },
  { min: 75000, max: 78309, states: ["Melaka"] },
  { min: 79000, max: 86900, states: ["Johor"] },
  { min: 87000, max: 87033, states: ["Labuan"] },
  { min: 88000, max: 91309, states: ["Sabah"] },
  { min: 93000, max: 98859, states: ["Sarawak"] },
];

export function validatePostcodeNegeri(
  poskod: string,
  negeri: string
): { valid: boolean; reason?: string } {
  if (!/^\d{5}$/.test(poskod)) {
    return { valid: false, reason: "Poskod mesti 5 digit" };
  }

  const num = parseInt(poskod, 10);
  const range = RANGES.find((r) => num >= r.min && num <= r.max);

  if (!range) {
    return { valid: false, reason: `Poskod "${poskod}" tidak wujud` };
  }
  if (!range.states.includes(negeri)) {
    return {
      valid: false,
      reason: `Poskod "${poskod}" bukan untuk negeri "${negeri}" (patut: ${range.states.join(" / ")})`,
    };
  }
  return { valid: true };
}
