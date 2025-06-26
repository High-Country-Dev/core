/* eslint-env commonjs, node */

/** @type {import('eslint').Linter.Config} */
module.exports = /** @type {const} */ ({
  extends: [
    './base.cjs',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:typescript-sort-keys/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'warn',
    'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
    '@typescript-eslint/no-empty-interface': [
      'error',
      {
        allowSingleExtends: true,
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: false,
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-misused-promises': [
      2,
      { checksVoidReturn: { attributes: false } },
    ],
    '@typescript-eslint/no-unnecessary-condition': [
      'error',
      {
        allowConstantLoopConditions: true,
      },
    ],
  },
});
