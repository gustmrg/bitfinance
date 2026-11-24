import { Copy, KeyRound, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { ApiKey, ApiKeyAccess, CreatedApiKey } from "@/api/api-keys/api-keys.types";
import { useAuth } from "@/auth/auth-provider";
import { Badge } from "@/components/base/badge";
import { Button } from "@/components/base/button";
import { Card, CardHeader } from "@/components/base/card";
import { ConfirmDialog, Dialog, DialogActions } from "@/components/base/dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/base/feedback";
import { Field, Input } from "@/components/base/field";
import { Select } from "@/components/base/select";
import { Switch } from "@/components/base/switch";
import { useApiKeyMutations } from "@/hooks/mutations/use-api-key-mutations";
import { useApiKeysQuery } from "@/hooks/queries/use-api-key-queries";
import { useLocale } from "@/hooks/use-locale";
import { formatMediumDate } from "@/lib/format";

type Expiration = "never" | "30" | "90" | "365";

export function ApiKeysCard() {
  const { t } = useTranslation();
  const locale = useLocale();
  const keys = useApiKeysQuery();
  const mutations = useApiKeyMutations();
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState<CreatedApiKey | null>(null);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);

  const usage = (key: ApiKey) => {
    const parts = [t("apiKeys.created", { date: formatMediumDate(key.createdAt, locale) })];
    parts.push(
      key.lastUsedAt
        ? t("apiKeys.lastUsed", { date: formatMediumDate(key.lastUsedAt, locale) })
        : t("apiKeys.neverUsed"),
    );
    if (key.expiresAt)
      parts.push(
        new Date(key.expiresAt) <= new Date()
          ? t("apiKeys.expired")
          : t("apiKeys.expires", { date: formatMediumDate(key.expiresAt, locale) }),
      );
    return parts.join(" · ");
  };

  return (
    <Card aria-labelledby="account-api-keys">
      <CardHeader
        titleId="account-api-keys"
        title={t("apiKeys.title")}
        description={t("apiKeys.description")}
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={16} aria-hidden="true" /> {t("apiKeys.new")}
          </Button>
        }
      />
      {keys.isPending ? (
        <LoadingState />
      ) : keys.error ? (
        <ErrorState message={keys.error.message} onRetry={() => void keys.refetch()} />
      ) : keys.data.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title={t("apiKeys.empty")}
          description={t("apiKeys.emptyBody")}
        />
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0">
          {keys.data.map((key) => (
            <li
              key={key.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-control border border-line p-4"
            >
              <div className="grid min-w-0 gap-1.5">
                <span className="font-bold">
                  {key.name}{" "}
                  <code className="text-[13px] font-normal text-ink-muted">{key.prefix}…</code>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {key.organizations.map((organization) => (
                    <Badge
                      key={organization.organizationId}
                      tone={organization.access === "ReadWrite" ? "brand" : "neutral"}
                    >
                      {organization.name} · {t(`apiKeys.access.${organization.access}`)}
                    </Badge>
                  ))}
                </div>
                <span className="text-[13px] text-ink-muted">{usage(key)}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setRevoking(key)}>
                {t("apiKeys.revoke")}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {createOpen && (
        <CreateApiKeyDialog
          onClose={() => setCreateOpen(false)}
          onCreated={(key) => {
            setCreateOpen(false);
            setCreated(key);
          }}
        />
      )}
      <Dialog
        open={created !== null}
        onOpenChange={(open) => !open && setCreated(null)}
        title={t("apiKeys.createdTitle")}
        description={t("apiKeys.createdBody")}
      >
        <div className="flex gap-2">
          <Input readOnly value={created?.secret ?? ""} aria-label={t("apiKeys.title")} />
          <Button
            variant="secondary"
            onClick={() => {
              void navigator.clipboard
                .writeText(created?.secret ?? "")
                .then(() => toast.success(t("apiKeys.copied")));
            }}
          >
            <Copy size={16} aria-hidden="true" /> {t("apiKeys.copy")}
          </Button>
        </div>
        <DialogActions>
          <Button onClick={() => setCreated(null)}>{t("apiKeys.done")}</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(open) => !open && setRevoking(null)}
        title={t("apiKeys.revokeTitle", { name: revoking?.name ?? "" })}
        description={t("apiKeys.revokeBody")}
        confirmLabel={t("apiKeys.revoke")}
        tone="danger"
        pending={mutations.revoke.isPending}
        onConfirm={() => {
          if (!revoking) return;
          mutations.revoke.mutate(revoking.id, {
            onSuccess: () => {
              setRevoking(null);
              toast.success(t("apiKeys.revoked"));
            },
            onError: (error) => toast.error(error.message),
          });
        }}
      />
    </Card>
  );
}

function CreateApiKeyDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (key: CreatedApiKey) => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { create } = useApiKeyMutations();
  const organizations = user?.organizations ?? [];
  const [name, setName] = useState("");
  const [expiration, setExpiration] = useState<Expiration>("90");
  const [access, setAccess] = useState<Record<string, ApiKeyAccess | undefined>>({});
  const selected = organizations.filter((organization) => access[organization.id]);

  const submit = () => {
    const days = expiration === "never" ? null : Number(expiration);
    create.mutate(
      {
        name,
        organizations: selected.map((organization) => ({
          organizationId: organization.id,
          access: access[organization.id]!,
        })),
        expiresAt: days ? new Date(Date.now() + days * 86_400_000).toISOString() : null,
      },
      { onSuccess: onCreated, onError: (error) => toast.error(error.message) },
    );
  };

  return (
    <Dialog
      open
      wide
      onOpenChange={(open) => !open && onClose()}
      title={t("apiKeys.createTitle")}
      description={t("apiKeys.createBody")}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Field label={t("apiKeys.name")} hint={t("apiKeys.nameHint")}>
          {(control) => (
            <Input
              {...control}
              value={name}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              required
            />
          )}
        </Field>
        <fieldset className="m-0 grid gap-2 border-0 p-0">
          <legend className="mb-2 text-sm font-bold">{t("apiKeys.organizations")}</legend>
          {organizations.map((organization) => {
            const value = access[organization.id];
            return (
              <div
                key={organization.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line px-3 py-2"
              >
                <label className="flex min-w-0 items-center gap-3">
                  <Switch
                    ariaLabel={organization.name}
                    checked={value !== undefined}
                    onCheckedChange={(checked) =>
                      setAccess((current) => ({
                        ...current,
                        [organization.id]: checked ? "Read" : undefined,
                      }))
                    }
                  />
                  <span className="truncate text-sm">{organization.name}</span>
                </label>
                <div className="w-48">
                  <Select<ApiKeyAccess>
                    ariaLabel={t("apiKeys.accessLabel", { name: organization.name })}
                    value={value ?? "Read"}
                    disabled={value === undefined}
                    onValueChange={(next) =>
                      setAccess((current) => ({ ...current, [organization.id]: next }))
                    }
                    options={[
                      { value: "Read", label: t("apiKeys.access.Read") },
                      { value: "ReadWrite", label: t("apiKeys.access.ReadWrite") },
                    ]}
                  />
                </div>
              </div>
            );
          })}
        </fieldset>
        <Field label={t("apiKeys.expiration")}>
          {(control) => (
            <Select<Expiration>
              id={control.id}
              value={expiration}
              onValueChange={setExpiration}
              options={[
                { value: "30", label: t("apiKeys.expirationDays", { count: 30 }) },
                { value: "90", label: t("apiKeys.expirationDays", { count: 90 }) },
                { value: "365", label: t("apiKeys.expirationDays", { count: 365 }) },
                { value: "never", label: t("apiKeys.expirationNever") },
              ]}
            />
          )}
        </Field>
        <DialogActions>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={!name.trim() || selected.length === 0 || create.isPending}
          >
            {t("apiKeys.create")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
