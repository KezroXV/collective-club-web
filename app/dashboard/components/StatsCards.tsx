"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import Image from "next/image";

interface StatData {
  total: number;
  variation: number;
  trend: "up" | "down";
}

interface StatsData {
  posts: StatData;
  engagement: StatData;
  members: StatData;
}

interface StatCardProps {
  title: string;
  value: number;
  variation: number;
  trend: "up" | "down";
  iconSrc: string;
  isLoading?: boolean;
  borderColor?: string;
}

function StatCard({
  title,
  value,
  variation,
  trend,
  iconSrc,
  isLoading,
  borderColor = "#E5E7EB",
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // Animation du compteur au chargement
  useEffect(() => {
    if (!isLoading && value > 0) {
      const duration = 1000;
      const steps = 30;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    } else if (!isLoading) {
      setDisplayValue(value);
    }
  }, [value, isLoading]);

  if (isLoading) {
    return (
      <Card className="hover:shadow-sm animate-pulse" style={{ borderColor }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
            <HelpCircle className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
            <div className="h-6 w-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trendColor =
    trend === "up" ? "text-green-500 bg-green-50" : "text-red-500 bg-red-50";
  const trendIcon = trend === "up" ? "↑" : "↓";
  const valueColor = title === "Posts" ? "text-blue-600" : "text-gray-900";

  return (
    <Card
      className="hover:shadow-md transition-all pt-0 h-32 duration-300 hover:-translate-y-1"
      style={{ borderColor }}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-lg text-black text-semibold">{title}</p>
          <HelpCircle className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex items-center gap-2 mb-1">
          <Image
            src={iconSrc}
            alt={title}
            width={13.75}
            height={13.75}
            className="text-blue-600"
          />
          <span
            className={`text-3xl font-bold ${valueColor} transition-all duration-300`}
          >
            {displayValue.toLocaleString()}
          </span>
          {variation > 0 && (
            <span
              className={`text-xs px-2 py-1 rounded ${trendColor} transition-all duration-200`}
            >
              {trendIcon} {variation}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  shopId?: string;
  borderColor?: string;
}

export default function StatsCards({
  shopId,
  borderColor = "#E5E7EB",
}: StatsCardsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/dashboard/stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Inclure les credentials pour l'authentification
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError("Erreur lors du chargement des statistiques");

      // Fallback avec données par défaut pour éviter l'interface vide
      setStats({
        posts: { total: 0, variation: 0, trend: "up" },
        engagement: { total: 0, variation: 0, trend: "up" },
        members: { total: 0, variation: 0, trend: "up" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Rafraîchir les stats toutes les 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [shopId]);

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="hover:shadow-sm border-red-200"
          style={{ borderColor: "#FCA5A5" }}
        >
          <CardContent className="p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <StatCard
        title="Posts"
        value={stats?.posts.total || 0}
        variation={stats?.posts.variation || 0}
        trend={stats?.posts.trend || "up"}
        iconSrc="/postIcon.svg"
        isLoading={isLoading}
        borderColor={borderColor}
      />

      <StatCard
        title="Engagement"
        value={stats?.engagement.total || 0}
        variation={stats?.engagement.variation || 0}
        trend={stats?.engagement.trend || "up"}
        iconSrc="/EngagementIcon.svg"
        isLoading={isLoading}
        borderColor={borderColor}
      />

      <StatCard
        title="Membres actifs"
        value={stats?.members.total || 0}
        variation={stats?.members.variation || 0}
        trend={stats?.members.trend || "up"}
        iconSrc="/FollowIcon.svg"
        isLoading={isLoading}
        borderColor={borderColor}
      />
    </div>
  );
}
