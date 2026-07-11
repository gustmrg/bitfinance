import i18next from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  "en-US": { translation: {
    nav: { overview: "Overview", bills: "Bills", expenses: "Expenses", organization: "Organization", members: "Members", account: "Account" },
    common: { demo: "Demo data", reset: "Reset demo", save: "Save changes", cancel: "Cancel", close: "Close", add: "Add", edit: "Edit", delete: "Delete", search: "Search", all: "All", today: "Today", viewAll: "View all", loading: "Loading", noResults: "No results", signIn: "Sign in", signUp: "Create account", continue: "Continue", invite: "Invite member", copy: "Copy invite link" },
    home: { eyebrow: "A clearer view of your money", title: "Make room for the life you’re planning.", body: "BitFinance brings bills, spending, and shared decisions into one calm workspace — so your next move is always visible.", cta: "Open the demo desk", secondary: "See how it works", signal: "Built for real-life money moments" },
    auth: { signInTitle: "Welcome back, Marina", signInBody: "Your money desk is ready for today’s decisions.", signUpTitle: "Start with a clearer picture", signUpBody: "Create a workspace for the people and plans that matter.", email: "Email address", password: "Password", firstName: "First name", lastName: "Last name", demoHint: "Any valid-looking credentials work in this prototype.", noAccount: "New to BitFinance?", haveAccount: "Already have an account?" },
    dashboard: { eyebrow: "Monday, July 13", title: "Good morning, Marina", body: "Here’s the shape of your money this month.", budget: "Monthly budget", spent: "Spent so far", remaining: "Available", upcoming: "Due this week", flow: "Cash-flow map", flowBody: "Your next 30 days, plotted as decisions instead of noise.", upcomingTitle: "Coming up", recentTitle: "Recent spending", categories: "Where it goes", onTrack: "You’re on track", setBudget: "Set a budget" },
    bills: { eyebrow: "Scheduled money", title: "Bills", body: "Keep every commitment visible before it becomes urgent.", add: "Add bill", total: "Total scheduled", due: "Due soon", paid: "Paid this month", search: "Search bills", empty: "No bills match these filters." },
    expenses: { eyebrow: "Money already moved", title: "Expenses", body: "A lightweight record of what happened — and what it means.", add: "Add expense", total: "Total spent", transactions: "transactions", search: "Search expenses", empty: "No expenses match these filters." },
    organization: { eyebrow: "Shared workspace", title: "Organization", body: "Set the rules and context behind the numbers.", settings: "Workspace settings", budget: "Monthly budget", members: "People with access", memberBody: "Invite the people who help make the calls.", name: "Workspace name", timezone: "Timezone", membersTitle: "Members & roles", membersBody: "A simple view of who is part of this money desk." },
    account: { eyebrow: "Your preferences", title: "Account", body: "Make the desk feel like yours.", profile: "Profile", appearance: "Appearance", language: "Language", theme: "Theme", signOut: "Sign out", reset: "Reset demo data" },
  } },
  "pt-BR": { translation: {
    nav: { overview: "Visão geral", bills: "Contas", expenses: "Despesas", organization: "Organização", members: "Membros", account: "Conta" },
    common: { demo: "Dados de demonstração", reset: "Resetar demo", save: "Salvar alterações", cancel: "Cancelar", close: "Fechar", add: "Adicionar", edit: "Editar", delete: "Excluir", search: "Buscar", all: "Todos", today: "Hoje", viewAll: "Ver tudo", loading: "Carregando", noResults: "Sem resultados", signIn: "Entrar", signUp: "Criar conta", continue: "Continuar", invite: "Convidar membro", copy: "Copiar convite" },
    home: { eyebrow: "Uma visão mais clara do seu dinheiro", title: "Abra espaço para a vida que você está planejando.", body: "O BitFinance reúne contas, gastos e decisões compartilhadas em um só lugar calmo — para o próximo passo estar sempre visível.", cta: "Abrir a demo", secondary: "Ver como funciona", signal: "Feito para os momentos reais do dinheiro" },
    auth: { signInTitle: "Bem-vinda de volta, Marina", signInBody: "Sua mesa financeira está pronta para as decisões de hoje.", signUpTitle: "Comece com uma visão mais clara", signUpBody: "Crie um espaço para as pessoas e planos que importam.", email: "E-mail", password: "Senha", firstName: "Nome", lastName: "Sobrenome", demoHint: "Qualquer credencial com formato válido funciona nesta demo.", noAccount: "Ainda não usa o BitFinance?", haveAccount: "Já possui uma conta?" },
    dashboard: { eyebrow: "Segunda-feira, 13 de julho", title: "Bom dia, Marina", body: "Este é o desenho do seu dinheiro neste mês.", budget: "Orçamento mensal", spent: "Gasto até agora", remaining: "Disponível", upcoming: "Vence nesta semana", flow: "Mapa do fluxo", flowBody: "Seus próximos 30 dias, plotados como decisões em vez de ruído.", upcomingTitle: "A seguir", recentTitle: "Gastos recentes", categories: "Para onde vai", onTrack: "Você está no caminho", setBudget: "Definir orçamento" },
    bills: { eyebrow: "Dinheiro programado", title: "Contas", body: "Mantenha cada compromisso visível antes que vire urgência.", add: "Adicionar conta", total: "Total programado", due: "Vence em breve", paid: "Pago neste mês", search: "Buscar contas", empty: "Nenhuma conta corresponde a estes filtros." },
    expenses: { eyebrow: "Dinheiro que já saiu", title: "Despesas", body: "Um registro leve do que aconteceu — e do que isso significa.", add: "Adicionar despesa", total: "Total gasto", transactions: "transações", search: "Buscar despesas", empty: "Nenhuma despesa corresponde a estes filtros." },
    organization: { eyebrow: "Espaço compartilhado", title: "Organização", body: "Defina as regras e o contexto por trás dos números.", settings: "Configurações do espaço", budget: "Orçamento mensal", members: "Pessoas com acesso", memberBody: "Convide quem ajuda a tomar as decisões.", name: "Nome do espaço", timezone: "Fuso horário", membersTitle: "Membros e papéis", membersBody: "Uma visão simples de quem faz parte desta mesa financeira." },
    account: { eyebrow: "Suas preferências", title: "Conta", body: "Deixe a mesa com a sua cara.", profile: "Perfil", appearance: "Aparência", language: "Idioma", theme: "Tema", signOut: "Sair", reset: "Resetar dados da demo" },
  } },
};

void i18next.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("bitfinance-v2-locale") ?? "en-US",
  fallbackLng: "en-US",
  interpolation: { escapeValue: false },
});

export default i18next;
