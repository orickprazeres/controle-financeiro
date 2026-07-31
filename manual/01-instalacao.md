# 01 · Instalação

Quatro etapas, cerca de 15 minutos. Faça na ordem.

---

## Etapa 1 — Subir a planilha para o Google Sheets

1. Abra <https://drive.google.com> → **Novo** → **Upload de arquivo** → escolha `planilha/Controle-Financeiro-v1.6.0.xlsx`.
2. Clique com o botão direito no arquivo → **Abrir com** → **Planilhas Google**.
3. Menu **Arquivo** → **Salvar como Planilhas Google**. Isso cria a versão nativa; o `.xlsx` no Drive pode ser apagado depois.
4. Renomeie a planilha para `Controle Financeiro`.
5. Na aba **Lancamentos**, apague as 5 linhas que começam com `EXEMPLO`.
6. Na aba **Cartoes**, ajuste os cartões, titulares e dias de fechamento/vencimento.
7. Nas abas **Ativos**, **Investimentos** e **Saldos**, apague as linhas de `EXEMPLO`. Se ainda não investe, deixe-as vazias — o site funciona normalmente sem elas.

> A aba **Leia-me** dentro da própria planilha explica cada coluna em uma tela.

---

## Etapa 2 — Publicar a API (Apps Script)

1. Com a planilha aberta: menu **Extensões** → **Apps Script**.
2. Apague o conteúdo em branco do `Código.gs` e **cole todo o conteúdo de `apps-script/Codigo.gs`**.
3. Logo no topo, troque a senha:

   ```js
   var TOKEN = 'minha-senha-secreta-123';
   ```

   Guarde essa senha — ela vai no site na Etapa 4.

4. Clique no disquete (**Salvar projeto**).
5. Botão azul **Implantar** → **Nova implantação**.
6. Na engrenagem ao lado de "Selecione o tipo", escolha **App da Web**.
7. Preencha:
   - **Descrição:** `API Controle Financeiro`
   - **Executar como:** `Eu (seu@gmail.com)`
   - **Quem pode acessar:** `Qualquer pessoa`
8. **Implantar**. O Google vai pedir autorização:
   - **Autorizar acesso** → escolha sua conta
   - Aparece "O Google não verificou este app" → **Avançado** → **Acessar API Controle Financeiro (não seguro)** → **Permitir**
   - *É seguro: o app é seu, feito por você, e só acessa a sua planilha.*
9. **Copie a URL do App da Web.** Ela termina em `/exec`:

   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

### Duas dúvidas que sempre aparecem aqui

**"Quem pode acessar: Qualquer pessoa" me deixa exposto?**
Não. Qualquer pessoa consegue *chamar* o endereço, mas a primeira coisa que o código faz é conferir o `TOKEN`. Sem a senha, a resposta é `{"ok":false,"erro":"Token inválido."}`. Essa opção é necessária para o site conversar com a planilha sem exigir login do Google a cada acesso.

**Editei o `Codigo.gs` e nada mudou.**
Toda alteração precisa de nova implantação: **Implantar** → **Gerenciar implantações** → ícone de lápis → **Versão: Nova versão** → **Implantar**. A URL continua a mesma.

---

## Etapa 3 — Publicar o site no GitHub

1. Entre em <https://github.com> → **New repository**.
   - **Nome:** `custos-casa`
   - **Público** (o GitHub Pages gratuito exige repositório público)
   - Marque **Add a README file** → **Create repository**
2. No repositório: **Add file** → **Upload files**.
3. Arraste a pasta `docs/` inteira (com `index.html` e `importar.html` dentro). Se quiser manter tudo versionado, arraste também `apps-script/`, `manual/`, `testes/`, o `README.md`, o `CHANGELOG.md` e o `.gitignore`.
4. **Commit changes**.
5. Aba **Settings** → menu lateral **Pages**.
6. Em *Build and deployment*:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` · **Pasta:** `/docs`
   - **Save**
7. Espere 1 a 2 minutos e recarregue a página. O endereço aparece no topo:

   ```
   https://SEU-USUARIO.github.io/custos-casa/
   ```

> Se você escolher `/ (root)` em vez de `/docs`, o site não abre — os HTML estão dentro de `docs/`.

---

## Etapa 4 — Conectar site e planilha

1. Abra o endereço do GitHub Pages.
2. Cole a **URL do App da Web** (Etapa 2.9) e o **Token** (Etapa 2.3).
3. **Salvar e conectar**.

Pronto. A configuração fica guardada no navegador. No celular, use **Compartilhar → Adicionar à Tela de Início** e vira um app.

---

## Primeira importação de fatura

1. Baixe o CSV da fatura no app do banco (Nubank: fatura → **Exportar** → CSV).
2. No site, aba **Importar fatura**.
3. Cole o conteúdo ou selecione o arquivo → **Ler dados**.
4. Confira o mapeamento das colunas, escolha **Crédito** e o cartão, e informe a competência (o mês em que a fatura vence).
5. **Pré-visualizar** — o importador categoriza sozinho e detecta parcelas do tipo `3/10`.
6. Ajuste o que ficou marcado como "falta", desmarque o que não quiser, e **Importar**.

As parcelas futuras são criadas automaticamente, cada uma no mês em que vai cair.

---

**Próximo:** [`02-estrutura-de-dados.md`](02-estrutura-de-dados.md) · Para a parte de investimentos, veja [`05-investimentos.md`](05-investimentos.md).
