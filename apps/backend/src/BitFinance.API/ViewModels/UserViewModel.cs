namespace BitFinance.API.ViewModels;

public record UserViewModel(string Id, string FullName, string Email, string UserName, List<OrganizationViewModel> Organizations);