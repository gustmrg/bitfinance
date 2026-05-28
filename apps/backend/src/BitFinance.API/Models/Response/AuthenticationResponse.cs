namespace BitFinance.API.Models.Response;

public record AuthenticationResponse(
    string AccessToken,
    DateTime AccessTokenExpiresAt,
    UserInfo User
);

public record UserInfo(
    string Id,
    string Email,
    string UserName,
    string FirstName,
    string LastName
);
