FROM mcr.microsoft.com/dotnet/runtime:10.0-alpine AS base
WORKDIR /app

RUN adduser -D -u 1000 appuser
USER appuser

FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS publish
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["src/BitFinance.MCP.csproj", "src/"]
RUN dotnet restore "src/BitFinance.MCP.csproj"

COPY . .
RUN dotnet publish "src/BitFinance.MCP.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false --no-restore

FROM base AS final
WORKDIR /app
COPY --from=publish --chown=appuser:appuser /app/publish .

ENTRYPOINT ["dotnet", "BitFinance.MCP.dll"]
