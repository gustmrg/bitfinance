import type { FileCategory } from "@/api/bills/bills.types";

export const documentCategories: FileCategory[] = ["Invoice", "Receipt", "Boleto", "Other"];
export const acceptedDocumentTypes = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
export const acceptedAvatarTypes = ["image/jpeg", "image/png"];

const maxDocumentSizeBytes = 10 * 1024 * 1024;

export function isAcceptedDocument(file: File) {
  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  return acceptedDocumentTypes.split(",").includes(extension) && file.size <= maxDocumentSizeBytes;
}
