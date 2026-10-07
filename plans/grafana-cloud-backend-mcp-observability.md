# Plano de observabilidade do back-end e MCP Server com Grafana Cloud

## Metadados

- **Status:** implementação no repositório concluída; ativação/aceite no Grafana Cloud pendentes de deploy e acesso administrativo à stack
- **Planejado em:** 2026-08-01
- **Commit de referência:** `8d4dd89`
- **Escopo:** `apps/backend`, `apps/mcp-server`, composição/deploy desses serviços e artefatos de observabilidade
- **Fora do escopo:** `apps/frontend`
- **Branch sugerida para a implementação:** `codex/grafana-cloud-observability`
- **Estratégia de revisão original:** uma fase por vez. Em 2026-09-07, o usuário autorizou a revisão e conclusão de todas as fases, commit, push e abertura de PR; as paradas intermediárias abaixo ficam como registro do plano original.

## Estado da entrega em 2026-09-07

- Fases 1–4 revisadas, incluindo correções de privacidade em logs/métricas, identificação do pool Npgsql, resultado `IsError` de tools, timeout versus cancelamento e falhas tratadas de workers.
- Fase 5: configuração do Alloy, limites, sondas privadas, self-monitoring e integração dos deployments implementados e testados localmente com OTLP/gRPC e HTTP/protobuf.
- Fase 6: dashboard de 26 painéis, 15 alertas gerenciados pelo Grafana, script de provisioning, runbook e CI de integração adicionados.
- Validação de produção/Cloud, destinos de notificação, Synthetic Monitoring público e medição de custo continuam como etapas de ativação do ambiente; não são comprovadas pela implementação ou pelo teste local.
- Procedimentos e limitações atuais: [runbook](../apps/backend/observability/README.md).

## Objetivo

Instrumentar o BitFinance para que o back-end e o MCP Server emitam logs estruturados, métricas e traces correlacionados, tenham endpoints reais de liveness/readiness e enviem a telemetria ao Grafana Cloud por meio do Grafana Alloy.

Ao final, deve ser possível:

1. verificar rapidamente se API, MCP, PostgreSQL, cache e coletor estão operacionais;
2. localizar falhas por serviço, endpoint, dependência, worker ou tool MCP;
3. seguir uma requisição do MCP até a API usando o mesmo trace distribuído;
4. acompanhar taxa, erros e latência das requisições, workers e tools;
5. detectar atraso ou falha no processamento de notificações e rotinas em background;
6. investigar um incidente sem expor e-mail, token, conteúdo financeiro, corpo de requisição/resposta, nome de arquivo ou documento em base64.

## Resultado arquitetural esperado

```text
bitfinance-api ─┐
                ├─ OTLP/gRPC na rede Docker ─> Grafana Alloy ─> Grafana Cloud OTLP
bitfinance-mcp ─┘

MCP tool ─> HttpClient instrumentado ─> API ASP.NET instrumentada ─> PostgreSQL
   └──────────────────────────── mesmo trace distribuído ─────────────────────┘
```

O Alloy será o único componente que conhecerá as credenciais do Grafana Cloud. A indisponibilidade do Alloy ou da internet não poderá impedir a API ou o MCP de iniciar e atender requisições; o exporter fará tentativas em segundo plano dentro de limites de memória.

## Decisões técnicas fechadas

### Stack e versões iniciais

Usar pacotes OpenTelemetry oficiais e independentes de fornecedor, em vez da distribuição `Grafana.OpenTelemetry`. Isso mantém o código portável e deixa a integração específica com o Grafana concentrada no Alloy.

Versões planejadas em 2026-08-01:

| Dependência | Versão | Aplicação |
|---|---:|---|
| `OpenTelemetry.Extensions.Hosting` | `1.17.0` | API e MCP |
| `OpenTelemetry.Exporter.OpenTelemetryProtocol` | `1.17.0` | API e MCP |
| `OpenTelemetry.Instrumentation.AspNetCore` | `1.17.0` | API e MCP |
| `OpenTelemetry.Instrumentation.Http` | `1.17.0` | API e MCP |
| `OpenTelemetry.Instrumentation.Runtime` | `1.17.0` | API e MCP |
| `Npgsql.OpenTelemetry` | `10.0.3` | API |
| `Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore` | `10.0.10` | API |
| imagem `grafana/alloy` | `v1.18.0` | composição Docker |

Regras para dependências:

- fixar versões exatas; não usar `latest`, wildcard ou prerelease;
- manter todos os pacotes OpenTelemetry na mesma versão;
- preservar a compatibilidade com `.NET 10` e `linux/arm64`;
- antes de adicionar os pacotes, executar `dotnet list package --vulnerable --include-transitive` nos dois projetos;
- parar se uma versão acima estiver retirada, vulnerável ou incompatível e registrar a substituição proposta antes de continuar.

### Identidade dos serviços

