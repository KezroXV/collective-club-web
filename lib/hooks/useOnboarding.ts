import { useState, useEffect } from "react";
import { smartFetch } from "@/lib/smartFetch";

interface OnboardingData {
  hasLikedPost: boolean;
  hasCommentedPost: boolean;
  hasCreatedPost: boolean;
  completedAt: string | null;
}

interface OnboardingTask {
  id: string;
  label: string;
  completed: boolean;
}

export function useOnboarding(userId?: string) {
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOnboarding = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await smartFetch(`/api/onboarding`);
      if (response.ok) {
        const data = await response.json();
        setOnboarding(data);
      }
    } catch (error) {
      console.error("Error fetching onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboarding();

    // Auto-refresh toutes les 5 secondes pour détecter les changements
    const interval = setInterval(() => {
      fetchOnboarding();
    }, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  const tasks: OnboardingTask[] = onboarding
    ? [
        {
          id: "like",
          label: "Likez un post",
          completed: onboarding.hasLikedPost,
        },
        {
          id: "comment",
          label: "Commentez un post",
          completed: onboarding.hasCommentedPost,
        },
        {
          id: "create",
          label: "Faites votre premier post",
          completed: onboarding.hasCreatedPost,
        },
      ]
    : [];

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = onboarding?.completedAt !== null;

  return {
    onboarding,
    tasks,
    progress,
    isComplete,
    loading,
    refetch: fetchOnboarding,
  };
}
