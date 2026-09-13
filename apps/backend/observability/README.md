# Observabilidade do BitFinance

API e MCP enviam traces, métricas e logs por OTLP ao Grafana Alloy. Somente o
Alloy recebe as credenciais de ingestão do Grafana Cloud. O frontend não participa
deste pipeline.

```text
MCP tool → HttpClient → API → PostgreSQL
    └──────── mesmo trace W3C ────────┘

API + MCP ── OTLP ──> Alloy ── HTTPS OTLP ──> Grafana Cloud
                       ├─ probes privados de readiness
                       └─ métricas do próprio coletor
```

## Configuração e deploy

1. Na stack existente do Grafana Cloud, obtenha o endpoint OTLP e o ID em
   **OpenTelemetry > Configure**. Crie uma chave de ingestão com `metrics:write`,
   `logs:write` e `traces:write`.
2. Preencha `GRAFANA_CLOUD_OTLP_ENDPOINT`, `GRAFANA_CLOUD_INSTANCE_ID` e
   `GRAFANA_CLOUD_API_KEY` no `.env` ignorado do diretório de deploy. O endpoint
   deve incluir o caminho `/otlp` informado pelo Grafana. Nunca versione esses valores.
3. `OBSERVABILITY_ENABLED=true` habilita os exporters das aplicações em produção;
   `OTEL_TRACE_SAMPLING_RATIO=1.0` mantém inicialmente todos os traces. O ambiente
   de desenvolvimento continua com exportação desligada por padrão.
4. `MCP_BIND_ADDRESS` pode apontar para o IP privado do Tailscale. O padrão é
   `127.0.0.1`. OTLP não tem portas publicadas, e a interface do Alloy está apenas
   em `127.0.0.1:12345`. Não exponha essas interfaces à internet.
5. Os workflows de release copiam os arquivos Compose, `config.alloy` e
   `deploy.sh` do commit da release para `DEPLOY_PATH`, preservando o `.env`.
   O padrão dos dois workflows é `/opt/bitfinance/apps/backend`. PostgreSQL/cache
   precisam estar previamente inicializados nesse host; a release não os recria.

O deploy executa migrations com exportação desabilitada, valida `config.alloy` com
a imagem implantada e compara seu SHA-256 com a última configuração pronta. Uma
mudança força a recriação do Alloy; o hash só é persistido depois que
`http://127.0.0.1:12345/-/ready` responde com sucesso. Em seguida, o script aguarda
até 120 segundos pelo health check da aplicação e consulta `/health/ready` dentro
do container. Falha de validação, download, inicialização ou readiness do Alloy
gera um aviso; falha da aplicação ou da migration encerra o job com erro.

Para executar manualmente, no diretório de deploy:

```bash
IMAGE_TAG=<versao-api> bash observability/deploy.sh backend
MCP_IMAGE_TAG=<versao-mcp> bash observability/deploy.sh mcp
```

Não execute `docker compose config` sem `--quiet` ou `--services` em logs
compartilhados: a configuração expandida contém segredos.

## Observabilidade local opcional

O Compose padrão mantém os exporters e o perfil `observability` desligados. Para
usar o pipeline local, preencha no `.env` uma credencial de ingestão dedicada ao
desenvolvimento (`GRAFANA_CLOUD_OTLP_ENDPOINT`, `GRAFANA_CLOUD_INSTANCE_ID` e
`GRAFANA_CLOUD_API_KEY`) e defina `OBSERVABILITY_ENABLED=true`. Depois execute:

```bash
cd apps/backend
docker compose -f docker-compose.yml -f docker-compose.override.yml \
  -f docker-compose.observability.yml --profile observability up -d --build
curl -fsS http://127.0.0.1:12345/-/ready
```

O overlay inclui API, MCP e Alloy, envia API/MCP ao endpoint interno
`http://bitfinance-alloy:4317` e publica a administração e os receptores OTLP
somente em loopback (`12345`, `4317` e `4318`). Ele exige um endpoint real e não
usa o destino descartável da composição base.

