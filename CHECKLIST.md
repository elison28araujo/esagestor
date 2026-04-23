# Checklist - ESA Gestor v2

## ✅ Antes do Deploy

### 1. Código
- [ ] Extraiu o ZIP `esagestor-v2-producao.zip`
- [ ] Rodou `npm install`
- [ ] Rodou `npm run dev` e testou localmente
- [ ] Não há erros no terminal
- [ ] Dark mode funciona (ícone Sol/Lua)
- [ ] Busca funciona (campo com lupa)
- [ ] Toast notifications aparecem (feedback visual)

### 2. Firebase
- [ ] Criou projeto no Firebase Console
- [ ] Ativou **Authentication > Email/Senha**
- [ ] Criou **Firestore Database** em test mode
- [ ] Copiou as 6 variáveis de ambiente corretas
- [ ] Configurou **Firestore Rules** (cole de `firestore.rules`)
- [ ] Publicou as rules

### 3. GitHub
- [ ] Criou repositório privado
- [ ] Fez `git push` com o código
- [ ] Vê os arquivos no repositório

### 4. Vercel
- [ ] Criou conta Vercel
- [ ] Conectou GitHub
- [ ] Adicionou **todas as 6 variáveis de ambiente**
- [ ] Fez deploy
- [ ] Viu "Deployment successful"
- [ ] Abriu a URL e testou

### 5. Testes no app ao vivo
- [ ] Conseguiu fazer login / criar conta
- [ ] Conseguiu adicionar cliente
- [ ] Conseguiu buscar cliente
- [ ] Conseguiu editar cliente (abre dialog)
- [ ] Conseguiu excluir cliente (pede confirmação)
- [ ] Conseguiu adicionar despesa
- [ ] Conseguiu exportar CSV
- [ ] Dark mode funciona (memória salva ao reload)
- [ ] Configurações (ícone ⚙️) salva mensagem
- [ ] Toast notifications aparecem em cada ação

---

## 🚀 Depois do Deploy - Próximas ações

### Segurança
- [ ] Firestore saiu do test mode (deve ser manual com as rules)
- [ ] Pediu aos primeiros usuários para trocar senha
- [ ] Avaliou se precisa de autenticação 2FA

### Marketing
- [ ] Criou página de landing para o produto
- [ ] Definiu preço (sugestão: R$ 50-100/mês por usuário)
- [ ] Começou a ofertar para fornecedores IPTV

### Monitoramento
- [ ] Verificou logs da Vercel (Analytics tab)
- [ ] Monitorou uso do Firestore (pode cobrar se exceder)
- [ ] Fez backup manual dos dados (botão Exportar CSV)

### Feedback
- [ ] Pediu feedback aos primeiros usuários
- [ ] Anotou bugs ou features solicitadas
- [ ] Planejou roadmap v2.1

---

## ⚠️ Problemas comuns e soluções

### "Firebase não configurado" aparece no app
**Solução:** Verfica se adicionou as 6 variáveis corretamente na Vercel.
- Ao adicionar, deve fazer novo deploy (Vercel > Deployments > Redeploy)

### Erro ao importar CSV
**Solução:** 
- Verifique encoding do arquivo (UTF-8)
- Nomes de colunas precisam conter palavras-chave (usuario, cliente, telefone, etc)
- Use o template exportado pelo próprio app

### Firestore Rules error
**Solução:** Copiou exatamente o conteúdo de `firestore.rules` e clicou "Publicar"

### Google Sheets não funciona
**Solução:** 
1. Abra o Sheets
2. Clique "Compartilhar" (canto superior direito)
3. Selecione "Qualquer um com o link"
4. Copie a URL exata

### "Too many requests" ao importar
**Solução:** Esperou alguns minutos (Firestore tem rate limit)

---

## 💰 Modelo de precificação sugerido

| Plano | Preço/mês | Usuários | Clientes |
|-------|-----------|----------|----------|
| **Básico** | R$ 49 | 1 | Ilimitado |
| **Pro** | R$ 99 | 3 | Ilimitado |
| **Enterprise** | R$ 299 | Ilimitado | Ilimitado |

Ou:
- **Assinatura anual:** 2 meses grátis (R$ 49 × 10)
- **Implementação:** R$ 200 (primeira vez, ajuda a configurar)

---

## 📱 Qual é o diferencial?

Quando vender para fornecedores IPTV, foque em:

1. ✅ **Importação rápida** — "Carrega 1000 clientes em 1 segundo"
2. ✅ **Dark mode** — "Trabalha a noite sem machucar os olhos"
3. ✅ **Alertas** — "Nunca mais perca uma cobrança vencida"
4. ✅ **Busca** — "Encontra qualquer cliente em mili-segundos"
5. ✅ **WhatsApp integrado** — "Cobra direto pelo app"
6. ✅ **Dashboard** — "Vê toda a saúde financeira em um gráfico"
7. ✅ **Backup automático** — "Dados seguros no Google"
8. ✅ **Multi-device** — "Funciona no celular, tablet e PC"

---

## 🎯 KPIs para acompanhar

Depois que tiver usuários:

```
Semana 1:
  - Quantos usuários criaram conta?
  - Quantos importaram CSV na 1ª semana?
  - Qual foi o maior CSV importado?

Semana 4:
  - Taxa de churn (quantos cancelaram)?
  - Features mais usadas?
  - Bugs reportados?
  - Feedback positivo/negativo?

Mês 1:
  - Receita gerada
  - Custo Firebase (deve ser < R$ 5)
  - Custo Vercel (deve ser grátis se < 100k requests)
  - NPS (Net Promoter Score)
```

---

## 📞 Suporte ao usuário

Quando clientes chegarem com problemas:

1. **Primeiro:** Verifique `DEPLOY.md` e `MELHORIAS.md` — Resposta pode estar lá
2. **Segundo:** Verifique `firestore.rules` — Pode ser permissão do Firestore
3. **Terceiro:** Veja logs da Vercel (Analytics > Errors)
4. **Quarto:** Consulte documentação oficial:
   - Firebase: https://firebase.google.com/docs
   - Next.js: https://nextjs.org/docs
   - Vercel: https://vercel.com/docs

---

## ✨ Ideia para v2.1

Depois que tiver feedback de usuários:

1. **Histórico de pagamentos** — Quando cada cliente pagou
2. **Relatório PDF** — Exportar resumo mensal bonito
3. **Notificação email** — 3 dias antes de vencer
4. **Webhook** — Avisar seu sistema quando cliente vencer
5. **Integração Stripe** — Cobrar automaticamente pelo cartão
6. **API REST** — Outros sistemas consumirem dados

---

**Parabéns! Você tem um produto pronto para vender!** 🎉

Agora é "engineering" do negócio — vendas, marketing, suporte.

Boa sorte! 💪
