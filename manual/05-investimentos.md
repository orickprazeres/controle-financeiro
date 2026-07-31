# 05 · Investimentos

Duas ferramentas na mesma aba: um **simulador** para planejar antes de aportar, e o **acompanhamento** do que você já tem.

> Isto é uma calculadora e um registro, não uma recomendação. Eu não sou consultor financeiro e o site não sugere onde investir — ele só mostra a matemática dos números que você informar. Decisões sobre onde aplicar são suas, idealmente com apoio de alguém habilitado.

---

## As três abas novas na planilha

Elas trabalham juntas, e a divisão tem um motivo.

### `Ativos` — o catálogo

Uma linha por aplicação que você tem.

| Coluna | Exemplo |
|---|---|
| `ativo` | `CDB 2 anos Banco Y` |
| `classe` | `Renda Fixa` — **texto livre** |
| `indexador` | `% do CDI`, `Selic +`, `IPCA +`, `Prefixado` |
| `taxa_contratada` | `110` (para 110% do CDI) ou `6.2` (para IPCA + 6,2%) |
| `instituicao` | `Banco Y` |
| `vencimento` | `2028-08-15` — vazio se não tiver |
| `liquidez` | `Diária` ou `No vencimento` |
| `em_uso` | `Não` esconde do site sem apagar o histórico |

**Sobre não saber ainda que tipos você vai ter:** a coluna `classe` é texto livre justamente por isso. Comece só com `Renda Fixa`. Quando um dia comprar uma ação, escreva `Ações` — a categoria passa a existir, aparece nos gráficos e no seletor, e nada precisa ser reconfigurado. O mesmo vale para `FII`, `Fundo`, `Cripto`, `Previdência` ou qualquer nome que fizer sentido para você.

### `Investimentos` — o dinheiro entrando e saindo

Só duas coisas acontecem aqui: **Aporte** e **Resgate**.

**Rendimento não se lança.** Ele é calculado. Continue lendo.

### `Saldos` — a foto mensal

Uma vez por mês, você copia da corretora quanto cada aplicação vale e registra. Só isso.

---

## Por que separado: o rendimento é deduzido, não digitado

```
rendimento do mês = saldo final − saldo inicial − aportes + resgates
```

Você aportou R$ 1.000 e no fim do mês a corretora mostra R$ 1.011,80? O sistema conclui sozinho que rendeu R$ 11,80.

Isso importa porque:

- **Você nunca precisa saber quanto rendeu.** Copiar um saldo é fácil; calcular rendimento com aportes no meio do mês é onde todo mundo erra.
- **Funciona para qualquer aplicação.** Renda fixa, ação, fundo — se tem um saldo, tem rendimento calculável.
- **Erro de digitação se corrige sozinho.** Registrar o mesmo ativo no mesmo mês **substitui** o valor, não duplica.

---

## Atenção: não conte o aporte duas vezes

Aporte **não é despesa** — é dinheiro que muda de lugar, do seu bolso para o seu bolso.

Registre o aporte **só na aba Investimentos**. Não crie também uma Saída em `Investimento/Reserva` na aba `Lancamentos`, senão ele some da sua sobra e aparece no patrimônio ao mesmo tempo.

A tabela **Aporte × sobra do mês** existe para essa reconciliação: ela mostra quanto sobrou (entradas − saídas) ao lado de quanto você aportou. Se aportou mais do que sobrou, o dinheiro veio de outro lugar — e o número vai te avisar.

---

## O simulador

Você informa aporte mensal, prazo e uma taxa; ele projeta mês a mês com juros compostos.

**Os três modos de taxa:**

| Modo | Quando usar | O que informar |
|---|---|---|
| `% do CDI` | CDB, LCI, LCA | `110` para 110% do CDI |
| `% ao ano, fixo` | Prefixado, ou uma estimativa sua | `12.5` |
| `IPCA + %` | Tesouro IPCA+ | o juro real, ex. `6.2` |

**Aumento do aporte por ano** — se você espera aportar mais conforme a renda cresce, ponha `10` para 10% ao ano. O aporte sobe uma vez por ano, a partir do 13º mês.

**Descontar IR** aplica a tabela regressiva da renda fixa sobre o rendimento:

| Prazo | Alíquota |
|---|---|
| até 180 dias | 22,5% |
| 181 a 360 | 20% |
| 361 a 720 | 17,5% |
| acima de 720 dias | 15% |

É uma **estimativa simplificada**: usa a alíquota do prazo total sobre o rendimento total. Na prática, cada aporte tem seu próprio prazo e sua própria alíquota, então o IR real tende a ser um pouco maior. LCI e LCA são isentas — desmarque a caixa nesses casos.

**Mostrar em poder de compra de hoje** divide o resultado pela inflação acumulada. R$ 245 mil em 10 anos com IPCA a 4,64% valem cerca de R$ 156 mil em dinheiro de hoje. É o número mais honesto dos dois.

### Os limites que você precisa conhecer

O simulador assume **taxa constante o tempo todo**. A realidade não é assim: a Selic estava em 14,25% ao ano em julho de 2026, mas já foi 2% e já foi 14,75%. Uma projeção de 20 anos com a taxa de hoje é um exercício de "e se", não uma previsão.

Use-o para comparar cenários — "aportar R$ 500 ou R$ 800 muda quanto?" — mais do que para acreditar num número específico lá na ponta.

---

## Rotina sugerida

**Uma vez, no começo:** cadastre seus ativos na aba **Registrar → Cadastrar um ativo novo**.

**A cada aporte:** registre em **Registrar → Aporte ou resgate**. Leva 15 segundos.

**Uma vez por mês:** abra a corretora, veja o saldo de cada aplicação e registre em **Registrar → Saldo do mês**. É o único trabalho recorrente, e é o que faz todo o resto funcionar.

Depois disso, a aba **Minha carteira** mostra patrimônio, quanto foi seu bolso e quanto foi juros, rentabilidade por ativo, composição por classe, e a comparação entre a sua sobra e o seu aporte.

---

## Referências usadas nos valores padrão

- Selic: **14,25% a.a.**, definida na reunião do Copom de 17/06/2026
- IPCA 12 meses: aproximadamente **4,64%**
- CDI: o campo vem preenchido com 14,15%, um pouco abaixo da Selic, como é usual

**Confira e ajuste.** Esses números mudam — a próxima reunião do Copom era 05/08/2026. Todos os campos do simulador são editáveis exatamente por isso.

---

**Anterior:** [`04-problemas-comuns.md`](04-problemas-comuns.md)
