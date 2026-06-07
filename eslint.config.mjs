import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'out/**', 'node_modules/**', '.vscode/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier: prettierPlugin
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          trailingComma: 'none'
        }
      ],
      'no-console': 'warn',
      'comma-dangle': ['error', 'never'],
      'no-unused-vars': ['warn', { args: 'none' }],
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase']
        }
      ],
      eqeqeq: 'warn',
      'no-throw-literal': 'warn',
      semi: 'warn'
    }
  },
  {
    files: ['src/test/**/*.ts'],
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  eslintConfigPrettier
];
