/**
 * @description This determines if the current environment is production.
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * @description This determines if the current environment is development.
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * @description This determines if the current environment is test.
 */
export const isTest = process.env.NODE_ENV === 'test';

/**
 * @description This is the list of key branches that are considered preview deployments.
 */
const KEY_BRANCHES = [
  // Production branches
  'main',
  'master',
  // Staging branches
  'staging',
  'stage',
  // Development branches
  'dev',
  'develop',
];

/**
 * @description This determines if the current deployment is a preview deployment.
 * @returns {boolean} True if the current deployment is a preview deployment, false otherwise.
 */
export const isPreviewDeployment = !KEY_BRANCHES.includes(
  process.env.VERCEL_GIT_COMMIT_REF ?? '',
);
