/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        card: "rgb(var(--c-card) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",
        warn: "rgb(var(--c-warn) / <alpha-value>)",
        ext: "rgb(var(--c-ext) / <alpha-value>)"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(17, 24, 39, 0.08)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};
