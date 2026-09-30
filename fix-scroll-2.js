const fs = require('fs');
let content = fs.readFileSync('src/components/ui/IosTimePicker.tsx', 'utf8');

// Add prev refs
content = content.replace(
  /const ignoreScroll = useRef\(false\);/g,
  `const ignoreScroll = useRef(false);
  const prevHour = useRef(hour);
  const prevMinute = useRef(minute);

  if (hour !== prevHour.current) {
    ignoreScroll.current = true;
    prevHour.current = hour;
    setTimeout(() => { ignoreScroll.current = false; }, 250);
  }
  if (minute !== prevMinute.current) {
    ignoreScroll.current = true;
    prevMinute.current = minute;
    setTimeout(() => { ignoreScroll.current = false; }, 250);
  }`
);

fs.writeFileSync('src/components/ui/IosTimePicker.tsx', content);
console.log('Done');
