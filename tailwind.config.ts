import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#2A1D14",     // header/footer coklat gelap
          brown: "#8B5A2B",    // panel "Ahli Berpengetahuan"
          gold: "#C68A2E",     // aksen CTA "SERTAI KAMI"
          cream: "#F5F1E9",    // latar belakang
          card: "#FFFFFF"
        }
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "serif"]
      },
      maxWidth: {
        "8xl": "96rem",   // 1536px - kandungan lebar untuk skrin besar
        "9xl": "104rem"   // 1664px - untuk seksyen paling lebar (contoh Hero)
      }
    }
  },
  plugins: []
};
export default config;