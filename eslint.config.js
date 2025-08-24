const globals = require('globals');
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angulareslint = require('angular-eslint');
const stylistic = require('@stylistic/eslint-plugin');



const xssDemoAppEslintConfigs = {
  rules: {
    'no-unused-vars': [
      'error',
      {
        caughtErrors: 'none',
      },
    ],
    '@stylistic/semi': [
      'error',
      'always',
    ],
    '@stylistic/no-multiple-empty-lines': [
      'error',
      {
        maxBOF: 0,
        max: 3,
        maxEOF: 0,
      },
    ],
    '@stylistic/key-spacing': [
      'error',
      {
        mode: 'minimum',
      },
    ],
  },
};



module.exports = tseslint.config(
  {
    files: ['*.js'],
    extends: [
      eslint.configs.recommended,
      stylistic.configs.recommended,
      xssDemoAppEslintConfigs,
    ],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.commonjs,
        ...globals.node,
      },
    },
  },
  {
    files: ['public/**/*.js'],
    extends: [
      eslint.configs.recommended,
      stylistic.configs.recommended,
      xssDemoAppEslintConfigs,
    ],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser,
        cookieStore: 'readonly',
      },
    },
  },
  {
    files: ['src/**/*.js'],
    extends: [
      eslint.configs.recommended,
      stylistic.configs.recommended,
      xssDemoAppEslintConfigs,
    ],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
        $: 'readonly',
        DOMPurify: 'readonly',
      },
    },
  },
  {
    files: ['*.ts', 'src/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      stylistic.configs.recommended,
      xssDemoAppEslintConfigs,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylisticTypeChecked,
      ...angulareslint.configs.tsRecommended,
    ],
    processor: angulareslint.processInlineTemplates,
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          caughtErrors: 'none',
        },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': [
        'off',
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
    languageOptions: {
      parserOptions: {
        projectService: {},
      },
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angulareslint.configs.templateRecommended,
      ...angulareslint.configs.templateAccessibility,
    ],
    rules: {},
  },
);
