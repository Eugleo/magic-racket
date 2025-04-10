import fs from 'fs';

function removeComments(content) {
  return content.replace(/\s+#\s+([^\\])*\\n/g, () => "");
}

const files = ['syntaxes/racket.tmLanguage.json', 'syntaxes/rhombus.tmLanguage.json'];

for (const file of files) {
  const fileContents = fs.readFileSync(file, 'utf-8');
  fs.writeFileSync(file, removeComments(fileContents));
}