| Atributo de recurso | API | MCP |
|---|---|---|
| `service.name` | `bitfinance-api` | `bitfinance-mcp` |
| `service.namespace` | `bitfinance` | `bitfinance` |
| `service.version` | versão do assembly (`1.12.0` no baseline) | versão do assembly (`0.5.0` no baseline) |
| `deployment.environment.name` | configuração do ambiente, por exemplo `development` ou `production` | idem |
| `service.instance.id` | hostname/container id gerado em runtime | hostname/container id gerado em runtime |

O processo `--migrate` da API deve executar com exportação desabilitada para não aparecer como uma instância saudável da API e não poluir os indicadores de produção.

### Sinais e retenção inicial

- **Logs:** estruturados via `Microsoft.Extensions.Logging`, em console e OTLP; aplicação em `Information` ou superior e frameworks em `Warning` ou superior em produção.
- **Traces:** ASP.NET Core, `HttpClient`, Npgsql, workers e tools MCP.
- **Métricas:** ASP.NET Core, `HttpClient`, runtime .NET, Npgsql e métricas de domínio de baixa cardinalidade.
- **Amostragem inicial:** `parentbased_traceidratio` com razão `1.0`, configurável. Para o baixo volume esperado de um projeto pessoal, começar com 100% facilita investigar os primeiros incidentes. Reduzir somente com evidência de volume/custo.
- **Health checks:** nunca são dependência da inicialização do pipeline de observabilidade e são filtrados dos traces de requisição para evitar ruído.
- **Profiles:** fora do escopo desta entrega.

### Contrato de privacidade e cardinalidade

É proibido registrar ou anexar a logs, spans, eventos ou métricas:

- tokens, cookies, cabeçalhos `Authorization`, credenciais ou connection strings;
- e-mail, nome, identificadores de usuário/organização ou IDs de entidades financeiras;
- descrições, notas, valores monetários, filtros de busca ou query strings com valores;
- corpo de requisição/resposta, retorno de tool MCP ou resposta bruta da API;
- nome/caminho de arquivo, storage key, conteúdo de anexo ou base64;
- SQL, parâmetros SQL ou valores de comandos Npgsql;
- argumentos fornecidos às tools MCP.

Dimensões permitidas devem pertencer a conjuntos pequenos e conhecidos, como `service.name`, rota normalizada, método HTTP, status HTTP, `worker.name`, `mcp.tool.name` e `outcome`. Nunca usar um identificador criado pelo usuário como label.

### Semântica de saúde

| Serviço | Endpoint | Semântica |
|---|---|---|
| API | `/health/live` | processo ASP.NET está vivo; não consulta dependências |
| API | `/health/ready` | PostgreSQL responde e, quando `CacheEnabled=true`, o cache configurado responde |
| API | `/health` | alias temporário de `/health/ready` para compatibilidade |
| MCP | `/health/live` | processo MCP está vivo; não chama a API |
| MCP | `/health/ready` | MCP está configurado e consegue obter sucesso de `bitfinance-api/health/ready` |
| MCP | `/health` | alias temporário de `/health/ready` para compatibilidade |
| Alloy | `/-/ready` | configuração foi carregada e o coletor está pronto |

As respostas de health não devem expor nomes de hosts, connection strings, stack traces ou detalhes internos. O `Dockerfile` deve usar readiness no `HEALTHCHECK`; um estado `unhealthy` não autoriza reiniciar dependências nem executar ações destrutivas automaticamente.

## Escopo de arquivos previsto

### Arquivos existentes que poderão ser alterados

- `apps/backend/src/BitFinance.API/Program.cs`
- `apps/backend/src/BitFinance.API/BitFinance.API.csproj`
- `apps/backend/src/BitFinance.API/appsettings.json`
- `apps/backend/src/BitFinance.API/appsettings.Development.json`
- `apps/backend/src/BitFinance.API/Extensions/LoggingExtensions.cs`
- `apps/backend/src/BitFinance.API/Extensions/MiddlewareExtensions.cs`
- `apps/backend/src/BitFinance.API/Extensions/CachingExtensions.cs`
- `apps/backend/src/BitFinance.API/Middlewares/GlobalExceptionHandlerMiddleware.cs`
- `apps/backend/src/BitFinance.API/Controllers/BillsController.cs`
- `apps/backend/src/BitFinance.API/Controllers/ExpensesController.cs`
- `apps/backend/src/BitFinance.API/Controllers/IdentityController.cs`
- `apps/backend/src/BitFinance.API/Services/S3FileStorageService.cs`
- `apps/backend/src/BitFinance.API/Services/AttachmentService.cs`
- `apps/backend/src/BitFinance.API/Services/BillStatusWorkerService.cs`
- `apps/backend/src/BitFinance.API/Services/NotificationDispatchWorkerService.cs`
- `apps/backend/src/BitFinance.API/Services/RefreshTokenCleanupService.cs`
- `apps/backend/src/BitFinance.API/Services/NotificationDispatcher.cs`, apenas nos pontos necessários para métricas
- `apps/backend/Dockerfile`
- `apps/backend/docker-compose.yml`
- `apps/backend/docker-compose.prod.yml`
- `apps/backend/.env.prod.example`
- `apps/mcp-server/src/Program.cs`
- `apps/mcp-server/src/BitFinance.MCP.csproj`
- `apps/mcp-server/src/BitFinanceApiClient.cs`
- `apps/mcp-server/src/BitFinanceApiException.cs`
- `apps/mcp-server/src/BitFinanceTokenProvider.cs`
- `apps/mcp-server/Dockerfile`
- `apps/backend/tests/BitFinance.API.UnitTests/BitFinance.API.UnitTests.csproj`
- `apps/mcp-server/tests/BitFinance.MCP.UnitTests/BitFinance.MCP.UnitTests.csproj`
- `.github/workflows/main-validation.yml`, somente se os novos testes exigirem ajuste explícito
- `.github/workflows/backend-docker-publish.yml`, para o gate de readiness da API
- `.github/workflows/mcp-docker-publish.yml`, para o gate de readiness do MCP

