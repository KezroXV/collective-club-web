"use client";

import { useTheme } from "@/contexts/ThemeContext";

interface PostCardSkeletonProps {
  isLast?: boolean;
}

export default function PostCardSkeleton({
  isLast = false,
}: PostCardSkeletonProps) {
  const { colors } = useTheme();

  return (
    <div
      className="pb-3 sm:pb-8 animate-pulse"
      style={{
        ...(!isLast && {
          borderBottom: `1px solid ${colors.Bordures}`,
        }),
      }}
    >
      <div className="pt-3 sm:pt-6">
        {/* Author info skeleton */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 sm:h-9 sm:w-9 bg-gray-200 rounded-full flex-shrink-0"></div>
            <div className="flex flex-col gap-1">
              <div className="h-2.5 sm:h-3 bg-gray-200 rounded-md w-20 sm:w-24"></div>
              <div className="h-2 sm:h-2.5 bg-gray-200 rounded-md w-12 sm:w-16"></div>
            </div>
          </div>
          {/* Badge skeleton */}
          <div className="h-5 w-16 sm:w-20 bg-gray-200 rounded-full"></div>
        </div>

        {/* Title skeleton */}
        <div className="mb-2 sm:mb-3">
          <div className="h-3.5 sm:h-4 bg-gray-200 rounded-md w-3/4 mb-1.5 sm:mb-2"></div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
          <div className="h-2.5 sm:h-3 bg-gray-200 rounded-md w-full"></div>
          <div className="h-2.5 sm:h-3 bg-gray-200 rounded-md w-5/6"></div>
        </div>

        {/* Image skeleton (50% chance) */}
        {Math.random() > 0.5 && (
          <div className="mb-4 sm:mb-6">
            <div
              className="rounded-2xl bg-gray-200 h-48 sm:h-64 w-full"
              style={{ border: `1px solid ${colors.Bordures}` }}
            ></div>
          </div>
        )}

        {/* Actions skeleton */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Reaction button skeleton */}
          <div
            className="h-8 w-16 sm:h-10 sm:w-20 bg-gray-200 rounded-full"
            style={{ border: `2px solid ${colors.Bordures}` }}
          ></div>

          {/* Comment button skeleton */}
          <div
            className="h-8 w-16 sm:h-10 sm:w-20 bg-gray-200 rounded-full"
            style={{ border: `2px solid ${colors.Bordures}` }}
          ></div>

          {/* Share button skeleton */}
          <div
            className="h-8 w-20 sm:h-10 sm:w-28 bg-gray-200 rounded-full ml-auto"
            style={{ border: `1px solid ${colors.Bordures}` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
