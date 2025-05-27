import path, { join } from 'path';
import { readdirSync, existsSync } from 'fs';
import * as url from 'url';
import { readFile } from 'fs/promises';
import { async as readJsonAsync } from '../read-json/index.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

/** @typedef {import('type-fest').PackageJson} PackageJson */

/** @typedef {{
 * name: string;
 * location: string;
 * packageJSONContent: PackageJson;
 * npmrcContent: string;
 * }} Package */

/** Folder where the packages are located in the monorepo. */
export const packagesFolder = join(__dirname, '..', '..', '..', 'packages');

/**
 * List all packages under the packages folder.
 * @returns List of folders under the packages folder.
 */
export const getPackagesFoldersNames = () => {
  return readdirSync(packagesFolder).filter((packagesFolderFilePath) => {
    return existsSync(
      path.join(packagesFolder, packagesFolderFilePath, 'package.json'),
    );
  });
};

/**
 *
 * @returns {Promise<Package[]>} A promise with the package's `name`, `location` and its package.json `content`.
 */

export function getPackagesInformation() {
  return new Promise((resolve, reject) => {
    try {
      const packagesFoldersNames = getPackagesFoldersNames();

      Promise.all(
        packagesFoldersNames.map((packageFolderNameName) => {
          const packageFolder = join(packagesFolder, packageFolderNameName);

          return Promise.all([
            /** @type {Promise<PackageJson>} */ (
              readJsonAsync(join(packageFolder, 'package.json'))
            ),
            readFile(join(packageFolder, '.npmrc'), 'utf8'),
          ]);
        }),
      )
        .then((packagesFilesContents) => {
          resolve(
            packagesFilesContents.map(
              ([packageJSONContent, npmrcContent], packageFolderIndex) =>
                /** @type {Package} */ ({
                  name: packageJSONContent.name,
                  location: join(
                    packagesFolder,
                    packagesFoldersNames[packageFolderIndex],
                  ),
                  packageJSONContent,
                  npmrcContent,
                }),
            ),
          );
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
}
