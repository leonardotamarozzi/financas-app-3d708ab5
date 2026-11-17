# Minhas Finanças (simulação)

Web app mobile-first, tema escuro, para controlar saldo e investimentos. **É uma simulação educativa**: nenhum dinheiro real é movimentado e todos os dados ficam no navegador (localStorage).

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm test         # testes unitários
npm run build    # build de produção (dist/)
```

## Funcionalidades

- Login com PIN local, biometria simulada e logo enviada pelo usuário
- Início, Conta, Extrato (filtros + CSV), Pix, Pagar, Receber, Recarga, Transferir, Câmbio
- Poupança → **Ajustar dados**: foto de perfil, nome, saldo, logo e **ícone do app** (favicon, apple-touch-icon e manifest dinâmicos)
- Investimentos: CDB, LCI, LCA, Tesouro Selic/IPCA+, fundo RF, poupança, ações, FIIs, Bitcoin, USDT, fundo em dólar
- Rendimento por dias corridos com taxas editáveis, IR regressivo, carência/vencimento, gráficos
- Metas ("Qual o seu sonho?"), Meu Porquinho, resumo do mês, backup JSON

Publicado no GitHub Pages com `noindex`. Decisões de implementação em [DECISIONS.md](DECISIONS.md).
