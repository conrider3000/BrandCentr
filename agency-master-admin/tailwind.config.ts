import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0A0A0D',
        panel: '#121318',
        borderSubtle: '#22242E',
      },
    },
  },
  plugins: [],
};

export default config;
