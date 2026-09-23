// Storan fail PERIBADI GERAN (Document Vault & salinan geran penjual).
//
// Stor Vercel Blob utama projek ini jenis "public" - Vercel tak benarkan
// blob `access: "private"` dalam stor public ("Cannot use private access on a
// public store"). Fail peribadi pergi ke stor KEDUA ("documents", akses
// private) yang disambung ke projek dengan prefix DOCUMENTS, jadi Vercel
// menyediakan tokennya sebagai DOCUMENTS_READ_WRITE_TOKEN.
//
// Hanya untuk pelayan - jangan import dari komponen klien.

export const TOKEN_BLOB_PERIBADI =
  process.env.DOCUMENTS_READ_WRITE_TOKEN || process.env.BLOB_PRIVATE_READ_WRITE_TOKEN || undefined;

// Laluan muat naik yang mesti ke stor peribadi.
export function laluanPeribadi(pathname: string): boolean {
  return pathname.startsWith("geran/dokumen/") || pathname.startsWith("geran/salinan/");
}

export const MESEJ_TIADA_STOR_PERIBADI =
  "Private document storage is not set up yet (DOCUMENTS_READ_WRITE_TOKEN). Please contact the site admin.";
