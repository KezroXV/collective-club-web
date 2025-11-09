import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * 🎨 Génération dynamique d'images Open Graph pour les posts
 * Utilisé lors du partage sur réseaux sociaux (Twitter, LinkedIn, Facebook, Discord)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Paramètres depuis l'URL
    const title = searchParams.get('title') || 'Post sans titre';
    const shopName = searchParams.get('shopName') || 'CollectiveClub';
    const category = searchParams.get('category');
    const author = searchParams.get('author');
    const logoUrl = searchParams.get('logoUrl');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#0f172a',
            padding: '60px',
            fontFamily: 'system-ui, sans-serif',
            position: 'relative',
          }}
        >
          {/* Fond avec gradient */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              opacity: 0.9,
            }}
          />

          {/* Pattern de fond */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 20px,
                rgba(255, 255, 255, 0.02) 20px,
                rgba(255, 255, 255, 0.02) 40px
              )`,
            }}
          />

          {/* Contenu */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '20px',
              position: 'relative',
              zIndex: 10,
              flex: 1,
              justifyContent: 'center',
              width: '100%',
            }}
          >
            {/* Logo ou Avatar */}
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                width={80}
                height={80}
                style={{
                  borderRadius: '16px',
                  border: '3px solid rgba(255, 255, 255, 0.1)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: 'white',
                  border: '3px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {shopName.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Catégorie */}
            {category && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                <span
                  style={{
                    fontSize: '20px',
                    color: '#60a5fa',
                    fontWeight: '600',
                  }}
                >
                  {category}
                </span>
              </div>
            )}

            {/* Titre du post */}
            <h1
              style={{
                fontSize: title.length > 60 ? '48px' : '60px',
                fontWeight: 'bold',
                color: 'white',
                lineHeight: 1.2,
                margin: 0,
                maxWidth: '90%',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </h1>

            {/* Auteur */}
            {author && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '10px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  {author.charAt(0).toUpperCase()}
                </div>
                <span
                  style={{
                    fontSize: '24px',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  {author}
                </span>
              </div>
            )}
          </div>

          {/* Footer avec nom du shop */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              position: 'relative',
              zIndex: 10,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '30px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <span
                style={{
                  fontSize: '28px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: '600',
                }}
              >
                {shopName}
              </span>
              <span
                style={{
                  fontSize: '24px',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              >
                •
              </span>
              <span
                style={{
                  fontSize: '24px',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                Community Forum
              </span>
            </div>

            {/* Badge CollectiveClub */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <span
                style={{
                  fontSize: '20px',
                  color: '#a78bfa',
                  fontWeight: '600',
                }}
              >
                CollectiveClub
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);

    // Fallback simple en cas d'erreur
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            color: 'white',
            fontSize: '40px',
            fontWeight: 'bold',
          }}
        >
          CollectiveClub Community
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