### Arquivos novos previstos

Os nomes podem acompanhar as convenções do diretório, mas as responsabilidades devem permanecer separadas:

- `apps/backend/src/BitFinance.API/Extensions/ObservabilityExtensions.cs`
- `apps/backend/src/BitFinance.API/Extensions/HealthCheckExtensions.cs`
- `apps/backend/src/BitFinance.API/Observability/BitFinanceTelemetry.cs`
- `apps/backend/src/BitFinance.API/Observability/WorkerTelemetry.cs`
- `apps/backend/src/BitFinance.API/Health/DistributedCacheHealthCheck.cs`
- `apps/mcp-server/src/Extensions/ObservabilityExtensions.cs`
- `apps/mcp-server/src/Extensions/HealthCheckExtensions.cs`
- `apps/mcp-server/src/Observability/BitFinanceMcpTelemetry.cs`
- `apps/mcp-server/src/Observability/McpToolTelemetryFilter.cs`
- `apps/mcp-server/src/Health/BackendReadinessHealthCheck.cs`
- `apps/backend/tests/BitFinance.API.UnitTests/LoggingPrivacyTests.cs`
- `apps/backend/tests/BitFinance.API.UnitTests/DistributedCacheHealthCheckTests.cs`
- `apps/backend/tests/BitFinance.API.UnitTests/ObservabilityConfigurationTests.cs`
- `apps/backend/tests/BitFinance.API.UnitTests/WorkerTelemetryTests.cs`
- `apps/mcp-server/tests/BitFinance.MCP.UnitTests/BitFinanceApiExceptionTests.cs`
- `apps/mcp-server/tests/BitFinance.MCP.UnitTests/BackendReadinessHealthCheckTests.cs`
- `apps/mcp-server/tests/BitFinance.MCP.UnitTests/ObservabilityConfigurationTests.cs`
- `apps/mcp-server/tests/BitFinance.MCP.UnitTests/McpToolTelemetryFilterTests.cs`
- `apps/backend/observability/alloy/config.alloy`
- `apps/backend/observability/grafana/dashboards/bitfinance-operations.json`
- `apps/backend/observability/README.md`

### Fora do escopo e limites

- nenhum arquivo de `apps/frontend`;
- nenhuma migration ou alteração de schema do PostgreSQL;
- nenhuma alteração de regras financeiras, contratos HTTP, autenticação, autorização, armazenamento S3 ou envio de e-mail;
- nenhuma exposição pública adicional do MCP, do OTLP ou da interface administrativa do Alloy;
- nenhum token real ou endpoint privado em arquivos versionados;
- nenhum agente APM proprietário dentro das aplicações;
- nenhum profiling contínuo nesta entrega;
- nenhuma criação automática de recursos pagos no Grafana Cloud;
- nenhuma refatoração ampla não necessária para observabilidade.

## Protocolo obrigatório de execução e revisão

1. Implementar somente uma fase por vez.
2. Preservar alterações do usuário e não exigir worktree limpo.
3. Ao concluir a fase, executar toda a verificação indicada nela.
4. Apresentar o diff da fase, arquivos alterados, testes executados, resultado e evidência manual.
5. Informar riscos ou desvios do plano.
6. **Parar e aguardar aprovação explícita do usuário. Não iniciar a fase seguinte.**
7. Deixar as mudanças da fase no working tree para revisão. Não criar commit sem solicitação; apenas sugerir a mensagem convencional indicada.

Antes da primeira fase, registrar o baseline:

```bash
git rev-parse --short HEAD
git status --short
git diff --stat 8d4dd89 -- apps/backend apps/mcp-server .github/workflows
```

Parar antes de implementar se houver mudanças não relacionadas que se sobreponham aos arquivos da fase, se o commit de referência tiver divergido materialmente em `Program.cs`, `.csproj`, Docker Compose ou workflows, ou se já existir outra implementação de OpenTelemetry/health checks nesses serviços.

## Fase 1 — Logging estruturado e barreira de privacidade

### Meta

Criar uma base de logging consistente e segura antes de exportar qualquer dado para fora do host.

### Implementação

