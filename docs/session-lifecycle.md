# Sessões — SWE-226

## Diagnóstico

- Access token somente em memória; refresh opaco em cookie HttpOnly de sete dias.
- O interceptor deduplicava apenas chamadas da mesma aba. A inicialização usava
  outro caminho e múltiplas abas podiam reapresentar o refresh já rotacionado,
  acionando corretamente a detecção de reutilização e revogando a família inteira.
- Qualquer erro de renovação, inclusive offline/5xx, encerrava a sessão.
- A resposta anunciava 60 minutos, enquanto o JWT usa `Jwt:ExpirationInMinutes`.
- A persistência do sucessor e a revogação do predecessor não eram atômicas.

## Comportamento

Um único coordenador atende bootstrap, StrictMode e interceptor de 401. Web Locks
serializa o ciclo requisição/Set-Cookie entre abas da mesma origem. Uma resposta
401 atrasada não renova novamente um access token que já foi substituído. Não
há tokens em localStorage/BroadcastChannel. Os cookies continuam rotacionando;
os TTLs não foram estendidos. Em produção, o cookie segue Secure, HttpOnly,
SameSite=Lax e restrito a `/api/v1/identity`; apenas Development permite HTTP.

A rotação no banco é transacional: compare-and-swap do predecessor ainda ativo,
sucessor e referência são persistidos juntos. A reutilização continua revogando a
família; não há janela de tolerância que aceite tokens roubados/revogados.

401/403 na renovação mostram sessão expirada e exigem login. Offline/timeout/5xx
não apagam a sessão; uma falha transitória no bootstrap exibe opção de tentar de
novo. Respostas de refresh/perfil anteriores ao logout não restauram a sessão.
A expiração informada agora usa a mesma configuração do JWT.

## Compatibilidade e verificação

Use navegadores atuais com Web Locks em HTTPS (ou localhost). Sem Web Locks há
single-flight dentro de uma aba, mas não se promete exclusão mútua entre abas.
Origens de frontend diferentes não compartilham o lock; configure uma origem
canônica. O MCP autentica sua própria conta, usa SemaphoreSlim e obtém novos
logins por senha; não deve compartilhar a sessão do navegador.

- `cd apps/frontend && pnpm test && pnpm lint && pnpm format:check && pnpm build`
- `dotnet test apps/backend/BitFinance.sln`
- Homologação manual: duas abas, expiração real do access token, reload,
  fechar/reabrir navegador e reiniciar a máquina antes dos sete dias; conferir
  Set-Cookie e sucesso da primeira requisição após expiração.
- Revogar/expirar refresh e verificar mensagem explícita. Simular offline/503 e
  verificar recuperação sem logout. Testar rollback/concorrência em PostgreSQL
  real antes do deploy; os testes unitários não substituem essa verificação.

A sessão persiste somente enquanto o refresh for válido; limpeza de cookies ou
política do navegador pode encerrá-la. Não são necessários novos secrets ou
migrações de schema.
