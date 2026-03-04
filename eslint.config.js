import js from '@eslint/js';
import json from '@eslint/json';
import prettier from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

/** @type {import("eslint").Linter.Config[]} */
const config = [
  //
  // Global ignores
  //
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/coverage',
      '**/outputs',
      '**/templates',
      '.github',
      '.awa',
      'website',
      '**/*.d.ts',
    ],
  },

  //
  // TypeScript files
  //
  ...tseslint.configs.recommended.map((c) => ({
    ...c,
    files: ['**/*.ts'],
  })),
  {
    files: ['**/*.ts'],
    plugins: {
      prettier,
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.test.json'],
      },
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'prettier/prettier': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          caughtErrors: 'all',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-empty-object-type': [
        'error',
        {
          allowInterfaces: 'always',
        },
      ],
    },
  },

  //
  // Test file overrides
  //
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
    },
  },

  //
  // Root config files (not in tsconfig project)
  //
  {
    files: ['*.config.ts', '*.config.js', '*.config.mjs', 'scripts/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },

  //
  // JavaScript files
  //
  {
    files: ['**/*.js', '**/*.mjs'],
    ...js.configs.recommended,
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    plugins: {
      prettier,
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'prettier/prettier': 'error',
    },
  },

  //
  // JSON files
  //
  {
    files: ['**/*.json'],
    ignores: ['**/package-lock.json'],
    language: 'json/json',
    ...json.configs.recommended,
  },
  {
    files: ['**/*.jsonc'],
    language: 'json/jsonc',
    ...json.configs.recommended,
  },
];

export default config;
