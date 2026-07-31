# 07 · Contas a pagar

Ver o que ainda falta pagar, e registrar quando e quanto você pagou.

---

## O que mudou nos dados

Três colunas novas em `Lancamentos`:

| Coluna | O que é |
|---|---|
| `vencimento` | Quando a conta vence. Nas linhas antigas foi preenchida com a data do lançamento. |
| `data_pagamento` | Quando você efetivamente pagou. Vazio = ainda em aberto. |
| `valor_pago` | Quanto saiu de fato. Pode ser diferente do previsto. |

E uma aba nova, `ContasFixas`, com o que se repete todo mês.

### Por que `vencimento` separado de `data`

São perguntas diferentes. A energia é *emitida* dia 07 e *vence* dia 20. O gasto no cartão acontece dia 10 e a fatura vence no mês seguinte.

Sem essa separação, o sistema não tem como saber o que está atrasado — e o alerta de atraso é a razão de existir de um contas a pagar.

---

## Instalar (uma vez)

1. Cole o `apps-script/Codigo.gs` novo no Apps Script e salve
2. Rode a função **`configurarContasAPagar`** (lista de funções → Executar)
3. **Implantar → Gerenciar implantações → lápis → Nova versão → Implantar**
4. Suba o `docs/index.html` novo no GitHub

A função cria as três colunas, preenche o `vencimento` das linhas antigas com a data delas, e cria a aba `ContasFixas`. Não apaga nem move nada, e rodar duas vezes é inofensivo.

---

## Usar no dia a dia

### A aba "Contas a pagar"

Quatro indicadores no topo:

- **Vencidas** — o que já passou do prazo. Se estiver zerado, aparece em verde.
- **Vence em 7 dias** — o que exige atenção esta semana.
- **Em aberto no mês** — total do mês selecionado que ainda não foi pago.
- **Pago no mês** — soma do que efetivamente saiu, usando `valor_pago`.

A lista vem ordenada por vencimento, com as atrasadas primeiro e fundo avermelhado. Cada linha mostra há quantos dias venceu, ou em quantos dias vence.

### Registrar um pagamento

Botão **Pagar** na linha → abre uma caixinha com:

- **Data do pagamento** — já vem hoje
- **Valor pago** — já vem o valor previsto

Se você mudar o valor, aparece um aviso na hora: *"Você está pagando R$ 24,22 A MAIS do que o previsto"*. Confirme e pronto.

O quadro **Pago em [mês]** mostra tudo que foi quitado, com previsto, pago e a diferença. Errou? O botão **desfazer** devolve a conta para "em aberto" e limpa os dois campos.

---

## Contas fixas

O que se repete todo mês você cadastra uma vez:

| Campo | Exemplo |
|---|---|
| Nome da conta | `ENERGIA` |
| Categoria | `Contas da casa (luz/água/gás)` |
| Dia do vencimento | `7` |
| Valor estimado | `690,78` |
| Forma de pagamento | `Boleto` |

Depois, o botão **Gerar contas de [mês]** cria todas de uma vez, já em aberto, com o valor estimado. Quando a conta real chegar, você ajusta o valor na hora de pagar.

Três detalhes que valem saber:

- **Gerar duas vezes não duplica.** Contas com o mesmo nome já existentes naquele mês são puladas, e o site diz quantas.
- **Dia 31 em fevereiro vira dia 28** (ou 29 em ano bissexto). Vale para qualquer mês curto.
- **Para aposentar uma conta**, ponha `Não` na coluna `em_uso` da aba `ContasFixas`. Ela para de ser gerada e o histórico continua intacto.

Sugestão a partir dos seus dados: `PARCELA MRV`, `SEGURO MRV`, `ENERGIA`, `HUMANAS SAUDE`, `HUMANAS DENTINHO`, `APCEF`, `CEA` e `DIZIMO` são candidatas naturais.

---

## Perguntas que costumam aparecer

**Uma conta de cartão entra aqui?**
Entra, se você lançar a fatura como uma linha só. Se você importa o detalhe da fatura, cada item vira uma linha e o "a pagar" fica poluído — nesse caso é melhor deixar os itens como pagos e controlar só a fatura.

**E se eu pagar só uma parte?**
Hoje o sistema registra um pagamento por conta. Para pagamento parcial, o jeito é dividir em duas linhas — uma com o valor pago, outra com o restante. Se isso virar rotina, dá para implementar de verdade.

**O que acontece com lançamentos que não são contas?**
Tudo que é Saída e está com `pago = Não` aparece na lista. Se você não quer um gasto ali, marque como pago no momento do lançamento.

---

**Anterior:** [`06-atualizar-versao.md`](06-atualizar-versao.md)
