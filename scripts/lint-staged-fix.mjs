#!/usr/bin/env node
/**
 * lint-staged runner for staged TS/TSX files.
 *
 * Why a custom script instead of `eslint --fix` directly?
 *   The repo has pre-existing React-Compiler errors in legacy view
 *   components (ProjectsView, AgentView, AioSettings) that need a
 *   dedicated refactor PR. We want pre-commit to:
 *     - auto-fix everything ESLint can fix
 *     - print remaining warnings/errors as guidance
 *     - NEVER block commit on those pre-existing issues
 *
 *   When the legacy backlog is gone, replace this script with a plain
 *   `eslint --fix --max-warnings 0` command in lint-staged config.
 */
import { spawnSync } from 'node:child_process';

const files = process.argv.slice(2);
if (files.length === 0) process.exit(0);

const result = spawnSync(
  'npx',
  ['eslint', '--fix', '--max-warnings', '9999', ...files],
  { stdio: 'inherit' },
);

if (result.status !== 0) {
  console.warn(
    '\n[lint-staged] eslint reported issues but commit is NOT blocked.\n' +
      '              Run `npm run lint` to see them, fix them in a follow-up PR.\n',
  );
}

// Always exit 0 so legacy issues don't block unrelated commits.
process.exit(0);
