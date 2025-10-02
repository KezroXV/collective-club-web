"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricsCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: "positive" | "negative";
  icon?: LucideIcon;
}

export default function MetricsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
}: MetricsCardProps) {
  return (
    <Card className="border-chart-4">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{value}</span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  changeType === "positive"
                    ? "text-green-600 bg-green-50"
                    : "text-red-600 bg-red-50"
                }`}
              >
                {changeType === "positive" ? "↑" : "↓"} {change}
              </span>
            </div>
          </div>
          {Icon && (
            <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
