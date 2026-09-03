// Sahkan format No. Kad Pengenalan (MyKad) Malaysia: YYMMDD-PB-###G (12 digit).
// Tiada API rasmi JPN untuk sahkan IC sebenar wujud/betul - fungsi ni cuma
// sahkan STRUKTUR & tarikh lahir adalah SAH (tangkap kebanyakan IC palsu/silap taip).

export type IcCheckResult = { valid: boolean; reason?: string };

export function isValidMalaysianIC(icNumberRaw: string): IcCheckResult {
  const icNumber = (icNumberRaw || "").replace(/\D/g, "");

  if (!/^\d{12}$/.test(icNumber)) {
    return { valid: false, reason: "No. Kad Pengenalan mesti 12 digit (tanpa tanda -)." };
  }

  const yy = parseInt(icNumber.slice(0, 2), 10);
  const mm = parseInt(icNumber.slice(2, 4), 10);
  const dd = parseInt(icNumber.slice(4, 6), 10);
  const placeCode = parseInt(icNumber.slice(6, 8), 10);

  if (mm < 1 || mm > 12) {
    return { valid: false, reason: "Tarikh lahir dalam No. Kad Pengenalan tidak sah (bulan)." };
  }

  // Andaikan abad berdasarkan tahun semasa supaya tarikh lahir tak jatuh ke masa depan.
  const currentYear = new Date().getFullYear();
  const currentYY = currentYear % 100;
  const century = yy <= currentYY ? 2000 : 1900;
  const birthYear = century + yy;

  const daysInMonth = new Date(birthYear, mm, 0).getDate();
  if (dd < 1 || dd > daysInMonth) {
    return { valid: false, reason: "Tarikh lahir dalam No. Kad Pengenalan tidak sah (hari)." };
  }

  if (placeCode < 1) {
    return { valid: false, reason: "Kod tempat lahir dalam No. Kad Pengenalan tidak sah." };
  }

  return { valid: true };
}

// Kira umur semasa (tahun genap) daripada 6 digit pertama No. Kad Pengenalan.
// Guna hanya SELEPAS isValidMalaysianIC() sahkan format & tarikh adalah sah.
export function getAgeFromIC(icNumberRaw: string): number {
  const icNumber = (icNumberRaw || "").replace(/\D/g, "");
  const yy = parseInt(icNumber.slice(0, 2), 10);
  const mm = parseInt(icNumber.slice(2, 4), 10);
  const dd = parseInt(icNumber.slice(4, 6), 10);

  const now = new Date();
  const currentYY = now.getFullYear() % 100;
  const century = yy <= currentYY ? 2000 : 1900;
  const birthDate = new Date(century + yy, mm - 1, dd);

  let age = now.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;

  return age;
}

export const MIN_AGE_AHLI_PLT = 18;
