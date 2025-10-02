import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import CommentItem from "./CommentItem";
import { useTheme } from "@/contexts/ThemeContext";

type ReactionType = "LIKE" | "LOVE" | "LAUGH" | "WOW" | "APPLAUSE";

interface ReactionData {
  type: ReactionType;
  count: number;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  createdAt: string;
  reactions?: ReactionData[];
  userReaction?: ReactionType | null;
  replies?: Comment[];
  _count?: {
    reactions: number;
    replies?: number;
  };
}

interface CommentsSectionProps {
  comments: Comment[];
  commentsCount: number;
  currentUser: {
    id: string;
    name: string;
    shopId?: string;
    role?: string;
  } | null;
  newComment: string;
  submittingComment: boolean;
  postId: string;
  postSlug?: string;
  postTitle?: string;
  onNewCommentChange: (value: string) => void;
  onSubmitComment: (e: React.FormEvent) => void;
  onCommentAdded: () => void;
  onCommentDeleted: (commentId: string) => void;
  onReactionUpdated: (commentId: string, reactions: ReactionData[], userReaction: ReactionType | null) => void;
  getInitials: (name: string) => string;
  formatRelativeDate: (dateString: string) => string;
}

const CommentsSection = ({
  comments,
  commentsCount,
  currentUser,
  newComment,
  submittingComment,
  postId,
  postSlug,
  postTitle,
  onNewCommentChange,
  onSubmitComment,
  onCommentAdded,
  onCommentDeleted,
  onReactionUpdated,
  getInitials,
  formatRelativeDate,
}: CommentsSectionProps) => {
  const { colors } = useTheme();

  return (
    <section
      className="mt-8 pt-6 border-t"
      style={{ borderTopColor: colors.Bordures }}
      itemScope
      itemType="https://schema.org/ItemList"
      aria-label="Section des commentaires"
    >
      <h3
        className="text-xl font-bold mb-6"
        style={{ color: colors.Police }}
        itemProp="name"
      >
        Commentaires ({commentsCount})
      </h3>
      <meta itemProp="numberOfItems" content={commentsCount.toString()} />

      {/* Comment Form */}
      {currentUser && (
        <div className="mb-8">
          <form
            onSubmit={onSubmitComment}
            className="bg-white rounded-2xl hover:shadow-sm p-4"
            style={{
              border: `1px solid ${colors.Bordures}`
            }}
          >
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="mb-3">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: colors.Police }}
                  >
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-gray-500">Membre</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Écrivez un commentaire..."
                    value={newComment}
                    onChange={(e) => onNewCommentChange(e.target.value)}
                    disabled={submittingComment}
                    className="bg-gray-50 focus:bg-white rounded-xl transition-colors theme-input"
                    style={{
                      borderColor: colors.Bordures,
                      color: colors.Police
                    }}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newComment.trim() || submittingComment}
                    className="rounded-xl px-4"
                    style={{
                      backgroundColor: colors.Posts,
                      color: "white"
                    }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment, index) => (
            <div
              key={comment.id}
              className="bg-white rounded-2xl hover:shadow-sm p-5 hover:shadow-md transition-shadow duration-200"
              style={{
                border: `1px solid ${colors.Bordures}`
              }}
              itemScope
              itemType="https://schema.org/ListItem"
              itemProp="itemListElement"
            >
              <meta itemProp="position" content={(index + 1).toString()} />
              <div itemProp="item">
                <CommentItem
                  comment={comment}
                  currentUser={currentUser}
                  postId={postId}
                  postSlug={postSlug}
                  postTitle={postTitle}
                  getInitials={getInitials}
                  formatRelativeDate={formatRelativeDate}
                  onCommentAdded={onCommentAdded}
                  onCommentDeleted={onCommentDeleted}
                  onReactionUpdated={onReactionUpdated}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div
              className="bg-white rounded-2xl hover:shadow-sm p-8"
              style={{
                border: `1px solid ${colors.Bordures}`
              }}
            >
              <p className="text-gray-500 text-sm">
                Aucun commentaire pour l&apos;instant. Soyez le premier à
                commenter !
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CommentsSection;
