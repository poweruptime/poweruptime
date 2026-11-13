import {execFileSync, spawnSync} from 'node:child_process';
import {cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline/promises';
import {fileURLToPath} from 'node:url';

const releasePaths = ['.changeset', 'changelogs', 'infrastructure/versions.env', 'pnpm-lock.yaml'];

async function confirmRelease(version) {
  if (!process.stdin.isTTY)
    throw new Error('Run releases in an interactive terminal to review the changes.');
  const prompt = createInterface({input: process.stdin, output: process.stdout});
  try {
    return (
      (await prompt.question(`Commit and tag ${version}? [y/N] `)).trim().toLowerCase() === 'y'
    );
  } finally {
    prompt.close();
  }
}

// Preparation is reversible until the release commit succeeds. Never push automatically.
export async function release(channel, {cwd = process.cwd(), confirm = confirmRelease} = {}) {
  if (!['beta', 'prod'].includes(channel)) throw new Error('Usage: release.mjs <beta|prod>');
  const git = (...args) => execFileSync('git', args, {cwd, encoding: 'utf8'}).trim();
  const run = (command, args) => {
    const result = spawnSync(command, args, {cwd, stdio: 'inherit'});
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed.`);
  };
  if (git('status', '--porcelain'))
    throw new Error('Commit or stash changes before preparing a release.');
  if (!git('branch', '--show-current'))
    throw new Error('Check out a branch before preparing a release.');
  // Check remote tag collisions too, when this checkout has an origin.
  if (git('remote').split('\n').includes('origin')) run('git', ['fetch', 'origin', '--tags']);

  const manifest = resolve(cwd, 'changelogs/package.json');
  const previousVersion = JSON.parse(readFileSync(manifest)).version;
  const backup = mkdtempSync(resolve(tmpdir(), 'poweruptime-release-'));
  let backedUp = false;
  let staged = false;
  let committed = false;
  try {
    for (const path of releasePaths) {
      if (existsSync(resolve(cwd, path)))
        cpSync(resolve(cwd, path), resolve(backup, path), {recursive: true});
    }
    backedUp = true;
    const prePath = resolve(cwd, '.changeset/pre.json');
    const pre = existsSync(prePath) ? JSON.parse(readFileSync(prePath)) : undefined;
    if (pre && pre.tag !== 'beta') throw new Error('Only beta prerelease mode is supported.');
    if (channel === 'beta' && !pre) run('pnpm', ['exec', 'changeset', 'pre', 'enter', 'beta']);
    if (channel === 'beta' && pre?.mode === 'exit')
      throw new Error('Finish the pending stable release first.');
    if (channel === 'prod' && pre?.mode === 'pre')
      run('pnpm', ['exec', 'changeset', 'pre', 'exit']);
    run('pnpm', ['exec', 'changeset', 'version']);
    const version = JSON.parse(readFileSync(manifest)).version;
    const pattern = channel === 'beta' ? /^\d+\.\d+\.\d+-beta\.\d+$/ : /^\d+\.\d+\.\d+$/;
    if (!pattern.test(version) || version === previousVersion)
      throw new Error('No new release was prepared.');
    if (git('tag', '--list', version)) throw new Error(`Tag ${version} already exists.`);

    // Use Node rather than platform-specific sed flags to preserve the rest of versions.env.
    const versionsPath = resolve(cwd, 'infrastructure/versions.env');
    const versions = readFileSync(versionsPath, 'utf8');
    if (!/^POWERUPTIME_VERSION=.*$/m.test(versions))
      throw new Error('POWERUPTIME_VERSION is missing.');
    writeFileSync(
      versionsPath,
      versions.replace(/^POWERUPTIME_VERSION=.*$/m, `POWERUPTIME_VERSION="${version}"`),
    );
    run('git', ['--no-pager', 'diff', '--', ...releasePaths]);
    console.log(`Release ${version}. Changed files:\n${git('status', '--short')}`);
    if (!(await confirm(version))) {
      console.log('Release cancelled. Restoring release files.');
      return;
    }
    // Only stage release files. Keep unrelated files out of the release commit.
    staged = true;
    run('git', ['add', '-A', '--', ...releasePaths]);
    run('git', ['commit', '-m', `chore(release): ${version}`]);
    committed = true;
    try {
      run('git', ['tag', version]);
    } catch (error) {
      throw new Error(
        `The release commit exists, but tagging failed. Create tag ${version} on HEAD before pushing.`,
        {cause: error},
      );
    }
    console.log(
      `Created local tag ${version}. Push the branch and tag when ready:\ngit push origin HEAD\ngit push origin ${version}`,
    );
    return version;
  } finally {
    if (!committed && staged) git('reset', '--quiet', 'HEAD', '--', ...releasePaths);
    if (!committed && backedUp) {
      for (const path of releasePaths) {
        rmSync(resolve(cwd, path), {recursive: true, force: true});
        if (existsSync(resolve(backup, path)))
          cpSync(resolve(backup, path), resolve(cwd, path), {recursive: true});
      }
    }
    rmSync(backup, {recursive: true, force: true});
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await release(process.argv[2]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
