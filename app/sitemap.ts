import { MetadataRoute } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 🗺️ Génère le sitemap.xml dynamiquement
 * Inclut toutes les pages importantes avec les posts SEO-friendly
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    // Récupérer tous les posts publiés avec slugs
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        slug: {
          not: null
        }
      },
      select: {
        slug: true,
        updatedAt: true,
        createdAt: true,
        shop: {
          select: {
            shopDomain: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Récupérer toutes les catégories actives
    const categories = await prisma.category.findMany({
      where: {
        posts: {
          some: {
            status: 'PUBLISHED'
          }
        }
      },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Récupérer tous les shops actifs (qui ont au moins un post)
    const activeShops = await prisma.shop.findMany({
      where: {
        posts: {
          some: {
            status: 'PUBLISHED'
          }
        }
      },
      select: {
        id: true,
        shopDomain: true,
        updatedAt: true,
      }
    });

    const sitemap: MetadataRoute.Sitemap = [];

    // Pages statiques principales
    sitemap.push({
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    });

    sitemap.push({
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    });

    // Pages des posts individuels (SEO-friendly avec slugs)
    for (const post of posts) {
      if (post.slug) {
        sitemap.push({
          url: `${baseUrl}/community/posts/${post.slug}`,
          lastModified: post.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }

    // Pages des catégories
    for (const category of categories) {
      sitemap.push({
        url: `${baseUrl}/community/categories/${category.id}`,
        lastModified: category.updatedAt,
        changeFrequency: 'daily',
        priority: 0.7,
      });
    }

    // Pages d'authentification et autres pages importantes
    sitemap.push({
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    });

    sitemap.push({
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    });

    
    return sitemap;

  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Sitemap minimal en cas d'erreur
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/community`,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 0.9,
      },
    ];
  } finally {
    await prisma.$disconnect();
  }
}