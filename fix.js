const fs = require('fs');

// PWAInstallPrompt
let pwa = fs.readFileSync('src/components/ui/PWAInstallPrompt.tsx', 'utf8');
pwa = pwa.replace('text-teal-950', 'text-white');
pwa = pwa.replace(/  useEffect\(\(\) => \{\n    const shouldShow = !\([^)]+\);\n    if \(shouldShow\) \{\n      document\.body\.style\.paddingBottom = '90px';\n    \} else \{\n      document\.body\.style\.paddingBottom = '0px';\n    \}\n    return \(\) => \{\n      document\.body\.style\.paddingBottom = '0px';\n    \};\n  \}, \[isStandalone, isDismissed, isIOS, deferredPrompt\]\);\n\n/, '');
fs.writeFileSync('src/components/ui/PWAInstallPrompt.tsx', pwa, 'utf8');

// uiStore
let uiStore = fs.readFileSync('src/store/uiStore.ts', 'utf8');
uiStore = uiStore.replace(/login: \(user\) => set\(\{ currentUser: user \}\)/, 'login: (user) => set({ currentUser: { ...user, username: user.username?.toLowerCase() } })');
uiStore = uiStore.replace(/username: e\.creator\.username/g, 'username: e.creator.username?.toLowerCase() || \'usuario\'');
uiStore = uiStore.replace(/username: ea\.users\.username/g, 'username: ea.users.username?.toLowerCase() || \'usuario\'');
uiStore = uiStore.replace(/username: senderObj\?\.username \|\| 'Usuario Desconocido'/g, 'username: senderObj?.username?.toLowerCase() || \'usuario desconocido\'');
uiStore = uiStore.replace(/username: ou\.username \|\| 'Usuario Desconocido'/g, 'username: ou.username?.toLowerCase() || \'usuario desconocido\'');
uiStore = uiStore.replace(/'Usuario Desconocido'/g, '\'usuario desconocido\'');
fs.writeFileSync('src/store/uiStore.ts', uiStore, 'utf8');

// CenterColumn
let center = fs.readFileSync('src/components/layout/CenterColumn.tsx', 'utf8');
center = center.replace(/'Usuario Desconocido'/g, '\'usuario desconocido\'');
fs.writeFileSync('src/components/layout/CenterColumn.tsx', center, 'utf8');

// LeftColumn
let left = fs.readFileSync('src/components/layout/LeftColumn.tsx', 'utf8');
left = left.replace(/'Usuario Desconocido'/g, '\'usuario desconocido\'');
fs.writeFileSync('src/components/layout/LeftColumn.tsx', left, 'utf8');

