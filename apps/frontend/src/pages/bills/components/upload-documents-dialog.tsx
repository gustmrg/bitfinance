import { type ChangeEvent, type ReactNode, useState } from "react";

import { FileText, Upload, X } from "lucide-react";

import type { BillFileCategory } from "@/api/bills";
import { AdaptiveModal } from "@/components/ui/adaptive-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UploadDocumentsDialogProps {
  billId: string;
  onUpload: (
    billId: string,
    files: File[],
    documentType: BillFileCategory
  ) => Promise<void>;
  defaultOpen?: boolean;
  trigger?: ReactNode;
}

const documentTypes: Array<{ value: BillFileCategory; label: string }> = [
  { value: "Boleto", label: "Boleto" },
  { value: "Receipt", label: "Receipt" },
  { value: "Other", label: "Other" },
];

export function UploadDocumentsDialog({
  billId,
  onUpload,
  defaultOpen = false,
  trigger,
}: UploadDocumentsDialogProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<BillFileCategory>("Other");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(billId, selectedFiles, documentType);
      setSelectedFiles([]);
      setOpen(false);
    } catch (error) {
      console.error("Failed to upload documents:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return "0 Bytes";
    }

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, index)).toFixed(2))} ${sizes[index]}`;
  };

  return (
    <AdaptiveModal
      open={open}
      onOpenChange={setOpen}
      trigger={
        trigger ?? (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4" />
          </Button>
        )
      }
      title="Upload Documents"
      description="Upload multiple files to attach to this bill."
      contentClassName="md:max-w-md"
      bodyClassName="space-y-4"
    >
      <div>
        <label htmlFor="document-type" className="text-sm font-medium">
          Document Type
        </label>
        <select
          id="document-type"
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value as BillFileCategory)}
          className="mt-1 w-full rounded-md border p-2 text-sm"
        >
          {documentTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="file-upload" className="text-sm font-medium">
          Select Files
        </label>
        <div className="mt-1">
          <input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-100"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
          />
        </div>
      </div>

      {selectedFiles.length > 0 ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Selected Files</label>
          <div className="max-h-32 space-y-2 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center space-x-2">
                    <FileText className="h-4 w-4 flex-shrink-0 text-gray-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={selectedFiles.length === 0 || isUploading}>
          {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} file(s)`}
        </Button>
      </div>
    </AdaptiveModal>
  );
}
