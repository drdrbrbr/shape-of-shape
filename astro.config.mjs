import { defineConfig } from 'astro/config';
import { qrcode } from 'vite-plugin-qrcode';

// https://astro.build/config
export default defineConfig({
  site: "https://shape-of-shape.com/",
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "./src/styles/vars.scss";`
        }
      }
    },
    plugins: [qrcode()]
  },
});