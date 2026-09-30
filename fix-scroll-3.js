const fs = require('fs');
let content = fs.readFileSync('src/components/ui/IosTimePicker.tsx', 'utf8');

// Fix hour
content = content.replace(
  /ignoreScroll\.current = true;\s*hourRef\.current\.scrollTop = idx \* ITEM_HEIGHT;\s*setTimeout\(\(\) => \{ ignoreScroll\.current = false; \}, 50\);/g,
  `ignoreScroll.current = true;
            const el = hourRef.current;
            const oldBehavior = el.style.scrollBehavior;
            el.style.scrollBehavior = 'auto'; // Force instant jump
            el.scrollTop = idx * ITEM_HEIGHT;
            setTimeout(() => { 
              if (el) el.style.scrollBehavior = oldBehavior;
              ignoreScroll.current = false; 
            }, 50);`
);

// Fix minute
content = content.replace(
  /ignoreScroll\.current = true;\s*minRef\.current\.scrollTop = idx \* ITEM_HEIGHT;\s*setTimeout\(\(\) => \{ ignoreScroll\.current = false; \}, 50\);/g,
  `ignoreScroll.current = true;
            const el = minRef.current;
            const oldBehavior = el.style.scrollBehavior;
            el.style.scrollBehavior = 'auto'; // Force instant jump
            el.scrollTop = idx * ITEM_HEIGHT;
            setTimeout(() => { 
              if (el) el.style.scrollBehavior = oldBehavior;
              ignoreScroll.current = false; 
            }, 50);`
);

fs.writeFileSync('src/components/ui/IosTimePicker.tsx', content);
console.log('Done');
