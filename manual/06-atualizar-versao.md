# 06 · Atualizar de versão

## A regra: nunca substitua a planilha

Se você já importou a planilha no Google Sheets e ligou o Apps Script, **não importe o `.xlsx` novo por cima**. Trocar a planilha significa:

- perder a URL do App da Web (o Apps Script vive *dentro* da planilha, some junto)
- refazer a publicação, a autorização e a reconexão do site
- perder todo lançamento já registrado

O `.xlsx` em `planilha/` serve para quem está começando do zero. Quem já usa, **atualiza no lugar**.

---

## Atualizar da v1.0.0 para a v1.1.0

A v1.1.0 acrescenta três abas (`Ativos`, `Investimentos`, `Saldos`) e não altera nenhuma das que você já tem. São três passos.

### 1. Atualizar o código da API

1. Abra sua planilha → **Extensões** → **Apps Script**.
2. Selecione **todo** o conteúdo do editor e apague.
3. Cole o conteúdo novo de `apps-script/Codigo.gs`.
4. **Ponha seu token de volta.** O arquivo vem com `var TOKEN = 'troque-esta-senha';` — troque pela mesma senha que você já usa, senão o site para de conectar.
5. Salve (ícone de disquete).

### 2. Criar as abas novas

Ainda no editor do Apps Script:

1. Na barra acima do código, há uma lista de funções (costuma mostrar `doGet`).
2. Escolha **`configurarInvestimentos`**.
3. Clique em **Executar**.
4. Se pedir autorização de novo, autorize — o script ganhou permissão para criar abas.

Volte à planilha: as abas `Ativos`, `Investimentos` e `Saldos` estão lá, com cabeçalhos, formato de moeda e listas suspensas prontas.

> Rodar essa função duas vezes por engano não faz mal. Ela confere o que já existe e só cria o que falta.

### 3. Reimplantar e atualizar o site

1. No Apps Script: **Implantar** → **Gerenciar implantações** → ícone de lápis → **Versão: Nova versão** → **Implantar**. A URL não muda.
2. No GitHub: **Add file** → **Upload files**, arraste o `docs/index.html` novo (e o `importar.html`) e confirme a substituição.
3. Abra o site e clique em **Atualizar**.

Pronto. A aba **Investimentos** aparece no menu.

---

## Conferir se deu certo

No editor do Apps Script, rode a função **`verificarInstalacao`**. Ela responde uma de duas coisas:

```
Tudo certo. Versão 1.1.0. Abas encontradas: 7 de 7.
```

```
FALTAM as abas: Ativos, Saldos. Rode configurarInvestimentos().
```

Outra checagem rápida: abra no navegador a URL da sua API com `?token=SUA-SENHA` no fim. O JSON precisa conter as chaves `ativos`, `investimentos` e `saldos`.

---

## Se a aba Investimentos abrir vazia

É quase sempre uma das duas metades faltando:

| Sintoma | Causa | Solução |
|---|---|---|
| Aba não aparece no menu | `index.html` antigo no GitHub | Suba o arquivo novo |
| Aba aparece mas sem dados e sem erro | `Codigo.gs` novo colado, mas **não reimplantado** | Gerenciar implantações → Nova versão |
| "Token inválido" depois de atualizar | Você colou o `Codigo.gs` e esqueceu de repor sua senha | Edite `var TOKEN` e reimplante |

---

## Atualizar da v1.1.0 para a v1.2.0

Esta é a atualização mais simples possível: **só o `docs/index.html` mudou.**

Não precisa mexer no Apps Script, não precisa reimplantar, não precisa tocar na planilha.

1. No GitHub, entre na pasta `docs`
2. **Add file → Upload files**, arraste o `index.html` novo e confirme a substituição
3. Espere ~1 minuto e recarregue o site com `Ctrl+F5`

O botão "+ Novo lançamento" aparece no topo e a aba "Novo" some do menu. Se o botão não aparecer, é cache do navegador: `Ctrl+F5` resolve.

---

## Atualizar para a v1.3.0 e v1.4.0

Como a v1.2.0: **só a pasta `docs/` mudou.** Suba `index.html` e `importar.html` no GitHub e dê `Ctrl+F5`.

Na v1.4.1 o botão **Planilha ↗** já vem com o endereço da sua planilha — nada a configurar.

---

## Atualizar para a v1.5.0 (nome e logo)

Só a pasta `docs/` mudou, mas agora com **arquivos novos**. Suba os seis:

- `index.html` e `importar.html` (atualizados)
- `favicon.svg`, `icone-180.png`, `icone-192.png`, `icone-512.png`, `manifest.webmanifest` (novos)

Depois `Ctrl+F5`. Se o ícone antigo insistir na aba, feche e reabra a aba — favicon é o que o navegador mais teima em guardar em cache.

Não precisa reimplantar o Apps Script: nada funcional mudou.

**Opcional:** renomeie a planilha no Google Drive de "Custos da Casa" para "Controle Financeiro". É só cosmético — o Apps Script vive dentro dela e não depende do nome.

---

## Atualizar para a v1.6.0 (contas a pagar)

Esta **mexe na estrutura** — são 4 passos, como foi na v1.1.0:

1. Cole o `apps-script/Codigo.gs` novo no Apps Script (**reponha seu token**) e salve
2. Rode a função **`configurarContasAPagar`**
3. **Implantar → Gerenciar implantações → lápis → Nova versão → Implantar**
4. Suba o `docs/index.html` no GitHub e dê `Ctrl+F5`

Detalhes em [`07-contas-a-pagar.md`](07-contas-a-pagar.md).

---

## Atualizar para a v1.7.0 (faxina de interface)

Só `docs/index.html` mudou. Suba no GitHub, `Ctrl+F5`, pronto. Nada de Apps Script, nada de planilha.

O menu passa a ter 4 itens. Orçamento e Parcelas futuras não sumiram: viraram, respectivamente, a coluna editável do Painel e uma seção dentro de A pagar.

---

## Atualizar para a v1.7.1 e v1.8.0

Só `docs/index.html`. Suba no GitHub e dê `Ctrl+F5`.

A v1.7.1 corrige o sinal do saldo no rodapé da lista de Lançamentos. A v1.8.0 troca o Painel pela página **Resumo**, com patrimônio líquido e alertas.

---

## E nas próximas versões?

O mesmo princípio, sempre:

- **Versão CORREÇÃO ou MENOR** (1.1.1, 1.2.0) — atualize os arquivos e, se houver aba nova, rode a função de configuração correspondente. A planilha permanece.
- **Versão MAIOR** (2.0.0) — significa que a estrutura de colunas mudou. Aí sim haverá um guia específico de migração de dados. Não troque nada por conta própria.

Antes de qualquer atualização, vale um seguro de dois cliques: na planilha, **Arquivo → Fazer uma cópia**. Se algo der errado, você volta.

---

**Anterior:** [`05-investimentos.md`](05-investimentos.md)
