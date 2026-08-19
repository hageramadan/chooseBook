/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from "tailwindcss-animate";

// ✅ تعيين الكائن لمتغير
const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ✅ إضافة الألوان الديناميكية من الـ API
        brand: {
          primary: {
            DEFAULT: "var(--main-color)",
            light: "var(--main-color-light)",
            dark: "var(--main-color-dark)",
            foreground: "var(--white)",
          },
          secondary: {
            DEFAULT: "var(--secondary-color)",
            light: "var(--secondary-color-light)",
            dark: "var(--secondary-color-dark)",
            foreground: "var(--white)",
          },
        },

        main: {
          DEFAULT: "var(--main-color)",
          light: "var(--main-color-light)",
          dark: "var(--main-color-dark)",
          10: "var(--main-color)10", // ✅ إضافة هذه
          20: "var(--main-color)20",
          30: "var(--main-color)30",
        },
        "secondary-color": {
          DEFAULT: "var(--secondary-color)",
          light: "var(--secondary-color-light)",
          dark: "var(--secondary-color-dark)",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "pulse-primary": {
          "0%, 100%": { boxShadow: "0 0 0 0 var(--main-color-light)" },
          "50%": { boxShadow: "0 0 0 10px transparent" },
        },
        "pulse-secondary": {
          "0%, 100%": { boxShadow: "0 0 0 0 var(--secondary-color-light)" },
          "50%": { boxShadow: "0 0 0 10px transparent" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "rotate-in": {
          from: { transform: "rotate(-180deg)", opacity: "0" },
          to: { transform: "rotate(0deg)", opacity: "1" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out forwards",
        "slide-out": "slide-out 0.3s ease-out forwards",
        "pulse-primary": "pulse-primary 1.5s infinite",
        "pulse-secondary": "pulse-secondary 1.5s infinite",
        "scale-in": "scale-in 0.3s ease-out",
        "rotate-in": "rotate-in 0.3s ease-out",
      },

      boxShadow: {
        primary: "0 4px 20px var(--main-color-light)",
        "primary-lg": "0 8px 30px var(--main-color-light)",
        secondary: "0 4px 20px var(--secondary-color-light)",
        "secondary-lg": "0 8px 30px var(--secondary-color-light)",
      },

      backgroundImage: {
        "primary-gradient":
          "linear-gradient(135deg, var(--main-color), var(--main-color-dark))",
        "secondary-gradient":
          "linear-gradient(135deg, var(--secondary-color), var(--secondary-color-dark))",
        "primary-gradient-horizontal":
          "linear-gradient(90deg, var(--main-color), var(--main-color-dark))",
        "secondary-gradient-horizontal":
          "linear-gradient(90deg, var(--secondary-color), var(--secondary-color-dark))",
      },

      borderWidth: {
        3: "3px",
      },

      transitionDuration: {
        250: "250ms",
        350: "350ms",
        450: "450ms",
      },
    },
  },

  plugins: [
    tailwindcssAnimate,
    function ({ addUtilities, theme }) {
      const newUtilities = {
        ".transition-primary": {
          transition: "all 0.3s ease",
        },
        ".transition-secondary": {
          transition: "all 0.5s ease",
        },
        ".text-shadow-primary": {
          textShadow: "0 2px 4px var(--main-color-light)",
        },
        ".text-shadow-secondary": {
          textShadow: "0 2px 4px var(--secondary-color-light)",
        },
        ".ring-primary": {
          "--tw-ring-color": "var(--main-color)",
        },
        ".ring-secondary": {
          "--tw-ring-color": "var(--secondary-color)",
        },
        ".ring-primary-light": {
          "--tw-ring-color": "var(--main-color-light)",
        },
        ".ring-secondary-light": {
          "--tw-ring-color": "var(--secondary-color-light)",
        },
        ".gradient-primary-text": {
          "background-image":
            "linear-gradient(135deg, var(--main-color), var(--secondary-color))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};

// ✅ تصدير المتغير
export default config;
