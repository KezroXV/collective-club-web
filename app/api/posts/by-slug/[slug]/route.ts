/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";

const prisma = new PrismaClient();

// GET /api/posts/by-slug/[slug] - Récupérer un post par son slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    // Récupérer le post avec toutes ses relations
    // Essayer d'abord par slug, puis par ID si pas trouvé
    let post = await prisma.post.findFirst({
      where: {
        slug,
        shopId, // ✅ ISOLATION: Seulement les posts de cette boutique
        status: 'PUBLISHED'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            role: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        shop: {
          select: {
            id: true,
            shopName: true,
            shopDomain: true,
          },
        },
        comments: {
          where: {
            parentId: null // Seulement les commentaires principaux
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            reactions: {
              where: {
                postId: null // Seulement les réactions de commentaires
              },
              select: {
                type: true,
                userId: true
              }
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
                reactions: {
                  where: {
                    postId: null // Seulement les réactions de commentaires
                  },
                  select: {
                    type: true,
                    userId: true
                  }
                },
                replies: {
                  include: {
                    author: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                      },
                    },
                    reactions: {
                      where: {
                        postId: null
                      },
                      select: {
                        type: true,
                        userId: true
                      }
                    },
                    replies: {
                      include: {
                        author: {
                          select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                          },
                        },
                        reactions: {
                          where: {
                            postId: null
                          },
                          select: {
                            type: true,
                            userId: true
                          }
                        },
                        replies: {
                          include: {
                            author: {
                              select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                              },
                            },
                            reactions: {
                              where: {
                                postId: null
                              },
                              select: {
                                type: true,
                                userId: true
                              }
                            },
                            replies: {
                              include: {
                                author: {
                                  select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    image: true,
                                  },
                                },
                                reactions: {
                                  where: {
                                    postId: null
                                  },
                                  select: {
                                    type: true,
                                    userId: true
                                  }
                                },
                                _count: {
                                  select: { reactions: true },
                                },
                              }
                            },
                            _count: {
                              select: { reactions: true },
                            },
                          }
                        },
                        _count: {
                          select: { reactions: true },
                        },
                      }
                    },
                    _count: {
                      select: { reactions: true },
                    },
                  }
                },
                _count: {
                  select: { reactions: true },
                },
              },
            },
            _count: {
              select: { reactions: true, replies: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        reactions: true,
        poll: {
          include: {
            options: {
              include: {
                _count: {
                  select: { votes: true },
                },
              },
              orderBy: { order: "asc" },
            },
            _count: {
              select: { votes: true },
            },
          },
        },
        _count: {
          select: { comments: true, reactions: true },
        },
      },
    });

    // Si pas trouvé par slug, essayer par ID
    if (!post) {
      post = await prisma.post.findFirst({
        where: {
          id: slug, // Utiliser slug comme ID
          shopId, // ✅ ISOLATION: Seulement les posts de cette boutique
          status: 'PUBLISHED'
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              createdAt: true,
              role: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          shop: {
            select: {
              id: true,
              shopName: true,
              shopDomain: true,
            },
          },
          comments: {
            where: {
              parentId: null // Seulement les commentaires principaux
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
              reactions: {
                where: {
                  postId: null // Seulement les réactions de commentaires
                },
                select: {
                  type: true,
                  userId: true
                }
              },
              replies: {
                include: {
                  author: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
                  reactions: {
                    where: {
                      postId: null // Seulement les réactions de commentaires
                    },
                    select: {
                      type: true,
                      userId: true
                    }
                  },
                  replies: {
                    include: {
                      author: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                          image: true,
                        },
                      },
                      reactions: {
                        where: {
                          postId: null
                        },
                        select: {
                          type: true,
                          userId: true
                        }
                      },
                      replies: {
                        include: {
                          author: {
                            select: {
                              id: true,
                              name: true,
                              email: true,
                              image: true,
                            },
                          },
                          reactions: {
                            where: {
                              postId: null
                            },
                            select: {
                              type: true,
                              userId: true
                            }
                          },
                          replies: {
                            include: {
                              author: {
                                select: {
                                  id: true,
                                  name: true,
                                  email: true,
                                  image: true,
                                },
                              },
                              reactions: {
                                where: {
                                  postId: null
                                },
                                select: {
                                  type: true,
                                  userId: true
                                }
                              },
                              replies: {
                                include: {
                                  author: {
                                    select: {
                                      id: true,
                                      name: true,
                                      email: true,
                                      image: true,
                                    },
                                  },
                                  reactions: {
                                    where: {
                                      postId: null
                                    },
                                    select: {
                                      type: true,
                                      userId: true
                                    }
                                  },
                                  _count: {
                                    select: { reactions: true },
                                  },
                                }
                              },
                              _count: {
                                select: { reactions: true },
                              },
                            }
                          },
                          _count: {
                            select: { reactions: true },
                          },
                        }
                      },
                      _count: {
                        select: { reactions: true },
                      },
                    }
                  },
                  _count: {
                    select: { reactions: true },
                  },
                },
              },
              _count: {
                select: { reactions: true, replies: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          reactions: true,
          poll: {
            include: {
              options: {
                include: {
                  _count: {
                    select: { votes: true },
                  },
                },
                orderBy: { order: "asc" },
              },
              _count: {
                select: { votes: true },
              },
            },
          },
          _count: {
            select: { comments: true, reactions: true },
          },
        },
      });
    }

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Récupérer la réaction de l'utilisateur actuel si connecté
    let userReaction = null;
    if (userId) {
      const reaction = await prisma.reaction.findFirst({
        where: {
          postId: post.id,
          userId,
          shopId, // ✅ ISOLATION
        },
      });
      userReaction = reaction?.type || null;
    }

    // Récupérer les posts récents de l'auteur
    const authorRecentPosts = await prisma.post.findMany({
      where: {
        authorId: post.authorId,
        shopId, // ✅ ISOLATION
        status: 'PUBLISHED',
        id: { not: post.id }, // Exclure le post actuel
      },
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        _count: {
          select: { comments: true, reactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Récupérer les commentaires récents de l'auteur
    const authorRecentComments = await prisma.comment.findMany({
      where: {
        authorId: post.authorId,
        post: {
          shopId, // ✅ ISOLATION
          status: 'PUBLISHED',
        },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        _count: {
          select: { reactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Agréger les réactions par type
    const reactionsMap = post.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.type]) {
        acc[reaction.type] = 0;
      }
      acc[reaction.type]++;
      return acc;
    }, {} as Record<string, number>);

    const reactionsData = Object.entries(reactionsMap).map(([type, count]) => ({
      type,
      count,
    }));

    // Traiter les réactions des commentaires de manière récursive
    const processCommentsReactions = (comments: any[]): any[] => {
      return comments.map((comment: any) => {
        // Grouper les réactions du commentaire
        const commentReactionsGrouped = comment.reactions?.reduce((acc: any, reaction: any) => {
          const existingType = acc.find((r: any) => r.type === reaction.type);
          if (existingType) {
            existingType.count += 1;
          } else {
            acc.push({ type: reaction.type, count: 1 });
          }
          return acc;
        }, []) || [];

        // Trouver la réaction de l'utilisateur pour ce commentaire
        const commentUserReaction = userId
          ? comment.reactions?.find((r: any) => r.userId === userId)?.type
          : null;

        // Traiter récursivement toutes les réponses
        const processedReplies = comment.replies ? processCommentsReactions(comment.replies) : [];

        return {
          ...comment,
          reactions: commentReactionsGrouped,
          userReaction: commentUserReaction,
          replies: processedReplies
        };
      });
    };

    const responseData = {
      post: {
        ...post,
        reactions: reactionsData,
        userReaction,
        comments: processCommentsReactions(post.comments || [])
      },
      authorRecentPosts,
      authorRecentComments,
    };

    return NextResponse.json(responseData, {
      headers: {
        // Cache pendant 5 minutes pour améliorer les performances SEO
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        // Headers SEO
        'X-Robots-Tag': 'index, follow',
      },
    });

  } catch (error) {
    console.error("Error fetching post by slug:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}