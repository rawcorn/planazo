const currentHour = 21;
const currentMinute = 52;
const isToday = true;
const hour = '';
const minute = '';

const hours = Array.from({ length: 24 })
  .map((_, i) => i.toString().padStart(2, '0'))
  .filter(h => !isToday || parseInt(h, 10) >= currentHour);

const minutes = Array.from({ length: 60 })
  .map((_, i) => i.toString().padStart(2, '0'))
  .filter(m => !isToday || parseInt(hour || '12', 10) > currentHour || parseInt(m, 10) >= currentMinute);

console.log("hours[0]:", hours[0], "includes 21:", hours.includes('21'));
console.log("minutes[0]:", minutes[0], "includes 52:", minutes.includes('52'));
