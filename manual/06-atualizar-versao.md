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

## E nas próximas versões?

O mesmo princípio, sempre:

- **Versão CORREÇÃO ou MENOR** (1.1.1, 1.2.0) — atualize os arquivos e, se houver aba nova, rode a função de configuração correspondente. A planilha permanece.
- **Versão MAIOR** (2.0.0) — significa que a estrutura de colunas mudou. Aí sim haverá um guia específico de migração de dados. Não troque nada por conta própria.

Antes de qualquer atualização, vale um seguro de dois cliques: na planilha, **Arquivo → Fazer uma cópia**. Se algo der errado, você volta.

---

**Anterior:** [`05-investimentos.md`](05-investimentos.md)
