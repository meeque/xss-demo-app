// @ts-check
const globals = require('globals');
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angulareslint = require('angular-eslint');

module.exports = tseslint.config(
  {
    files: ['public/**/*.js'],
    extends: [
      eslint.configs.recommended
    ],
    processor: angulareslint.processInlineTemplates,
    rules: {
      'no-unused-vars': [
        'error',
        {
          caughtErrors: 'none',
        }
      ],
    },
    languageOptions: {
      sourceType: 'script',
			globals: {
        ... globals.browser,
        cookieStore: 'readonly',
			},
		},
  },
  {
    files: ['**/*.ts', 'src/**/*.js'],
    extends: [
      eslint.configs.recommended,
      ... tseslint.configs.recommended,
      ... tseslint.configs.stylistic,
      ... angulareslint.configs.tsRecommended,
    ],
    processor: angulareslint.processInlineTemplates,
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          caughtErrors: 'none',
        }
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'xss',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'xss',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ... angulareslint.configs.templateRecommended,
      ... angulareslint.configs.templateAccessibility,
    ],
    rules: {},
  }
);
