# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Google Drive Photo Upload

Guests choose photos on the page without signing in to Google. The Vercel API validates and forwards each compressed JPEG to Google Apps Script, which saves it in the configured Drive folder. The `/api/photos` endpoint uses the same script to load the album; no browser Drive API key is needed. The Apps Script source is in `../google-apps-script/Code.gs`.

### Setup

1. Create a Google Apps Script project and paste in `google-apps-script/Code.gs`.
2. In **Project Settings → Script Properties**, add `DRIVE_FOLDER_ID` with the Drive folder ID and `UPLOAD_SECRET` with a random secret of at least 32 characters.
3. Run `authorizeDriveAccess` once and approve access to Drive.
4. Deploy as a web app that executes as you and allows access to anyone. Copy its URL ending in `/exec`.
5. For local development, set `GOOGLE_APPS_SCRIPT_URL` and the same `GOOGLE_APPS_SCRIPT_SECRET` in the repository-root `.env` file. Keep this file private; it is ignored by Git. For a Vercel deployment, set both as server-side environment variables.
6. Make the Drive folder viewable by anyone with the link so its image thumbnails can be displayed.
7. Run `npm --prefix Casamiento run dev -- --host 0.0.0.0` from the repository root. Open Vite's network URL on a device connected to the same Wi-Fi.

Uploads are converted to JPEG and limited to 3 MB. Likes are saved per browser/device and are not shared between guests.

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
