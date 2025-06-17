"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  prompt: string;
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  prompt,
}: ImagePreviewModalProps) {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `ai-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI Generated Image",
          text: `Check out this AI generated image: ${prompt}`,
          url: imageUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopyUrl();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-left">Generated Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Container */}
          <div className="relative w-full h-[60vh] bg-gray-50 rounded-lg overflow-hidden">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt="Generated image preview"
              fill
              className="object-contain"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="flex items-center justify-center h-full bg-gray-100 text-gray-500">
                      <div class="text-center">
                        <div class="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p class="text-sm font-medium">Image Preview</p>
                        <p class="text-xs text-gray-400 mt-1">Unable to load image</p>
                      </div>
                    </div>
                  `;
                }
              }}
            />
          </div>

          {/* Prompt Display */}
          <div className="bg-gray-50 p-3 rounded-lg">
            {/* <p className="text-sm text-gray-600 font-medium mb-1">Prompt:</p>
            <p className="text-sm text-gray-800">{prompt}</p> */}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-end">
            {/* <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {copied ? "Copied!" : "Copy URL"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button> */}

            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
