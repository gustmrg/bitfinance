# Configurações por escopo — SWE-225

## Decisão

Adotar a opção recomendada na issue: separar pessoa de organização, preservando
as rotas canônicas atuais. A implementação está nesta branch; não há necessidade
de abrir outra issue para executar esta decisão. Abas da organização não são
mais exibidas dentro de Conta, e Conta não aparece nas abas da organização.

| Escopo | Conteúdo | Lugar canônico | Entradas |
|---|---|---|---|
| Pessoa | Perfil/avatar, idioma, tema, Google, sessões | `/settings/account` | Avatar → Conta; Mais → Configurações pessoais |
| Organização | Nome, orçamento, plano, transferência/exclusão | `/settings/organization` | Sidebar; Mais → Configurações da organização |
| Organização | Membros, papéis, convites, saída | `/settings/members` | Sidebar; abas da organização; Mais |

Os pontos de entrada são atalhos para a **mesma rota**, não cópias das telas.
O menu Mais é um índice mobile/atalho, não um segundo conjunto de configurações.
No mobile as duas abas da organização continuam acessíveis horizontalmente;
Conta não exige passar por uma navegação de organização.

## Links compatíveis

Não se alteraram URLs. Os redirects existentes são preservados, com query string:

- `/account/settings` → `/settings/account` (inclui callbacks Google).
- `/account/organization` → `/settings/organization`.
- `/organization/members` → `/settings/members`.
- `/account/more` → `/settings`.

Não há migração de favoritos. Links antigos e atuais não precisam de novos aliases.

## Permissões e uso

Membros comuns podem consultar a organização/lista de membros e sair da própria
organização. Owner/Admin têm ações administrativas; Owner possui ações exclusivas
como transferência/exclusão e gestão de Admins. As regras continuam nos componentes
e nos serviços do backend: ocultar links não seria autorização suficiente.
Membros é funcional (convites/papéis/remoção/saída), não apenas simetria de layout.
Não se consultou telemetria de uso, favoritos privados ou dados de produção.

## Validação

- Testes renderizam as abas nas duas rotas, verificam estado ativo, ausência de
  Conta, acessibilidade do escopo e preservação das regras de papel.
- `pnpm test`, `pnpm lint`, `pnpm format:check`, `pnpm build` no frontend.
- Homologação manual recomendada: viewport mobile/desktop, avatar → Conta,
  sidebar → Organização/Membros, aliases e callback de vinculação Google;
  confirmar ações disponíveis para Member/Admin/Owner.
