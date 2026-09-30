const fs = require('fs');
let content = fs.readFileSync('src/components/ui/IosTimePicker.tsx', 'utf8');

// Add ref
content = content.replace(
  /const minRef = useRef<HTMLDivElement>\(null\);/g,
  `const minRef = useRef<HTMLDivElement>(null);\n  const ignoreScroll = useRef(false);`
);

// Update hour useEffect
content = content.replace(
  /if \(hourRef\.current && hour && hours\.includes\(hour\)\) \{\s*const idx = hours\.indexOf\(hour\);\s*t = setTimeout\(\(\) => \{\s*if \(hourRef\.current && Math\.round\(hourRef\.current\.scrollTop \/ ITEM_HEIGHT\) !== idx\) \{\s*hourRef\.current\.scrollTop = idx \* ITEM_HEIGHT;\s*\}\s*\}, 50\);\s*\}/g,
  `if (hourRef.current && hour && hours.includes(hour)) {
      const idx = hours.indexOf(hour);
      t = setTimeout(() => {
        if (hourRef.current && Math.round(hourRef.current.scrollTop / ITEM_HEIGHT) !== idx) {
          ignoreScroll.current = true;
          hourRef.current.scrollTop = idx * ITEM_HEIGHT;
          setTimeout(() => { ignoreScroll.current = false; }, 50);
        }
      }, 50);
    }`
);

// Update minute useEffect
content = content.replace(
  /if \(minRef\.current && minute && minutes\.includes\(minute\)\) \{\s*const idx = minutes\.indexOf\(minute\);\s*t = setTimeout\(\(\) => \{\s*if \(minRef\.current && Math\.round\(minRef\.current\.scrollTop \/ ITEM_HEIGHT\) !== idx\) \{\s*minRef\.current\.scrollTop = idx \* ITEM_HEIGHT;\s*\}\s*\}, 50\);\s*\}/g,
  `if (minRef.current && minute && minutes.includes(minute)) {
      const idx = minutes.indexOf(minute);
      t = setTimeout(() => {
        if (minRef.current && Math.round(minRef.current.scrollTop / ITEM_HEIGHT) !== idx) {
          ignoreScroll.current = true;
          minRef.current.scrollTop = idx * ITEM_HEIGHT;
          setTimeout(() => { ignoreScroll.current = false; }, 50);
        }
      }, 50);
    }`
);

// Update handleScrollHour
content = content.replace(
  /const handleScrollHour = \(\) => \{\s*if \(!hourRef\.current\) return;/g,
  `const handleScrollHour = () => {
    if (!hourRef.current || ignoreScroll.current) return;`
);

// Update handleScrollMinute
content = content.replace(
  /const handleScrollMinute = \(\) => \{\s*if \(!minRef\.current\) return;/g,
  `const handleScrollMinute = () => {
    if (!minRef.current || ignoreScroll.current) return;`
);

fs.writeFileSync('src/components/ui/IosTimePicker.tsx', content);
console.log('Done');
