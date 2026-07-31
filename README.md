# Custos da Casa · v1.0.0

Controle de custos domésticos com **Google Sheets como banco de dados** e um **site no GitHub Pages** para analisar e lançar.

Você lança pelo site ou direto na planilha — é o mesmo dado, sincronizado na hora.

---

## Estrutura da pasta

```
#ControleFinanceiro/
├── README.md                    você está aqui — visão geral
├── CHANGELOG.md                 histórico de versões
├── .gitignore                   o que o Git deve ignorar
│
├── docs/                        ► O SITE (é desta pasta que o GitHub Pages publica)
│   ├── index.html                 painel, lançamentos, orçamento, parcelas futuras
│   └── importar.html              importador de CSV de fatura/extrato
│
├── apps-script/                 ► O BACKEND (vai colado dentro da planilha)
│   ├── Codigo.gs                  a API que lê e grava no Sheets
│   └── appsscript.json            configuração do projeto Apps Script
│
├── planilha/                    ► O BANCO DE DADOS
│   ├── Custos-Casa-v1.0.0.xlsx    modelo para importar no Google Sheets
│   └── anterior/                  a planilha antiga de 25 abas, guardada
│       └── Controle-Custos-Casa-ORIGINAL.xlsx
│
├── manual/                      ► A DOCUMENTAÇÃO (leia nesta ordem)
│   ├── 01-instalacao.md           passo a passo completo, do zero
│   ├── 02-estrutura-de-dados.md   o que é cada aba e cada coluna
│   ├── 03-personalizar.md         categorias, cores, regras de auto-classificação
│   └── 04-problemas-comuns.md     o que fazer quando algo não funciona
│
└── testes/                      ► CONTROLE DE QUALIDADE
    ├── testes.js                  testes automatizados da lógica crítica
    └── README.md                  como rodar
```

> **Por que o site fica em `docs/` e não em `site/`?**
> Porque o GitHub Pages gratuito só publica de duas origens: a raiz do repositório ou a pasta `docs/`. Usando `docs/`, a configuração é um clique e a raiz fica limpa. A documentação em texto ficou em `manual/` justamente para não se confundir com ela.

---

## Começar

Vá direto para **[`manual/01-instalacao.md`](manual/01-instalacao.md)**. São 4 etapas, cerca de 15 minutos:

1. Subir a planilha para o Google Sheets
2. Colar o `Codigo.gs` no Apps Script e publicar como App da Web
3. Subir a pasta para o GitHub e ligar o Pages
4. Conectar o site à planilha (URL + token)

---

## O que o site faz

**Painel** — entradas, saídas, saldo, quanto foi no cartão e quanto ainda está em aberto. Evolução de 12 meses, gasto por categoria, por grupo e por forma de pagamento, tabela de categorias com orçamento e barra de consumo, e comparativo com o mês anterior categoria a categoria.

**Lançamentos** — lista filtrável por texto, tipo, categoria, forma de pagamento e status de pagamento, com exclusão.

**Novo** — formulário de lançamento. Se você informar parcelas, ele mostra a prévia ("vou criar 10 linhas de R$ 420,00, de jan/26 até out/26") e grava cada parcela no mês em que ela cai.

**Orçamento** — limite mensal por categoria, salvo na planilha.

**Parcelas futuras** — gráfico do que já está comprometido nos próximos 12 meses e a lista de compras parceladas em aberto.

**Importar fatura** — lê o CSV do banco, adivinha as colunas, categoriza sozinho por palavra-chave (Assaí → Mercado, iFood → Restaurantes/Delivery, Netflix → Assinaturas…), detecta parcelas do tipo `3/10` e gera as futuras.

---

## Por que a planilha foi refeita

| Planilha antiga | Agora |
|---|---|
| 25 abas (12 meses × 2 + resumo) | 1 tabela `Lancamentos` |
| 2 listas de categoria que nunca somavam entre si | 1 lista única em `Categorias` |
| "Cartão de Crédito" era uma categoria de gasto | Cartão é *forma de pagamento*; remédio no cartão conta como Saúde |
| Parcela era texto solto, sem projeção | Cada parcela é uma linha, na competência certa |
| Teto de 50 saídas e 100 itens de fatura por mês | Sem limite |
| Copiar aba manualmente todo mês | Nada a fazer |
| Sem orçamento e sem comparativo entre meses | Orçamento por categoria e comparação mês a mês |

Detalhes em [`manual/02-estrutura-de-dados.md`](manual/02-estrutura-de-dados.md).

---

## Segurança

- Os dados ficam **na sua conta do Google**, nunca no GitHub. O repositório só contém HTML.
- O token fica no `Codigo.gs` (privado, dentro da sua planilha) e no navegador.
- **Nunca** escreva o token dentro dos arquivos de `docs/` antes de subir para um repositório público.

---

## Versão

`1.0.0` — veja o [CHANGELOG.md](CHANGELOG.md). O número de versão aparece dentro de cada arquivo (`var VERSAO`) e no nome do arquivo da planilha.
