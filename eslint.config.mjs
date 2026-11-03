import stylistic from '@stylistic/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vueParser from 'vue-eslint-parser';

export default [
  {
    ignores: [
      'node_modules/**',
      '.nuxt/**',
      '.output/**',
      '.data/**',
      'dist/**',
      'coverage/**',
      'tmp/**',
    ],
  },
  {
    files: ['**/*.{js,mjs,ts,vue}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      curly: ['error', 'all'],
      'no-nested-ternary': 'error',
      '@stylistic/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: ['if', 'for', 'while', 'do', 'switch', 'try', 'return', 'throw', 'function'],
        },
        {
          blankLine: 'always',
          prev: 'block-like',
          next: '*',
        },
      ],
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.vue'],
      },
    },
  },
];
