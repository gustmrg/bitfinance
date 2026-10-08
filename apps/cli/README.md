# BitFinance CLI

`bitfinance-cli` is a non-interactive C# client for the BitFinance API. It is designed for agents and automation: successful commands emit one JSON value to standard output by default, diagnostics use standard error, and failures return documented nonzero exit codes.

## Installation

Download the archive matching the Linux host from the GitHub Release for the desired `cli/vX.Y.Z` tag:

- `bitfinance-cli-<version>-linux-x64.tar.gz` for x86-64 Linux.
- `bitfinance-cli-<version>-linux-arm64.tar.gz` for ARM64 Linux.

Verify the archive against the release's `checksums.txt`, extract it, and place the executable on `PATH`:

```bash
sha256sum --check checksums.txt --ignore-missing
tar -xzf bitfinance-cli-<version>-linux-x64.tar.gz
install -m 0755 bitfinance-cli "$HOME/.local/bin/bitfinance-cli"
bitfinance-cli --version
```

The release executables are self-contained and do not require a preinstalled .NET runtime. They target glibc-based Linux distributions.

## Configuration

Provide configuration through environment variables:

```bash
export BITFINANCE_API_BASE_URL="https://<bitfinance-api-host>"
export BITFINANCE_ACCESS_TOKEN="<access-token>"
export BITFINANCE_API_VERSION="1"
```

`BITFINANCE_API_BASE_URL` and `BITFINANCE_ACCESS_TOKEN` are required for API commands. `BITFINANCE_API_VERSION` is optional and defaults to `1`.

There is no default-organization setting. Every organization-scoped command requires `--organization-id`; omission is a command error and no API request is made. Access tokens are read only from the environment and are never accepted as command arguments or written to output.

## Commands

Discover the complete command and option reference from the executable:

```bash
bitfinance-cli --help
bitfinance-cli bills create --help
bitfinance-cli expenses documents upload --help
```

The command groups are:

- `organizations list|get`
- `dashboard upcoming-bills|recent-expenses`
- `bills list|get|create|update|delete|stop-series`
- `bills documents upload|download-url|delete`
- `expenses list|get|create|update`
- `expenses documents upload|download-url|delete`

List expenses as JSON:

```bash
bitfinance-cli expenses list \
  --organization-id 00000000-0000-0000-0000-000000000000 \
  --from 2026-08-01T00:00:00-03:00 \
  --to 2026-08-31T23:59:59-03:00 \
  --status Paid
```

Create an expense using the authenticated token owner as `createdBy`:

```bash
bitfinance-cli expenses create \
  --organization-id 00000000-0000-0000-0000-000000000000 \
  --description "Lunch" \
  --category Food \
  --amount 42.50 \
  --status Paid \
  --payment-method Pix
```

Create a recurring bill:

```bash
bitfinance-cli bills create \
  --organization-id 00000000-0000-0000-0000-000000000000 \
  --description "Rent" \
  --category Housing \
  --status Upcoming \
  --due-date 2026-09-10T00:00:00-03:00 \
  --amount-due 1500.00 \
  --frequency Monthly
```

Destructive operations are non-interactive and require `--confirm`:

```bash
bitfinance-cli bills delete \
  --organization-id 00000000-0000-0000-0000-000000000000 \
  --bill-id 00000000-0000-0000-0000-000000000001 \
  --confirm
```

Upload a local document:

```bash
bitfinance-cli bills documents upload \
  --organization-id 00000000-0000-0000-0000-000000000000 \
  --bill-id 00000000-0000-0000-0000-000000000001 \
  --file ./receipt.pdf \
  --file-category Receipt
```

Uploads support `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, and `.docx` files up to 10 MB. The MIME type is inferred from the extension unless `--content-type` is provided.

## Output and Exit Codes

JSON is the default success format. Use `--output table` for human-readable output:

```bash
bitfinance-cli organizations list --output table
```

Errors always use JSON on standard error:

```json
{"error":{"code":"invalid_arguments","message":"...","httpStatus":null,"details":null}}
```

Exit codes:

- `0`: success.
- `1`: unexpected internal failure.
- `2`: parsing, configuration, input-validation, or confirmation failure.
- `3`: authentication or authorization failure.
- `4`: another BitFinance API failure.
- `5`: network or timeout failure.
- `130`: cancellation.

Dates use ISO 8601, decimal values use invariant formatting, and enum-like values are case-insensitive. Update commands preserve optional notes or payment methods when their option is omitted; pass an empty value to clear a supported field.

## Local Development

Build and test from the repository root:

```bash
dotnet build apps/cli/src/BitFinance.Cli.csproj
dotnet test apps/cli/tests/BitFinance.Cli.UnitTests/BitFinance.Cli.UnitTests.csproj
```

Run from source:

```bash
dotnet run --project apps/cli/src/BitFinance.Cli.csproj -- organizations list
```

## Versioning and Releases

The CLI has independent SemVer starting at `0.1.0`. The version is stored in `apps/cli/src/BitFinance.Cli.csproj` and must match the release tag.

To release version `0.1.0`:

1. Set `Version` and `InformationalVersion` to the SemVer release value in the CLI project. Set `AssemblyVersion` and `FileVersion` to its numeric `major.minor.patch` value (without a prerelease suffix).
2. Commit and merge the version change.
3. Create and push tag `cli/v0.1.0`.
4. The CLI Release workflow tests the project, builds native `linux-x64` and `linux-arm64` archives, smoke-tests them, creates `checksums.txt`, and publishes a GitHub Release.

The workflow rejects malformed tags and tag/project version mismatches before publishing. Prerelease versions such as `0.2.0-beta.1` produce GitHub prereleases.
