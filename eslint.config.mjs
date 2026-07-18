// @ts-check

import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'
export default defineConfig({
  files: ['**/*.{js,ts}'],
  extends: [js.configs.recommended, tseslint.configs.recommended],
  languageOptions: {
    globals: globals.node,
  },
  rules: {
    'preserve-caught-error': 0,
    '@typescript-eslint/no-explicit-any': 0,
  },
})
