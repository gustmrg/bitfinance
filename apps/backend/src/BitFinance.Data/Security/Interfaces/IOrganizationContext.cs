namespace BitFinance.Data.Security.Interfaces;

public interface IOrganizationContext
{
    Guid OrganizationId { get; }
    void SetOrganization(Guid organizationId);
}