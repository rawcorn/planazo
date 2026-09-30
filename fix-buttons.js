const fs = require('fs');
let content = fs.readFileSync('src/components/layout/RightColumn.tsx', 'utf8');

// 3. ArrowLeft button
content = content.replace(
  /<button onClick=\{resetRightColumn\} className=\"p-1\.5 -ml-1\.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors\">\s*<ArrowLeft className=\"h-4 w-4\" \/>\s*<\/button>/g,
  `<button onClick={() => {
    const rId = activeRoomId || defaultRegionId;
    setNewPlan({ 
      title: '', description: '', region: rId, interest: interests[0]?.id || '', 
      date: '', hour: '', minute: '', maxAttendees: '', address: '', ageMin: '', ageMax: '', genderPreference: 'Todos', imageUrl: '', imageFile: null
    });
    setFormError(null);
    setFormErrorField(null);
    resetRightColumn();
  }} className="p-1.5 -ml-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
    <ArrowLeft className="h-4 w-4" />
  </button>`
);

// 4. X button
content = content.replace(
  /<button onClick=\{resetRightColumn\} className=\{\`p-1\.5 rounded-lg transition-colors \$\{\(activeView === 'create_event' \|\| activeView === 'edit_event' \|\| activeView === 'edit_profile'\) \? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'\} \$\{activeView === 'profile' \? 'hidden lg:flex' : ''\}\`\}>\s*<X className=\"h-5 w-5\" \/>\s*<\/button>/g,
  `<button onClick={() => {
    if (activeView === 'create_event') {
      const rId = activeRoomId || defaultRegionId;
      setNewPlan({ 
        title: '', description: '', region: rId, interest: interests[0]?.id || '', 
        date: '', hour: '', minute: '', maxAttendees: '', address: '', ageMin: '', ageMax: '', genderPreference: 'Todos', imageUrl: '', imageFile: null
      });
      setFormError(null);
      setFormErrorField(null);
    }
    resetRightColumn();
  }} className={\`p-1.5 rounded-lg transition-colors \${(activeView === 'create_event' || activeView === 'edit_event' || activeView === 'edit_profile') ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'} \${activeView === 'profile' ? 'hidden lg:flex' : ''}\`}>
    <X className="h-5 w-5" />
  </button>`
);

fs.writeFileSync('src/components/layout/RightColumn.tsx', content);
console.log('Done');