1. Padronizar API e MCP em `Microsoft.Extensions.Logging`.
2. Na API, substituir os usos estáticos de `Serilog.Log` por `ILogger<T>` já injetado ou por injeção explícita quando necessário.
3. Configurar console legível em desenvolvimento e JSON estruturado em produção.
4. Remover `Serilog.AspNetCore`, a configuração `Serilog` dos appsettings e código residual somente após `rg` confirmar que não há uso do namespace/pacote.
5. Não ativar `UseHttpLogging` nem qualquer captura de request/response body. Remover o registro inútil de `AddHttpLogging` se não houver uso legítimo.
6. Trocar `Console.WriteLine` do middleware global por `ILogger<GlobalExceptionHandlerMiddleware>.LogError(exception, ...)`, preservando o objeto da exceção e um evento estável, sem dados da requisição.
7. Revisar logs conhecidos com risco de PII:
   - remover e-mail dos eventos de identidade e token do MCP;
   - remover nome de arquivo, caminho e storage key dos eventos de anexos/S3;
   - manter apenas ação, resultado e categoria estável do erro.
8. Tornar `BitFinanceApiException` segura:
   - mensagem somente com método HTTP, status code e caminho sem query string;
   - não incluir corpo bruto da resposta;
   - não anexar resposta bruta ao log ou ao retorno da tool;
   - preservar informação suficiente para distinguir erro de cliente, servidor e indisponibilidade.
9. Garantir que exceções sejam registradas uma vez no limite correto. Evitar registrar e relançar a mesma exceção em várias camadas.

### Testes e verificações

Adicionar testes para a sanitização de `BitFinanceApiException` com valores sentinela em query string e response body. Confirmar que os sentinelas não aparecem em `Message` ou `ToString()`.

```bash
rg -n "Serilog|Log\.(Error|Warning|Information)|Console\.WriteLine|AddHttpLogging|UseHttpLogging" apps/backend/src apps/mcp-server/src
rg -n -i "email|filename|storagepath|authorization|responsebody|base64" apps/backend/src/BitFinance.API apps/mcp-server/src
dotnet build apps/backend/BitFinance.sln --disable-build-servers -v:minimal
dotnet test apps/backend/BitFinance.sln --no-build --disable-build-servers -v:minimal
dotnet build apps/mcp-server/src/BitFinance.MCP.csproj --disable-build-servers -v:minimal
dotnet test apps/mcp-server/tests/BitFinance.MCP.UnitTests/BitFinance.MCP.UnitTests.csproj --disable-build-servers -v:minimal
```

Resultado esperado: builds e testes verdes; nenhum uso estático de Serilog; nenhum corpo bruto/query sensível em exceções; os logs de produção são JSON e os logs de desenvolvimento continuam legíveis.

### Checkpoint 1 — Revisão da fundação de logs

Parar e apresentar:

- diff completo da fase;
- lista de eventos que tiveram PII removida;
- saída dos quatro comandos de build/test;
- amostra de um log de erro da API e um do MCP com dados sentinela redigidos;
- confirmação de que nenhum exporter externo foi habilitado ainda;
- mensagem de commit sugerida: `refactor(observability): standardize safe structured logging`.

**Não iniciar a Fase 2 sem aprovação explícita.**

## Fase 2 — Liveness, readiness e contratos operacionais

### Meta

Substituir os endpoints estáticos que sempre retornam `200` por verificações que representem a saúde real de cada serviço e de suas dependências obrigatórias.

### Implementação

1. API:
   - registrar `AddHealthChecks()`;
   - usar `AddDbContextCheck<ApplicationDbContext>` para PostgreSQL, com tag `ready`;
   - criar `DistributedCacheHealthCheck` que chama `IDistributedCache.GetAsync` em uma chave reservada e inexistente, sem escrita, e registrá-lo somente quando `CacheEnabled=true`;
   - mapear `/health/live` sem checks de dependência;
   - mapear `/health/ready` selecionando checks com tag `ready`;
   - manter `/health` como alias de readiness;
   - responder somente estado agregado e status HTTP `200` ou `503`.
2. MCP:
   - criar um `HttpClient` nomeado exclusivamente para readiness, sem autenticação e com timeout curto;
   - verificar `GET {BitFinanceApiUrl}/health/ready` sem solicitar token do agente;
   - mapear `/health/live`, `/health/ready` e o alias `/health` com a mesma semântica da API.
3. Containers:
   - apontar o `HEALTHCHECK` da API para `/health/ready`;
   - adicionar `HEALTHCHECK` equivalente ao MCP;
   - atualizar Compose para refletir dependências e intervalos sem criar ciclo de inicialização;
   - não incluir Alloy como dependência de readiness das aplicações.
4. A configuração obrigatória do MCP deve falhar cedo quando URL/credenciais estiverem ausentes ou inválidas, mas readiness não deve efetuar login a cada probe.

### Testes e verificações

Adicionar testes unitários para:

- cache habilitado/desabilitado;
- PostgreSQL/cache saudável e indisponível;
- resposta da API `200`, `503`, timeout e erro de rede no check do MCP;
- ausência de detalhes internos no response writer de health.

