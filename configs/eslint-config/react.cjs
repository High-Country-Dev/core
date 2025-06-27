/* eslint-env commonjs, node */

const importPaths = /** @type {const} */ ({
  pathGroups: [
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
module.exports = /** @type {const} */ ({
  extends: [
    './base.cjs',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    'react/jsx-props-no-spreading': 'off',
    'react/prop-types': 'off',
    'react/require-default-props': 'off',
    'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
    'react/no-unstable-nested-components': [
      'error',
      {
        allowAsProps: true,
      },
    ],
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
});
