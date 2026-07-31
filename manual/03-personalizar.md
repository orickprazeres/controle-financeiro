# 03 · Personalizar

Tudo aqui é opcional. O sistema funciona sem mexer em nada.

---

## Adicionar ou renomear uma categoria

Na aba **Categorias** da planilha, acrescente uma linha:

| categoria | grupo | tipo | essencial |
|---|---|---|---|
| Streaming infantil | Pessoal | Saída | Não |

Recarregue o site (botão **Atualizar**). Ela já aparece nas listas suspensas e nos gráficos.

Se quiser controlar orçamento nessa categoria, acrescente-a também na aba **Orcamento**.

> **Ao renomear uma categoria**, os lançamentos antigos continuam com o nome velho e passam a aparecer como uma categoria separada. Use Localizar e Substituir (`Ctrl+H`) na coluna `categoria` da aba `Lancamentos` para atualizar o histórico.

---

## Melhorar a classificação automática do importador

Abra `docs/importar.html` e procure `var REGRAS`. É uma lista de pares — categoria e as palavras-chave que a acionam, **sempre em minúsculas**:

```js
['Mercado', ['assai','atacad','carrefour','supermerc','hortifruti']],
```

Para ensinar o mercado do seu bairro:

```js
['Mercado', ['assai','atacad','carrefour','supermerc','hortifruti','mercadinho do ze']],
```

Três detalhes importantes:

- **A ordem importa.** A primeira regra que casar vence. `Mercado` é testado antes de `Restaurantes/Delivery`, então "SUPERMERCADO CAFÉ CENTRAL" cai em Mercado.
- **Palavras curtas causam falso positivo.** `'bar'` casaria com "Barbearia". Por isso as regras usam `'bar '` com espaço.
- **O nome da categoria tem que existir** na aba `Categorias`, escrito igual. Se não existir, o lançamento entra como `Outros`.

---

## Voltar a aba "Novo" no lugar do modal

Se preferir o formulário como página fixa, em `docs/index.html`:

1. No `<nav>`, acrescente `<button data-p="novo">Novo</button>`
2. No JavaScript, ponha `novo:'pgNovo'` de volta no objeto `mapa`
3. Troque `<div id="modalNovo" class="modal hide">` por `<div id="pgNovo" class="pg hide">`

Dá para ter os dois ao mesmo tempo, mas aí o formulário existiria duplicado e os IDs colidiriam. Escolha um.

---

## Mudar o formato do mês na tela

Hoje aparece `jul/26`. A conversão está numa função só, em `docs/index.html`:

```js
function nomeMes(c){
  var p=String(c).split('-');
  return MESES_CURTOS[(+p[1])-1] + '/' + String(p[0]).slice(-2);
}
```

Para `jul/2026`, troque `String(p[0]).slice(-2)` por `p[0]`. Para `07/26`, troque `MESES_CURTOS[(+p[1])-1]` por `p[1]`.

O valor guardado na planilha continua `2026-07` de qualquer jeito — isso é só apresentação.

---

## Trocar as cores

No topo do `<style>` de `docs/index.html` e `docs/importar.html`:

```css
:root{
  --bg:#0f172a;    /* fundo da página */
  --card:#1e293b;  /* fundo dos cartões */
  --txt:#e2e8f0;   /* texto */
  --ac:#38bdf8;    /* cor de destaque, botões */
  --ok:#34d399;    /* positivo, entradas */
  --bad:#f87171;   /* negativo, saídas */
}
```

Para tema claro, troque `--bg` por `#f8fafc`, `--card` por `#ffffff`, `--txt` por `#0f172a` e `--line` por `#e2e8f0`.

A paleta dos gráficos é a lista `PAL` no JavaScript de `index.html`.

---

## Mudar o ano do painel da planilha

A aba `Painel` tem a evolução fixa em 2026 (células `H15:H26`). Para 2027, edite essas células para `2027-01` até `2027-12`. As fórmulas ao lado se ajustam sozinhas.

O site não tem essa limitação — ele monta a evolução a partir do mês selecionado, para trás, sempre.

---

## Adicionar uma forma de pagamento

Ela aparece em três lugares:

1. **Planilha**, aba `Lancamentos`: selecione a coluna `forma_pagamento` → **Dados** → **Validação de dados** → acrescente à lista.
2. **`docs/index.html`**, no `<select id="nForma">`.
3. **`docs/importar.html`**, no `<select id="mForma">`.

---

## Adicionar um cartão

Só na aba **Cartoes**. O site lê de lá.

---

## Adicionar um tipo de investimento

Não precisa de nenhuma configuração. Na aba **Ativos**, a coluna `classe` é texto livre: escreva `Ações`, `FII`, `Cripto`, `Previdência` ou o que fizer sentido. A classe passa a existir, aparece nos gráficos de composição e vira sugestão no formulário. Você também pode cadastrar pelo próprio site, em **Investimentos → Registrar → Cadastrar um ativo novo**.

Para aposentar uma aplicação vencida sem perder o histórico, ponha `Não` na coluna `em_uso` — ela some dos seletores e continua nos relatórios.

---

## Ajustar as taxas de referência do simulador

Os campos **CDI hoje** e **IPCA 12 meses** são editáveis na própria tela. Para mudar o valor com que a página abre, procure em `docs/index.html`:

```html
<input type="number" step="0.01" id="sCDI" value="14.15">
<input type="number" step="0.01" id="sIPCA" value="4.64">
```

---

## Depois de editar qualquer arquivo

| Arquivo alterado | O que fazer |
|---|---|
| `docs/*.html` | Subir para o GitHub (Add file → Upload files, substituindo). O Pages atualiza em ~1 min. |
| `apps-script/Codigo.gs` | Colar no Apps Script **e** reimplantar: Implantar → Gerenciar implantações → lápis → Versão: Nova versão → Implantar. |
| Abas da planilha | Nada. É lido em tempo real. |

E registre a mudança no `CHANGELOG.md`, subindo o número da versão.

---

**Próximo:** [`04-problemas-comuns.md`](04-problemas-comuns.md)
