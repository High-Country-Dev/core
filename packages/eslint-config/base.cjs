/* eslint-env commonjs, node */

const importPaths = /** @type {const} */ ({
  pathGroups: [
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

module.exports = /** @type {import('eslint').Linter.Config} */ ({
  extends: ['airbnb'],
  plugins: ['import'],
  rules: {
    'default-case': 'off',
    'class-methods-use-this': 'off',
    'consistent-return': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'always',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'import/no-unresolved': 'off',
    'import/prefer-default-export': 'off',
    'no-restricted-exports': 'off',
    'import/no-extraneous-dependencies': 'off',
    'sort-imports': ['error', { ignoreDeclarationSort: true }],
    'import/order': [
      'error',
      {
        alphabetize: { order: 'asc' },
        distinctGroup: true,
        pathGroups: importPaths.pathGroups,
        pathGroupsExcludedImportTypes:
          importPaths.pathGroupsExcludedImportTypes,
      },
    ],
  },
  overrides: [
    {
      // Apply this override only to files within the "src" directory
      files: ['src/**/*'],
      rules: {
        'import/no-extraneous-dependencies': 'error',
      },
    },
  ],
});
