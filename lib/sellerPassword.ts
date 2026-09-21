import { z } from "zod";

// Syarat kata laluan akaun GERAN. Sengaja ringkas - panjang minimum yang
// munasabah tanpa peraturan simbol yang cuma buat orang tulis kata laluan
// atas kertas.
export const KATA_LALUAN_MIN = 8;

export const skemaKataLaluan = z
  .string()
  .min(KATA_LALUAN_MIN, `Password must be at least ${KATA_LALUAN_MIN} characters.`)
  .max(200, "Password is too long.");

export const AYAT_SYARAT_KATA_LALUAN = `At least ${KATA_LALUAN_MIN} characters.`;

// Had cubaan log masuk sebelum akaun dikunci sementara.
export const MAX_CUBAAN_LOG_MASUK = 8;
export const TEMPOH_KUNCI_MINIT = 15;
