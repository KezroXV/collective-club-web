#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

const apiDir = path.join(process.cwd(), 'app', 'api');

// Fichiers qui ont des params dynamiques (contiennent [])
const filesWithParams = [
  'app/api/auth/[...nextauth]/route.ts',
  'app/api/badges/[badgeId]/route.ts',
  'app/api/categories/[categoryId]/route.ts',
  'app/api/comments/[commentId]/reactions/route.ts',
  'app/api/comments/[commentId]/route.ts',
  'app/api/posts/by-slug/[slug]/route.ts',
  'app/api/posts/[postId]/comments/route.ts',
  'app/api/posts/[postId]/pin/route.ts',
  'app/api/posts/[postId]/reactions/route.ts',
  'app/api/posts/[postId]/route.ts',
  'app/api/roles/[roleId]/route.ts',
  'app/api/users/[userId]/ban/route.ts',
  'app/api/users/[userId]/follow/route.ts',
  'app/api/users/[userId]/followers/count/route.ts',
  'app/api/users/[userId]/followers/route.ts',
  'app/api/users/[userId]/followers/status/route.ts',
  'app/api/users/[userId]/following/route.ts',
  'app/api/users/[userId]/role/route.ts',
  'app/api/users/[userId]/role-assignment/route.ts',
  'app/api/users/[userId]/route.ts',
];

function fixFile(filePath: string) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Fichier non trouvé: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;

  // Pattern 1: interface RouteParams avec params non-Promise
  const interfacePattern = /interface\s+RouteParams\s*\{[^}]*params:\s*\{/g;
  if (interfacePattern.test(content)) {
    content = content.replace(
      /interface\s+RouteParams\s*\{\s*params:\s*\{/g,
      'interface RouteParams {\n  params: Promise<{'
    );
    // Fix closing brace
    content = content.replace(
      /(interface RouteParams \{\s*params: Promise<\{[^}]*\}\s*);/g,
      '$1>;'
    );
    modified = true;
    console.log(`  ✓ Fixed interface in ${filePath}`);
  }

  // Pattern 2: Trouver toutes les fonctions qui utilisent { params }: RouteParams
  // et ajouter await params au début
  const functionPattern = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\([^)]*\{\s*params\s*\}:\s*RouteParams\s*\)\s*\{/g;

  if (functionPattern.test(content)) {
    content = content.replace(
      /(export\s+async\s+function\s+(?:GET|POST|PUT|PATCH|DELETE)\s*\([^)]*\{\s*params\s*\}:\s*RouteParams\s*\)\s*\{\s*(?:\/\/[^\n]*\n\s*)*try\s*\{\s*)/g,
      '$1const resolvedParams = await params;\n    '
    );

    // Remplacer toutes les utilisations de params. par resolvedParams.
    content = content.replace(/params\.(\w+)/g, 'resolvedParams.$1');

    // Remplacer const { x } = params; par const { x } = resolvedParams;
    content = content.replace(/const\s*\{([^}]+)\}\s*=\s*params;/g, 'const {$1} = resolvedParams;');

    modified = true;
    console.log(`  ✓ Added await params in ${filePath}`);
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ ${filePath}`);
  } else {
    console.log(`⏭️  ${filePath} (pas de changement nécessaire)`);
  }
}

console.log('🔧 Correction des params Promise dans les routes API...\n');

for (const file of filesWithParams) {
  fixFile(file);
}

console.log('\n✨ Terminé!');
