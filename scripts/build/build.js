import path from 'path';
import spawn from 'cross-spawn';
import fse from 'fs-extra';
import { build } from 'tsup';
import {
  cleanBuild,
  getPackageBuilds,
  getPublicFiles,
  getSourcePath,
  makeGitignore,
  makeProxies,
  writePackageJson,
} from './utils.js';
import { mkdir, rm } from 'fs/promises';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/**
 * Builds a package
 * @param {string} packagePath - The path to the package to build
 */
async function buildPackage(packagePath) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    writable: true,
    enumerable: true,
    configurable: true,
    value: 'production',
  });

  cleanBuild(packagePath);

  const sourcePath = getSourcePath(packagePath);
  const entry = getPublicFiles(sourcePath);
  const builds = getPackageBuilds(packagePath);

  await Promise.all(
    Object.values(builds)
      .filter(Boolean)
      .map((build) =>
        mkdir(path.join(packagePath, build), { recursive: true }),
      ),
  );

  const rootTSConfigPath = path.join(__dirname, '..', '..', 'tsconfig.json');
  const tsconfig = /** @type {import('../../tsconfig.json')} */ (
    fse.readJSONSync(rootTSConfigPath)
  );

  // Clears the cache file - caching is already handled by turbo.
  await rm(
    path.join(
      packagePath,
      tsconfig.compilerOptions.tsBuildInfoFile.replace('${configDir}/', ''),
    ),
  );
  const { status: tscCommandStatus } = spawn.sync(
    'tsc',
    [
      '--project',
      'tsconfig.build.json',
      '--outDir',
      /** @type {string} */ (builds.esm || builds.cjs),
    ],
    { stdio: 'inherit' },
  );

  if (tscCommandStatus !== 0) process.exit(tscCommandStatus || 1);

  if (typeof builds.esm !== 'undefined' && typeof builds.cjs !== 'undefined') {
    fse.copySync(builds.esm, builds.cjs);
  }

  /** @type {import('tsup').Options | undefined} */
  let tsupConfigOverrides;
  await import(path.join(packagePath, 'tsup.config.js'))
    .then((module) => {
      tsupConfigOverrides = module.default;
    })
    .catch(() => {
      tsupConfigOverrides = undefined;
    });

  for (const [format, outDir] of Object.entries(builds)) {
    await build({
      ...tsupConfigOverrides,
      entry,
      format: /** @type {import('tsup').Format} */ (format),
      outDir,
      splitting: true,
      esbuildOptions(options) {
        options.chunkNames = '__chunks/[hash]';
      },
    });
  }

  writePackageJson(packagePath, true);
  makeGitignore(packagePath);
  makeProxies(packagePath);
}

buildPackage(process.cwd());
