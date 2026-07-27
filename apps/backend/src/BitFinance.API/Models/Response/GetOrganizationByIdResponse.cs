using System.Text.Json.Serialization;
using BitFinance.Business.Enums;

namespace BitFinance.API.Models.Response;

public class GetOrganizationByIdResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public OrganizationBudgetResponse? Budget { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public PlanTier PlanTier { get; set; }
    public DateTime PlanExpiresAt { get; set; }
    public List<OrganizationMemberResponse> Members { get; set; } = [];
}
