const fs = require('fs');
let content = fs.readFileSync('src/components/layout/RightColumn.tsx', 'utf8');

// 1. DatePicker onChange forcefully resets hour and minute
content = content.replace(
  /onChange=\{\(d\) => \{ setNewPlan\(\{\.\.\.newPlan, date: d\}\); if \(formErrorField === 'date' \|\| formErrorField === 'time'\) \{ setFormError\(null\); setFormErrorField\(null\); \} \}\}/g,
  `onChange={(d) => {
    const todayObj = new Date();
    const todayStr = \`\${todayObj.getFullYear()}-\${String(todayObj.getMonth() + 1).padStart(2, '0')}-\${String(todayObj.getDate()).padStart(2, '0')}\`;
    const isToday = d === todayStr;
    const isFuture = d && d !== todayStr;
    const currentHStr = String(todayObj.getHours()).padStart(2, '0');
    const currentMStr = String(todayObj.getMinutes()).padStart(2, '0');
    
    // Always reset hour/minute when picking a date
    const h = isToday ? currentHStr : (isFuture ? '00' : '');
    const m = isToday ? currentMStr : (isFuture ? '00' : '');
    
    setNewPlan({...newPlan, date: d, hour: h, minute: m}); 
    if (formErrorField === 'date' || formErrorField === 'time') { setFormError(null); setFormErrorField(null); }
  }}`
);

// 2. Button onClick forceful reset
content = content.replace(
  /<Button className="w-full py-3\.5 shadow-sm" onClick=\{\(\) => setRightColumnView\('create_event'\)\}>/g,
  `<Button className="w-full py-3.5 shadow-sm" onClick={() => {
    const rId = activeRoomId || defaultRegionId;
    setNewPlan({ 
      title: '', description: '', region: rId, interest: interests[0]?.id || '', 
      date: '', hour: '', minute: '', maxAttendees: '', address: '', ageMin: '', ageMax: '', genderPreference: 'Todos', imageUrl: '', imageFile: null
    });
    setFormError(null);
    setFormErrorField(null);
    setRightColumnView('create_event');
  }}>`
);

fs.writeFileSync('src/components/layout/RightColumn.tsx', content);
console.log('Done');
