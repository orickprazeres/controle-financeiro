# Testes

124 testes cobrindo a lógica onde um erro passaria despercebido — aritmética de meses, leitura de valores, parsing de CSV, geração de parcelas, somas do painel e a matemática de investimento.

## Rodar

Precisa apenas do [Node.js](https://nodejs.org) instalado. Na raiz do projeto:

```bash
node testes/testes.js
```

Saída esperada no fim:

```
124 testes passaram, 0 falharam
```

Sai com código `0` se tudo passar, `1` se algo falhar.

## O que é coberto

| Grupo | Por que importa |
|---|---|
| Competência | Um erro de 1 mês joga a parcela no lugar errado e desalinha o ano inteiro |
| Valores BR/US | `1.234,56` e `1,234.56` são o mesmo número; ler errado corrompe o histórico |
| Datas | Bancos exportam em 4 formatos diferentes |
| Parcelas `N/M` | Precisa detectar `3/10` sem confundir com `05/01/2026` |
| CSV | Vírgula dentro de aspas quebra parsers ingênuos |
| Geração de parcelas | Rateio com dízima, virada de ano, e só a 1ª herdar "pago" |
| Agregações do painel | Confere que cartão **não** é contado como categoria |
| Taxa equivalente | 12% a.a. não é 1% ao mês — a diferença compõe ao longo de anos |
| IR regressivo | As quatro faixas e as fronteiras exatas (720 vs 721 dias) |
| Projeção de aportes | Com e sem juros, e o aporte crescendo só a partir do 13º mês |
| Rendimento deduzido | Garante que um aporte nunca seja confundido com rendimento |
| Vencimento e atraso | Virada de mês e de ano, onde a conta de dias costuma errar |
| Dia 31 em mês curto | Vencimento não pode escorregar de fevereiro para março |
| Gerar contas fixas | Rodar duas vezes não pode duplicar |

## Ao alterar o código

As funções em `testes.js` são cópias das que rodam em `docs/importar.html` e `apps-script/Codigo.gs`. Se você mudar uma delas lá, **copie a mudança para cá e rode os testes** — é o que impede uma correção pequena de estragar outra coisa em silêncio.

Ao adicionar um recurso, acrescente um teste no grupo correspondente e registre no `CHANGELOG.md`.