Executar os quatro comandos de build/test da Fase 1 e, com os serviços locais iniciados:

```bash
curl -fsS http://localhost:8080/health/live
curl -fsS http://localhost:8080/health/ready
docker compose -f apps/backend/docker-compose.yml -f apps/backend/docker-compose.prod.yml config
docker compose -f apps/backend/docker-compose.yml -f apps/backend/docker-compose.prod.yml ps
```

Teste de falha controlada: indisponibilizar somente a dependência de teste, confirmar `/health/live = 200` e `/health/ready = 503`, restaurar a dependência e confirmar recuperação. Não usar esse teste contra dados de produção.

### Checkpoint 2 — Revisão dos health checks

Parar e apresentar:

- diff completo da fase;
- matriz com os status observados em estado saudável, PostgreSQL indisponível, cache indisponível e API indisponível para o MCP;
- saída dos testes e de `docker compose ... config`;
- respostas sanitizadas dos endpoints;
- confirmação de que falha do Alloy não afeta readiness;
- mensagem de commit sugerida: `feat(observability): add service readiness and liveness checks`.

**Não iniciar a Fase 3 sem aprovação explícita.**

## Fase 3 — OpenTelemetry básico na API e no MCP

### Meta

Produzir os três sinais de forma local e testável, ainda sem credenciais do Grafana Cloud.

### Implementação

1. Adicionar os pacotes OpenTelemetry listados nas decisões técnicas.
2. Criar `AddBitFinanceObservability` em cada aplicação, com opções validadas no startup:
   - `Observability:Enabled`;
   - endpoint/protocolo OTLP por `OTEL_EXPORTER_OTLP_ENDPOINT` e `OTEL_EXPORTER_OTLP_PROTOCOL`;
   - ambiente e razão de sampling;
   - resource attributes padronizados.
3. API:
   - traces e métricas de ASP.NET Core e `HttpClient`;
   - métricas do runtime .NET;
   - traces Npgsql via `Npgsql.OpenTelemetry` e métricas nativas do Npgsql;
   - não capturar statements SQL nem parâmetros;
   - filtrar `/health`, `/health/live` e `/health/ready` da instrumentação de requisição.
4. MCP:
   - traces e métricas de ASP.NET Core e `HttpClient`;
   - métricas do runtime .NET;
   - preservar propagação W3C para que a chamada `BitFinanceApiClient -> API` pertença ao trace MCP de entrada.
5. Logs OTLP:
   - adicionar o provider OpenTelemetry sem duplicar eventos no console;
   - incluir scopes, propriedades estruturadas, `TraceId` e `SpanId`;
   - não incluir payloads ou headers.
6. Exportação:
   - desabilitada por padrão no desenvolvimento;
   - habilitada somente quando `Observability:Enabled=true` e o endpoint OTLP for válido;
   - conectividade com o collector não deve ser validada de forma bloqueante no startup.
7. Manter métricas com labels normalizadas por rota; nunca usar URL completa ou query string como label.

### Testes e verificações

Adicionar testes com `ActivityListener`, `MeterListener` e provider de logs em memória para verificar:

- nomes e versões dos dois serviços;
- presença de trace/span nos logs emitidos dentro de uma activity;
- propagação MCP -> API em um teste com `HttpMessageHandler` controlado;
- filtro das rotas de health;
- ausência dos sentinelas `otel-secret-email@example.invalid`, `Bearer otel-secret-token`, `search=otel-secret-query` e `otel-secret-response-body` em todos os sinais capturados.

Executar builds/testes das duas soluções e:

```bash
dotnet list apps/backend/src/BitFinance.API/BitFinance.API.csproj package --vulnerable --include-transitive
dotnet list apps/mcp-server/src/BitFinance.MCP.csproj package --vulnerable --include-transitive
```

Resultado esperado: nenhuma vulnerabilidade conhecida nas dependências adicionadas, serviço e versão corretos, correlação W3C preservada e nenhum dado sentinela exportado.

### Checkpoint 3 — Revisão da instrumentação automática

Parar e apresentar:

- diff completo da fase e lista de pacotes adicionados;
- saída de build, testes e auditoria de pacotes;
- um trace local MCP -> API com os IDs correlacionados;
- inventário de métricas automáticas disponíveis;
- resultado da busca pelos quatro valores sentinela;
- confirmação de que nenhuma credencial Grafana foi adicionada ao código;
- mensagem de commit sugerida: `feat(observability): instrument api and mcp with opentelemetry`.

**Não iniciar a Fase 4 sem aprovação explícita.**

## Fase 4 — Telemetria de domínio e tools MCP

### Meta

Acrescentar sinais de negócio operacional que a instrumentação automática não conhece, sem transformar dados financeiros em telemetria.

### Implementação

