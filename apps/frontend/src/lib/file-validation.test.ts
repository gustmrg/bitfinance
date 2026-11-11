import { describe, expect, it } from "vitest";

import { isAcceptedDocument } from "@/lib/file-validation";

const megabyte = 1024 * 1024;

function fileOf(name: string, size: number) {
  return { name, size } as File;
}

describe("isAcceptedDocument", () => {
  it("accepts the supported extensions regardless of case", () => {
    expect(isAcceptedDocument(fileOf("invoice.pdf", megabyte))).toBe(true);
    expect(isAcceptedDocument(fileOf("RECEIPT.JPG", megabyte))).toBe(true);
    expect(isAcceptedDocument(fileOf("contract.final.docx", megabyte))).toBe(true);
  });

  it("rejects other extensions and files without one", () => {
    expect(isAcceptedDocument(fileOf("script.exe", megabyte))).toBe(false);
    expect(isAcceptedDocument(fileOf("pdf", megabyte))).toBe(false);
  });

  it("accepts a file of exactly 10 MB and rejects a larger one", () => {
    expect(isAcceptedDocument(fileOf("scan.png", 10 * megabyte))).toBe(true);
    expect(isAcceptedDocument(fileOf("scan.png", 10 * megabyte + 1))).toBe(false);
  });
});
