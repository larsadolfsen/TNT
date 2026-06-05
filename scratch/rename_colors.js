const fs = require('fs');
const path = require('path');

const targetDirs = [
  'blocks',
  'sections',
  'snippets',
  'templates',
  'layout',
  'locales',
  'assets'
];

const workspaceRoot = 'c:\\Users\\adolf\\Documents\\Projects\\Shopify';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const replacements = [
  { from: /brand-yellow/g, to: 'accent' },
  { from: /brand_yellow/g, to: 'accent' }
];

targetDirs.forEach(dirName => {
  const dirPath = path.join(workspaceRoot, dirName);
  if (!fs.existsSync(dirPath)) return;

  walkDir(dirPath, filePath => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.liquid' && ext !== '.css' && ext !== '.json' && ext !== '.js') return;

    // Skip output.css since we compile it
    if (path.basename(filePath) === 'output.css') return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    replacements.forEach(r => {
      content = content.replace(r.from, r.to);
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${path.relative(workspaceRoot, filePath)}`);
    }
  });
});

console.log('Done!');
