namespace BitFinance.API.Models.Response;

public class GetOrganizationByIdResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public OrganizationBudgetResponse? Budget { get; set; }
    public List<OrganizationMemberResponse> Members { get; set; } = [];
}
