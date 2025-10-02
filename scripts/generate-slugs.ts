/**
 * 🔍 Migration Script: Generate SEO Slugs
 * Génère des slugs SEO pour tous les posts existants
 * 
 * Usage: tsx scripts/generate-slugs.ts
 */

import { PrismaClient } from '@prisma/client';
import { generateSlug } from '../lib/seo';

const prisma = new PrismaClient();

interface PostForSlug {
  id: string;
  title: string;
  shopId: string;
  slug: string | null;
}

async function generateSlugs() {
  console.log('🚀 Starting slug generation for existing posts...');
  
  try {
    // Récupérer tous les posts sans slug
    const postsWithoutSlug = await prisma.post.findMany({
      where: {
        slug: null
      },
      select: {
        id: true,
        title: true,
        shopId: true,
        slug: true
      },
      orderBy: {
        createdAt: 'asc' // Plus anciens en premier
      }
    });

    console.log(`📊 Found ${postsWithoutSlug.length} posts without slugs`);

    if (postsWithoutSlug.length === 0) {
      console.log('✅ All posts already have slugs!');
      return;
    }

    // Grouper par shopId pour isolation multi-tenant
    const postsByShop = postsWithoutSlug.reduce((acc, post) => {
      if (!acc[post.shopId]) {
        acc[post.shopId] = [];
      }
      acc[post.shopId].push(post);
      return acc;
    }, {} as Record<string, PostForSlug[]>);

    let totalUpdated = 0;

    // Traiter chaque boutique séparément
    for (const [shopId, posts] of Object.entries(postsByShop)) {
      console.log(`\n🏪 Processing shop ${shopId} (${posts.length} posts)...`);
      
      // Récupérer tous les slugs existants pour cette boutique
      const existingSlugs = await prisma.post.findMany({
        where: {
          shopId,
          slug: { not: null }
        },
        select: { slug: true }
      });

      const existingSlugSet = new Set(
        existingSlugs.map(p => p.slug).filter(Boolean) as string[]
      );

      // Générer slugs uniques pour chaque post
      for (const post of posts) {
        try {
          let slug = generateSlug(post.title);
          
          // Si le slug est vide, utiliser l'ID du post
          if (!slug) {
            slug = `post-${post.id.slice(-8)}`;
            console.log(`⚠️  Empty slug for "${post.title}", using fallback: ${slug}`);
          }
          
          // Assurer l'unicité du slug
          let uniqueSlug = slug;
          let counter = 1;
          
          while (existingSlugSet.has(uniqueSlug)) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
          }
          
          // Mettre à jour le post
          await prisma.post.update({
            where: { id: post.id },
            data: { slug: uniqueSlug }
          });
          
          // Ajouter à notre set pour éviter les doublons
          existingSlugSet.add(uniqueSlug);
          totalUpdated++;
          
          console.log(`  ✅ "${post.title}" → "${uniqueSlug}"`);
          
        } catch (error) {
          console.error(`  ❌ Error updating post ${post.id}:`, error);
        }
      }
    }

    console.log(`\n🎉 Migration completed! Updated ${totalUpdated} posts with SEO slugs`);
    
    // Vérification finale
    const remainingWithoutSlug = await prisma.post.count({
      where: { slug: null }
    });
    
    if (remainingWithoutSlug > 0) {
      console.warn(`⚠️  Warning: ${remainingWithoutSlug} posts still without slugs`);
    } else {
      console.log('✅ All posts now have SEO slugs!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Fonction pour régénérer tous les slugs (même ceux existants)
 * Usage: tsx scripts/generate-slugs.ts --force
 */
async function regenerateAllSlugs() {
  console.log('🔄 Regenerating ALL slugs (including existing ones)...');
  
  try {
    const allPosts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        shopId: true,
        slug: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Found ${allPosts.length} total posts`);

    const postsByShop = allPosts.reduce((acc, post) => {
      if (!acc[post.shopId]) {
        acc[post.shopId] = [];
      }
      acc[post.shopId].push(post);
      return acc;
    }, {} as Record<string, PostForSlug[]>);

    let totalRegenerated = 0;

    for (const [shopId, posts] of Object.entries(postsByShop)) {
      console.log(`\n🏪 Regenerating shop ${shopId} (${posts.length} posts)...`);
      
      const usedSlugs = new Set<string>();

      for (const post of posts) {
        try {
          let slug = generateSlug(post.title);
          
          if (!slug) {
            slug = `post-${post.id.slice(-8)}`;
          }
          
          let uniqueSlug = slug;
          let counter = 1;
          
          while (usedSlugs.has(uniqueSlug)) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
          }
          
          await prisma.post.update({
            where: { id: post.id },
            data: { slug: uniqueSlug }
          });
          
          usedSlugs.add(uniqueSlug);
          totalRegenerated++;
          
          const changeIndicator = post.slug !== uniqueSlug ? '🔄' : '✅';
          console.log(`  ${changeIndicator} "${post.title}" → "${uniqueSlug}"`);
          
        } catch (error) {
          console.error(`  ❌ Error updating post ${post.id}:`, error);
        }
      }
    }

    console.log(`\n🎉 Regeneration completed! Processed ${totalRegenerated} posts`);

  } catch (error) {
    console.error('❌ Regeneration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Script principal
async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  
  console.log('🔍 CollectiveClub SEO Slug Migration');
  console.log('=====================================');
  
  if (force) {
    await regenerateAllSlugs();
  } else {
    await generateSlugs();
  }
  
  console.log('\n💡 Tips:');
  console.log('  - Run with --force to regenerate ALL slugs');
  console.log('  - Remember to run "npx prisma generate" after schema changes');
  console.log('  - Test your new SEO URLs after migration');
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});