# Histórico de versões

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Numeração [SemVer](https://semver.org/lang/pt-BR/): `MAIOR.MENOR.CORREÇÃO`.

- **MAIOR** — muda a estrutura da planilha; exige migrar os dados.
- **MENOR** — recurso novo, compatível com o que você já tem.
- **CORREÇÃO** — conserto de bug, sem mudança de estrutura.

---

## [1.0.0] — 2026-07-31

Primeira versão. Substitui a planilha `Controle-Custos-Casa.xlsx` (25 abas).

### Adicionado

**Planilha** (`planilha/Custos-Casa-v1.0.0.xlsx`)

- Aba `Lancamentos`: tabela única com 14 colunas, sem limite de linhas.
- Aba `Categorias`: lista única de 27 categorias com grupo, tipo e marcação de essencial.
- Aba `Cartoes`: cartões com titular, dias de fechamento/vencimento e limite.
- Aba `Orcamento`: limite mensal por categoria de saída.
- Aba `Painel`: resumo de conferência com seletor de competência, quadro por categoria com orçamento e evolução dos 12 meses.
- Aba `Leia-me`: explicação de cada coluna dentro do próprio arquivo.
- Listas suspensas em tipo, categoria, forma de pagamento, cartão e pago.
- 5 linhas de exemplo, ignoradas automaticamente pelo site e removíveis.

**Backend** (`apps-script/Codigo.gs`)

- `doGet` devolve lançamentos, categorias, cartões e orçamento em JSON.
- `doPost` com as ações `inserir`, `importar`, `atualizar`, `excluir` e `orcamento`.
- `inserir` gera automaticamente uma linha por parcela, cada uma na sua competência, com virada de ano correta.
- Aceita valor por parcela ou valor total da compra, com rateio.
- Datas e valores normalizados na saída, para o site não depender do formato regional da planilha.
- Proteção por token.

**Site** (`docs/`)

- `index.html`: painel com 5 indicadores, 4 gráficos, quadro de categorias com orçamento, comparativo com o mês anterior, lista filtrável, formulário de lançamento com prévia de parcelamento, edição de orçamento e visão de parcelas futuras.
- `importar.html`: importador em 3 etapas com detecção de separador, mapeamento de colunas, leitura de valores em formato brasileiro e americano, 23 regras de auto-classificação por palavra-chave, detecção de parcelas `N/M` e geração das parcelas futuras.
- Configuração guardada no navegador; funciona como app ao adicionar à tela de início do celular.

**Documentação** (`manual/`) e **testes** (`testes/`)

- Manual em 4 partes: instalação, estrutura de dados, personalização e problemas comuns.
- 48 testes automatizados cobrindo aritmética de competência, leitura de valores e datas, parsing de CSV, detecção de parcelas, auto-classificação e agregação do painel.

### Decisões de projeto

- **Cartão deixou de ser categoria.** Virou forma de pagamento, para que o gasto seja classificado pelo que é, não por como foi pago.
- **Competência separada da data.** A data diz quando comprou; a competência diz em que mês o valor pesa. É o que torna o parcelamento visível no futuro.
- **Uma parcela = uma linha.** Mais linhas, porém toda soma, filtro e gráfico funciona sem regra especial.

---

## Como registrar suas próprias mudanças

Ao alterar algo, acrescente aqui no topo:

```markdown
## [1.1.0] — 2026-08-15

### Adicionado
- Categoria "Streaming infantil" na aba Categorias.

### Corrigido
- Regra de auto-classificação confundia "Barbearia" com "Bar".
```

E atualize o `var VERSAO` no topo de `docs/index.html`, `docs/importar.html` e `apps-script/Codigo.gs`.

Se mudar as colunas da aba `Lancamentos`, suba a versão **MAIOR** e gere um novo `.xlsx` em `planilha/` com o número no nome — nunca sobrescreva o antigo, ele é o registro de como os dados existentes estão organizados.
