const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      res = res.concat(walk(file));
    } else {
      res.push(file);
    }
  });
  return res;
}

const files = walk('src').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/className="([^"]*)"/g, (match, classes) => {
    if (classes.includes('text-[16px]')) {
      if (classes.includes('steami-badge')) return match.replace(/text-\[16px\]/g, 'text-[10px]');
      if (classes.includes('steami-btn')) return match.replace(/text-\[16px\]/g, 'text-[11px]');
      if (classes.includes('font-mono')) return match.replace(/text-\[16px\]/g, 'text-[11px]');
      if (classes.includes('font-serif')) return match.replace(/text-\[16px\]/g, 'text-[17px]');
      if (classes.includes('text-muted-foreground')) return match.replace(/text-\[16px\]/g, 'text-[14px]');
      return match.replace(/text-\[16px\]/g, 'text-[15px]');
    }
    if (classes.includes('text-[19px]')) {
      return match.replace(/text-\[19px\]/g, 'text-[18px]');
    }
    return match;
  });

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log('Typography fixed.');
