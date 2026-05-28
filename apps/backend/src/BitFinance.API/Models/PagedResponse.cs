namespace BitFinance.API.Models;

public class PagedResponse<T>(List<T> data, int page, int pageSize, int totalRecords, int totalPages)
{
    public List<T> Data { get; set; } = data;
    public int Page { get; set; } = page;
    public int PageSize { get; set; } = pageSize;
    public int TotalRecords { get; set; } = totalRecords;
    public int TotalPages { get; set; } = totalPages;
}