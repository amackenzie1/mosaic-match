import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/utils/general";
import { ZipFile } from "./FileUploadAndParse";

export const ZipFileDialog = ({
  isOpen,
  onClose,
  zipFiles,
  onFileSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  zipFiles: ZipFile[];
  onFileSelect: (fileName: string) => void;
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold text-foreground">
          Select a file from the zip
        </DialogTitle>
      </DialogHeader>
      <ScrollArea className="h-[60vh]">
        <div className="space-y-2">
          {zipFiles.map((file) => (
            <button
              key={file.name}
              onClick={() => onFileSelect(file.name)}
              className="w-full p-4 text-left rounded-md hover:bg-muted/60 transition-colors group bg-card"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-base text-card-foreground group-hover:text-primary transition-colors">
                  {file.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(file.date)}
                </span>
              </div>
              <div
                className="text-sm leading-relaxed text-muted-foreground/90 line-clamp-2"
                dangerouslySetInnerHTML={{
                  __html: file.preview.replace(/\n/g, "<br>"),
                }}
              />
            </button>
          ))}
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
);
