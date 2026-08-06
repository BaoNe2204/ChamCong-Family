const fs = require('fs');
const files = [
  'src/pages/EmployeeView.jsx',
  'src/pages/EmployeeRequests.jsx',
  'src/pages/EmployeeProfile.jsx',
  'src/pages/EmployeeHistory.jsx',
  'src/pages/EmployeeNotifications.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Backgrounds
  content = content.replace(/bg-white(?!\/| dark)/g, 'bg-white dark:bg-slate-800');
  content = content.replace(/bg-white\/60(?! dark)/g, 'bg-white/60 dark:bg-slate-800/60');
  content = content.replace(/bg-white\/70(?! dark)/g, 'bg-white/70 dark:bg-slate-800/70');
  content = content.replace(/bg-slate-50(?!\/| dark)/g, 'bg-slate-50 dark:bg-slate-900');
  content = content.replace(/bg-slate-100(?!\/| dark)/g, 'bg-slate-100 dark:bg-slate-800');
  
  // Texts
  content = content.replace(/text-slate-800(?! dark)/g, 'text-slate-800 dark:text-white');
  content = content.replace(/text-slate-700(?! dark)/g, 'text-slate-700 dark:text-slate-200');
  content = content.replace(/text-slate-600(?! dark)/g, 'text-slate-600 dark:text-slate-300');
  content = content.replace(/text-slate-500(?! dark)/g, 'text-slate-500 dark:text-slate-400');
  
  // Borders
  content = content.replace(/border-slate-200(?! dark)/g, 'border-slate-200 dark:border-white/10');
  content = content.replace(/border-slate-100(?! dark)/g, 'border-slate-100 dark:border-white/5');
  content = content.replace(/border-white\/50(?! dark)/g, 'border-white/50 dark:border-white/10');
  content = content.replace(/border-white\/40(?! dark)/g, 'border-white/40 dark:border-white/5');

  // Shadows
  content = content.replace(/shadow-slate-200\/50(?! dark)/g, 'shadow-slate-200/50 dark:shadow-none');
  
  fs.writeFileSync(file, content, 'utf8');
});
console.log('Done replacing colors for dark mode.');
