/* eslint-env commonjs, node */

const importPaths = /** @type {const} */ ({
  pathGroups: [
    {
      pattern: 'next',
      group: 'builtin',
      position: 'before',
    },
    {
      pattern: 'react',
      group: 'builtin',
      position: 'before',
    },
    {
      pattern: '@mtndev/core/**',
      group: 'external',
      position: 'after',
    },
    {
      pattern: '@mtndev/react-core/**',
      group: 'external',
      position: 'after',
    },
  ],
  get pathGroupsExcludedImportTypes() {
    return this.pathGroups.map((group) => group.pattern);
  },
});

/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    './react.cjs',
    'plugin:next/recommended',
    'plugin:next/core-web-vitals',
  ],
  rules: {
    // TypeError: context.getAncestors is not a function
    '@next/next/no-duplicate-head': 'off',
    '@next/next/no-html-link-for-pages': 'off',
    'react/no-unescaped-entities': ['error', { forbid: ['>', '}'] }],
    '@typescript-eslint/require-await': 'off',
    'import/order': [
      'error',
      {
        alphabetize: { order: 'asc' },
        pathGroups: importPaths.pathGroups,
        pathGroupsExcludedImportTypes:
          importPaths.pathGroupsExcludedImportTypes,
      },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
