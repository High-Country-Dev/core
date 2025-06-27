import { generateDatabaseUrl, parseDatabaseUrl } from './database-url.js';

export const PREVIEW_DEPLOYMENT_DATABASE_URL_SUFFIX = '_preview';

export function generatePreviewDeploymentDatabaseUrl(
  databaseUrl: string,
  previewDeploymentBranchName: string,
): string {
  const databaseConfig = parseDatabaseUrl(databaseUrl);

  if (!databaseConfig) {
    throw new Error('Invalid database URL format');
  }

  const modifiedBranchName = previewDeploymentBranchName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();

  const previewDatabaseConfig = {
    ...databaseConfig,
    dbName: `${databaseConfig.dbName}_${modifiedBranchName}${PREVIEW_DEPLOYMENT_DATABASE_URL_SUFFIX}`,
  };

  return generateDatabaseUrl(previewDatabaseConfig);
}
