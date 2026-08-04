import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
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
      reactRefresh.configs.vite,
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
      // Ratchet: eslint-plugin-react-hooks v7's "recommended" preset folded in
      // a large set of new React-Compiler-oriented rules. These two have
      // pre-existing violations across the codebase (never caught — nothing
      // ran `eslint .` in CI before now). Demoted to warn so they stay
      // visible without blocking the new CI gate on day one; re-promote to
      // 'error' after a dedicated cleanup pass.
      // - only-export-components is pure fast-refresh DX noise, expected in
      //   a shadcn/ui + route-config codebase (files exporting both a
      //   component and a constant/variant helper).
      // - set-state-in-effect can flag real bugs, so it stays a visible
      //   warning rather than being silenced outright.
      'react-refresh/only-export-components': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
