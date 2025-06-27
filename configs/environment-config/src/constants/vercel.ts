import { generatePreviewDeploymentDatabaseUrl } from '../utils/db/index.js';
import { isPreviewDeployment } from './environment.js';

/**
 * This is used to get the Vercel deployment information.
 */
export type VercelInfo = {
  /**
   * The database URL for the preview deployment.
   *
   * This databaseURL is combined with a [snake_case](https://en.wikipedia.org/wiki/Snake_case)
   * version of the git branch name, followed by the `_preview` suffix to create a unique database URL for the preview deployment.
   *
   * This databaseURL is used internally within our backend through the `@acme/env` package, which when ran on Vercel will override
   * the default [doppler](https://docs.doppler.com/docs/cli)'s `DATABASE_URL` with this value.
   *
   * When combined with the [cleanup-close-pr Github Action](https://github.com/High-Country-Dev/cleanup-close-pr-action)
   * it will also delete the preview database after the preview deployment PR is closed.
   * */
  databaseUrl: string;
  /** The git branch URL. */
  gitBranchUrl?: string;
  /** The git commit ref. */
  gitCommitRef: string;
  /** Whether the deployment is a preview deployment. */
  isPreviewDeployment: boolean;
} | null;

export const vercelInfo: VercelInfo =
  process.env.VERCEL &&
  process.env.VERCEL_GIT_COMMIT_REF &&
  process.env.DATABASE_URL
    ? {
        gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF,
        gitBranchUrl: process.env.VERCEL_BRANCH_URL,
        isPreviewDeployment,
        databaseUrl: generatePreviewDeploymentDatabaseUrl(
          process.env.DATABASE_URL,
          process.env.VERCEL_GIT_COMMIT_REF,
        ),
      }
    : null;
