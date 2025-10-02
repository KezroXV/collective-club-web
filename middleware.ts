import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from "next-auth/middleware"

// Instance Prisma pour le middleware
const prisma = new PrismaClient();

export default withAuth(
  async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
  
  // 🔄 REDIRECTIONS SEO - Anciennes URLs vers nouvelles
  
  // 1. Redirection /community/[postId] vers /community/posts/[slug]
  const oldPostMatch = pathname.match(/^\/community\/([a-zA-Z0-9_-]+)$/);
  
  if (oldPostMatch) {
    const postId = oldPostMatch[1];
    
    try {
      // Récupérer le slug du post par son ID
      const post = await prisma.post.findUnique({
        where: { 
          id: postId,
          status: 'PUBLISHED'
        },
        select: { 
          slug: true,
          id: true
        }
      });

      if (post && post.slug) {
        // Redirection 301 vers la nouvelle URL avec slug
        const newUrl = new URL(`/community/posts/${post.slug}`, request.url);
        
        // Conserver les query parameters s'il y en a
        if (request.nextUrl.search) {
          newUrl.search = request.nextUrl.search;
        }

        
        return NextResponse.redirect(newUrl, { status: 301 });
      }
    } catch (error) {
      console.error('Error in post redirect middleware:', error);
    }
  }

  // 2. Redirection /community?postId=[id] vers /community/posts/[slug]
  const postIdParam = request.nextUrl.searchParams.get('postId');
  if (pathname === '/community' && postIdParam) {
    try {
      const post = await prisma.post.findUnique({
        where: { 
          id: postIdParam,
          status: 'PUBLISHED'
        },
        select: { 
          slug: true,
          id: true
        }
      });

      if (post && post.slug) {
        const newUrl = new URL(`/community/posts/${post.slug}`, request.url);
        
        // Supprimer le paramètre postId et conserver les autres
        const searchParams = new URLSearchParams(request.nextUrl.searchParams);
        searchParams.delete('postId');
        
        if (searchParams.toString()) {
          newUrl.search = searchParams.toString();
        }

        
        return NextResponse.redirect(newUrl, { status: 301 });
      }
    } catch (error) {
      console.error('Error in query redirect middleware:', error);
    }
  }

  // 🏪 GESTION SHOP (logique existante)
  const response = NextResponse.next();
  
  // Vérifier si on a un paramètre shop dans l'URL
  const shopParam = request.nextUrl.searchParams.get('shop');
  
  if (shopParam) {
    // Définir un cookie avec le shopDomain pour les futures requêtes
    response.cookies.set('shopDomain', shopParam, {
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      httpOnly: false, // Accessible côté client aussi
      sameSite: 'lax',
      path: '/'
    });
  }
  
  return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Routes publiques
        const publicRoutes = ['/auth/signin', '/auth/error', '/community'];
        if (publicRoutes.includes(pathname) || pathname.startsWith('/community/posts/')) {
          return true;
        }
        
        // Routes protégées nécessitent une authentification
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/admin')) {
          return !!token;
        }
        
        // Routes API nécessitent une authentification
        if (pathname.startsWith('/api/')) {
          return !!token;
        }
        
        return true;
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes sauf auth) 
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sitemap.xml, robots.txt (SEO files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    // Inclure spécifiquement les routes d'auth pour capturer le shop param
    '/api/auth/(.*)',
  ],
};