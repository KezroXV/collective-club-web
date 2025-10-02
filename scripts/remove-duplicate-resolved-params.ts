#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

const files = [
  'app/api/comments/[commentId]/reactions/route.ts',
  'app/api/users/[userId]/follow/route.ts',
  'app/api/users/[userId]/followers/route.ts',
  'app/api/users/[userId]/following/route.ts',
];

for (const file of files) {
  const fullPath = path.join(process.cwd(), file);
  let content = fs.readFileSync(fullPath, 'utf-8');

  // Remove duplicate lines
  const lines = content.split('\n');
  const uniqueLines: string[] = [];
  let previousLine = '';

  for (const line of lines) {
    if (line.trim() === 'const resolvedParams = await params;' && previousLine.trim() === 'const resolvedParams = await params;') {
      // Skip duplicate
      continue;
    }
    uniqueLines.push(line);
    previousLine = line;
  }

  fs.writeFileSync(fullPath, uniqueLines.join('\n'), 'utf-8');
  console.log(`✅ Fixed ${file}`);
}

console.log('\n✨ Terminé!');
