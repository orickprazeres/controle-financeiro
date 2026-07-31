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

## Depois de editar qualquer arquivo

| Arquivo alterado | O que fazer |
|---|---|
| `docs/*.html` | Subir para o GitHub (Add file → Upload files, substituindo). O Pages atualiza em ~1 min. |
| `apps-script/Codigo.gs` | Colar no Apps Script **e** reimplantar: Implantar → Gerenciar implantações → lápis → Versão: Nova versão → Implantar. |
| Abas da planilha | Nada. É lido em tempo real. |

E registre a mudança no `CHANGELOG.md`, subindo o número da versão.

---

**Próximo:** [`04-problemas-comuns.md`](04-problemas-comuns.md)
