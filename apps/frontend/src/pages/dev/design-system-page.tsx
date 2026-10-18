import { CircleAlert, Clock3, Plus, Settings2 } from "lucide-react";
import { useState } from "react";
import { Amount } from "@/components/base/amount";
import { Badge } from "@/components/base/badge";
import { Button } from "@/components/base/button";
import { Card, CardHeader } from "@/components/base/card";
import { ConfirmDialog, Dialog, DialogActions } from "@/components/base/dialog";
import { Field, Input, Textarea } from "@/components/base/field";
import { IconButton } from "@/components/base/icon-button";
import { Meter } from "@/components/base/meter";
import { PageHeader } from "@/components/base/page-header";
import { SegmentedControl } from "@/components/base/segmented-control";
import { Select } from "@/components/base/select";
import { Stat } from "@/components/base/stat";

const swatches = [
  ["canvas", "bg-canvas"],
  ["surface", "bg-surface"],
  ["surface-muted", "bg-surface-muted"],
  ["line", "bg-line"],
  ["ink", "bg-ink"],
  ["ink-muted", "bg-ink-muted"],
  ["brand", "bg-brand"],
  ["brand-soft", "bg-brand-soft"],
  ["danger", "bg-danger"],
  ["warning", "bg-warning"],
  ["success", "bg-success"],
  ["chart-2", "bg-chart-2"],
] as const;

type Status = "all" | "open" | "overdue" | "paid";

function Showcase({ theme }: { theme: "light" | "dark" }) {
  const [status, setStatus] = useState<Status>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <div
      data-theme={theme}
      className="grid min-w-0 flex-1 basis-[560px] grid-cols-[minmax(0,1fr)] content-start gap-6 bg-canvas p-6 font-sans text-ink sm:p-8"
    >
      <PageHeader
        title={theme === "light" ? "Tema claro" : "Tema escuro"}
        description="Componentes base da proposta D"
        actions={
          <>
            <Button variant="secondary">Nova conta</Button>
            <Button>
              <Plus size={16} aria-hidden="true" /> Nova despesa
            </Button>
          </>
        }
      />
      <Card>
        <CardHeader title="Cores" description="Tokens semânticos" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {swatches.map(([name, className]) => (
            <div key={name} className="grid gap-1.5">
              <span className={`h-12 rounded-control border border-line ${className}`} />
              <span className="text-xs text-ink-muted">{name}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader title="Botões" />
        <div className="flex flex-wrap items-center gap-2">
          <Button>Primário</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="ghost">Discreto</Button>
          <Button variant="danger">Excluir</Button>
          <Button size="sm">Pequeno</Button>
          <Button disabled>Desativado</Button>
          <IconButton label="Configurações">
            <Settings2 size={18} aria-hidden="true" />
          </IconButton>
          <IconButton label="Configurações" variant="secondary">
            <Settings2 size={18} aria-hidden="true" />
          </IconButton>
        </div>
      </Card>
      <Card>
        <CardHeader title="Situação" />
        <div className="flex flex-wrap gap-2">
          <Badge tone="danger" icon={<CircleAlert size={13} aria-hidden="true" />}>
            Vencida
          </Badge>
          <Badge tone="warning" icon={<Clock3 size={13} aria-hidden="true" />}>
            Em 2 dias
          </Badge>
          <Badge tone="success">Paga</Badge>
          <Badge tone="brand">Recorrente</Badge>
          <Badge>Em aberto</Badge>
        </div>
        <div className="mt-5">
          <SegmentedControl<Status>
            label="Filtrar por situação"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "Todas", count: 5 },
              { value: "open", label: "Em aberto", count: 4 },
              { value: "overdue", label: "Vencidas", count: 1, tone: "danger" },
              { value: "paid", label: "Pagas", count: 1 },
            ]}
          />
        </div>
      </Card>
      <Card>
        <CardHeader title="Campos" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Descrição" hint="Como aparece no extrato">
            {(control) => <Input {...control} placeholder="Ex.: Mercado" />}
          </Field>
          <Field label="Valor" error="Informe um valor maior que zero">
            {(control) => <Input {...control} inputMode="decimal" defaultValue="0,00" />}
          </Field>
          <Field label="Categoria">
            {(control) => (
              <Select
                id={control.id}
                defaultValue="food"
                options={[
                  { value: "food", label: "Alimentação" },
                  { value: "housing", label: "Moradia" },
                  { value: "services", label: "Serviços" },
                ]}
              />
            )}
          </Field>
          <Field label="Observações" className="sm:col-span-2">
            {(control) => <Textarea {...control} />}
          </Field>
        </div>
      </Card>
      <Card tone="brand">
        <div className="grid gap-4">
          <span className="text-sm font-semibold opacity-85">Gasto em outubro</span>
          <Amount value={1015} className="text-5xl font-extrabold tracking-tight" />
          <Meter
            label="29% do orçamento usado"
            max={3500}
            variant="inverse"
            segments={[
              { value: 960, color: "inverse" },
              { value: 55, color: "inverse-muted" },
            ]}
          />
        </div>
      </Card>
      <Card>
        <div className="grid gap-6 sm:grid-cols-3">
          <Stat label="A pagar" value={<Amount value={2700} />} detail="4 contas" />
          <Stat label="Vencidas" tone="danger" value={<Amount value={680} />} />
          <Stat label="Pagas no mês" tone="success" value={<Amount value={195} />} />
        </div>
        <Meter
          className="mt-5"
          label="Despesas por categoria"
          max={3500}
          segments={[
            { value: 960, color: "chart-1" },
            { value: 55, color: "chart-2" },
          ]}
        />
        <p className="mb-0 mt-4 text-sm text-ink-muted">
          Despesa: <Amount value={140} negative className="font-bold text-ink" />
        </p>
      </Card>
      <Card>
        <CardHeader title="Diálogos" />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setDialogOpen(true)}>
            Abrir diálogo
          </Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Abrir confirmação
          </Button>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Nova despesa"
          description="Registre um gasto do mês."
        >
          <Field label="Descrição">{(control) => <Input {...control} />}</Field>
          <DialogActions>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setDialogOpen(false)}>Salvar</Button>
          </DialogActions>
        </Dialog>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Excluir esta conta?"
          description="Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          onConfirm={() => setConfirmOpen(false)}
        />
      </Card>
    </div>
  );
}

export function DesignSystemPage() {
  return (
    <main className="flex min-h-screen flex-wrap">
      <Showcase theme="light" />
      <Showcase theme="dark" />
    </main>
  );
}
