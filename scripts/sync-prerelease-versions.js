/**
 * Syncs package versions with the latest npm alpha tag so lerna
 * increments from the correct base (e.g. alpha.5 -> alpha.6).
 *
 * Skips packages where the stable release is already at or beyond
 * the alpha base version (e.g. stable 0.13.3, alpha 0.13.3-alpha.16)
 * so lerna bumps to the next minor prerelease (0.13.4-alpha.0).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const glob = require('glob');
const semver = require('semver');

const pkgs = glob.sync('packages/*/package.json');

for (const p of pkgs) {
  const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (pkg.private) {
    continue;
  }

  try {
    const tags = JSON.parse(execSync(`npm view ${pkg.name} dist-tags --json 2>/dev/null`, { encoding: 'utf8' }));
    const alpha = tags.alpha;
    const latest = tags.latest;

    if (!alpha) {
      continue;
    }

    const alphaBase = semver.coerce(alpha)?.version;
    if (latest && alphaBase && semver.gte(latest, alphaBase)) {
      console.log(`${pkg.name}: skip alpha ${alpha} (stable ${latest} already released)`);
      continue;
    }

    console.log(`${pkg.name}: ${pkg.version} -> ${alpha}`);
    pkg.version = alpha;
    fs.writeFileSync(p, `${JSON.stringify(pkg, null, 2)}\n`);
  } catch (e) {
    // package not on npm yet, skip
  }
}
