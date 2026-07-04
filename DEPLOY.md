# Guia de Deploy - ESA Gestor

## 📱 Requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Vercel](https://vercel.com) (grátis)
- Conta no [Firebase](https://firebase.google.com) (grátis com limite)

---

## 1️⃣ Preparar o projeto

### 1.1 - Criar repositório no GitHub

1. Acesse https://github.com/new
2. Nome: `esagestor` (ou outro)
3. Descrição: "Sistema de gerenciamento de IPTV"
4. Marque **Private** (privado)
5. Clique "Create repository"

### 1.2 - Fazer upload do código

Na pasta do projeto:

```bash
git init
git add .
git commit -m "Initial commit - ESA Gestor v2.0"
git branch -M main
git remote add origin https://github.com/seu-usuario/esagestor.git
git push -u origin main
```

**Nota:** Você pode copiar a URL de push exata do GitHub após criar o repo.

---

## 2️⃣ Configurar Firebase

### 2.1 - Criar projeto Firebase

1. Acesse https://console.firebase.google.com
2. Clique "Criar projeto"
3. Nome: `esagestor`
4. Desmarque "Google Analytics" (não precisa)
5. Clique "Criar"

### 2.2 - Ativar Authentication

1. No menu esquerdo: **Build > Authentication**
2. Clique "Começar"
3. Selecione "Email/Senha"
4. Marque "Ativar"
5. Salve

### 2.3 - Ativar Firestore

1. Menu esquerdo: **Build > Firestore Database**
2. Clique "Criar banco de dados"
3. Localização: `us-central1` (ou a mais próxima de você)
4. Modo: **Iniciar no modo de teste** (depois configuraremos as rules)
5. Clique "Criar"

### 2.4 - Obter credenciais

1. Menu: **Projeto > Configurações do projeto**
2. Vá até "Suas apps"
3. Clique o ícone `</>` Web
4. Copie o objeto `firebaseConfig`
5. Será algo como:

```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "esagestor-abc123.firebaseapp.com",
  projectId: "esagestor-abc123",
  storageBucket: "esagestor-abc123.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
}
```

### 2.5 - Atualizar Firestore Rules

1. Menu: **Build > Firestore > Rules**
2. Cole o conteúdo do arquivo `firestore.rules` do projeto
3. Clique "Publicar"

---

## 3️⃣ Deploy na Vercel

### 3.1 - Conectar GitHub

1. Acesse https://vercel.com
2. Clique "New Project"
3. Clique "Import Git Repository"
4. Cole a URL: `https://github.com/seu-usuario/esagestor`
5. Clique "Continue"

### 3.2 - Configurar variáveis de ambiente

Na tela de configuração do Vercel:

1. Procure por "Environment Variables"
2. Adicione as 6 variáveis do Firebase:

```
NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = esagestor-abc123.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = esagestor-abc123
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = esagestor-abc123.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 123456789
NEXT_PUBLIC_FIREBASE_APP_ID = 1:123456789:web:abcdef123456
```

### 3.3 - Deploy

1. Clique "Deploy"
2. Espere 2-3 minutos
3. Verá "Deployment successful!"
4. Clique em "Visit" ou copie a URL

Pronto! Seu site está ao vivo! 🎉

---

## 4️⃣ Primeira execução

1. Abra o site no navegador
2. Clique "Criar conta"
3. Cadastre um email e senha
4. Faça login
5. Teste adicionar um cliente

---

## 5️⃣ Atualizar código

Sempre que fazer mudanças:

```bash
git add .
git commit -m "Descrição da alteração"
git push origin main
```

Vercel detectará e fará deploy automaticamente (1-2 minutos).

---

## 🔐 Segurança - Mudar de "test mode"

**Importante:** O Firebase começa em "test mode" (qualquer um pode ler/escrever). Depois de alguns dias, desativa automaticamente.

Para configurar corretamente:

1. Firebase > Firestore > Rules
2. Use o conteúdo de `firestore.rules` (já está no projeto)
3. Clique "Publicar"

Agora só usuários autenticados podem acessar **seus próprios dados**.

---

## 🛠️ Troubleshooting

### "Firebase não configurado"
Verifique se as variáveis de ambiente foram adicionadas corretamente na Vercel.

### "Erro ao importar CSV"
- Verifique se o arquivo está no formato UTF-8
- As colunas devem ter nomes reconhecidos (usuario, cliente, etc)

### "Google Sheets não funciona"
1. Certifique-se a planilha está **pública** (Arquivo > Compartilhar > Qualquer um com o link)
2. Cole a URL completa do Sheets

### Firestore cheio de dados de teste?
1. Firebase > Firestore > (clique na coleção)
2. Selecione documentos
3. Clique lixeira
4. Confirme

---

## 📞 Domínio customizado (opcional)

1. Na Vercel, vá ao projeto
2. Settings > Domains
3. Adicione seu domínio
4. Siga as instruções de DNS
5. Seu site estará em `seudominio.com.br`

---

## 💾 Backup de dados

Firebase faz backup automático, mas você pode exportar:

1. Firebase > Firestore > Dados
2. Exporte > Exportar

Ou simplesmente use o botão "Exportar CSV" no app mesmo! 😉

---

**Pronto! Seu gerenciador IPTV está no ar!** 🚀
