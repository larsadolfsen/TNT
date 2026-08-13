// Writes a date-time-derived version (1.<YYYYMMDD>.<HHMM>) into package.json,
// package-lock.json (root + first package), and config/settings_schema.json's theme_version.
// Run once at merge-to-main time (see CLAUDE.md) instead of hand-bumping a shared counter,
// so concurrent branches never race on the same increment.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const now = new Date();
const yyyymmdd = now.getFullYear().toString() +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0');
const hhmm = String(now.getHours() * 100 + now.getMinutes()); // leading zeros stripped for valid semver
const version = `1.${yyyymmdd}.${hhmm}`;

function updateJson(relPath, updater) {
  const filePath = path.join(root, relPath);
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  updater(data);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

updateJson('package.json', (data) => { data.version = version; });

updateJson('package-lock.json', (data) => {
  data.version = version;
  const pkgs = data.packages;
  if (pkgs && pkgs[''] && pkgs[''].version) pkgs[''].version = version;
});

updateJson('config/settings_schema.json', (data) => {
  const themeInfo = data.find((entry) => entry.name === 'theme_info');
  if (!themeInfo) throw new Error('theme_info block not found in settings_schema.json');
  themeInfo.theme_version = version;
});

console.log(`Bumped version to ${version}`);