1. Criar uma única `ActivitySource` e um único `Meter` por serviço, com nomes estáveis e centralizados.
2. Instrumentar os três workers da API:
   - activity por ciclo, não por entidade;
   - histograma `bitfinance.worker.run.duration` em segundos;
   - contador `bitfinance.worker.run.count`;
   - contador `bitfinance.worker.failure.count`;
   - gauge `bitfinance.worker.last_success` em Unix time;
   - dimensão `worker.name` limitada a `bill_status`, `notification_dispatch` e `refresh_token_cleanup`;
   - `outcome` limitado a `success`, `error` e `cancelled`.
3. Instrumentar o dispatcher/outbox usando agregados:
   - itens obtidos, entregues, reagendados e terminalmente falhos;
   - backlog pendente e idade do item mais antigo, no máximo uma consulta agregada por minuto;
   - nenhuma label com organização, destinatário, mensagem ou ID.
4. Instrumentar tools MCP usando o hook do SDK 1.3.0:
   - registrar `WithRequestFilters(...AddCallToolFilter(...))`;
   - activity por `tools/call` com o nome estável da tool;
   - histograma `bitfinance.mcp.tool.duration`;
   - contador `bitfinance.mcp.tool.invocation.count`;
   - dimensões somente `mcp.tool.name` e `outcome`;
   - não ler, serializar ou anexar `Arguments`/resultado;
   - preservar cancelamento e relançar a exceção original sem alterar o contrato do MCP.
5. Evitar spans duplicados: o filtro mede a execução lógica da tool; a instrumentação ASP.NET mede o transporte e a de `HttpClient` mede a dependência API.

### Testes e verificações

Adicionar testes para:

- um evento por execução, inclusive em erro e cancelamento;
- duração não negativa e unidade correta;
- conjunto fechado de labels;
- todas as tools registradas passarem pelo filtro sem alterar seus resultados;
- argumentos e resultados sentinela não aparecerem em Activity tags, eventos, métricas ou logs;
- falha de telemetria nunca mascarar falha do worker/tool.

Executar os builds/testes das duas soluções. Executar ainda um teste de cardinalidade que faça várias chamadas com IDs, e-mails, valores e buscas diferentes e confirme que o número de séries cresce somente pelo conjunto de tool/worker/outcome, não pelos valores fornecidos.

### Checkpoint 4 — Revisão da telemetria de domínio

Parar e apresentar:

- diff completo da fase;
- catálogo dos instrumentos, unidade, tipo e labels;
- saída dos testes;
- evidência do teste de cardinalidade;
- trace de uma tool MCP contendo o span de tool, `HttpClient`, API e Npgsql, sem argumentos;
- custo adicional medido de consultas do outbox;
- mensagem de commit sugerida: `feat(observability): add worker and mcp tool telemetry`.

**Não iniciar a Fase 5 sem aprovação explícita.**

## Fase 5 — Grafana Alloy e envio ao Grafana Cloud

### Meta

Conectar os sinais validados ao Grafana Cloud sem distribuir credenciais pelas aplicações.

### Pré-requisitos fornecidos fora do Git

- `GRAFANA_CLOUD_OTLP_ENDPOINT` obtido em **OpenTelemetry > Configure**;
- `GRAFANA_CLOUD_INSTANCE_ID`;
- `GRAFANA_CLOUD_API_KEY` com somente `metrics:write`, `logs:write` e `traces:write`;
- stack/região Grafana Cloud já criada.

Se essas informações não estiverem disponíveis, implementar e validar o Alloy localmente, mas parar o checkpoint sem declarar a fase concluída no ambiente Cloud.

### Implementação

1. Adicionar o serviço `bitfinance-alloy` ao Docker Compose com imagem `grafana/alloy:v1.18.0`, compatível com ARM64.
2. Criar `config.alloy` contendo:
   - receiver OTLP gRPC `4317` e HTTP/protobuf `4318` apenas na rede interna;
   - `memory_limiter`, processamento de recursos e `batch`;
   - exporter OTLP/HTTP para o endpoint Grafana Cloud;
   - basic auth lida exclusivamente de variáveis do Alloy;
   - retry e fila limitada para absorver indisponibilidade temporária sem crescimento de memória;
   - nenhuma saída de debug com payload em produção.
3. Expor a UI/health do Alloy `12345` somente em loopback ou na rede interna. Nunca publicar OTLP ou UI na internet.
4. Configurar API e MCP com:

```text
Observability__Enabled=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://bitfinance-alloy:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
Observability__TraceSamplingRatio=1.0
Observability__Environment=production
```

5. Adicionar somente placeholders seguros ao `.env.prod.example`; os três segredos/identificadores reais permanecem no `.env.prod` ignorado ou no mecanismo de secrets do deploy.
6. Definir limites iniciais do Alloy no Compose, começando com `0.25 CPU` e `192 MiB` de memória, e ajustar o `memory_limiter` abaixo do limite do container.
7. Não usar `depends_on: condition: service_healthy` entre aplicações e Alloy: telemetria degradada não pode bloquear o produto.
8. Desabilitar observabilidade no comando/container de migration.

### Testes e verificações

