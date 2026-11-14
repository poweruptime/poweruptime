import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {after, test} from 'node:test';

import {release} from './release.mjs';

const source = resolve(import.meta.dirname, '..');
// Fixtures share the repository's node_modules. No pnpm process may run in a fixture,
// because pnpm would prune these dependencies to match the fixture's workspace.
const modulesState = resolve(source, 'node_modules/.modules.yaml');
const initialModulesState = readFileSync(modulesState, 'utf8');
after(() => assert.equal(readFileSync(modulesState, 'utf8'), initialModulesState));

function fixture(t) {
  const cwd = mkdtempSync(resolve(tmpdir(), 'poweruptime-release-test-'));
  const origin = mkdtempSync(resolve(tmpdir(), 'poweruptime-release-origin-'));
  t.after(() => {
    rmSync(cwd, {recursive: true, force: true});
    rmSync(origin, {recursive: true, force: true});
  });
  const git = (...args) =>
    execFileSync('git', args, {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
  mkdirSync(resolve(cwd, '.changeset'));
  mkdirSync(resolve(cwd, 'infrastructure'));
  // Mirror the repository: the root package carries the release version.
  writeFileSync(
    resolve(cwd, 'package.json'),
    JSON.stringify({
      name: 'poweruptime',
      version: '0.6.0',
      private: true,
      packageManager: 'pnpm@12.18.0',
    }),
  );
  writeFileSync(
    resolve(cwd, 'pnpm-workspace.yaml'),
    "packages:\n  - 'web'\n  - 'emails'\n  - '.'\n",
  );
  for (const [dir, name] of [
    ['web', 'poweruptime-web'],
    ['emails', 'emails'],
  ]) {
    mkdirSync(resolve(cwd, dir));
    writeFileSync(
      resolve(cwd, dir, 'package.json'),
      JSON.stringify({name, version: '0.0.0', private: true}),
    );
  }
  writeFileSync(resolve(cwd, '.gitignore'), 'node_modules\n');
  cpSync(resolve(source, '.changeset/config.json'), resolve(cwd, '.changeset/config.json'));
  const configPath = resolve(cwd, '.changeset/config.json');
  const config = JSON.parse(readFileSync(configPath));
  config.format = false;
  writeFileSync(configPath, JSON.stringify(config));
  writeFileSync(resolve(cwd, 'CHANGELOG.md'), '# Changelog\n\n## 0.5.9\n\nOld stable notes.\n');
  writeFileSync(
    resolve(cwd, 'infrastructure/versions.env'),
    'OTHER="keep"\nPOWERUPTIME_VERSION="0.6.0-beta-1794308547"\n',
  );
  symlinkSync(resolve(source, 'node_modules'), resolve(cwd, 'node_modules'), 'dir');
  git('init', '-b', 'main');
  git('config', 'user.email', 'release-test@example.invalid');
  git('config', 'user.name', 'Release test');
  git('add', '.');
  git('commit', '-m', 'Initial fixture');
  execFileSync('git', ['init', '--bare', '-b', 'main', origin]);
  git('remote', 'add', 'origin', origin);
  // Releases are pushed before the next one, as the script requires main to match origin.
  const push = () => git('push', '--quiet', 'origin', 'main', '--tags');
  push();
  const add = (id, summary) => {
    writeFileSync(
      resolve(cwd, `.changeset/${id}.md`),
      `---\n"poweruptime": patch\n---\n\n${summary}\n`,
    );
    git('add', '.changeset');
    git('commit', '-m', `fix: ${summary}`);
    push();
  };
  return {
    cwd,
    git,
    add,
    push,
    notes: () => readFileSync(resolve(cwd, 'CHANGELOG.md'), 'utf8'),
  };
}

test('beta releases retain changes for promotion, exact notes and tags point to release commits', async (t) => {
  const f = fixture(t);
  f.add('first', 'First fix.');
  const options = {cwd: f.cwd, confirm: async () => true};
  assert.equal(await release('beta', options), '0.6.1-beta.0');
  assert.equal(f.git('rev-parse', '0.6.1-beta.0'), f.git('rev-parse', 'HEAD'));
  assert.match(
    readFileSync(resolve(f.cwd, 'infrastructure/versions.env'), 'utf8'),
    /OTHER="keep"\nPOWERUPTIME_VERSION="0.6.1-beta.0"/,
  );
  assert.equal(f.git('status', '--porcelain'), '');
  f.push();
  await assert.rejects(release('beta', options), /No new release/);
  assert.equal(f.git('status', '--porcelain'), '');
  f.add('second', 'Second fix.');
  assert.equal(await release('beta', options), '0.6.1-beta.1');
  f.push();
  assert.equal(await release('prod', options), '0.6.1');
  assert.equal(f.git('rev-parse', '0.6.1'), f.git('rev-parse', 'HEAD'));
  assert.equal(JSON.parse(readFileSync(resolve(f.cwd, 'package.json'))).version, '0.6.1');
  assert.equal(JSON.parse(readFileSync(resolve(f.cwd, 'web/package.json'))).version, '0.0.0');
  const stable = f.notes().split('## 0.6.1-beta.1')[0];
  assert.match(stable, /First fix\./);
  assert.match(stable, /Second fix\./);
  assert.equal(f.git('status', '--porcelain'), '');
  execFileSync(
    'bash',
    [resolve(source, '.github/extractLatestChangelog.sh'), 'CHANGELOG.md', '0.6.1-beta.1'],
    {cwd: f.cwd},
  );
  const notes = readFileSync(resolve(f.cwd, 'RELEASE_CHANGELOG.md'), 'utf8');
  assert.match(notes, /Second fix\./);
  assert.doesNotMatch(notes, /First fix\.|Old stable notes/);
  assert.throws(() =>
    execFileSync(
      'bash',
      [resolve(source, '.github/extractLatestChangelog.sh'), 'CHANGELOG.md', '0.6.1-beta.99'],
      {cwd: f.cwd},
    ),
  );
  // Aliases used by the release workflow preserve the base version.
  assert.equal(
    execFileSync('bash', ['-c', 'echo "${VERSION%%-beta.*}-beta"'], {
      env: {...process.env, VERSION: '0.6.1-beta.12'},
      encoding: 'utf8',
    }).trim(),
    '0.6.1-beta',
  );
});

test('cancellation, empty releases, dirty trees, and duplicate tags leave no release changes', async (t) => {
  const f = fixture(t);
  const options = {cwd: f.cwd, confirm: async () => true};
  await assert.rejects(release('beta', options));
  assert.equal(f.git('status', '--porcelain'), '');
  f.add('first', 'A fix.');
  const head = f.git('rev-parse', 'HEAD');
  await release('beta', {...options, confirm: async () => false});
  assert.equal(f.git('rev-parse', 'HEAD'), head);
  assert.equal(f.git('status', '--porcelain'), '');
  f.git('tag', '0.6.1-beta.0');
  await assert.rejects(release('beta', options), /already exists/);
  assert.equal(f.git('status', '--porcelain'), '');
  f.git('tag', '-d', '0.6.1-beta.0');
  writeFileSync(resolve(f.cwd, 'unrelated.txt'), 'Uncommitted work');
  await assert.rejects(release('prod', options), /Commit or stash/);
  assert.equal(f.git('rev-parse', 'HEAD'), head);
  rmSync(resolve(f.cwd, 'unrelated.txt'));
  assert.equal(await release('prod', options), '0.6.1');
  f.push();
  // Changesets itself fails when nothing is queued outside prerelease mode.
  await assert.rejects(release('prod', options));
  assert.equal(f.git('status', '--porcelain'), '');
});

test('releases only run on main when it matches origin/main', async (t) => {
  const f = fixture(t);
  f.add('first', 'A fix.');
  const options = {cwd: f.cwd, confirm: async () => true};
  const head = f.git('rev-parse', 'HEAD');
  f.git('switch', '--quiet', '-c', 'feature');
  await assert.rejects(release('beta', options), /Check out main/);
  f.git('switch', '--quiet', 'main');
  // Behind: origin/main has a commit that the local main lacks.
  f.git('commit', '--quiet', '--allow-empty', '-m', 'chore: remote change');
  f.push();
  f.git('reset', '--quiet', '--hard', head);
  await assert.rejects(release('beta', options), /must match origin\/main/);
  f.git('reset', '--quiet', '--hard', 'origin/main');
  // Ahead: the local main has an unpushed commit.
  f.git('commit', '--quiet', '--allow-empty', '-m', 'chore: local change');
  await assert.rejects(release('beta', options), /must match origin\/main/);
  f.git('reset', '--quiet', '--hard', 'origin/main');
  f.git('remote', 'remove', 'origin');
  await assert.rejects(release('beta', options), /Add the origin remote/);
  assert.equal(f.git('tag', '--list'), '');
  assert.equal(f.git('status', '--porcelain'), '');
});

test('a rejected release commit restores the worktree and index', async (t) => {
  const f = fixture(t);
  f.add('first', 'A fix.');
  const head = f.git('rev-parse', 'HEAD');
  writeFileSync(resolve(f.cwd, '.git/hooks/pre-commit'), '#!/bin/sh\nexit 1\n', {mode: 0o755});
  await assert.rejects(release('beta', {cwd: f.cwd, confirm: async () => true}), /failed/);
  assert.equal(f.git('rev-parse', 'HEAD'), head);
  assert.equal(f.git('status', '--porcelain'), '');
  assert.equal(f.git('tag', '--list'), '');
});
