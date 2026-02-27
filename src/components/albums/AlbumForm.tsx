"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CoverImageField } from "@/components/ui/cover-image-field";

type AlbumFormMode = "create" | "edit";

export interface AlbumFormValues {
  name: string;
  description?: string;
  coverImage?: string;
}

interface AlbumFormProps {
  mode: AlbumFormMode;
  initialValues?: AlbumFormValues;
  submitting?: boolean;
  onSubmit: (values: AlbumFormValues) => void | Promise<void>;
  onCancel?: () => void;
}

export function AlbumForm({
  mode,
  initialValues,
  submitting,
  onSubmit,
  onCancel,
}: AlbumFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [coverImage, setCoverImage] = useState(
    initialValues?.coverImage ?? "",
  );

  useEffect(() => {
    if (!initialValues) return;
    setName(initialValues.name ?? "");
    setDescription(initialValues.description ?? "");
    setCoverImage(initialValues.coverImage ?? "");
  }, [initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      coverImage: coverImage.trim() || undefined,
    });
  };

  const title =
    mode === "create" ? "Create a new album" : "Edit album";
  const descriptionHelp =
    mode === "create"
      ? "Give it a name, a vibe, and fill it with the movies, series, songs, and books you love."
      : "Update the name, description, or cover image.";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{descriptionHelp}</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Album name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Comfort watchlist, Healing songs, Cozy reads..."
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional: explain the vibe or story behind this album."
              rows={4}
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            Cover image
            <span className="text-[11px] text-muted-foreground font-normal">
              Optional
            </span>
          </label>
          <CoverImageField image={coverImage} onImageChange={setCoverImage} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={submitting || !name.trim()}
          className="rounded-full"
        >
          {submitting
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create album"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

