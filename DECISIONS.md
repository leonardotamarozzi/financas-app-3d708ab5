# Decisões

- Skill de brainstorming não usada: o prompt pede execução sem perguntas e já traz o plano completo.
- Repositório criado privado com sufixo aleatório (`financas-app-3d708ab5`) antes de codar, para abrir a issue de rastreamento (#1).
- Fonte Figtree (Google Fonts), próxima do visual dos prints sem copiar a fonte de nenhum banco.
- Poupança é implementada como posições do produto `poupanca` (mesmo motor de rendimento dos investimentos), com resgate FIFO e isenção de IR.
- Saldo da conta = soma das transações (sem "saldo inicial" separado); "Ajustar dados" grava a diferença como transação "Ajuste de saldo".
- Meu Porquinho é derivado das transações `piggy_in`/`piggy_out` e não rende.
- Investir a partir da poupança gera duas transações: resgate da poupança e aplicação.
- Renda variável, cripto e global: preços simulados por passeio aleatório com semente fixa (determinístico); IR não é simulado nesses produtos (avisado na tela de resgate).
- Fundo Global usa a cotação do dólar da tela Câmbio + 4,5% a.a. em dólar.
- Taxas padrão: Selic 15%, CDI 14,9%, IPCA 4,6% (editáveis em Configurações).
- LCI/LCA com carência de 90 dias; CDB prefixado só resgata no vencimento (12 meses).
- "Trocar" no login mostra um aviso: o app guarda um único perfil por aparelho.
- PIN guardado como hash SHA-256 (com fallback FNV fora de HTTPS); biometria é apenas simulada.
- Sessão desbloqueada fica em sessionStorage (recarregar a aba não pede PIN de novo; fechar a aba pede).
- Atalho "Metas" no Início no lugar do quarto atalho cortado do print; o banner promocional virou "Seu mês até agora" (resumo do mês).
- Tela Investimentos carregada sob demanda (code split) para tirar o recharts do pacote inicial.
- Ícone padrão em SVG próprio; versões PNG 192/512 do padrão são geradas no navegador para apple-touch-icon e manifest.
- Publicação: o plano do GitHub recusou Pages em repositório privado (HTTP 422). Seguindo o prompt, o repositório foi tornado público (nome aleatório, sem dados pessoais, site com noindex e robots.txt bloqueando indexação).

## Pix agendado e notificação
- Safe area: utilitário `pt-safe` = `max(28px, env(safe-area-inset-top) + 20px)` nos cabeçalhos de todas as telas (inclusive Login). Os meta tags `viewport-fit=cover` e `black-translucent` já existiam. O fim das telas usa `pb-nav` (7rem + safe area de baixo).
- Número da conta exibido nos avisos é fictício (`NNNNN-N`), gerado uma vez e mostrado em "Ajustar dados". Estados antigos ganham o campo pela migração (`migrateState`), sem mudar a versão.
- O Pix agendado entra no extrato com a data marcada (não a hora em que o app abriu) e descrição "De {nome}" (com " · descrição" quando houver).
- O atalho "Em 1 min" guarda o instante exato; se a pessoa editar a data/hora à mão, vale o minuto digitado.
- Processamento: ao carregar, ao voltar para a aba (`visibilitychange`) e por `setTimeout` até o próximo vencimento. Com o app fechado nada roda; o crédito acontece na próxima abertura (uma única vez).
- Ícone do banner: ícone do app → logo do login → ícone padrão. "Testar notificação" usa o que está no formulário (antes de salvar) e não mexe no saldo.
- Notificação do sistema: `new Notification` só com permissão concedida e só com o app aberto. Sem service worker nem servidor de push (fora do escopo e das regras). Navegadores que só aceitam notificação via service worker (ex.: Chrome no Android) ficam só com o banner.
- O "X invisível" fica no canto superior direito do banner (aparece com foco do teclado). Esc também fecha; Enter abre o extrato.
