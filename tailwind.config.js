/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './index.html',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // En desarrollo, no purgar CSS para que sea más rápido
  // safelist: [],
};