```bash
docker compose -f apps/backend/docker-compose.yml -f apps/backend/docker-compose.prod.yml config
docker compose -f apps/backend/docker-compose.yml -f apps/backend/docker-compose.prod.yml run --rm --no-deps bitfinance-alloy fmt /etc/alloy/config.alloy
curl -fsS http://127.0.0.1:12345/-/ready
curl -fsS http://127.0.0.1:12345/metrics
```

Gerar tráfego controlado com um marcador não sensível e confirmar no Grafana Cloud:

- serviços `bitfinance/bitfinance-api` e `bitfinance/bitfinance-mcp`;
- logs correlacionados por trace;
- trace completo MCP -> API -> PostgreSQL;
- métricas HTTP/runtime e métricas customizadas;
- `deployment.environment.name=production` e versões corretas;
- nenhum valor sentinela de privacidade.

Simular Alloy indisponível por curto período em ambiente local: API e MCP devem continuar saudáveis; após retorno do Alloy, a exportação deve se recuperar sem crescimento ilimitado de memória.

### Checkpoint 5 — Revisão da integração Grafana Cloud

Parar e apresentar:

- diff completo da fase;
- `config.alloy` formatado e saída de `docker compose ... config` sem valores secretos;
- estado `/-/ready` e métricas internas relevantes do Alloy;
- links ou capturas dos dois serviços, de um trace correlacionado e de logs correlacionados no Grafana;
- resultado do teste de indisponibilidade do collector;
- volume aproximado por sinal observado durante o teste;
- confirmação de que credenciais aparecem apenas no processo Alloy;
- mensagem de commit sugerida: `feat(observability): export telemetry through grafana alloy`.

**Não iniciar a Fase 6 sem aprovação explícita.**

## Fase 6 — Dashboards, alertas, gates de deploy e runbook

### Meta

Transformar a telemetria em uma rotina operacional reproduzível e encerrar a entrega com verificação de produção.

### Implementação

1. Usar o service overview nativo do Grafana Application Observability para RED e dependências.
2. Criar e exportar para o Git o dashboard sanitizado `bitfinance-operations.json` com:
   - disponibilidade e status de API/MCP/Alloy;
   - request rate, taxa de erro e p50/p95/p99 por rota normalizada;
   - latência MCP -> API e API -> PostgreSQL;
   - invocações, erro e duração por tool MCP;
   - execução, erro e última conclusão por worker;
   - backlog e idade do outbox;
   - CPU, memória, GC, thread pool e falhas de exportação.
3. Criar alertas iniciais, sempre com janela e volume mínimo para evitar ruído:

| Alerta | Condição inicial | Severidade |
|---|---|---|
| API indisponível | `/health/ready` falha por 2 minutos | crítica |
| API com erros | 5xx > 5% e pelo menos 5 requisições em 5 min | alta |
| API lenta | p95 > 1 s por 10 min e volume mínimo | média |
| MCP com erros | `outcome=error` > 5% e pelo menos 5 tools em 10 min | alta |
| Worker falhando | qualquer aumento persistente de `worker.failure.count` | alta |
| Worker atrasado | bill > 2 h, notification > 5 min, cleanup > 30 h sem sucesso | alta |
| Outbox atrasado | item mais antigo > 5 min ou backlog crescente por 10 min | alta |
| Telemetria ausente | runtime/heartbeat do serviço ausente por 5 min | média |
| Alloy degradado | falhas/retries de exportação persistem por 5 min | média |

Os thresholds são baselines, não SLOs definitivos. Revisá-los após pelo menos uma semana de produção e registrar a data da revisão.

4. Configurar Synthetic Monitoring para a readiness pública da API se o endpoint for acessível. O MCP permanece privado; não expô-lo para viabilizar probe. Para ele, usar telemetria de processo, readiness no deploy e, se necessário posteriormente, um probe privado no host.
5. Atualizar workflows/scripts de deploy:
   - esperar o container ficar `healthy` com timeout explícito;
   - consultar `/health/ready` da API e do MCP após subir a versão;
   - em falha, encerrar o job com erro e anexar `docker compose ps` e logs recentes sanitizados;
   - não considerar `docker compose up -d` isoladamente como sucesso;
   - não imprimir variáveis Grafana ou `docker compose config` expandido com secrets no CI.
6. Criar `apps/backend/observability/README.md` com:
   - arquitetura e variáveis necessárias;
   - como validar Alloy e os dois serviços;
   - como localizar logs pelo trace;
   - queries e painel/alertas;
   - resposta a falhas de API, MCP, DB, cache e Alloy;
   - rotação da API key;
   - ajuste de sampling e filtros;
   - rollback da configuração de observabilidade sem retirar health checks/logging seguro.

### Testes e verificações finais

Executar:

```bash
dotnet build apps/backend/BitFinance.sln --disable-build-servers -v:minimal
dotnet test apps/backend/BitFinance.sln --no-build --disable-build-servers -v:minimal
dotnet build apps/mcp-server/src/BitFinance.MCP.csproj --disable-build-servers -v:minimal
dotnet test apps/mcp-server/tests/BitFinance.MCP.UnitTests/BitFinance.MCP.UnitTests.csproj --disable-build-servers -v:minimal
docker compose -f apps/backend/docker-compose.yml -f apps/backend/docker-compose.prod.yml config
git diff --check
git status --short
```

