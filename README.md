# ESA Gestor

Projeto Next.js com Firebase para controle de acessos, clientes, despesas e cobranças por WhatsApp.

## Recursos

- Login e cadastro com Firebase Auth
- Recuperação de senha
- Cadastro de clientes
- ImportaÃ§Ã£o e exportaÃ§Ã£o de clientes por CSV
- Cadastro de despesas
- Dashboard financeiro
- Gráfico mensal
- Edição de cliente
- Cobrança por WhatsApp
- Dados em tempo real com Firestore

## Como rodar

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Variáveis de ambiente

Preencha o arquivo `.env.local` com suas credenciais Firebase:

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

## Firestore Rules

O arquivo `firestore.rules` já está incluído no projeto.
