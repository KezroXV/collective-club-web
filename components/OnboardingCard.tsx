"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Check } from "lucide-react";

interface OnboardingTask {
  id: string;
  label: string;
  completed: boolean;
}

interface OnboardingCardProps {
  tasks: OnboardingTask[];
  progress: number;
}

export default function OnboardingCard({ tasks, progress }: OnboardingCardProps) {
  const { colors } = useTheme();

  return (
    <div
      className="fixed left-4 top-24 w-80 rounded-2xl bg-white shadow-lg z-40 overflow-hidden"
      style={{
        border: `1px solid ${colors.Bordures}`,
      }}
    >
      <div className="p-4" style={{ backgroundColor: colors.Fond }}>
        {/* En-tête */}
        <h3 className="text-lg font-bold mb-1 text-gray-900">
          Bienvenue !
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Suivez ce guide pour démarrer
        </p>

        {/* Barre de progression */}
        <div className="relative mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  backgroundColor: colors.Posts,
                }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {progress}%
            </span>
          </div>
        </div>

        {/* Liste des tâches compacte */}
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 py-2"
            >
              {/* Icône de validation */}
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  task.completed ? "" : "border-2 border-gray-300"
                }`}
                style={{
                  backgroundColor: task.completed ? colors.Posts : "transparent",
                }}
              >
                {task.completed && <Check className="w-3 h-3 text-white" />}
              </div>

              {/* Label de la tâche */}
              <span
                className={`text-sm ${
                  task.completed
                    ? "line-through text-gray-400"
                    : "font-medium text-gray-900"
                }`}
              >
                {task.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
