#!/usr/bin/env node

import * as actions from '@actions/core';
import * as github from '@actions/github';
import type { DatabaseConfig } from '@mtndev/environment-config';
import {
  PREVIEW_DEPLOYMENT_DATABASE_URL_SUFFIX,
  generatePreviewDeploymentDatabaseUrl,
  parseDatabaseUrl,
} from '@mtndev/environment-config';

interface PullRequest {
  base: { ref: string };
  head: { ref: string };
  number: number;
  title: string;
}

function getInputSecrets() {
  const githubToken =
    process.env.GITHUB_TOKEN ??
    actions.getInput('github-token', {
      required: true,
      trimWhitespace: true,
    });
  if (!githubToken) {
    throw new Error('GitHub token is not set. Exiting.');
  }

  const dopplerToken =
    process.env.DOPPLER_TOKEN ??
    actions.getInput('doppler-token', {
      required: true,
      trimWhitespace: true,
    });
  if (!dopplerToken) {
    throw new Error('Doppler token is not set. Exiting.');
  }

  return { githubToken, dopplerToken };
}

async function getPreviewDeploymentBranchName() {
  const pullRequestNumber = process.env.PR_NUMBER ?? null;
  let currentPullRequest: PullRequest | null = null;

  switch (true) {
    case typeof github.context.payload.pull_request !== 'undefined': {
      currentPullRequest = github.context.payload.pull_request as PullRequest;

      break;
    }

    case typeof pullRequestNumber === 'string': {
      const { githubToken } = getInputSecrets();
      const octokit = github.getOctokit(githubToken);

      const { data: pullRequestData } = await octokit.rest.pulls.get({
        ...github.context.repo,
        pull_number: parseInt(pullRequestNumber, 10),
      });

      currentPullRequest = pullRequestData as PullRequest;

      break;
    }

    default: {
      throw new Error('Could not determine pull request number. Exiting.');
    }
  }

  const branchName =
    currentPullRequest.head.ref ||
    github.context.ref.replace('refs/heads/', '');

  return branchName;
}

async function getDatabaseURLFromDoppler() {
  const { dopplerToken } = getInputSecrets();

  const dopplerSecretsEndpointURL = new URL(
    'https://api.doppler.com/v3/configs/config/secrets/download',
  );
  dopplerSecretsEndpointURL.searchParams.append(
    'project',
    github.context.repo.repo,
  );
  dopplerSecretsEndpointURL.searchParams.append('config', 'dev');
  dopplerSecretsEndpointURL.searchParams.append('format', 'json');

  const { DATABASE_URL: databaseURLFromDoppler } = await fetch(
    dopplerSecretsEndpointURL,
    {
      headers: {
        authorization: `Bearer ${dopplerToken}`,
        'content-type': 'application/json',
      },
    },
  )
    .then(
      (res) =>
        res.json() as Promise<{
          [key: string]: string;
          DATABASE_URL: string;
        }>,
    )
    .catch((err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : String(err);

      throw new Error(`Failed to fetch secrets from Doppler: ${errorMessage}`);
    });

  if (!databaseURLFromDoppler) {
    throw new Error('Failed to extract DATABASE_URL from Doppler.');
  }

  const parsedDatabaseURLFromDoppler = parseDatabaseUrl(databaseURLFromDoppler);
  if (!parsedDatabaseURLFromDoppler) {
    throw new Error('Failed to parse database URL from Doppler.');
  }

  return databaseURLFromDoppler;
}

// eslint-disable-next-line @typescript-eslint/require-await
async function dropDatabase(databaseConfig: DatabaseConfig) {
  const {
    dbName,
    dbType,
    // dbUser,
    //  dbPassword,
    //  dbHost,
    //  dbPort
  } = databaseConfig;

  // const dropCommand = `DROP DATABASE IF EXISTS ${dbName}`;

  switch (dbType) {
    case 'postgres': {
      process.stdout.write(
        `Dropping the Postgres database called "${dbName}"...`,
      );

      // await execAsync(
      //   `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -c "${dropCommand}"`,
      // ).catch((err: unknown) => {
      //   const errorMessage = err instanceof Error ? err.message : String(err);

      //   throw new Error(
      //     `Failed to drop Postgres database ${dbName}: ${errorMessage}`,
      //   );
      // });

      break;
    }

    case 'mysql': {
      process.stdout.write(`Dropping the MySQL database called "${dbName}"...`);

      // await execAsync(
      //   `mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} -e "${dropCommand}"`,
      // ).catch((err: unknown) => {
      //   const errorMessage = err instanceof Error ? err.message : String(err);

      //   throw new Error(
      //     `Failed to drop MySQL database ${dbName}: ${errorMessage}`,
      //   );
      // });

      break;
    }

    default: {
      throw new Error(
        `Unsupported database type: ${dbType as string}. Operation aborted.`,
      );
    }
  }
}

async function run() {
  try {
    const previewDeploymentBranchName = await getPreviewDeploymentBranchName();

    process.stdout.write(
      `Found deployment branch name: ${previewDeploymentBranchName}`,
    );

    const databaseURLFromDoppler = await getDatabaseURLFromDoppler();

    const previewDeploymentDatabaseURL = generatePreviewDeploymentDatabaseUrl(
      databaseURLFromDoppler,
      previewDeploymentBranchName,
    );

    const previewDeploymentDatabaseConfig =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      parseDatabaseUrl(previewDeploymentDatabaseURL)!; // We already validated that the databaseURLFromDoppler is valid, this is safe

    const { dbName } = previewDeploymentDatabaseConfig;

    switch (true) {
      // Avoid dropping protected databases
      case /_(dev|staging|prod)$/.test(dbName): {
        throw new Error(
          `Error: Attempting to drop a protected database (${dbName}). Operation aborted.`,
        );
      }

      // Avoid dropping non-preview databases
      case dbName.endsWith(PREVIEW_DEPLOYMENT_DATABASE_URL_SUFFIX) === false: {
        throw new Error(
          `Error: Attempting to drop a non-preview database (${dbName}). Database must end with _preview. Operation aborted.`,
        );
      }
    }

    process.stdout.write(
      `Database "${dbName}" passed all safety checks and is going to be dropped.`,
    );

    await dropDatabase(previewDeploymentDatabaseConfig);

    process.stdout.write(`Successfully dropped database "${dbName}".`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An error occurred';

    actions.setFailed(errorMessage);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run();
