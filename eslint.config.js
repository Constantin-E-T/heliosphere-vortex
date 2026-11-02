import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'reference/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { globals: globals.browser },
    rules: { 'no-empty': ['error', { allowEmptyCatch: true }] }
  },
  {
    files: ['scripts/**', 'tests/**', '*.config.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } }
  }
];
