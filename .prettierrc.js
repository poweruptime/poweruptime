module.exports = {
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-organize-attributes',
    'prettier-plugin-tailwindcss',
  ],
  printWidth: 100,
  singleQuote: true,
  bracketSpacing: false,
  bracketSameLine: true,
  htmlWhitespaceSensitivity: 'ignore',
  importOrder: [
    '^@angular/(.*)$',
    '^@angular/material/(.*)',
    '^@angular/cdk',
    '^rxjs',
    '<THIRD_PARTY_MODULES>',
    '^@app/(.*)',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ['typescript', 'decorators-legacy'],
  overrides: [
    {
      files: ['*.tsx'],
      options: {
        parser: 'babel-ts',
      },
    },
  ],
};
