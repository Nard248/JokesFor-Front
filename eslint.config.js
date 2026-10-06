import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import { reactRefresh } from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // .remember is local agent tool-state (untracked, has its own nested
  // .gitignore) — not part of the app, never present in a fresh clone/CI.
  globalIgnores(['dist', '.remember']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      // Ships only-export-components at 'error' with the Vite options
      // (allowConstantExport, allowCompoundComponents).
      reactRefresh.configs.vite(),
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Codebase convention: prefix intentionally-unused params/vars with `_`
      // (see src/lib/mock-api.ts, test files) instead of deleting them.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // Ratchet complete: every rule the presets ship at 'warn' is clean
      // (0 warnings) and is promoted to 'error' so a regression fails CI
      // instead of scrolling past as a warning.
      // (react-refresh/only-export-components is already 'error' via the
      // vite preset above: keep components and plain exports in separate
      // modules — see jokeFormats.ts, flowJokeData.ts, routeConfig.tsx,
      // ui/toast.ts — so React Fast Refresh works.)
      // - set-state-in-effect: derive state during render instead.
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/incompatible-library': 'error',
      'react-hooks/unsupported-syntax': 'error',
    },
  },
])
