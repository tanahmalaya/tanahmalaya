// fetch() untuk API khas Ahli PLT (lihat tolakJikaBukanAhliPlt dalam lib/memberAuth.ts).
// Kalau sesi tamat / ahli tak lagi aktif (401), bawa pengguna ke log masuk dan
// balik semula ke laman semasa lepas berjaya.
export async function fetchAhli(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (res.status === 401) {
    const balik = window.location.pathname + window.location.search;
    window.location.href = `/ahli-plt/log-masuk?redirect=${encodeURIComponent(balik)}`;
    throw new Error("Sesi ahli tamat");
  }
  return res;
}
