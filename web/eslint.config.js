// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['off'],
      '@angular-eslint/component-selector': ['off'],
      '@angular-eslint/no-input-rename': ['off'],
      '@angular-eslint/component-class-suffix': ['off'],
      '@angular-eslint/directive-class-suffix': ['off'],
      '@typescript-eslint/consistent-indexed-object-style': ['off'],
      '@typescript-eslint/no-explicit-any': ['off'],
      '@typescript-eslint/no-extra-non-null-assertion': ['off'],
      '@typescript-eslint/no-require-imports': ['off'],
      '@typescript-eslint/no-empty-function': ['warn'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/button-has-type': ['error'],
    },
  },
);
