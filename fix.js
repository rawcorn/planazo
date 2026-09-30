const fs = require('fs');
let content = fs.readFileSync('src/components/layout/RightColumn.tsx', 'utf8');

content = content.replace(
  /{event\.description\?\.includes\('<!--edited-->'\) && \(\s*<span className="bg-slate-200\/70 text-slate-500 text-\[9px\] px-1\.5 py-0\.5 rounded-md uppercase font-bold border border-slate-300 shrink-0">Editado<\/span>\s*\)/g,
  `{event.description?.match(/<!--edited.*?-->/) && (() => { const match = event.description.match(/<!--edited:(.*?)-->/); const edits = match ? match[1] : ''; return <span className=\"bg-slate-200/70 text-slate-500 text-[9px] px-1.5 py-0.5 rounded-md uppercase font-bold border border-slate-300 shrink-0\">{edits && edits !== 'algo' ? \`Editado: \${edits}\` : 'Editado'}</span>; })()}`
);

content = content.replace(
  /{eventToShow\.description\?\.match\(\/<!--edited\.\*\?-->\/\) && \(\(\(\) => \{ const match = eventToShow\.description\.match\(\/<!--edited:\(\.\*\?\)-->\/\); const edits = match \? match\[1\] : ''; return \s*<span className="bg-slate-200 text-slate-500 text-\[10px\] px-2 py-0\.5 rounded-md uppercase font-bold border border-slate-300">Editado<\/span>\s*\)\}/g,
  `{eventToShow.description?.match(/<!--edited.*?-->/) && (() => { const match = eventToShow.description.match(/<!--edited:(.*?)-->/); const edits = match ? match[1] : ''; return <span className=\"bg-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-md uppercase font-bold border border-slate-300\">{edits && edits !== 'algo' ? \`Editado: \${edits}\` : 'Editado'}</span>; })()}`
);

fs.writeFileSync('src/components/layout/RightColumn.tsx', content);
