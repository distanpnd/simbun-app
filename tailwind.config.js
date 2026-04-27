export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <-- Ini sangat penting agar Tailwind membaca file .jsx
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}