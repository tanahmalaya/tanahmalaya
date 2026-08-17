import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#2A1D14",     // header/footer coklat gelap
          brown: "#8B5A2B",    // panel "Ahli Berilmu"
          gold: "#C68A2E",     // aksen CTA "SERTAI KAMI"
          cream: "#F5F1E9",    // latar belakang
          card: "#FFFFFF"
        }
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "serif"]
      }
    }
  },
  plugins: []
};
export default config;
