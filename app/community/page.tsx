
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Plus, Search, ArrowLeft, Send, Calendar, User, Filter, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import ReactionPicker from "@/components/ReactionPicker";
import PollDisplay from "@/components/PollDisplay";
import ThemeWrapper from "@/components/ThemeWrapper";
import { useTheme } from "@/contexts/ThemeContext";
interface Post {
  id: string;
  title: string;
  content: string;
  slug?: string;
  imageUrl?: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  poll?: {
    id: string;
    question: string;
    options: Array<{
      id: string;
      text: string;
      order: number;
      _count: { votes: number };
    }>;
    _count: { votes: number };
  } | null;
  _count: {
    comments: number;
    reactions: number;
  };
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  author: {
    name: string;
    email: string;
  };
  createdAt: string;
}

function CommunityPageContent() {
  const { currentUser } = useCurrentUser();
  const { colors } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  const searchParams = useSearchParams();

  // Ancien code d'authentification retiré - maintenant géré par useCurrentUser

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts");
      if (response.ok) {
        const data = await response.json();
        const postsArray = data.posts || data; // Support nouvelle et ancienne structure
        setPosts(postsArray);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content || !currentUser) return;

    setLoading(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPost,
          authorId: currentUser.id,
        }),
      });

      if (response.ok) {
        setNewPost({ title: "", content: "" });
        setShowCreateForm(false);
        fetchPosts();
      }
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const createComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment || !selectedPost || !currentUser) return;

    try {
      const response = await fetch(`/api/posts/${selectedPost}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          authorId: currentUser.id,
        }),
      });

      if (response.ok) {
        setNewComment("");
        fetchComments(selectedPost);
        fetchPosts(); // Refresh pour mettre à jour le count
      }
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "?"
    );
  };

  const filteredAndSortedPosts = posts
    .filter((post) => {
      if (!searchQuery) return true;
      return (
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortBy === "popular") {
        const aPopularity = a._count.comments + a._count.reactions;
        const bPopularity = b._count.comments + b._count.reactions;
        return bPopularity - aPopularity;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <ThemeWrapper applyBackgroundColor={true} className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Forum Communautaire</h1>
              <p className="text-muted-foreground">
                Partagez vos idées et discutez • {posts.length} posts
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="gap-2"
            disabled={!currentUser}
          >
            <Plus className="h-4 w-4" />
            Nouveau post
          </Button>
        </div>

        {/* User Info */}
        {currentUser && (
          <Card className="mb-6 hover:shadow-sm border-0" style={{ backgroundColor: `${colors.Posts}08` }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-white font-semibold" style={{ backgroundColor: colors.Posts }}>
                      {getInitials(currentUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold" style={{ color: colors.Police }}>
                      Connecté en tant que {currentUser.name}
                    </p>
                    <p className="text-sm text-gray-600">{currentUser.email}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  Membre actif
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Post Form */}
        {showCreateForm && (
          <Card className="mb-8 hover:shadow-sm" style={{ border: `1px solid ${colors.Bordures}`, backgroundColor: colors.Fond }}>
            <CardHeader className="border-b" style={{ backgroundColor: `${colors.Fond}`, borderBottomColor: colors.Bordures }}>
              <CardTitle className="flex items-center gap-2" style={{ color: colors.Police }}>
                <Plus className="h-5 w-5" />
                Créer un nouveau post
              </CardTitle>
              <CardDescription className="text-gray-600">
                Partagez vos idées avec la communauté
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={createPost} className="space-y-4">
                <Input
                  placeholder="Titre de votre post..."
                  value={newPost.title}
                  onChange={(e) =>
                    setNewPost({ ...newPost, title: e.target.value })
                  }
                  className="theme-input"
                  style={{ borderColor: colors.Bordures, backgroundColor: colors.Fond, color: colors.Police }}
                />
                <Textarea
                  placeholder="Contenu de votre post..."
                  rows={4}
                  value={newPost.content}
                  onChange={(e) =>
                    setNewPost({ ...newPost, content: e.target.value })
                  }
                  className="theme-input resize-none"
                  style={{ borderColor: colors.Bordures, backgroundColor: colors.Fond, color: colors.Police }}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="px-6" style={{ backgroundColor: colors.Posts, color: "white" }}>
                    {loading ? "Publication..." : "Publier"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Rechercher des posts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-muted-foreground/20 focus:border-primary hover:shadow-sm" 
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === "recent" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("recent")}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                Récents
              </Button>
              <Button
                variant={sortBy === "popular" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("popular")}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Populaires
              </Button>
            </div>
          </div>
          {(searchQuery || posts.length > 0) && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {searchQuery ? (
                  `${filteredAndSortedPosts.length} résultat${filteredAndSortedPosts.length > 1 ? 's' : ''} pour "${searchQuery}"`
                ) : (
                  `${posts.length} post${posts.length > 1 ? 's' : ''} • Triés par ${sortBy === "recent" ? "date" : "popularité"}`
                )}
              </span>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="text-xs px-2 py-1 h-auto"
                >
                  Effacer
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Posts List */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card className="hover:shadow-sm border-0">
              <CardContent className="text-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-muted/50">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      Aucun post pour l&apos;instant
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      Lancez la conversation ! Soyez le premier à partager quelque chose avec la communauté.
                    </p>
                  </div>
                  {currentUser && (
                    <Button 
                      onClick={() => setShowCreateForm(true)}
                      className="mt-4 px-6"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer le premier post
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : filteredAndSortedPosts.length === 0 && searchQuery ? (
            <Card className="hover:shadow-sm border-0">
              <CardContent className="text-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-muted/50">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      Aucun résultat trouvé
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      Aucun post ne correspond à votre recherche &quot;{searchQuery}&quot;. Essayez avec d&apos;autres mots-clés.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                    className="mt-4"
                  >
                    Afficher tous les posts
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 bg-white" style={{ border: `1px solid ${colors.Bordures}` }}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground font-semibold">
                          {getInitials(post.author.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/community/posts/${post.slug || post.id}`}
                          className="group"
                        >
                          <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors cursor-pointer line-clamp-2">
                            {post.title}
                          </CardTitle>
                        </Link>
                        <CardDescription className="flex items-center gap-2">
                          <span className="font-medium">{post.author.name}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.createdAt)}
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      Nouveau
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground mb-6 line-clamp-3">{post.content}</p>

                  {post.poll && (
                    <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                      <PollDisplay
                        poll={post.poll}
                        currentUser={currentUser ?? undefined}
                        onVote={() => fetchPosts()}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-muted/50">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-foreground px-2"
                        onClick={() => {
                          setSelectedPost(
                            selectedPost === post.id ? null : post.id
                          );
                          if (selectedPost !== post.id) {
                            fetchComments(post.id);
                          }
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm font-medium">{post._count.comments}</span>
                      </Button>
                      <ReactionPicker
                        postId={post.id}
                        currentUserId={currentUser?.id || ""}
                        onReactionUpdate={fetchPosts}
                      />
                    </div>
                    <Link href={`/community/posts/${post.slug || post.id}`}>
                      <Button variant="outline" size="sm">
                        Voir le post
                      </Button>
                    </Link>
                  </div>

                  {/* Comments Section */}
                  {selectedPost === post.id && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Commentaires ({comments.length})
                        </h4>
                      </div>

                      {/* Comment Form */}
                      {currentUser && (
                        <form onSubmit={createComment} className="mb-6">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Écrivez un commentaire..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="flex-1 border-muted-foreground/20"
                            />
                            <Button type="submit" size="sm" className="px-4">
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </form>
                      )}

                      {/* Comments List */}
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-muted/30 rounded-lg p-4 border border-muted/50"
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="text-xs bg-gradient-to-r from-primary/10 to-secondary/10">
                                  {getInitials(comment.author.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-sm">
                                    {comment.author.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm leading-relaxed">{comment.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {comments.length === 0 && (
                          <div className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <div className="p-2 rounded-full bg-muted/50">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <p className="text-muted-foreground text-sm">
                                Aucun commentaire pour l&apos;instant.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </ThemeWrapper>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    }>
      <CommunityPageContent />
    </Suspense>
  );
}
