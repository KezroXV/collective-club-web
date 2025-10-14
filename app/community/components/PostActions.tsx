import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type ReactionType = "LIKE" | "LOVE" | "LAUGH" | "WOW" | "APPLAUSE";

interface ReactionData {
  type: ReactionType;
  count: number;
}

interface PostActionsProps {
  totalReactions: number;
  commentsCount: number;
  showReactionDropdown: boolean;
  reactions?: ReactionData[];
  userReaction?: ReactionType | null;
  currentUser: {
    id: string;
    name: string;
    shopId?: string;
  } | null;
  onReactionClick: () => void;
  onReaction: (type: ReactionType) => void;
  onCommentsClick: () => void;
  onShare: () => void;
}

const REACTION_EMOJIS: Record<ReactionType, string> = {
  LIKE: "👍",
  LOVE: "❤️",
  LAUGH: "😂",
  WOW: "😮",
  APPLAUSE: "👏",
};

const PostActions = ({
  totalReactions,
  commentsCount,
  showReactionDropdown,
  reactions,
  userReaction,
  currentUser,
  onReactionClick,
  onReaction,
  onCommentsClick,
  onShare,
}: PostActionsProps) => {
  const { colors } = useTheme();

  return (
    <div className="flex items-center justify-between pt-4 border-t" style={{ borderTopColor: colors.Bordures }}>
      <div className="flex items-center gap-6">
        {/* Reactions with dropdown */}
        <div className="relative">
          <button
            className={`flex items-center gap-2 transition-colors ${
              userReaction
                ? "text-red-600 hover:text-red-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={onReactionClick}
          >
            <Heart
              className={`h-5 w-5 ${userReaction ? "fill-current" : ""}`}
            />
            <span className="text-sm font-medium">{totalReactions}</span>
          </button>

          {/* Dropdown des réactions */}
          {showReactionDropdown && currentUser && (
            <div className="reaction-dropdown absolute bottom-full left-0 mb-2 rounded-lg shadow-lg p-2 z-10" style={{ backgroundColor: colors.Fond, border: `1px solid ${colors.Bordures}` }}>
              <div className="flex gap-1 mb-2">
                {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
                  const isSelected = userReaction === type;
                  const reactionCount =
                    reactions?.find((r) => r.type === type)?.count || 0;
                  return (
                    <div key={type} className="flex flex-col items-center">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onReaction(type as ReactionType);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                        className={`p-2 rounded transition-colors text-lg relative ${
                          isSelected
                            ? "border-2"
                            : "hover:bg-gray-100"
                        }`}
                        style={isSelected ? {
                          backgroundColor: `${colors.Posts}15`,
                          borderColor: colors.Posts
                        } : {}}
                        title={type}
                      >
                        {emoji}
                        {isSelected && (
                          <div
                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white"
                            style={{ backgroundColor: colors.Posts }}
                          />
                        )}
                      </button>
                      {reactionCount > 0 && (
                        <span className="text-xs text-gray-500 mt-1">
                          {reactionCount}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          onClick={onCommentsClick}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-sm font-medium">{commentsCount}</span>
        </button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-gray-600 hover:text-gray-900"
        onClick={onShare}
        neutralHover={true}
      >
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PostActions;
