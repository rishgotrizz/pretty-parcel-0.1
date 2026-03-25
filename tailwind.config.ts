import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      colors: {
        blush: "#f7d7df",
        rosewater: "#fff6f7",
        rosewood: "#8d5b69",
        petal: "#f3b7c5",
        berry: "#6d4256",
        cocoa: "#4a3140",
        gold: "#d5a763"
      },
      boxShadow: {
        glow: "0 30px 80px rgba(141, 91, 105, 0.22)",
        card: "0 18px 45px rgba(118, 75, 93, 0.12)"
      },
      backgroundImage: {
        "soft-grid": "radial-gradient(circle at 1px 1px, rgba(141,91,105,0.08) 1px, transparent 0)"
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        shimmer: "shimmer 4s linear infinite",
        rise: "rise 0.8s ease-out both"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
