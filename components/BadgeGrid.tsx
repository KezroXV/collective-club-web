"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Coins, Lock, CheckCircle, Star } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface BadgeData {
  id: string;
  name: string;
  imageUrl: string;
  requiredPoints: number;
  description?: string;
  unlocked: boolean;
  canUnlock: boolean;
  unlockedAt?: string;
}

interface BadgeGridProps {
  userId: string;
  shopId: string;
  userPoints: number;
  onPointsChange?: (newPoints: number) => void;
  compact?: boolean;
}

export default function BadgeGrid({
  userId,
  shopId,
  userPoints: initialUserPoints,
  onPointsChange,
  compact = false,
}: BadgeGridProps) {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [userPoints, setUserPoints] = useState(initialUserPoints);
  const [isLoading, setIsLoading] = useState(false);
  const [unlockingBadgeId, setUnlockingBadgeId] = useState<string | null>(null);

  useEffect(() => {
    loadBadges();
  }, [userId, shopId]);

  useEffect(() => {
    setUserPoints(initialUserPoints);
  }, [initialUserPoints]);

  const loadBadges = async () => {
    if (!userId || !shopId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/badges/points?userId=${userId}&shopId=${shopId}`);
      if (response.ok) {
        const data = await response.json();
        setBadges(data.badges || []);
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const unlockBadge = async (badgeId: string, requiredPoints: number) => {
    if (unlockingBadgeId || userPoints < requiredPoints) return;

    setUnlockingBadgeId(badgeId);
    try {
      const response = await fetch('/api/badges/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unlock',
          userId,
          shopId,
          badgeId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Mettre à jour les badges
        setBadges(prev => prev.map(badge => 
          badge.id === badgeId 
            ? { ...badge, unlocked: true, canUnlock: false, unlockedAt: data.unlockedAt }
            : badge
        ));

        // Mettre à jour les points
        const newPoints = userPoints - requiredPoints;
        setUserPoints(newPoints);
        onPointsChange?.(newPoints);

        toast.success(`Badge "${data.badge.name}" débloqué !`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lors du déblocage du badge');
      }
    } catch (error) {
      console.error('Error unlocking badge:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setUnlockingBadgeId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getProgressPercentage = (required: number) => {
    return Math.min((userPoints / required) * 100, 100);
  };

  if (compact) {
    const unlockedBadges = badges.filter(b => b.unlocked);
    return (
      <div className="flex flex-wrap gap-1">
        {unlockedBadges.slice(0, 4).map((badge) => (
          <div key={badge.id} className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
              <Star className="h-4 w-4 text-white" />
            </div>
          </div>
        ))}
        {unlockedBadges.length > 4 && (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
            +{unlockedBadges.length - 4}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-600" />
          Badges
          <Badge variant="secondary" className="ml-auto">
            {badges.filter(b => b.unlocked).length}/{badges.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div key={badge.id} className="text-center">
                <div className={`
                  relative aspect-square rounded-lg p-3 mb-2 transition-all
                  ${badge.unlocked 
                    ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300' 
                    : badge.canUnlock
                    ? 'bg-blue-50 border-2 border-blue-200 hover:border-blue-300 cursor-pointer'
                    : 'bg-gray-50 border border-chart-4'
                  }
                `}>
                  
                  {/* Badge Image/Icon */}
                  <div className="w-full h-full flex items-center justify-center">
                    {badge.imageUrl ? (
                      <Image
                        src={badge.imageUrl}
                        alt={badge.name}
                        width={48}
                        height={48}
                        className={`max-w-full max-h-full object-contain ${!badge.unlocked ? 'grayscale opacity-50' : ''}`}
                      />
                    ) : (
                      <Star className={`h-12 w-12 ${
                        badge.unlocked ? 'text-yellow-500' : 'text-gray-400'
                      }`} />
                    )}
                  </div>

                  {/* Status Icons */}
                  <div className="absolute top-1 right-1">
                    {badge.unlocked ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : badge.canUnlock ? (
                      <div className="bg-blue-500 rounded-full p-1">
                        <Coins className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <Lock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Badge Info */}
                <h3 className={`font-medium text-sm mb-1 ${
                  badge.unlocked ? 'text-yellow-800' : 'text-gray-700'
                }`}>
                  {badge.name}
                </h3>

                {badge.unlocked ? (
                  <p className="text-xs text-green-600">
                    Débloqué le {formatDate(badge.unlockedAt!)}
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Coins className="h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-600">
                        {badge.requiredPoints} points
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <Progress 
                        value={getProgressPercentage(badge.requiredPoints)} 
                        className="h-1"
                      />
                    </div>

                    {/* Unlock Button */}
                    {badge.canUnlock ? (
                      <Button
                        size="sm"
                        onClick={() => unlockBadge(badge.id, badge.requiredPoints)}
                        disabled={unlockingBadgeId === badge.id}
                        className="w-full text-xs"
                      >
                        {unlockingBadgeId === badge.id ? 'Déblocage...' : 'Débloquer'}
                      </Button>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {userPoints}/{badge.requiredPoints}
                      </p>
                    )}
                  </>
                )}

                {badge.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {badge.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {badges.length === 0 && !isLoading && (
          <p className="text-center text-gray-500 py-8">
            Aucun badge disponible pour le moment.
          </p>
        )}
      </CardContent>
    </Card>
  );
}