Executar um smoke test em ambiente não produtivo ou em uma janela segura:

1. deploy da API, migration com exporter desabilitado e readiness verde;
2. deploy do MCP e readiness verde;
3. chamada MCP de leitura que atravesse a API;
4. localização do trace, logs e métricas no Grafana;
5. falha controlada que acione e depois resolva um alerta de teste;
6. confirmação de recuperação sem intervenção destrutiva.

### Checkpoint 6 — Go/no-go final

Parar e apresentar:

- diff completo da fase e diff acumulado da implementação;
- resultado de todos os builds, testes e smoke tests;
- dashboard importado, alertas criados e estado de cada regra;
- evidência dos gates de deploy;
- checklist de privacidade e busca final por sentinelas;
- riscos residuais, custo/volume observado e thresholds a recalibrar;
- instruções de rollback e operação;
- mensagem de commit sugerida: `docs(observability): add grafana dashboards alerts and runbook`.

Somente após aprovação explícita deste checkpoint a implementação pode ser considerada concluída.

## Critérios globais de aceite

- API e MCP aparecem como serviços distintos e correlacionados no Grafana Cloud.
- Um trace iniciado em uma tool MCP alcança `BitFinanceApiClient`, endpoint da API e Npgsql.
- Logs exibem `TraceId`/`SpanId` e permitem navegar até o trace.
- `/health/live` não falha quando DB/cache/API dependente está indisponível; `/health/ready` falha corretamente.
- Falha do Alloy/Grafana não interrompe requisições, workers ou tools.
- Nenhum secret, PII ou conteúdo financeiro aparece nos três sinais.
- Métricas customizadas não usam labels de alta cardinalidade.
- Workers e outbox têm indicadores acionáveis de erro e atraso.
- Dashboard, alertas e runbook estão reproduzíveis a partir do repositório.
- CI e deploy verificam readiness em vez de apenas processo/container iniciado.
- Todos os testes existentes e novos passam.
- O frontend permanece inalterado.

## Condições de parada durante a implementação

Parar e pedir decisão antes de continuar se ocorrer qualquer um destes casos:

- seria necessário expor MCP, OTLP ou Alloy publicamente;
- uma biblioteca exigir captura de body, argumento MCP, SQL ou query string sem redação verificável;
- uma mudança alterar contrato de API, autenticação ou resultado de tool;
- o health check causar escrita em cache/DB ou carga relevante;
- a métrica exigir label por usuário, organização, entidade ou mensagem;
- o Alloy exceder de forma sustentada os limites de CPU/memória definidos;
- os sinais não aparecerem no Grafana mesmo com `/-/ready` saudável e exporter sem erro;
- qualquer segredo aparecer em diff, log de CI ou saída compartilhada;
- o SDK MCP mudar e o `AddCallToolFilter` deixar de existir ou alterar semântica;
- houver conflito com alterações do usuário nos mesmos arquivos.

## Manutenção após a entrega

- revisar volume, sampling, níveis de log e thresholds após 7 dias e novamente após 30 dias;
- acompanhar uso do plano Grafana Cloud e configurar aviso de consumo antes de atingir o limite aplicável à stack;
- atualizar OpenTelemetry em conjunto, sempre com testes de correlação e privacidade;
- atualizar Alloy uma minor version por vez, lendo breaking changes e validando `config.alloy` antes do deploy;
- rotacionar a API key do Grafana periodicamente e imediatamente em caso de exposição;
- ao adicionar worker ou tool, exigir testes de telemetry outcome/cardinalidade;
- ao adicionar dados sensíveis novos, ampliar os testes sentinela antes de exportar;
- manter `/health` como alias até confirmar que todos os consumidores usam `/health/ready`; sua remoção deve ser uma mudança separada.

## Referências oficiais

- [Grafana Cloud — Set up Application Observability](https://grafana.com/docs/grafana-cloud/monitor-applications/application-observability/setup/)
- [Grafana — Set up Grafana Alloy for Application Observability](https://grafana.com/docs/opentelemetry/collector/grafana-alloy/)
- [Grafana Alloy — endpoints HTTP e `/-/ready`](https://grafana.com/docs/grafana-cloud/send-data/alloy/reference/http/)
- [Grafana Alloy v1.18.0 — release](https://github.com/grafana/alloy/releases/tag/v1.18.0)
- [OpenTelemetry .NET — instrumentação](https://opentelemetry.io/docs/languages/dotnet/instrumentation/)
- [ASP.NET Core 10 — health checks](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks?view=aspnetcore-10.0)
- [Npgsql — tracing com OpenTelemetry](https://www.npgsql.org/doc/diagnostics/tracing.html)
- [Npgsql — métricas](https://www.npgsql.org/doc/diagnostics/metrics.html)
- [MCP C# SDK](https://github.com/modelcontextprotocol/csharp-sdk)