Para uma API ou um MCP iniciado com `dotnet run`, mantenha o Alloy do overlay em
execução e exporte estas variáveis no processo:

```bash
export Observability__Enabled=true
export Observability__Environment=development
export OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4317
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
```

No Grafana Cloud, consulte `deployment_environment_name="development"`: em
Application Observability selecione `bitfinance-api` ou `bitfinance-mcp`; em Tempo
use `{ resource.deployment.environment.name = "development" }`; em Loki use
`{service_name=~"bitfinance-(api|mcp)"}`; e em Explore/Prometheus consulte, por
exemplo, `bitfinance_notification_delivery_backlog`. Remova o overlay ou volte
`OBSERVABILITY_ENABLED=false` para retornar ao padrão sem exportação.

## Dashboard e alertas reproduzíveis

`grafana/dashboards/bitfinance-operations.json` contém 26 painéis. Importe o JSON
na interface do Grafana e selecione a fonte Prometheus da stack, ou use o script
abaixo. A variável `environment` começa em `production`. Os painéis abrangem
readiness, RED HTTP, dependências, tools, workers, outbox, runtime .NET e coletor.
As consultas HTTP excluem os endpoints de health.

`grafana/alerts/bitfinance-alerts.json` contém 17 regras **gerenciadas pelo
Grafana**, em formato de payload da API de provisioning. Não é um arquivo para
importação direta no Mimir nem um arquivo de provisioning do servidor Grafana.
O script cria/atualiza os UIDs `bf-*` no grupo `bitfinance-operations` e verifica
as regras após a gravação. Um novo deploy da aplicação não altera os alertas.

Prepare um arquivo revisável, sem fazer requisições à stack:

```bash
python3 observability/grafana/provision.py \
  --grafana-url https://<stack>.grafana.net \
  --prometheus-uid <uid-prometheus> > /tmp/bitfinance-grafana-preview.json
```

Para aplicar, use uma conta de serviço do Grafana autorizada a gerenciar a pasta,
dashboard e alertas. Forneça `GRAFANA_SERVICE_ACCOUNT_TOKEN` por um gerenciador de
segredos/variável de ambiente e repita o comando com `--apply`. A chave OTLP de
escrita não concede essa permissão de administração. O script atualiza somente
os recursos BitFinance; não modifica contact points nem políticas de notificação.
Configure o destino das notificações pela política `application=bitfinance` e
verifique um alerta de teste antes de considerar a ativação operacional concluída.

| Alerta | Condição inicial |
| --- | --- |
| API/MCP indisponível | Readiness privada falhando por 2 min |
| API com erros | 5xx > 5%, ao menos 5 requests em 5 min, sustentado por 2 min |
| API lenta | p95 > 1 s por 10 min, com ao menos 5 requests em 5 min |
| MCP com erros | > 5%, ao menos 5 calls em 10 min, sustentado por 2 min |
| Worker falhando | Aumento do contador de falhas na última hora, por 2 min |
| Workers atrasados | Bill > 2 h, dispatcher > 5 min, cleanup > 30 h; tolerância de 5 min |
| Outbox atrasado | Idade > 5 min, sustentada por 10 min |
| Outbox crescendo | Tendência positiva por 10 min, sustentada por 10 min |
| Entregas falhando | Retry ou falha terminal nos últimos 15 min, sustentado por 2 min |
| Entregas atrasadas | Idade da entrega pendente mais antiga > 5 min, sustentada por 10 min |
| API/MCP sem telemetria | Sem métricas de memória por 5 min |
| Alloy sem telemetria | Sem self-scrape por 5 min |
| Alloy degradado | Falhas de exportação persistentes por 5 min |

Ausência de tráfego não dispara os alertas RED. Ausência de telemetria tem regras
próprias; falhas de avaliação das consultas entram em estado `Error` no Grafana.
O timestamp zero de um worker significa que ele ainda não terminou com sucesso
desde a inicialização, e deixa de ser tratado como uma execução saudável.

