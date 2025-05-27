import { readFileSync } from 'fs';
import { readFile } from 'fs/promises';

/**
 * @template T
 * @param {string} path
 * @returns {T}
 */
export function sync(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

/**
 * @template T
 * @param {string} path
 * @returns {Promise<T>}
 */
export function async(path) {
  return new Promise((resolve, reject) => {
    readFile(path, 'utf-8')
      .then((contents) => {
        resolve(JSON.parse(contents));
      })
      .catch(reject);
  });
}
