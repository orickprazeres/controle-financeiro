# Histórico de versões · Controle Financeiro

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Numeração [SemVer](https://semver.org/lang/pt-BR/): `MAIOR.MENOR.CORREÇÃO`.

- **MAIOR** — muda a estrutura da planilha; exige migrar os dados.
- **MENOR** — recurso novo, compatível com o que você já tem.
- **CORREÇÃO** — conserto de bug, sem mudança de estrutura.

---

## [1.6.0] — 2026-07-31

Contas a pagar. **Requer rodar uma função de migração e reimplantar** — é a primeira versão desde a 1.1.0 que mexe na estrutura.

### Adicionado

**Planilha**

- Três colunas em `Lancamentos`: `vencimento`, `data_pagamento` e `valor_pago`.
- Aba `ContasFixas`: o que se repete todo mês, com dia de vencimento e valor estimado.
- `configurarContasAPagar()` cria as colunas, preenche o `vencimento` das linhas antigas com a data delas e cria a aba. Idempotente.

**Backend**

- `pagar` — grava data e valor do pagamento e vira o status.
- `desfazer_pag` — devolve a conta para "em aberto" e limpa os campos.
- `conta_fixa` — cadastra ou atualiza uma conta recorrente.
- `gerar_contas` — cria as contas do mês a partir do cadastro, pulando as que já existem.

**Site — aba "Contas a pagar"**

- Indicadores de vencidas, a vencer em 7 dias, em aberto no mês e pago no mês.
- Lista ordenada por vencimento, atrasadas primeiro com fundo avermelhado e a contagem de dias.
- Botão **Pagar** com data e valor, avisando na hora se o valor difere do previsto.
- Quadro do que foi pago no mês, com previsto, pago, diferença e opção de desfazer.
- Cadastro de contas fixas e botão para gerar o mês.
- Campo **Vencimento** no formulário de lançamento, que acompanha a data quando deixado em branco.

### Decisões de projeto

- **`vencimento` separado de `data`.** A energia é emitida dia 07 e vence dia 20; a compra no cartão acontece hoje e vence na fatura. Sem separar, não há como saber o que está atrasado.
- **`valor_pago` separado de `valor`.** Conta de luz quase nunca vem no valor estimado. Guardar os dois permite ver o desvio; o indicador "Pago no mês" usa o real, não o previsto.
- **Linhas antigas não quebram.** Sem `vencimento`, o sistema usa a `data`. Os 185 lançamentos importados continuam funcionando sem nenhum ajuste.
- **Dia 31 em fevereiro vira 28** (ou 29 em bissexto), em vez de escorregar para março.

### Testes

30 testes novos: classificação de atraso incluindo virada de mês e de ano, dia de vencimento em meses curtos, geração sem duplicar, comparação ignorando maiúsculas e diferença entre previsto e pago. Total: **124 testes**.

---

## [1.5.0] — 2026-07-31

O projeto passa a se chamar **Controle Financeiro** e ganha identidade visual.

### Alterado

- **"Custos da Casa" virou "Controle Financeiro"** no título da aba do navegador, no cabeçalho das duas páginas, no rodapé, na documentação e no comentário do `Codigo.gs`.
- O nome deixou de descrever só metade do que o sistema faz: desde a v1.1.0 ele também acompanha investimentos, patrimônio e rentabilidade.
- Novo modelo `planilha/Controle-Financeiro-v1.5.0.xlsx`, com o Painel retitulado. Os modelos antigos foram para `planilha/anterior/`.

### Adicionado

- **Logo CF** — monograma em azul sobre fundo escuro, com uma linha ascendente verde na base. Desenhado em SVG, então fica nítido de 16px a 512px.
- `docs/favicon.svg` — ícone da aba do navegador.
- `docs/icone-180.png`, `icone-192.png`, `icone-512.png` — para "Adicionar à tela de início" no celular.
- `docs/manifest.webmanifest` — instalado no celular, o app aparece como **CF · Controle Financeiro** com ícone próprio, abrindo em tela cheia.
- A marca também aparece ao lado do título, dentro do site.

### Sobre o desenho

A primeira versão tinha a linha verde cruzando por cima das letras — bonito em 512px, ilegível em 16px. As letras foram para a faixa de cima e a linha para a base, separadas. Testado renderizando em 16, 32, 48 e 180px antes de fechar.

### Não muda nada funcional

Nenhum dado, coluna, fórmula ou endereço foi alterado. **Não precisa reimplantar o Apps Script** — o `VERSAO` dele subiu junto só para os números baterem, mas o comportamento é idêntico.

---

## [1.4.1] — 2026-07-31

### Alterado

- O botão **Planilha ↗** já vem com o endereço da planilha embutido — não precisa configurar nada. O campo do ⚙ continua existindo para trocar de planilha ou esconder o botão.

### Por que agora pode ficar no código

O compartilhamento da planilha está em **Restrito**: só quem foi autorizado abre, e saber o endereço não dá acesso a nada. Nesse cenário o ID não é segredo, e a configuração manual da v1.4.0 virava atrito sem ganho.

**Se um dia você mudar o compartilhamento para "qualquer pessoa com o link"**, o endereço volta a ser a única proteção dos seus dados. Aí apague a linha `SHEET_PADRAO` do `index.html` antes de subir para o GitHub, e use só o campo do ⚙. Há um comentário no próprio arquivo lembrando disso.

---

## [1.4.0] — 2026-07-31

Competência em formato brasileiro e atalho para a planilha. Só `docs/` mudou — nada a reimplantar.

### Alterado

- **Todo mês na tela agora aparece como `jul/26`**, não mais `2026-07`. Vale para o seletor do topo, gráficos, tabelas, comparativo e parcelas futuras.
- **Os campos de competência viraram listas suspensas.** Antes eram caixas de texto onde se digitava `2026-07` — e digitar errado fazia o lançamento sumir num mês inexistente. Agora você escolhe `jul/26` e o sistema guarda `2026-07` por baixo.
- A lista de meses inclui os que já têm lançamento, mais 30 meses para trás e 18 para frente.

### Adicionado

- **Botão `Planilha ↗` no topo**, abre o Google Sheets em nova aba.
- Campo **"Link da planilha"** na tela de conexão (⚙), ao lado da URL e do token.

### Por que o link fica na configuração e não no código

O repositório do GitHub é **público**. Se o endereço da planilha estivesse escrito dentro do `index.html`, qualquer pessoa poderia lê-lo. Caso a planilha esteja compartilhada como "qualquer pessoa com o link", esse endereço é a única coisa que protege seus dados — publicá-lo equivaleria a deixar a porta aberta.

Guardado no navegador, o botão funciona igual e o endereço não sai do seu computador.

**Vale conferir:** na planilha, botão **Compartilhar**. Se estiver em "Qualquer pessoa com o link", troque para **"Restrito"** — o site continua funcionando, porque ele acessa os dados pelo Apps Script, não pelo link.

---

## [1.3.0] — 2026-07-31

Importador entende arquivos que já vêm no formato do sistema. Só `docs/importar.html` mudou — nada a reimplantar.

### Adicionado

- **Modo direto.** Se o CSV traz as colunas do sistema (`data`, `tipo`, `descricao`, `categoria`, `valor` no mínimo), o importador detecta sozinho e oferece um botão que pula todo o mapeamento.
- **Cartão, tipo, competência, forma de pagamento e status lidos linha a linha.** Antes esses cinco eram fixos para o arquivo inteiro — impossível importar uma planilha com três cartões e entradas misturadas com saídas numa tacada só.
- **Categoria vinda do arquivo é usada como está**, sem passar pela adivinhação por palavra-chave. A prévia marca a origem: "do arquivo" ou "auto".
- **Estornos mantêm o sinal negativo.** Uma compra estornada é despesa que voltou, não receita; somar como entrada distorceria os dois indicadores.
- A prévia agora mostra a coluna de pagamento, quantos cartões distintos existem e quantos estornos foram encontrados.

### Motivo

Migrar a planilha antiga expôs o limite: 185 lançamentos, 3 cartões, entradas e saídas juntas, competência diferente da data em toda a fatura. Pelo caminho antigo seriam 6 importações separadas, cada uma com risco de errar um seletor.

---

## [1.2.0] — 2026-07-31

Lançar virou um botão. Só o site muda — planilha e Apps Script continuam na v1.1.0, nada a reimplantar.

### Alterado

- **Botão "+ Novo lançamento" fixo no topo**, ao lado do seletor de mês. Abre um modal sobre a tela atual, de qualquer aba.
- **A aba "Novo" saiu do menu.** O formulário é o mesmo, agora dentro do modal — nenhum campo mudou.
- **A competência já vem no mês que você está olhando.** Se o painel está em jul/2026, o lançamento nasce em 2026-07 em vez do mês corrente.
- Ao salvar, o modal fecha sozinho e a confirmação aparece no topo da página, não escondida dentro do formulário.

### Adicionado

- Fechar o modal por **Esc**, pelo **✕**, pelo **Cancelar** ou clicando no fundo escurecido.
- **Enter** dentro de qualquer campo de texto salva o lançamento.
- Foco automático na Descrição ao abrir — dá para abrir e já digitar.
- Em tela de celular o modal ocupa a tela inteira, sem bordas.

### Motivo

Lançar é a ação mais frequente do sistema, e estava a dois cliques e uma troca de contexto de distância: sair do painel, ir na aba Novo, preencher, voltar. Agora é um clique de onde você estiver, e você não perde de vista o mês que estava analisando.

---

## [1.1.0] — 2026-07-31

Módulo de investimentos. Compatível com a v1.0.0: nenhum dado existente precisa ser alterado.

### Adicionado

**Planilha** (`planilha/Custos-Casa-v1.1.0.xlsx`)

- Aba `Ativos`: catálogo das aplicações, com classe em texto livre (`Renda Fixa` hoje, `Ações` ou `FII` quando aparecerem), indexador, taxa contratada, instituição, vencimento e liquidez. Coluna `em_uso` aposenta um ativo vencido sem apagar o histórico.
- Aba `Investimentos`: aportes e resgates. Rendimento não se lança aqui.
- Aba `Saldos`: foto mensal de quanto cada aplicação vale.
- Apêndice na aba `Leia-me` explicando as três e o risco de contar o aporte em dobro.

**Backend** (`apps-script/Codigo.gs`)

- `doGet` passa a devolver `ativos`, `investimentos` e `saldos`.
- Novas ações: `inv_lancar` (aporte/resgate), `inv_saldo`, `inv_ativo` e `inv_excluir`.
- `inv_saldo` e `inv_ativo` são idempotentes: repetir o mesmo ativo no mesmo mês **corrige** o valor em vez de duplicar.
- Helpers `texto_` e `mes_` normalizam datas vindas do Sheets, para o site não depender do formato regional da planilha.

**Site** (`docs/index.html`)

- Aba **Investimentos** com três seções.
- *Simulador*: projeção mês a mês com juros compostos, em `% do CDI`, `% ao ano` ou `IPCA + %`; aporte com crescimento anual opcional; IR pela tabela regressiva; conversão para poder de compra de hoje. Gráfico de barras empilhadas separando o que veio do bolso do que veio de juros, e tabela ano a ano.
- *Minha carteira*: patrimônio, total aportado, rendimento acumulado, aporte médio mensal, evolução do patrimônio com aportes sobrepostos, composição por classe, quadro por ativo com rentabilidade, e comparativo entre a sobra do mês e o aporte efetivo.
- *Registrar*: formulários de aporte/resgate, saldo mensal e cadastro de ativo.

**Migração** (para quem já usava a v1.0.0)

- `configurarInvestimentos()` cria as três abas novas na planilha existente, com cabeçalhos, formato de moeda e listas suspensas. Idempotente — rodar duas vezes não duplica nada.
- `verificarInstalacao()` diz quais abas faltam e qual versão está rodando.
- **Não substitua a planilha.** O Apps Script vive dentro dela; trocar o arquivo derruba a API e apaga os lançamentos. Guia em `manual/06-atualizar-versao.md`.

**Documentação e testes**

- Novo `manual/05-investimentos.md` e `manual/06-atualizar-versao.md`.
- Seções novas em `03-personalizar.md` (adicionar tipo de investimento, ajustar taxas de referência) e `04-problemas-comuns.md` (aba vazia, rendimento estranho, aporte em dobro).
- 34 testes novos: taxa mensal equivalente, composição IPCA + juro real, tabela regressiva de IR nas quatro faixas e fronteiras, projeção de aportes com e sem juros, crescimento anual do aporte, rendimento deduzido e consolidação da carteira. Total: **94 testes**.

### Decisões de projeto

- **Rendimento é deduzido, não digitado.** `saldo final − saldo inicial − aportes + resgates`. Você copia um saldo; a conta se vira. Funciona igual para renda fixa, ação ou fundo.
- **Classe de ativo é texto livre.** Não há lista fechada de tipos de investimento — a intenção é justamente não obrigar ninguém a decidir hoje o que vai comprar daqui a dois anos.
- **Aporte não é despesa.** Fica só na aba `Investimentos`, nunca em `Lancamentos`. A tabela *Aporte × sobra* existe para checar essa consistência.
- **O simulador assume taxa constante e diz isso na tela.** É ferramenta de comparação de cenários, não previsão.

### Referências das taxas padrão

Selic em 14,25% a.a. (Copom de 17/06/2026), IPCA 12 meses em ~4,64%, CDI pré-preenchido em 14,15%. Todos os campos são editáveis — as fontes consultadas divergiram sobre o valor exato do CDI, então o número é uma referência a conferir, não um dado fechado.

---

## [1.0.0] — 2026-07-31

Primeira versão. Substitui a planilha `Controle-Custos-Casa.xlsx` (25 abas).

### Adicionado

**Planilha** (`planilha/Custos-Casa-v1.0.0.xlsx`)

- Aba `Lancamentos`: tabela única com 14 colunas, sem limite de linhas.
- Aba `Categorias`: lista única de 27 categorias com grupo, tipo e marcação de essencial.
- Aba `Cartoes`: cartões com titular, dias de fechamento/vencimento e limite.
- Aba `Orcamento`: limite mensal por categoria de saída.
- Aba `Painel`: resumo de conferência com seletor de competência, quadro por categoria com orçamento e evolução dos 12 meses.
- Aba `Leia-me`: explicação de cada coluna dentro do próprio arquivo.
- Listas suspensas em tipo, categoria, forma de pagamento, cartão e pago.
- 5 linhas de exemplo, ignoradas automaticamente pelo site e removíveis.

**Backend** (`apps-script/Codigo.gs`)

- `doGet` devolve lançamentos, categorias, cartões e orçamento em JSON.
- `doPost` com as ações `inserir`, `importar`, `atualizar`, `excluir` e `orcamento`.
- `inserir` gera automaticamente uma linha por parcela, cada uma na sua competência, com virada de ano correta.
- Aceita valor por parcela ou valor total da compra, com rateio.
- Datas e valores normalizados na saída, para o site não depender do formato regional da planilha.
- Proteção por token.

**Site** (`docs/`)

- `index.html`: painel com 5 indicadores, 4 gráficos, quadro de categorias com orçamento, comparativo com o mês anterior, lista filtrável, formulário de lançamento com prévia de parcelamento, edição de orçamento e visão de parcelas futuras.
- `importar.html`: importador em 3 etapas com detecção de separador, mapeamento de colunas, leitura de valores em formato brasileiro e americano, 23 regras de auto-classificação por palavra-chave, detecção de parcelas `N/M` e geração das parcelas futuras.
- Configuração guardada no navegador; funciona como app ao adicionar à tela de início do celular.

**Documentação** (`manual/`) e **testes** (`testes/`)

- Manual em 4 partes: instalação, estrutura de dados, personalização e problemas comuns.
- 48 testes automatizados cobrindo aritmética de competência, leitura de valores e datas, parsing de CSV, detecção de parcelas, auto-classificação e agregação do painel.

### Decisões de projeto

- **Cartão deixou de ser categoria.** Virou forma de pagamento, para que o gasto seja classificado pelo que é, não por como foi pago.
- **Competência separada da data.** A data diz quando comprou; a competência diz em que mês o valor pesa. É o que torna o parcelamento visível no futuro.
- **Uma parcela = uma linha.** Mais linhas, porém toda soma, filtro e gráfico funciona sem regra especial.

---

## Como registrar suas próprias mudanças

Ao alterar algo, acrescente aqui no topo:

```markdown
## [1.1.0] — 2026-08-15

### Adicionado
- Categoria "Streaming infantil" na aba Categorias.

### Corrigido
- Regra de auto-classificação confundia "Barbearia" com "Bar".
```

E atualize o `var VERSAO` no topo de `docs/index.html`, `docs/importar.html` e `apps-script/Codigo.gs`.

Se mudar as colunas da aba `Lancamentos`, suba a versão **MAIOR** e gere um novo `.xlsx` em `planilha/` com o número no nome — nunca sobrescreva o antigo, ele é o registro de como os dados existentes estão organizados.
