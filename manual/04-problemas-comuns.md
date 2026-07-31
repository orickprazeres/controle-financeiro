# 04 · Problemas comuns

---

### O site abre mas diz "Não consegui conectar"

Na ordem:

1. A URL termina em `/exec`? Se termina em `/dev`, você copiou o endereço errado — volte em **Implantar → Gerenciar implantações** e pegue a URL do App da Web.
2. O token no site é exatamente igual ao `var TOKEN` do `Codigo.gs`? Sem espaço sobrando.
3. Em **Gerenciar implantações**, "Quem pode acessar" está como **Qualquer pessoa**?
4. Cole a URL direto no navegador com `?token=SUA-SENHA` no fim. Deve devolver um JSON começando com `{"ok":true`. Se devolver uma tela de login do Google, o passo 3 é a causa.

### `{"ok":false,"erro":"Token inválido."}`

O token do site não bate com o do `Codigo.gs`. Clique em ⚙ no site e corrija. Lembre que, se você editou o `TOKEN`, precisa **reimplantar** para a mudança valer.

### Editei o `Codigo.gs` e nada mudou

Falta reimplantar: **Implantar → Gerenciar implantações → ícone de lápis → Versão: Nova versão → Implantar**. A URL não muda. Esse é o esquecimento mais comum.

### O GitHub Pages mostra 404

- Em **Settings → Pages**, a pasta está como `/docs`? Os HTML estão dentro de `docs/`, não na raiz.
- O arquivo se chama exatamente `index.html`, minúsculo?
- Espere 2 minutos após o commit e recarregue com `Ctrl+F5`.

### Lancei algo e não aparece no painel

Quase sempre é a **competência**. O painel mostra o mês selecionado no seletor lá em cima, e ele filtra por `competencia`, não por `data`. Confira na aba **Lançamentos** se o valor está no mês que você espera — e se o seletor está nesse mês.

### Os valores do importador vieram errados

O leitor decide o formato pelo número de dígitos depois do separador: 1 ou 2 dígitos é decimal (`55,90` → 55,90), 3 dígitos é milhar (`12,345` → 12.345). Se o seu banco exporta `1.234` querendo dizer "um e duzentos e trinta e quatro", vai ler como 1234. Corrija manualmente ou ajuste a função `numero()` em `docs/importar.html`.

### O importador não detectou minhas parcelas

Ele procura o padrão `N/M` na descrição (`3/10`, `2 / 6`) e descarta o que parece data. Se o seu banco escreve "PARC 03 DE 10", não é reconhecido — use o formulário **Novo** para lançar essa compra, informando o número de parcelas.

### Importei duas vezes e duplicou

Não há proteção contra duplicata: cada importação gera IDs novos. Na aba **Lancamentos**, ordene por `id` (as importações começam com `I`) e apague o bloco repetido. Ou use **Ctrl+Z** no Sheets logo após.

### Excluí um lançamento parcelado e as outras parcelas ficaram

A exclusão pelo site remove uma linha por vez. Para apagar a compra inteira, filtre pela descrição na aba **Lancamentos** da planilha e apague as linhas de uma vez.

### O painel da planilha mostra `#REF!` ou `#NAME?`

Alguma aba foi renomeada. Os nomes têm que ser exatamente `Lancamentos`, `Categorias`, `Cartoes`, `Orcamento` — sem acento, como estão.

### Está lento com muitos lançamentos

O Apps Script devolve tudo de uma vez. Até uns 5.000 lançamentos (uns 3 anos de uso normal) é tranquilo. Passando disso, arquive os anos antigos: crie uma cópia da planilha como histórico e apague as linhas antigas da principal.

### Quero voltar tudo como estava

O Google Sheets guarda todo o histórico: **Arquivo → Histórico de versões → Ver histórico de versões**. Dá para restaurar qualquer ponto no tempo.

---

## Onde cada coisa mora

Útil quando algo some ou você troca de computador:

| O quê | Onde |
|---|---|
| Seus dados | Google Sheets, na sua conta |
| A API | Apps Script, dentro da planilha |
| O site | GitHub, repositório público |
| URL e token | `localStorage` do navegador (some se você limpar os dados do site) |

Perder o navegador não perde nada: basta reconfigurar a URL e o token em ⚙.
