import { useCallback, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  onTextSubmit?: (text: string) => void;
  isProcessing?: boolean;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in MB
}

export function DropZone({
  onFileSelect,
  onTextSubmit,
  isProcessing = false,
  acceptedFileTypes = [".pdf", ".docx"],
  maxFileSize = 10,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    []
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    []
  );

  const handleFile = useCallback(
    (file: File) => {
      // Validate file type
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
      if (!acceptedFileTypes.includes(extension)) {
        alert(`Invalid file type. Accepted types: ${acceptedFileTypes.join(", ")}`);
        return;
      }

      // Validate file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxFileSize) {
        alert(`File size exceeds ${maxFileSize}MB limit`);
        return;
      }

      onFileSelect(file);
    },
    [acceptedFileTypes, maxFileSize, onFileSelect]
  );

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim() && onTextSubmit) {
      onTextSubmit(textInput.trim());
      setTextInput("");
      setShowTextInput(false);
    }
  }, [textInput, onTextSubmit]);

  return (
    <div className="space-y-4">
      {/* File Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/30 hover:border-primary/50",
          isProcessing && "opacity-50 pointer-events-none"
        )}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={acceptedFileTypes.join(",")}
          onChange={handleFileInput}
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {isProcessing ? (
            <>
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div>
                <p className="text-lg font-medium">Processing resume...</p>
                <p className="text-sm text-muted-foreground">
                  Extracting content and parsing structure
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium mb-1">
                  Drop your resume here or{" "}
                  <label
                    htmlFor="file-upload"
                    className="text-primary hover:underline cursor-pointer"
                  >
                    browse
                  </label>
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF and DOCX files up to {maxFileSize}MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Text Input Option */}
      {onTextSubmit && (
        <div className="space-y-2">
          {!showTextInput ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTextInput(true)}
              className="w-full"
              disabled={isProcessing}
            >
              <FileText className="w-4 h-4 mr-2" />
              Or paste raw text instead
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste your resume content here..."
                  className="flex-1 min-h-[120px] p-3 border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isProcessing}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowTextInput(false);
                    setTextInput("");
                  }}
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Button
                type="button"
                onClick={handleTextSubmit}
                disabled={!textInput.trim() || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Parse Resume"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

