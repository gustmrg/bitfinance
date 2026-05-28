namespace BitFinance.API.Services.Interfaces;

/// <summary>
/// Abstracts file storage operations, supporting pluggable providers (local filesystem, S3, etc.).
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// Saves a file to the configured storage provider.
    /// </summary>
    /// <param name="fileStream">The file content stream.</param>
    /// <param name="fileName">The file name to use for storage.</param>
    /// <param name="contentType">The MIME content type of the file.</param>
    /// <param name="directoryPath">The directory path within the bucket where the file should be stored.</param>
    /// <returns>A <see cref="FileStorageResult"/> with the outcome of the operation.</returns>
    Task<FileStorageResult> SaveFileAsync(Stream fileStream, string fileName, string contentType, string directoryPath);

    /// <summary>
    /// Retrieves a file stream from storage.
    /// </summary>
    /// <param name="storagePath">The storage path of the file.</param>
    /// <returns>A readable <see cref="Stream"/> of the file contents.</returns>
    Task<Stream> GetFileAsync(string storagePath);

    /// <summary>
    /// Deletes a file from storage.
    /// </summary>
    /// <param name="storagePath">The storage path of the file to delete.</param>
    /// <returns><c>true</c> if the file was successfully deleted; otherwise, <c>false</c>.</returns>
    Task<bool> DeleteFileAsync(string storagePath);

    /// <summary>
    /// Checks whether a file exists at the specified storage path.
    /// </summary>
    /// <param name="storagePath">The storage path to check.</param>
    /// <returns><c>true</c> if the file exists; otherwise, <c>false</c>.</returns>
    Task<bool> FileExistsAsync(string storagePath);

    /// <summary>
    /// Generates a unique file name based on the original file name to prevent collisions.
    /// </summary>
    /// <param name="originalFileName">The original file name.</param>
    /// <returns>A unique file name preserving the original extension.</returns>
    string GenerateUniqueFileName(string originalFileName);
}

/// <summary>
/// Contains the result of a file storage operation.
/// </summary>
public class FileStorageResult
{
    /// <summary>
    /// Indicates whether the file was saved successfully.
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// The storage path where the file was saved, if successful.
    /// </summary>
    public string? StoragePath { get; set; }

    /// <summary>
    /// The file name used for storage.
    /// </summary>
    public string? FileName { get; set; }

    /// <summary>
    /// An error message describing what went wrong, if the operation failed.
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// The size of the stored file in bytes.
    /// </summary>
    public long? FileSizeInBytes { get; set; }

    /// <summary>
    /// The SHA-256 hash of the stored file for integrity verification.
    /// </summary>
    public string? FileHash { get; set; }
}
