#!/usr/bin/env node
import { basename, dirname, join } from 'path';
import chalk from 'chalk';
import { watch } from 'chokidar';
import { program } from 'commander';
import { glob } from 'glob';
import { readPackageJson, writePackageJson } from './utils.js';

const workspaces = ['configs', 'packages'];

const packagesGlobs = workspaces.map((workspace) => `${workspace}/*/src`);

program.option('-w, --watch', 'Watches for file changes', false).parse();

/** @typedef {import('type-fest').SetRequired<import('type-fest').PackageJson, 'name'>} PackageJson */

/** @param {string} path */
function getPackagePath(path) {
  const match = path.match(new RegExp(`^(${workspaces.join('|')})/(.*)/src$`));

  if (!match) return;
  const [, workspace, pkg] = match;
  if (!workspace || !pkg) return;

  return join(process.cwd(), workspace, pkg);
}

/** @param {string} path */
function getPackageName(path) {
  return basename(path);
}

const packages = glob.sync(packagesGlobs);
const packagesFolderNameToPackageJSONMap = packages.reduce(
  (accumulator, pkg) => {
    const packageFolderName = getPackageName(dirname(pkg));

    const pkgPath =
      /** @type {NonNullable<ReturnType<typeof getPackagePath>>} */ (
        getPackagePath(pkg)
      );

    const pkgJSON = /** @type {PackageJson} */ (readPackageJson(pkgPath));

    return {
      ...accumulator,
      [packageFolderName]: pkgJSON,
    };
  },
  /** @type {Record<string, PackageJson>} */ ({}),
);

const packagesFilteringInformation = Object.values(
  packagesFolderNameToPackageJSONMap,
).reduce(
  (accumulator, pkgJSON) => {
    // If `bin` is present in your package.json, we'll assume that the package is a CLI tool and should be
    // excluded from the dev-package-json script.
    if ('bin' in pkgJSON) {
      accumulator.excludedPackages.add(pkgJSON.name);
    }

    if (accumulator.excludedPackages.has(pkgJSON.name)) {
      accumulator.excludedPackages = new Set([
        ...accumulator.excludedPackages,
        ...Object.keys(pkgJSON.dependencies || {}),
      ]);
    }

    return {
      ...accumulator,
      filteredPackages: new Set(
        Array.from([...accumulator.filteredPackages, pkgJSON.name]).filter(
          (pkgName) => !accumulator.excludedPackages.has(pkgName),
        ),
      ),
    };
  },
  {
    filteredPackages: /** @type{Set<string>} */ (new Set([])),
    excludedPackages: /** @type{Set<string>} */ (new Set([])),
  },
);

/** @param {string} pkgPath */
function filterDevPackage(pkgPath) {
  const pkgFolderName = getPackageName(pkgPath);

  const pkgJSON = packagesFolderNameToPackageJSONMap[pkgFolderName];

  return (
    typeof pkgJSON !== 'undefined' &&
    packagesFilteringInformation.filteredPackages.has(pkgJSON.name)
  );
}

/** @param {string} path */
function processDevPackage(path) {
  const pkgPath = getPackagePath(path);

  if (!pkgPath) return;
  if (!filterDevPackage(pkgPath)) {
    const pkgJSON = readPackageJson(pkgPath);

    console.log(`${chalk.gray(pkgJSON.name)} - Ignored package.json`);
    return;
  }
  writePackageJson(pkgPath);
}

packages.forEach(processDevPackage);

if (program.opts().watch) {
  watch(packagesGlobs, { ignoreInitial: true })
    .on('add', processDevPackage)
    .on('unlink', processDevPackage)
    .on('unlinkDir', processDevPackage);
}
