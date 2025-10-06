"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface CreatePostFormProps {
  onSubmit: (title: string, content: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function CreatePostForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: CreatePostFormProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(title, content);
    setTitle("");
    setContent("");
  };

  return (
    <Card
      className="mb-8 hover:shadow-sm"
      style={{ border: `1px solid ${colors.Bordures}`, backgroundColor: colors.Fond }}
    >
      <CardHeader
        className="border-b"
        style={{ backgroundColor: colors.Fond, borderBottomColor: colors.Bordures }}
      >
        <CardTitle className="flex items-center gap-2" style={{ color: colors.Police }}>
          <Plus className="h-5 w-5" />
          Créer un nouveau post
        </CardTitle>
        <CardDescription className="text-gray-600">
          Partagez vos idées avec la communauté
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Titre de votre post..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="theme-input"
            style={{
              borderColor: colors.Bordures,
              backgroundColor: colors.Fond,
              color: colors.Police,
            }}
          />
          <Textarea
            placeholder="Contenu de votre post..."
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="theme-input resize-none"
            style={{
              borderColor: colors.Bordures,
              backgroundColor: colors.Fond,
              color: colors.Police,
            }}
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="px-6"
              style={{ backgroundColor: colors.Posts, color: "white" }}
            >
              {isSubmitting ? "Publication..." : "Publier"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
