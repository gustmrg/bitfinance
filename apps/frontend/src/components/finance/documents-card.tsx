import { Download, ExternalLink, FilePlus2, FileText, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FileCategory } from "@/api/bills/bills.types";
import { Button } from "@/components/base/button";
import { Card, CardHeader } from "@/components/base/card";
import { EmptyState } from "@/components/base/feedback";
import { IconButton } from "@/components/base/icon-button";
import { Select } from "@/components/base/select";
import { acceptedDocumentTypes, documentCategories } from "@/lib/file-validation";

type DocumentItem = { id: string; fileName: string; fileCategory: string };

export function DocumentsCard({
  documents,
  available,
  isFree,
  description,
  emptyTitle,
  emptyDescription,
  uploading,
  multiple = false,
  defaultCategory,
  onUpload,
  onOpen,
  onDownload,
  onRemove,
}: {
  documents: DocumentItem[];
  available: boolean;
  isFree: boolean;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  uploading: boolean;
  multiple?: boolean;
  defaultCategory: FileCategory;
  onUpload: (files: File[], category: FileCategory) => void;
  onOpen?: (document: DocumentItem) => void;
  onDownload: (document: DocumentItem) => void;
  onRemove: (document: DocumentItem) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<FileCategory>(defaultCategory);
  return (
    <Card aria-labelledby="documents-title">
      <CardHeader
        titleId="documents-title"
        title={t("common.attachments")}
        description={isFree ? t("common.attachmentsPaidPlan") : description}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="min-w-40 flex-1 sm:w-48 sm:flex-none">
          <Select
            ariaLabel={t("common.documentCategory")}
            value={category}
            onValueChange={setCategory}
            disabled={!available}
            options={documentCategories.map((value) => ({
              value,
              label: t(`documents.${value}`),
            }))}
          />
        </div>
        <Button
          variant="secondary"
          disabled={!available || uploading}
          onClick={() => inputRef.current?.click()}
        >
          <FilePlus2 size={16} aria-hidden="true" /> {t("common.addFile")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedDocumentTypes}
          disabled={!available}
          hidden
          multiple={multiple}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length > 0) onUpload(files, category);
            event.currentTarget.value = "";
          }}
        />
      </div>
      {documents.length ? (
        <ul className="m-0 grid list-none p-0">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex items-center gap-3 border-t border-line py-3 first:border-t-0"
            >
              <span className="inline-grid size-10 shrink-0 place-items-center rounded-control bg-brand-soft text-brand-ink">
                <FileText size={18} aria-hidden="true" />
              </span>
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-sm font-bold">{document.fileName}</span>
                <span className="text-[13px] text-ink-muted">
                  {t(`documents.${document.fileCategory}`, { defaultValue: document.fileCategory })}
                </span>
              </span>
              {onOpen && (
                <IconButton
                  label={`${t("common.open")} ${document.fileName}`}
                  onClick={() => onOpen(document)}
                >
                  <ExternalLink size={17} aria-hidden="true" />
                </IconButton>
              )}
              <IconButton
                label={`${t("common.download")} ${document.fileName}`}
                onClick={() => onDownload(document)}
              >
                <Download size={17} aria-hidden="true" />
              </IconButton>
              <IconButton
                label={t("common.removeFile", { name: document.fileName })}
                onClick={() => onRemove(document)}
              >
                <Trash2 size={17} className="text-danger" aria-hidden="true" />
              </IconButton>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={FilePlus2} title={emptyTitle} description={emptyDescription} />
      )}
    </Card>
  );
}
