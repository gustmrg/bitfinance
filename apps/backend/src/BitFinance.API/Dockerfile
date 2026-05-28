# Stage 1: Base runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081
ENV ASPNETCORE_URLS=http://+:8080

RUN apk add --no-cache tzdata

# Add non-root user for security
RUN adduser -D -u 1000 appuser
USER appuser

# Stage 2: Build and publish
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS publish
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project files first for layer caching
COPY ["BitFinance.API/BitFinance.API.csproj", "BitFinance.API/"]
COPY ["BitFinance.Business/BitFinance.Business.csproj", "BitFinance.Business/"]
COPY ["BitFinance.Data/BitFinance.Data.csproj", "BitFinance.Data/"]

# Restore dependencies
RUN dotnet restore "BitFinance.API/BitFinance.API.csproj"

# Copy all source code
COPY . .

# Publish (includes build)
WORKDIR "/src/BitFinance.API"
RUN dotnet publish "BitFinance.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false --no-restore

# Stage 3: Final runtime image
FROM base AS final
WORKDIR /app
COPY --from=publish --chown=appuser:appuser /app/publish .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "BitFinance.API.dll"]