As sondas locais verificam também o MCP privado. Para cobrir DNS, TLS e acesso
público à API de fora do host, configure adicionalmente um check HTTP de Synthetic
Monitoring para `https://<api>/health/ready`, intervalo de 60 s, status esperado
200 e alerta após 2 min. A URL pública e a escolha de probes pertencem ao ambiente;
o repositório não cria checks pagos nem publica o MCP para permitir essa sondagem.

## Consultas e investigação

Os nomes OTLP com pontos viram nomes Prometheus com underscores; histogramas em
segundos usam `_seconds_bucket`, contadores usam `_total`. As aplicações aparecem
com `job="bitfinance/bitfinance-api"` e `job="bitfinance/bitfinance-mcp"`.
`deployment_environment_name` separa os ambientes. Os atributos de recurso também
podem ser consultados no `target_info`.

- No **Application Observability**, selecione o serviço e o ambiente para ver RED,
  dependências e traces. Confirme o cadastro/configuração desse recurso na stack.
- Em **Explore / Tempo**, procure `{ resource.service.namespace = "bitfinance" }`.
  Uma chamada MCP deve conter `mcp.tool`, um client HTTP, o servidor API e
  `postgresql.command`. Use o `traceID` para abrir o mesmo trace em outros painéis.
- Em **Explore / Loki**, comece com `{service_name="bitfinance-api"}` e filtre o
  campo de metadados `trace_id`. O console JSON usa `TraceId` e `SpanId`; no OTLP
  eles são campos de correlação próprios do protocolo.
- Ferramentas usam somente `mcp.tool.name` e `outcome`. Workers usam `worker.name`
  e `outcome`, limitados aos nomes e resultados previstos no código.
- Os backlogs de outbox e entregas são obtidos por consultas agregadas, no máximo
  uma vez por minuto, inclusive quando a consulta falha. Não existem consultas no
  callback de métricas. Resultados do dispatcher têm a dimensão limitada `stage`
  (`outbox` ou `delivery`).

## Privacidade e limites

O mesmo processamento sanitiza os logs antes do console e do OTLP. Mantemos
categoria, EventId, template constante da aplicação, contagens permitidas,
tipo da exceção e IDs de trace/span. Mensagens e stacks de exceções, mensagens
arbitrárias de frameworks, SQL, scopes HTTP e atributos de usuário não saem.
Isso reduz o detalhe textual dos erros; use categoria, EventId e trace para
identificar o caminho afetado. Ao adicionar logs, use templates constantes;
nunca coloque dados do usuário em interpolação ou no próprio template.

Os traces removem URLs completas, caminhos brutos, query strings e atributos de
SQL. A conexão Npgsql recebe o nome fixo `bitfinance`, e uma allowlist filtra as
dimensões de métricas antes da exportação, evitando connection strings como labels.
As tools não registram argumentos/conteúdo retornado; somente o sinal `IsError`
do protocolo é usado para classificar o resultado.

O Alloy tem limite de 192 MiB e 0,25 CPU, memory limiter de 150 MiB, lotes limitados
a 1024 itens e filas em memória de até 16 MiB por sinal. Retries duram até 5 min;
uma interrupção longa pode descartar telemetria. Não há garantia de entrega nem
fila persistente. O produto permanece independente da disponibilidade do coletor.

## Resposta a falhas

| Sintoma | Ação |
| --- | --- |
| API ready=503, live=200 | Verifique PostgreSQL e, se habilitado, Redis. A resposta pública não contém detalhes internos. |
| MCP ready=503, live=200 | Verifique a readiness da API, DNS/rede Docker e configuração da URL. A sonda não faz login. |
| Readiness saudável, chamadas MCP falham | Verifique a conta do agente, token e resultados `outcome=error`; a readiness não valida credenciais por login. |
| Alloy ausente | Consulte `docker compose ps bitfinance-alloy` e `curl -fsS http://127.0.0.1:12345/-/ready` no host. |
| Alloy pronto, dados ausentes | Prontidão valida a configuração, não o sucesso do envio. Verifique filas, falhas/retries, endpoint/região e chave de ingestão. |
| Worker atrasado | Verifique falhas e duração do ciclo; erros tratados no worker de bills também marcam o ciclo como falho. |
| Outbox crescente | Verifique dispatcher, banco e provedor de e-mail; não apague/reprocesse filas indiscriminadamente. |
| Entregas falhando/atrasadas | Consulte `stage="delivery"`, `outcome`, backlog, idade e `LastError`; valide o provedor antes de reprocessar. |

