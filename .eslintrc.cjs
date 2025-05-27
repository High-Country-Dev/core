/* eslint-env commonjs, node */

/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    '@mtndev/eslint-config/base',
    '@mtndev/eslint-config/react',
    'prettier',
  ],
  plugins: ['turbo'],
  overrides: [
    {
      files: ['*.{ts,tsx}'],
      extends: ['@mtndev/eslint-config/typescript', 'prettier'],
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: true,
      },
    },
  ],
  root: true,
};
