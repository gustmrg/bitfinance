using System.Net;
using System.Security.Cryptography;
using Amazon.S3;
using Amazon.S3.Model;
using BitFinance.API.Services.Interfaces;
using BitFinance.API.Settings;
using Microsoft.Extensions.Options;

namespace BitFinance.API.Services;

public class S3FileStorageService : IFileStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly StorageSettings _settings;
    private readonly ILogger<S3FileStorageService> _logger;

    public S3FileStorageService(
        IAmazonS3 s3Client,
        IOptions<StorageSettings> settings,
        ILogger<S3FileStorageService> logger)
    {
        _s3Client = s3Client;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<FileStorageResult> SaveFileAsync(Stream fileStream, string fileName, string contentType, string directoryPath)
    {
        try
        {
            var uniqueFileName = GenerateUniqueFileName(fileName);
            var key = BuildObjectKey(directoryPath, uniqueFileName);

            using var sha256 = SHA256.Create();
            using var memoryStream = new MemoryStream();

            var buffer = new byte[8192];
            int bytesRead;
            long totalBytes = 0;

            while ((bytesRead = await fileStream.ReadAsync(buffer, 0, buffer.Length)) > 0)
            {
                await memoryStream.WriteAsync(buffer, 0, bytesRead);
                sha256.TransformBlock(buffer, 0, bytesRead, null, 0);
                totalBytes += bytesRead;
            }

            sha256.TransformFinalBlock(Array.Empty<byte>(), 0, 0);
            var hash = Convert.ToBase64String(sha256.Hash!);

            memoryStream.Position = 0;

            var putRequest = new PutObjectRequest
            {
                BucketName = _settings.BucketName,
                Key = key,
                InputStream = memoryStream,
                ContentType = contentType
            };

            await _s3Client.PutObjectAsync(putRequest);

            return new FileStorageResult
            {
                Success = true,
                StoragePath = key,
                FileName = uniqueFileName,
                FileSizeInBytes = totalBytes,
                FileHash = hash
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving file {FileName} to S3", fileName);
            return new FileStorageResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<Stream> GetFileAsync(string storagePath)
    {
        var response = await _s3Client.GetObjectAsync(new GetObjectRequest
        {
            BucketName = _settings.BucketName,
            Key = storagePath
        });

        return response.ResponseStream;
    }

    public async Task<bool> DeleteFileAsync(string storagePath)
    {
        try
        {
            var response = await _s3Client.DeleteObjectAsync(new DeleteObjectRequest
            {
                BucketName = _settings.BucketName,
                Key = storagePath
            });

            return response.HttpStatusCode == HttpStatusCode.NoContent;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file {StoragePath} from S3", storagePath);
            return false;
        }
    }

    public async Task<bool> FileExistsAsync(string storagePath)
    {
        try
        {
            await _s3Client.GetObjectMetadataAsync(new GetObjectMetadataRequest
            {
                BucketName = _settings.BucketName,
                Key = storagePath
            });

            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    public string GenerateUniqueFileName(string originalFileName)
    {
        var extension = Path.GetExtension(originalFileName)?.ToLowerInvariant();
        var uuid = Guid.NewGuid().ToString();

        return $"{uuid}{extension}";
    }

    private string BuildObjectKey(string directoryPath, string fileName)
    {
        var parts = new List<string>();

        if (!string.IsNullOrWhiteSpace(_settings.Prefix))
            parts.Add(_settings.Prefix);

        parts.Add(directoryPath);
        parts.Add(fileName);

        return string.Join("/", parts);
    }
}