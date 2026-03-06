import { useRef, useCallback, useState } from "react";
import { Upload, X, FilmIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/upload";
import { toast } from "sonner";

interface CoverImageFieldProps {
  /** Current image value (URL) */
  image: string;
  /** Called whenever the image value changes (upload, URL edit, or clear) */
  onImageChange: (value: string) => void;
  /** Optional fallback image URL used if the main image fails to load */
  fallbackImageUrl?: string;
  className?: string;
}

export function CoverImageField({
  image,
  onImageChange,
  fallbackImageUrl,
  className,
}: CoverImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      e.target.value = "";
      setUploading(true);
      try {
        const url = await uploadToCloudinary(file, "image");
        onImageChange(url);
      } catch {
        toast.error("Failed to upload image. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [onImageChange],
  );

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onImageChange(e.target.value.trim());
  };

  const handleClear = () => {
    onImageChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 transition-colors flex flex-wrap justify-center gap-6",
        className,
      )}
    >
      <div className="text-center space-y-3">
        <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Upload a file or paste an image URL
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? "Uploading…" : "Upload"}
          </Button>
          <span className="text-muted-foreground text-sm">or</span>
          <Input
            placeholder="Paste image URL"
            value={image}
            onChange={handleUrlChange}
            className="w-64 bg-transparent"
            disabled={uploading}
          />
        </div>
      </div>
      {image ? (
        <div className="w-fit relative flex-shrink-0">
          <div className="w-32 h-40 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
            <img
              src={image}
              alt="Cover preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                if (fallbackImageUrl) {
                  (e.target as HTMLImageElement).src = fallbackImageUrl;
                }
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive text-destructive-foreground p-1 shadow-md hover:bg-destructive/90 transition-colors focus:outline-none focus:ring-2 focus:ring-destructive"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="w-32 h-40 rounded-lg border border-border overflow-hidden bg-muted flex flex-col items-center justify-center">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <>
              <FilmIcon className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-4">Preview</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
