import { lstatSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import fse from 'fs-extra';
import { rimraf } from 'rimraf';
import { readJsonSync } from '../utils/index.js';

/**
 * @param {string} path
 */
function isDirectory(path) {
  return lstatSync(path).isDirectory();
}

/**
 * @param {string} path
 */
export function removeExt(path) {
  return path.replace(/\.[^.]+$/, '');
}

/**
 * @param {string} rootPath
 * @returns {Record<string, any>}
 */
export function readPackageJson(rootPath) {
  const pkgPath = join(rootPath, 'package.json');
  return readJsonSync(pkgPath);
}

/** @param {string} rootPath */
export function getPackageBuilds(rootPath) {
  const { main, module } = readPackageJson(rootPath);

  return {
    ...(typeof main !== 'undefined' && {
      cjs: getCJSDir(),
    }),
    ...(typeof module !== 'undefined' && {
      esm: getESMDir(),
    }),
  };
}

/**
 * @param {string} rootPath
 */
export function getPackageJson(rootPath, prod = false) {
  const pkg = readPackageJson(rootPath);
  const sourcePath = getSourcePath(rootPath);
  const publicFiles = getPublicFiles(sourcePath);
  const sourceDir = getSourceDir();
  const cjsDir = getCJSDir();
  const esmDir = getESMDir();
  const builds = getPackageBuilds(rootPath);
  const buildKeys = Object.keys(builds);

  /** @param {string} path */
  const getExports = (path) => {
    if (!prod) {
      return path.replace(sourcePath, `./${sourceDir}`);
    }
    path = removeExt(path).replace(sourcePath, '');

    const esmExport = `./${join(esmDir, path)}.js`;
    const cjsExport = `./${join(cjsDir, path)}.cjs`;

    if ('esm' in builds && 'cjs' in builds) {
      return {
        import: esmExport,
        require: cjsExport,
      };
    }

    const [esmOrCjsBuildKey] = buildKeys;
    if (esmOrCjsBuildKey === 'esm') return esmExport;

    return cjsExport;
  };

  const moduleExports = Object.entries(publicFiles).reduce(
    (acc, [name, path]) => {
      if (name === 'index') {
        return { '.': getExports(path), ...acc };
      }
      const pathname = `./${name.replace(/\/index$/, '')}`;
      return { ...acc, [pathname]: getExports(path) };
    },
    {},
  );

  /** @type {Record<string, any>} */
  if ('cjs' in builds) {
    pkg.main = prod ? join(cjsDir, 'index.cjs') : join(sourceDir, 'index.ts');
    pkg.types = prod ? join(cjsDir, 'index.d.ts') : join(sourceDir, 'index.ts');
  }
  if ('esm' in builds) {
    pkg.module = prod ? join(esmDir, 'index.js') : join(sourceDir, 'index.ts');
    pkg.types = prod ? join(esmDir, 'index.d.ts') : join(sourceDir, 'index.ts');
  }

  pkg.exports = {
    ...moduleExports,
    './package.json': './package.json',
  };

  return pkg;
}

/**
 * @param {string} rootPath
 */
export function writePackageJson(rootPath, prod = false) {
  const pkgPath = join(rootPath, 'package.json');
  const currentContents = readFileSync(pkgPath, 'utf-8');
  const pkg = getPackageJson(rootPath, prod);
  const nextContents = `${JSON.stringify(pkg, null, 2)}\n`;
  if (currentContents === nextContents) return;
  writeFileSync(pkgPath, nextContents);
  console.log(`${chalk.blue(pkg.name)} - Updated package.json`);
}

export function getSourceDir() {
  return 'src';
}

export function getESMDir() {
  return 'esm';
}

export function getCJSDir() {
  return 'cjs';
}

/**
 * @param {string} rootPath
 */
export function getSourcePath(rootPath) {
  return join(rootPath, getSourceDir());
}

/**
 * Ensure that paths are consistent across Windows and non-Windows platforms.
 * @param {string} filePath
 */
function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

/**
 * Filters out test files
 * Includes directories and TS/JS files.
 * @param {string} rootPath
 * @param {string} filename
 */
function isPublicModule(rootPath, filename) {
  const isPrivate = /^.*\.test\..*/.test(filename);
  if (isPrivate) return false;
  if (isDirectory(join(rootPath, filename))) return true;
  return /\.(j|t)sx?$/.test(filename);
}

/**
 * Returns { index: "path/to/index", moduleName: "path/to/moduleName" }
 * @param {string} sourcePath
 * @param {string} prefix
 * @returns {Record<string, string>}
 */
export function getPublicFiles(sourcePath, prefix = '') {
  return readdirSync(sourcePath)
    .filter((filename) => isPublicModule(sourcePath, filename))
    .sort() // Ensure consistent order across platforms
    .reduce((acc, filename) => {
      const path = join(sourcePath, filename);
      const childFiles =
        isDirectory(path) && getPublicFiles(path, join(prefix, filename));
      return {
        ...(childFiles || {
          [removeExt(normalizePath(join(prefix, filename)))]:
            normalizePath(path),
        }),
        ...acc,
      };
    }, {});
}

/**
 * Returns { "module": "module", "path/to/module": "path/to/module/index" }]
 * @param {string} rootPath
 * @returns {Record<string, string>}
 */
export function getProxyFolders(rootPath) {
  const publicFiles = getPublicFiles(getSourcePath(rootPath));
  return Object.fromEntries(
    Object.keys(publicFiles)
      .map((name) => [name.replace(/\/index$/, ''), name])
      .filter(([name]) => name !== 'index'),
  );
}

/**
 * Returns ["lib", "es", "dist", "ts", "moduleName", ...]
 * @param {string} rootPath
 * @returns {string[]}
 */
export function getBuildFolders(rootPath) {
  return [getCJSDir(), getESMDir(), ...Object.keys(getProxyFolders(rootPath))];
}

/**
 * @param {string} path
 */
function getRootPath(path) {
  return path.replace(/^([^/]+).*$/, '$1');
}

/**
 * @param {string} path
 * @param {number} _
 * @param {string[]} array
 */
function isRootModule(path, _, array) {
  const rootPath = getRootPath(path);
  return path === rootPath || !array.includes(rootPath);
}

/**
 * @param {string[]} array
 * @param {string} path
 */
function reduceToRootPaths(array, path) {
  const rootPath = getRootPath(path);
  if (array.includes(rootPath)) return array;
  return [...array, rootPath];
}

/**
 * @param {string} rootPath
 */
export function cleanBuild(rootPath) {
  writePackageJson(rootPath);
  getBuildFolders(rootPath)
    .filter(isRootModule)
    .reduce(reduceToRootPaths, [])
    .forEach((name) => rimraf.sync(name));
}

/**
 * @param {string} path
 */
export function getIndexPath(path) {
  const index = readdirSync(path).find((file) =>
    /^index\.(c|m)?(j|t)sx?/.test(file),
  );
  if (!index) {
    throw new Error(`Missing index file in ${path}`);
  }
  return join(path, index);
}

/**
 * @param {string} rootPath
 */
export function makeGitignore(rootPath) {
  const pkg = readPackageJson(rootPath);
  const buildFolders = getBuildFolders(rootPath);
  const contents = buildFolders
    .filter(isRootModule)
    .reduce(reduceToRootPaths, [])
    .sort() // Ensure that the order is consistent across platforms
    .map((name) => `/${name}`)
    .join('\n');
  writeFileSync(
    join(rootPath, '.gitignore'),
    `# Automatically generated\n${contents}\n`,
  );
  console.log(
    `\nCreated in ${chalk.bold(pkg.name)}: ${chalk.bold(
      chalk.green('.gitignore'),
    )}`,
  );
}

/**
 * @param {string} rootPath
 * @param {string} moduleName
 * @param {string} path
 */
function getProxyPackageContents(rootPath, moduleName, path) {
  const { name } = readPackageJson(rootPath);
  const builds = getPackageBuilds(rootPath);

  const mainDir = getCJSDir();
  const moduleDir = getESMDir();
  const prefix = '../'.repeat(moduleName.split('/').length);
  const json = {
    name: `${name}/${moduleName}`,
    private: true,
    sideEffects: false,
    ...('esm' in builds && {
      module: join(prefix, moduleDir, `${path}.js`),
      types: join(prefix, moduleDir, `${path}.d.ts`),
    }),
    ...('cjs' in builds && {
      main: join(prefix, mainDir, `${path}.cjs`),
      types: join(prefix, mainDir, `${path}.d.ts`),
    }),
  };
  return JSON.stringify(json, null, 2);
}

/**
 * @param {string} rootPath
 */
export function makeProxies(rootPath) {
  const pkg = readPackageJson(rootPath);
  /** @type {string[]} */
  const created = [];
  Object.entries(getProxyFolders(rootPath)).forEach(([name, path]) => {
    fse.ensureDirSync(name);
    writeFileSync(
      `${name}/package.json`,
      getProxyPackageContents(rootPath, name, path),
    );
    created.push(chalk.bold(chalk.green(name)));
  });
  if (created.length) {
    console.log(
      [
        '',
        `Created proxies in ${chalk.bold(pkg.name)}:`,
        `${created.join(', ')}`,
      ].join('\n'),
    );
  }
}
