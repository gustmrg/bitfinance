# Frontend v2 deployment

Frontend v2 is deployed independently from the existing frontend so both can
remain live during the rollout:

- Existing frontend: unchanged, deployed to `/var/www/bitfinance/`.
- Frontend v2: `https://bitfinance-v2.gustavomiranda.dev`, deployed to
  `/var/www/bitfinance-v2/`.

The release workflow is `.github/workflows/frontend-v2-deploy.yml`. It runs when
a `frontend-v2/v<version>` tag is pushed and requires the tag version to match
`apps/frontend-v2/package.json`.

## 1. Configure DNS

Create an `A` record for `bitfinance-v2.gustavomiranda.dev` pointing to the VPS
public IPv4 address. Add an `AAAA` record only if the VPS is also configured to
serve the site over IPv6.

Wait for the record to resolve before requesting a TLS certificate:

```bash
dig +short bitfinance-v2.gustavomiranda.dev
```

## 2. Prepare the deployment directory

On the VPS, create the v2 directory and make the GitHub Actions SSH user its
owner. Replace `<deploy-user>` and `<web-group>` with the values used by the
existing frontend deployment.

```bash
sudo mkdir -p /var/www/bitfinance-v2
sudo chown -R <deploy-user>:<web-group> /var/www/bitfinance-v2
sudo chmod 0755 /var/www/bitfinance-v2
```

The deployment user must be able to create files in this directory without
`sudo`. Do not change `/var/www/bitfinance/` or the existing frontend virtual
host.

## 3. Add the Nginx virtual host

Create a separate Nginx server block. Replace `127.0.0.1:8080` with the backend
upstream already used by the existing BitFinance virtual host.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name bitfinance-v2.gustavomiranda.dev;

    root /var/www/bitfinance-v2;
    index index.html;

    location /api/v1/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /health {
        proxy_pass http://127.0.0.1:8080/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site using the same layout as the VPS's existing Nginx installation,
then validate and reload it:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 4. Enable TLS

After DNS resolves and the HTTP virtual host is reachable, request a certificate
using the VPS's existing ACME client. With Certbot's Nginx integration:

```bash
sudo certbot --nginx -d bitfinance-v2.gustavomiranda.dev
sudo nginx -t
sudo systemctl reload nginx
```

Confirm that certificate renewal is already scheduled on the VPS.

## 5. GitHub production environment

The v2 workflow reuses the existing `production` environment and its secrets:

- `TS_OAUTH_CLIENT_ID`
- `TS_OAUTH_SECRET`
- `SSH_KEY`
- `SSH_HOST`
- `TAILSCALE_HOST`
- `SSH_USERNAME`
- `SSH_PORT` (optional; defaults to `22`)

No separate API URL secret is required. The production build uses `/api/v1` and
`/health`, and Nginx proxies both paths to the shared backend on the same origin.

## 6. Publish and verify a release

Create the release tag from the merged `main` commit. For the initial v2
version currently declared in `package.json`:

```bash
git switch main
git pull --ff-only origin main
git tag frontend-v2/v0.1.0
git push origin frontend-v2/v0.1.0
```

Wait for the **Frontend v2 Release** workflow to finish, then verify the release:

```bash
curl --fail https://bitfinance-v2.gustavomiranda.dev/version.json
curl --fail https://bitfinance-v2.gustavomiranda.dev/health
test "$(curl --silent --output /dev/null --write-out '%{http_code}' \
  https://bitfinance-v2.gustavomiranda.dev/api/v1/organizations)" = "401"
```

The expected `401` from the protected organizations endpoint confirms that the
request reached the backend through the v2 proxy without requiring credentials.

Also verify in a browser that a nested v2 route survives a direct page refresh,
then test login, one authenticated API request, token refresh, and logout. Finally,
confirm the existing frontend is still available at its original URL.
