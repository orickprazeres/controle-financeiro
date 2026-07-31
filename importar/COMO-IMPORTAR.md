# Como importar os dados da planilha antiga

`lancamentos-julho-agosto.csv` · 185 lançamentos · Julho e Agosto de 2026

---

## Antes de tudo: atualize o importador

O `importar.html` precisa estar na **v1.3.0**. A versão anterior aplicava um único cartão ao arquivo inteiro, e o seu tem três.

1. No GitHub, pasta `docs` → **Add file → Upload files**
2. Arraste o `importar.html` novo, confirme a substituição
3. Espere ~1 min e recarregue com `Ctrl+F5`

---

## Importar

1. No site: **Importar fatura**
2. **Escolher arquivo** → `lancamentos-julho-agosto.csv`
3. **Ler dados**
4. Vai aparecer uma faixa verde: *"Este arquivo já está no formato do sistema"* → clique em **Importar direto, sem mapear nada**
5. Confira a prévia e clique em **Importar para a planilha**

Não mexa nos seletores de cartão, tipo ou competência — no modo direto tudo vem de cada linha.

### O que você deve ver na prévia

| | |
|---|---|
| Lançamentos | 185 |
| Saídas somando | R$ 29.475,89 |
| Cartões | NU HELENA, NU RICARDO, VISA RICARDO |
| Estornos com valor negativo | 4 |
| Sem categoria | nenhum |

Se esses números baterem, pode importar.

---

## Conferência: os totais batem com a planilha antiga

| Mês | | Antes | Depois |
|---|---|---|---|
| **Julho** | Entradas | R$ 10.950,24 | R$ 10.950,24 |
| | Saídas | R$ 9.298,47 | R$ 9.298,47 |
| | Cartão | R$ 5.155,59 | R$ 5.155,59 |
| **Agosto** | Entradas | R$ 9.650,24 | R$ 9.650,24 |
| | Saídas | R$ 20.177,42 | R$ 20.177,42 |
| | Cartão | R$ 4.288,18 | R$ 4.288,18 |

*Entradas de agosto: a planilha antiga somava R$ 17.241,54 porque incluía o RESGATE de R$ 7.591,30. Ele saiu — veja abaixo.*

---

## Três linhas que eu tirei de propósito

### 1. RICARDO VISA · R$ 3.549,19 · agosto — duplicata

A aba `Agosto-Cartão` traz os **76 itens** dessa mesma fatura, somando exatamente R$ 3.549,19. Importar os dois contaria o valor duas vezes.

Ficaram os 76 itens detalhados, que é o que permite ver em que você gastou.

### 2. APLICAÇÃO AURORA · R$ 300,00 · agosto — é aporte, não despesa

Aporte é dinheiro mudando de lugar dentro do seu patrimônio. Como despesa, ele derruba sua sobra e infla o patrimônio ao mesmo tempo.

**Registre em Investimentos → Registrar → Aporte:** ativo `PREV. AURORA`, data 10/08/2026, valor 300.

### 3. RESGATE · R$ 7.591,30 · agosto — é resgate, não receita

Mesma lógica ao contrário. Como Entrada, apareceria como se você tivesse ganhado esse dinheiro.

**Registre em Investimentos → Registrar → Resgate**, no ativo de onde saiu.

---

## Duas faturas que ficaram sem detalhe

`NUBAK HELENA` (R$ 332,01 em julho e R$ 200,00 em agosto) e `RICARDO NU BANK` (R$ 538,99 em agosto) não têm itens nas abas de cartão da planilha antiga.

Entraram como **uma linha só**, categoria `Outros`, forma `Crédito`, com o cartão certo — assim o dinheiro é contabilizado e o total da fatura fica correto. O que se perde é só o detalhe de "em que foi gasto".

Se você tiver esses extratos, dá para apagar essas três linhas e importar o detalhe depois.

---

## De/para das categorias

A planilha antiga usava duas listas diferentes; agora é uma só.

| Antes | Agora |
|---|---|
| Moradia (aluguel/condomínio) | Aluguel/Condomínio |
| Contas (luz/água/internet) | Contas da casa (luz/água/gás) |
| Saúde → APCEF, HUMANAS, SEGURO ITAU | **Plano de Saúde** |
| Saúde → demais | Saúde/Farmácia |
| Outros → DIZIMO | **Presentes/Doações** |
| Casa *(cartão)* | Manutenção/Móveis |
| Transporte/Combustível *(cartão)* | Combustível ou Transporte/App, pelo nome do estabelecimento |
| Cartão de Crédito *(era categoria)* | deixou de existir — virou forma de pagamento |

---

## O que eu adivinhei — confira se importa para você

**Forma de pagamento das saídas fora do cartão.** A planilha antiga não guardava essa informação. Usei:

- `Boleto` para MRV, ENERGIA, HUMANAS, APCEF, SEGURO ITAU e CEA
- `Débito` para o resto

Isso afeta só o gráfico "Como você pagou". Se quiser corrigir, é editar a coluna `forma_pagamento` na aba Lancamentos.

**Data das entradas.** Salário e dividendo não tinham data na planilha antiga (só descrição e valor). Coloquei dia 05 de cada mês.

**Parcelas futuras não foram geradas.** As compras parceladas entraram exatamente como estavam (ex.: `8/10` fica registrada como parcela 8 de 10), sem criar as parcelas 9 e 10. Gerar automaticamente duplicaria, porque agosto já traz as parcelas seguintes das mesmas compras.

Consequência: a tela **Parcelas futuras** vai aparecer vazia. Se quiser preenchê-la, lance manualmente as parcelas de setembro em diante.

---

## Depois de importar

1. Confira o Painel em jul/2026 e ago/2026 contra a tabela de conferência acima
2. Registre o aporte e o resgate na aba Investimentos
3. Guarde a planilha antiga — ela já está em `planilha/anterior/`
