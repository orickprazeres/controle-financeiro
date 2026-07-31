# 02 · Estrutura de dados

A regra de ouro: **todo lançamento vai numa única aba.** Entrada, saída, dinheiro, débito, cartão — tudo em `Lancamentos`. Não existe mais uma aba por mês nem uma aba por cartão.

---

## Aba `Lancamentos`

| Coluna | O que é | Exemplo |
|---|---|---|
| `id` | Código único da linha. O site preenche sozinho. | `Lm3k9x2af` |
| `data` | Quando o gasto aconteceu. | `2026-01-20` |
| `competencia` | **Em que mês esse valor pesa no bolso.** É por aqui que tudo é somado. | `2026-03` |
| `tipo` | `Entrada` ou `Saída`. | `Saída` |
| `descricao` | Texto livre. | `Geladeira (3/10)` |
| `categoria` | Escolhida da aba `Categorias`. | `Manutenção/Móveis` |
| `grupo` | Preenchido a partir da categoria. Agrupa no painel. | `Moradia` |
| `forma_pagamento` | Dinheiro, Débito, Pix, Boleto, Crédito, Transferência. | `Crédito` |
| `cartao` | Só quando forma_pagamento = Crédito. | `VISA RICARDO` |
| `parcela` / `parcelas_total` | `1` e `1` à vista; `3` e `10` na terceira de dez. | `3` / `10` |
| `valor` | **O valor DA PARCELA**, não o total da compra. | `420` |
| `pago` | `Sim` ou `Não`. | `Não` |
| `obs` | Livre. | `importado` |

---

## As três decisões que mudam tudo

### 1. `data` e `competencia` são coisas diferentes

`data` é quando você comprou. `competencia` é o mês em que aquele dinheiro sai.

Compra de 20/01 no cartão que fecha dia 28 e vence em fevereiro → `data = 2026-01-20`, `competencia = 2026-02`.

Isso é o que faz o painel mostrar o mês real do seu bolso, e não o mês da compra.

### 2. Cada parcela é uma linha

Uma geladeira de R$ 4.200 em 10× vira 10 linhas de R$ 420, com competências de `2026-01` até `2026-10`.

Parece mais trabalho, mas é o contrário: o site cria as 10 linhas sozinho, e a partir daí toda soma, filtro e gráfico funciona sem nenhuma regra especial. É também o que permite a tela **Parcelas futuras** dizer quanto do seu salário de agosto já está comprometido hoje.

### 3. Cartão não é categoria

Na planilha antiga, "Cartão de Crédito" aparecia ao lado de "Moradia" e "Mercado" no resumo. Isso mistura duas perguntas diferentes:

- **O que eu comprei?** → `categoria`
- **Como eu paguei?** → `forma_pagamento`

Remédio comprado no cartão é `categoria = Saúde/Farmácia`, `forma_pagamento = Crédito`. Ele conta em Saúde, como deve. E o total da fatura continua visível: é a soma de tudo com `forma_pagamento = Crédito` naquela competência — o indicador "No cartão" no painel.

---

## Aba `Categorias`

27 categorias, uma lista só valendo para tudo.

| Coluna | Para que serve |
|---|---|
| `categoria` | O nome que aparece nas listas suspensas e nos gráficos |
| `grupo` | Moradia, Alimentação, Transporte, Saúde, Educação, Pessoal, Financeiro, Receita |
| `tipo` | `Saída` ou `Entrada` — define em qual lista a categoria aparece no formulário |
| `essencial` | `Sim`/`Não` — marcação sua, para separar o que é obrigatório do que é escolha |

Na planilha antiga havia **duas** listas: 8 categorias nas Saídas e 11 no Cartão. "Mercado" existia nas duas e nunca somava junto. Agora é uma só.

---

## Aba `Cartoes`

Cadastro dos cartões, com titular, dia de fechamento, dia de vencimento e limite. Alimenta a lista suspensa de cartão no site.

## Aba `Orcamento`

Limite mensal por categoria de saída. Deixe `0` nas que você não quer controlar. O painel mostra a barra de consumo e quanto sobrou ou estourou.

## Aba `Painel`

Resumo de conferência dentro da própria planilha, com seletor de competência na célula amarela. A análise de verdade é no site — esta aba existe para você checar um número rápido sem abrir o navegador.

**Amarelo = célula que você edita. O resto é fórmula; não digite por cima.**

## Aba `Leia-me`

A mesma explicação deste arquivo, resumida, dentro da planilha.

---

**Próximo:** [`03-personalizar.md`](03-personalizar.md)
