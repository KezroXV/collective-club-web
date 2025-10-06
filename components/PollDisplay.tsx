/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Check } from "lucide-react";

interface PollOption {
  id: string;
  text: string;
  order: number;
  _count: {
    votes: number;
  };
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  _count: {
    votes: number;
  };
}

interface PollDisplayProps {
  poll: Poll;
  currentUser?: any;
  onVote?: (optionId: string) => void;
}

export default function PollDisplay({
  poll,
  currentUser,
  onVote,
}: PollDisplayProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const totalVotes = poll._count.votes;

  // Charger le vote actuel de l'utilisateur
  useEffect(() => {
    const loadCurrentVote = async () => {
      if (!currentUser) return;
      try {
        const url = `/api/polls/vote?pollId=${encodeURIComponent(
          poll.id
        )}&userId=${encodeURIComponent(currentUser.id)}`;
        const res = await fetch(url);
        if (res.ok) {
          const vote = await res.json();
          setSelectedOption(vote?.optionId ?? null);
        }
      } catch (error) {
        console.error("Error loading current vote:", error);
      }
    };
    loadCurrentVote();
  }, [poll.id, currentUser]);

  const handleVote = async (optionId: string) => {
    if (!currentUser || isVoting) return;

    setIsVoting(true);
    try {
      // Toggle off si on reclique la même option
      if (selectedOption === optionId) {
        const response = await fetch("/api/polls/vote", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pollId: poll.id, userId: currentUser.id }),
        });
        if (response.ok) {
          setSelectedOption(null);
          if (onVote) {
            onVote(optionId); // Rafraîchissement immédiat
          }
        }
      } else {
        const response = await fetch("/api/polls/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pollId: poll.id,
            optionId,
            userId: currentUser.id,
          }),
        });
        if (response.ok) {
          setSelectedOption(optionId);
          if (onVote) {
            onVote(optionId); // Rafraîchissement immédiat
          }
        }
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/10">
      <CardContent className="p-4 space-y-4">
        {/* En-tête du sondage */}
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-[13px] text-gray-900">
            {poll.question}
          </h3>
        </div>

        {/* Options du sondage */}
        <div className="space-y-2">
          {poll.options.map((option) => {
            const percentage =
              totalVotes > 0 ? (option._count.votes / totalVotes) * 100 : 0;
            const isSelected = selectedOption === option.id;

            return (
              <div key={option.id} className="relative">
                <Button
                  variant="outline"
                  className={`w-full h-auto p-3 justify-start text-left relative overflow-hidden ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => handleVote(option.id)}
                  disabled={isVoting}
                >
                  {/* Barre de progression */}
                  <div
                    className="absolute inset-0 bg-primary/20 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />

                  {/* Contenu */}
                  <div className="relative flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                      <span className="font-medium text-xs">{option.text}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{option._count.votes} votes</span>
                      <span className="font-semibold">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Stats du sondage */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-primary/30">
          <span>
            {totalVotes} vote{totalVotes !== 1 ? "s" : ""} au total
          </span>
          <span>Sondage</span>
        </div>
      </CardContent>
    </Card>
  );
}
