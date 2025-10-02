"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, History, Calendar } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PointTransaction {
  id: string;
  points: number;
  action: string;
  description?: string;
  createdAt: string;
}

interface PointsDisplayProps {
  userId: string;
  shopId: string;
  points?: number;
  showHistory?: boolean;
  compact?: boolean;
}

export default function PointsDisplay({
  userId,
  shopId,
  points: initialPoints,
  showHistory = false,
  compact = false,
}: PointsDisplayProps) {
  const [points, setPoints] = useState(initialPoints || 0);
  const [history, setHistory] = useState<PointTransaction[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  // Charger les points si pas fournis initialement
  useEffect(() => {
    if (initialPoints === undefined) {
      loadPoints();
    }
  }, [userId, shopId, initialPoints]);

  const loadPoints = async () => {
    if (!userId || !shopId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/points?userId=${userId}&shopId=${shopId}`);
      if (response.ok) {
        const data = await response.json();
        setPoints(data.points);
        
        if (showHistory && data.history) {
          setHistory(data.history);
          setHasLoadedHistory(true);
        }
      }
    } catch (error) {
      console.error('Error loading points:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async () => {
    if (hasLoadedHistory || !showHistory) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/points?userId=${userId}&shopId=${shopId}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
        setHasLoadedHistory(true);
      }
    } catch (error) {
      console.error('Error loading points history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'POST_CREATED':
        return 'bg-green-100 text-green-800';
      case 'COMMENT_CREATED':
        return 'bg-blue-100 text-blue-800';
      case 'REACTION_RECEIVED':
        return 'bg-purple-100 text-purple-800';
      case 'BADGE_UNLOCKED':
        return 'bg-orange-100 text-orange-800';
      case 'DAILY_LOGIN':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'POST_CREATED':
      case 'COMMENT_CREATED':
      case 'REACTION_RECEIVED':
        return <TrendingUp className="h-3 w-3" />;
      case 'DAILY_LOGIN':
        return <Calendar className="h-3 w-3" />;
      default:
        return <Coins className="h-3 w-3" />;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Coins className="h-4 w-4 text-yellow-600" />
        <span className="font-medium">{points} points</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coins className="h-5 w-5 text-yellow-600" />
          Mes Points
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-yellow-600">{points}</div>
          <p className="text-sm text-gray-600">Points accumulés</p>
        </div>

        {showHistory && (
          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={loadHistory}
                disabled={isLoading}
              >
                <History className="h-4 w-4" />
                {isHistoryOpen ? 'Masquer l\'historique' : 'Voir l\'historique'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.length > 0 ? (
                  history.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getActionColor(transaction.action)} flex items-center gap-1`}>
                          {getActionIcon(transaction.action)}
                          <span className={transaction.points >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {transaction.points >= 0 ? '+' : ''}{transaction.points}
                          </span>
                        </Badge>
                        <span className="text-xs text-gray-600">
                          {transaction.description}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucune transaction pour le moment
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}