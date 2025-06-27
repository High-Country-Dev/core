export const DATABASE_TYPES = ['postgres', 'mysql'] as const;

export const DATABASE_URL_REGEXP = new RegExp(
  `^(?<dbType>${DATABASE_TYPES.join('|')}):\\/\\/(?<dbUser>[^:]+):(?<dbPassword>[^@]+)@(?<dbHost>[^:]+):(?<dbPort>\\d+)\\/(?<dbName>.+)$`,
);

export interface DatabaseConfig {
  dbHost: string;
  dbName: string;
  dbPassword: string;
  dbPort: string;
  dbType: (typeof DATABASE_TYPES)[number];
  dbUser: string;
}

export function parseDatabaseUrl(url: string): DatabaseConfig | null {
  const match = url.match(DATABASE_URL_REGEXP);

  if (!match) {
    return null;
  }

  return match.groups as unknown as DatabaseConfig;
}

export function generateDatabaseUrl(databaseConfig: DatabaseConfig): string {
  return `${databaseConfig.dbType}://${databaseConfig.dbUser}:${databaseConfig.dbPassword}@${databaseConfig.dbHost}:${databaseConfig.dbPort}/${databaseConfig.dbName}`;
}
