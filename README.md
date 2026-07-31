# Controle Financeiro · v1.7.0

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
│   ├── index.html                 painel, lançamentos, orçamento, investimentos
│   ├── importar.html              importador de CSV de fatura/extrato
│   ├── favicon.svg                logo CF (nítido em qualquer tamanho)
│   ├── icone-180/192/512.png      ícones para celular e tela de início
│   └── manifest.webmanifest       nome e ícone do app quando instalado
│
├── apps-script/                 ► O BACKEND (vai colado dentro da planilha)
│   ├── Codigo.gs                  a API que lê e grava no Sheets
│   └── appsscript.json            configuração do projeto Apps Script
│
├── planilha/                    ► O BANCO DE DADOS
│   ├── Controle-Financeiro-v1.6.0.xlsx  modelo para importar no Google Sheets
│   └── anterior/                  a planilha antiga de 25 abas, guardada
│       └── Controle-Custos-Casa-ORIGINAL.xlsx
│
├── manual/                      ► A DOCUMENTAÇÃO (leia nesta ordem)
│   ├── 01-instalacao.md           passo a passo completo, do zero
│   ├── 02-estrutura-de-dados.md   o que é cada aba e cada coluna
│   ├── 03-personalizar.md         categorias, cores, regras de auto-classificação
│   ├── 04-problemas-comuns.md     o que fazer quando algo não funciona
│   ├── 05-investimentos.md        simulador de aportes e carteira real
│   └── 06-atualizar-versao.md     como atualizar SEM trocar a planilha
│
├── importar/                    ► MIGRAÇÃO DA PLANILHA ANTIGA
│   ├── lancamentos-julho-agosto.csv   185 lançamentos prontos
│   └── COMO-IMPORTAR.md               o passo a passo e o que foi convertido
│
└── testes/                      ► CONTROLE DE QUALIDADE
    ├── testes.js                  testes automatizados da lógica crítica
    └── README.md                  como rodar
```

> **Por que o site fica em `docs/` e não em `site/`?**
> Porque o GitHub Pages gratuito só publica de duas origens: a raiz do repositório ou a pasta `docs/`. Usando `docs/`, a configuração é um clique e a raiz fica limpa. A documentação em texto ficou em `manual/` justamente para não se confundir com ela.

---

## Começar

**Já instalou uma versão anterior?** Não importe o `.xlsx` de novo — vá para **[`manual/06-atualizar-versao.md`](manual/06-atualizar-versao.md)**. Trocar a planilha faz você perder a API e os dados.

**Instalando do zero?** Vá para **[`manual/01-instalacao.md`](manual/01-instalacao.md)**. São 4 etapas, cerca de 15 minutos:

1. Subir a planilha para o Google Sheets
2. Colar o `Codigo.gs` no Apps Script e publicar como App da Web
3. Subir a pasta para o GitHub e ligar o Pages
4. Conectar o site à planilha (URL + token)

---

## O que o site faz

**Painel** — entradas, saídas, saldo e quanto foi no cartão. Tabela de categorias com **orçamento editável ali mesmo**, e uma seção recolhível com os gráficos secundários. Evolução de 12 meses, gasto por categoria, por grupo e por forma de pagamento, tabela de categorias com orçamento e barra de consumo, e comparativo com o mês anterior categoria a categoria.

**Lançamentos** — o histórico completo, filtrável por texto, tipo, categoria, forma de pagamento e status. **Clique numa linha para editar ou excluir.**

**+ Novo lançamento** — botão fixo no topo, disponível de qualquer aba. Abre um modal sobre a tela atual; Esc ou clique fora fecha. A competência já vem no mês que você está olhando. Se você informar parcelas, mostra a prévia ("vou criar 10 linhas de R$ 420,00, de jan/26 até out/26") e grava cada parcela no mês em que ela cai.

**Contas a pagar** — o que vence quando, com as atrasadas em destaque e um seletor "só este mês / tudo em aberto". Inclui as parcelas já comprometidas nos próximos meses. Botão Pagar registra data e valor efetivos e avisa se o valor difere do previsto. Cadastro de contas fixas com geração mensal em um clique.

**Investimentos** — três telas. O *simulador* projeta aportes mensais com juros compostos, em % do CDI, % ao ano ou IPCA+, com IR regressivo e conversão para poder de compra de hoje. *Minha carteira* mostra patrimônio, quanto foi seu bolso e quanto foi juros, rentabilidade por ativo, composição por classe e a comparação entre a sobra do mês e o que você aportou. *Registrar* recebe aportes, resgates, saldos mensais e o cadastro de ativos novos.

**Importar fatura** — lê o CSV do banco, adivinha as colunas, categoriza sozinho por palavra-chave (Assaí → Mercado, iFood → Restaurantes/Delivery, Netflix → Assinaturas…), detecta parcelas do tipo `3/10` e gera as futuras. Se o arquivo já vier no formato do sistema, detecta e importa direto, lendo cartão, tipo e competência de cada linha.

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
- **Nunca** escreva o token dentro dos arquivos de `docs/`. Ele fica no `Codigo.gs` (privado, dentro da planilha) e no navegador.
- O endereço da planilha está no `index.html` (`SHEET_PADRAO`). Isso só é seguro porque o compartilhamento dela está **Restrito** — saber o endereço não dá acesso.
- **Se você mudar o compartilhamento para "qualquer pessoa com o link"**, o endereço passa a ser a única proteção dos dados: apague a linha `SHEET_PADRAO` e use o campo do ⚙, que fica só no navegador.

---

## Versão

`1.7.0` — veja o [CHANGELOG.md](CHANGELOG.md). O número de versão aparece dentro de cada arquivo (`var VERSAO`) e no nome do arquivo da planilha.
