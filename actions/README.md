# GitHub Actions

This directory contains reusable GitHub Actions for the MountainDev monorepo.

## ⚠️ Important: Monorepo Usage

**CRITICAL**: Since this is a monorepo, you must reference actions using their full path to avoid unintended execution of the root `action.yml` file.

### ❌ Incorrect Usage

```yaml
# This will trigger the root action.yml, not the intended action
uses: High-Country-Dev/core@main
```

### ✅ Correct Usage

```yaml
# Always specify the full path to the action
uses: High-Country-Dev/core@main/actions/clean-up-preview-deployment
```

## Available Actions

### Clean Up Preview Deployment

**Path**: `./actions/clean-up-preview-deployment`

Automatically cleans up preview deployment databases when pull requests are closed or merged. This action is designed to work with Vercel preview deployments and Doppler secrets management.

#### What it does

1. **Identifies Preview Deployments**: Determines the branch name from the pull request context
2. **Fetches Database Configuration**: Retrieves the base `DATABASE_URL` from Doppler secrets
3. **Generates Preview Database URL**: Creates a unique database URL for the preview deployment using the pattern:
   ```
   {original_db_name}_{branch_name}_preview
   ```
4. **Safety Validation**: Ensures the database is safe to drop by checking:
   - Database name doesn't end with `_dev`, `_staging`, or `_prod` (protected databases)
   - Database name ends with `_preview` (only preview databases)
5. **Database Cleanup**: Drops the preview database to free up resources

#### When to use

- **Pull Request Closure**: Automatically triggered when a PR is merged or closed
- **Manual Cleanup**: For cleaning up orphaned preview databases
- **Resource Management**: To prevent accumulation of unused preview databases

#### Inputs

| Input           | Description                            | Required | Default               |
| --------------- | -------------------------------------- | -------- | --------------------- |
| `github-token`  | GitHub token for API access            | Yes      | `${{ github.token }}` |
| `doppler-token` | Doppler API token for secrets access   | Yes      | -                     |
| `pr-number`     | Pull request number for manual cleanup | No       | -                     |

#### Environment Variables

| Variable    | Description                                          | Required |
| ----------- | ---------------------------------------------------- | -------- |
| `PR_NUMBER` | Specific PR number to clean up (for manual triggers) | No       |

#### Usage Examples

##### Automatic Cleanup on PR Merge

```yaml
name: Clean Up Preview Deployment

on:
  pull_request:
    types: [closed]

jobs:
  cleanup:
    runs-on: ubuntu-latest
    if: github.event.pull_request.merged == true

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Clean up preview deployment
        uses: High-Country-Dev/core@main/actions/clean-up-preview-deployment
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          doppler-token: ${{ secrets.DOPPLER_TOKEN }}
```

##### Manual Cleanup with Specific PR Number

```yaml
name: Manual Clean Up Preview Deployment

on:
  workflow_dispatch:
    inputs:
      pr_number:
        description: 'Pull request number to clean up'
        required: true
        type: number

jobs:
  cleanup:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Clean up preview deployment
        uses: High-Country-Dev/core@main/actions/clean-up-preview-deployment
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          doppler-token: ${{ secrets.DOPPLER_TOKEN }}
          pr-number: ${{ github.event.inputs.pr_number }}
```

#### Required Secrets

Configure these secrets in your repository settings:

- **`GITHUB_TOKEN`**: Usually available by default
- **`DOPPLER_TOKEN`**: Your Doppler API token for accessing secrets

#### Safety Features

The action includes the following safety mechanisms:

1. **Protected Database Check**: Prevents dropping databases ending with `_dev`, `_staging`, or `_prod`
2. **Preview Database Validation**: Only drops databases ending with `_preview`

#### Database Naming Convention

Preview databases follow this naming pattern: `{original_database_name}{branch_name_snake_case}_preview`

Examples:

- `myapp_feature_new_ui_preview`
- `myapp_bug_fix_123_preview`
- `myapp_improve_performance_preview`

#### Integration with Vercel

This action works seamlessly with Vercel preview deployments:

1. **Vercel Environment**: Uses `VERCEL_GIT_COMMIT_REF` to identify the branch
2. **Database URL Override**: The `@mtndev/environment-config` package automatically overrides `DATABASE_URL` on Vercel with the preview database URL
3. **Automatic Cleanup**: When PRs are closed, the preview database is automatically dropped

#### Troubleshooting

**Common Issues:**

1. **"Could not determine pull request number"**: Ensure the action is triggered by a pull request event or provide `pr-number` input parameter
2. **"Pull request number is not a number"**: Ensure the `pr-number` input can be converted to a number (`parseInt(inputs['pr-number'], 10)`)
3. **"Failed to fetch secrets from Doppler"**: Verify your `DOPPLER_TOKEN` is valid and has access to the project
4. **"Attempting to drop a protected database"**: The action correctly prevents dropping production/staging databases
5. **"Attempting to drop a non-preview database"**: Only databases ending with `_preview` can be dropped