`/health` permanece um alias de `/health/ready`. Nenhum health check escreve em
DB/cache, e `/health/live` não consulta dependências. `docker compose ps` e logs
da aplicação/Alloy ajudam na investigação; não imprima o `.env`.

## Validação e ativação

Na raiz do repositório:

```bash
dotnet build apps/backend/BitFinance.sln --disable-build-servers -v:minimal
dotnet test apps/backend/BitFinance.sln --no-build --disable-build-servers -v:minimal
dotnet build apps/mcp-server/src/BitFinance.MCP.csproj --disable-build-servers -v:minimal
dotnet test apps/mcp-server/tests/BitFinance.MCP.UnitTests/BitFinance.MCP.UnitTests.csproj --disable-build-servers -v:minimal
python3 -m venv /tmp/bitfinance-otel-venv
/tmp/bitfinance-otel-venv/bin/pip install -r apps/backend/observability/requirements-test.txt
/tmp/bitfinance-otel-venv/bin/python apps/backend/observability/validate.py
/tmp/bitfinance-otel-venv/bin/python apps/backend/observability/smoke-test.py
```

O teste integrado usa os binários Debug, PostgreSQL descartável, Alloy com os
limites de produção e um receptor OTLP de teste. Ele não lê `.env` nem envia dados
ao Cloud. Verifica ambos os protocolos OTLP, correlação MCP → API → DB, logs,
métricas, dados sentinela, migrations sem exporter, falhas do Alloy e do DB e
recuperação. Os containers/volumes criados pelo teste são removidos ao final.
A workflow **Observability Validation** executa isso em PRs e na `main`.

Após a release e a aplicação dos artefatos na stack real, ainda é necessário
registrar: serviços e versões corretos, um trace e seus logs correlacionados,
dashboard com dados, disparo/resolução de alerta de teste, roteamento de
notificações e volume/custo observado. O teste local não comprova essas condições
em produção. Reavalie sampling e thresholds após 7 e 30 dias e registre os valores
escolhidos e a data no histórico operacional.

## Rotação e rollback

Crie outra chave com as mesmas permissões de ingestão, substitua-a no `.env` do
host e recrie apenas `bitfinance-alloy`. Confirme o envio antes de revogar a chave
anterior. A API e o MCP não precisam receber essa credencial.

Para desligar exportação sem remover health checks e logging sanitizado, defina
`OBSERVABILITY_ENABLED=false` no `.env` e recrie API/MCP com as **mesmas tags** de
imagem em uso (`IMAGE_TAG` e `MCP_IMAGE_TAG`). Pare o Alloy se necessário. Preserve
os dados de PostgreSQL/Redis e evite `down -v`. Silencie temporariamente os alertas
de telemetria ausente durante uma manutenção planejada.

## Referências

- [Alloy e Application Observability](https://grafana.com/docs/opentelemetry/collector/grafana-alloy/)
- [Ponte Prometheus → OTLP](https://grafana.com/docs/alloy/latest/reference/components/otelcol/otelcol.receiver.prometheus/)
- [Conversão OTLP no Grafana Cloud](https://grafana.com/docs/grafana-cloud/observe-and-act/send-data/otlp/otlp-format-considerations/)
- [API de provisioning de alertas](https://grafana.com/docs/grafana/latest/developer-resources/api-reference/http-api/api-legacy/alerting_provisioning/)
- [Métricas Npgsql e nome do pool](https://www.npgsql.org/doc/diagnostics/metrics.html)
