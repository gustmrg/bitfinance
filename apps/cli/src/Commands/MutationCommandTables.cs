using BitFinance.Cli.Models;
using BitFinance.Cli.Output;
using System.Globalization;

namespace BitFinance.Cli.Commands;

internal static class MutationCommandTables
{
    public static TableData UpdatedBill(UpdateBillResponse bill) =>
        new(
            ["Id", "Description", "Category", "Status", "Amount due", "Due date"],
            [
                [
                    bill.Id.ToString(),
                    bill.Description,
                    bill.Category,
                    bill.Status,
                    bill.AmountDue.ToString("0.00", CultureInfo.InvariantCulture),
                    bill.DueDate.ToString("O", CultureInfo.InvariantCulture)
                ]
            ]);

    public static TableData UploadedDocument(UploadDocumentResponse document) =>
        new(
            ["Id", "File name", "Content type", "Category", "Attachment type"],
            [[document.Id.ToString(), document.FileName, document.ContentType, document.FileCategory, document.AttachmentType]]);

    public static TableData DownloadUrl(DocumentDownloadUrlResponse document) =>
        new(
            ["File name", "Content type", "Expires at", "URL"],
            [[document.FileName, document.ContentType, document.ExpiresAt.ToString("O"), document.Url]]);
}
