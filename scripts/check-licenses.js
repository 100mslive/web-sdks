#!/usr/bin/env node
/**
 * Fails when a published package's runtime dependency tree contains a license that customers cannot ship
 * in a closed-source app. Everything in `dependencies` and `peerDependencies` ends up in customer bundles,
 * so a copyleft or non-commercial license there is a legal problem for every customer, not just for us.
 * Dev dependencies are not checked: they never leave this repository.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Permissive licenses that allow use in closed-source, commercial apps without obligations beyond attribution.
const ALLOWED = new Set([
  '0BSD',
  'Apache-2.0',
  'BlueOak-1.0.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'CC0-1.0',
  'CC-BY-4.0',
  'ISC',
  'MIT',
  'Python-2.0',
  'Unlicense',
  'WTFPL',
]);

// Reviewed one-offs: "name@version": "why it is acceptable". A new copyleft entry needs legal sign-off.
const EXCEPTIONS = {
  'fast-shallow-equal@1.0.0': 'Unlicense per its LICENSE file; package.json omits the field',
  'react-universal-interface@0.6.2': 'Unlicense per its LICENSE file; package.json omits the field',
};

const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8'));

const publishedPackages = () =>
  fs
    .readdirSync(path.join(ROOT, 'packages'))
    .map(dir => path.join(ROOT, 'packages', dir))
    .filter(dir => fs.existsSync(path.join(dir, 'package.json')))
    .filter(dir => !readJSON(path.join(dir, 'package.json')).private);

/** Node's lookup: the nearest node_modules/<name> walking up from the requiring package. */
const resolvePackageDir = (name, fromDir) => {
  for (let dir = fromDir; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', name, 'package.json');
    if (fs.existsSync(candidate)) {
      return path.dirname(fs.realpathSync(candidate));
    }
    if (dir === path.dirname(dir)) {
      return null;
    }
  }
};

const licenseOf = pkg => {
  if (typeof pkg.license === 'string') {
    return pkg.license;
  }
  if (pkg.license && pkg.license.type) {
    return pkg.license.type;
  }
  if (Array.isArray(pkg.licenses)) {
    return pkg.licenses.map(l => l.type || l).join(' OR ');
  }
  return 'UNKNOWN';
};

/** Accepts an SPDX expression when every AND term has at least one allowed OR alternative. */
const isAllowed = license =>
  license
    .replace(/[()]/g, '')
    .split(/\s+AND\s+/i)
    .every(term => term.split(/\s+OR\s+/i).some(id => ALLOWED.has(id.trim())));

const runtimeDependencies = pkg => ({
  ...pkg.dependencies,
  ...pkg.optionalDependencies,
  ...pkg.peerDependencies,
});

// Workspace packages are ours and published under the repository license.
const isViolation = (dir, pkg, id) =>
  !dir.startsWith(path.join(ROOT, 'packages')) && !isAllowed(licenseOf(pkg)) && !EXCEPTIONS[id];

const isOptionalPeer = (pkg, name) => Boolean(pkg.peerDependenciesMeta?.[name]?.optional);

const check = () => {
  const seen = new Map();
  const violations = [];
  const missing = [];

  const visit = (dir, chain) => {
    const pkg = readJSON(path.join(dir, 'package.json'));
    const id = `${pkg.name}@${pkg.version}`;
    if (seen.has(id)) {
      return;
    }
    seen.set(id, true);
    if (isViolation(dir, pkg, id)) {
      violations.push({ id, license: licenseOf(pkg), chain: [...chain, id].join(' > ') });
    }
    for (const name of Object.keys(runtimeDependencies(pkg))) {
      const depDir = resolvePackageDir(name, dir);
      if (depDir) {
        visit(depDir, [...chain, id]);
      } else if (!isOptionalPeer(pkg, name)) {
        missing.push(`${name} (required by ${id})`);
      }
    }
  };

  publishedPackages().forEach(dir => visit(dir, []));

  missing.forEach(name => console.warn(`warning: not installed, license not checked: ${name}`));
  if (violations.length) {
    console.error('Disallowed licenses in the runtime dependencies of published packages:\n');
    violations.forEach(({ id, license, chain }) => console.error(`  ${id}: ${license}\n    via ${chain}\n`));
    console.error('Customers ship these packages in closed-source apps. Use a permissively licensed version or');
    console.error('alternative; add to EXCEPTIONS in scripts/check-licenses.js only with legal sign-off.');
    process.exit(1);
  }
  console.log(`Checked ${seen.size} runtime packages: all licenses allowed.`);
};

check();
