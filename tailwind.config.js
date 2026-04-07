/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0C0C0D",
        foreground: "#F0EBE3",
        primary: "#E8793A",
      },
    },
  },
  plugins: [],
}