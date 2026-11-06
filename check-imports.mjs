import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "js");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

function exportsOf(file) {
  if (!fs.existsSync(file)) return null;
  const src = fs.readFileSync(file, "utf8");
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s+(?:const|let|class)\s+([A-Za-z0-9_$]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) {
    m[1].split(",").map(s => s.trim().split(/\s+as\s+/).pop()).filter(Boolean).forEach(n => names.add(n));
  }
  return names;
}

const files = walk(root).filter(f => f.endsWith(".js"));
let problems = 0;

for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
    const names = m[1].split(",").map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
    const spec = m[2];
    if (!spec.startsWith(".")) continue;

    const target = path.join(path.dirname(f), spec);

    const available = exportsOf(target);
    if (available === null) {
      console.log(`NG  ${path.relative(process.cwd(), f)}: ファイルが見つからない -> ${path.relative(process.cwd(), target)}`);
      problems++;
      continue;
    }
    for (const n of names) {
      if (!available.has(n)) {
        console.log(`NG  ${path.relative(process.cwd(), f)}: '${n}' が ${path.relative(process.cwd(), target)} に export されていません`);
        problems++;
      }
    }
  }
}

console.log(problems === 0 ? "\n✅ 問題なし" : `\n❌ ${problems} 件の問題`);
