# ESA Gestor

Sistema de gerenciamento de clientes IPTV com Next.js + Firebase.

## Recursos

- Login, cadastro e recuperação de senha com Firebase Auth
- Cadastro de clientes com validações
- Importação via CSV e Google Sheets (com `writeBatch` — suporta centenas de linhas)
- Exportação de clientes em CSV
- Cadastro e controle de despesas
- Dashboard financeiro com gráfico mensal
- Alertas de acessos vencidos e próximos do vencimento
- Busca por usuário, cliente, app ou telefone
- Mensagem de cobrança WhatsApp personalizável (com variáveis `{cliente}`, `{app}`, `{valor}`)
- Confirmação antes de excluir qualquer registro
- Dark mode com persistência local
- Toast de feedback em todas as ações
- Código modularizado em componentes

## Como rodar

```bash
npm install
cp .env.example .env.local
# Preencha .env.local com as credenciais Firebase
npm run dev
```

## Variáveis de ambiente

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Deploy na Vercel

1. Suba os arquivos para o GitHub
2. Importe o repositório na Vercel
3. Configure as variáveis de ambiente
4. Faça o deploy

## Estrutura

```
app/
  page.tsx              # Página principal (hub de estado)
  layout.tsx
  globals.css
  api/google-sheet/     # API route para importar Google Sheets

components/
  LoginForm.tsx         # Tela de login/cadastro
  Dashboard.tsx         # Cards financeiros + gráfico + alertas
  NovoClienteForm.tsx   # Formulário de novo acesso + importação
  ClienteCard.tsx       # Card de cliente com ações
  EditClienteDialog.tsx # Modal de edição
  DespesaList.tsx       # Lista e formulário de despesas
  ConfigDialog.tsx      # Configurações (mensagem cobrança)
  ConfirmDialog.tsx     # Modal de confirmação de exclusão
  Toast.tsx             # Notificações temporárias

lib/
  firebase.ts           # Inicialização Firebase
  utils.ts              # Funções utilitárias
  types.ts              # Tipos TypeScript
  constants.ts          # Constantes globais
```
