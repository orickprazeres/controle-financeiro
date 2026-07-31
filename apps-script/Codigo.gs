/**
 * Custos da Casa — API do Google Sheets
 * Cole este arquivo no Apps Script da sua planilha e publique como App da Web.
 * Passo a passo completo no README.md
 */

var VERSAO = '1.0.0';

// ⚠️ TROQUE por uma senha sua. A mesma vai no site.
var TOKEN = 'troque-esta-senha';

var ABA_LANC = 'Lancamentos';
var ABA_CAT  = 'Categorias';
var ABA_CARD = 'Cartoes';
var ABA_ORC  = 'Orcamento';

var COLS = ['id','data','competencia','tipo','descricao','categoria','grupo',
            'forma_pagamento','cartao','parcela','parcelas_total','valor','pago','obs'];

/* ------------------------------------------------------------------ utils */

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function tabela_(nome) {
  var sh = ss_().getSheetByName(nome);
  if (!sh) return [];
  var vals = sh.getDataRange().getValues();
  if (vals.length < 2) return [];
  var head = vals[0].map(function (h) { return String(h).trim(); });
  var out = [];
  for (var i = 1; i < vals.length; i++) {
    var linha = vals[i];
    if (linha.join('').trim() === '') continue;
    var obj = {};
    for (var j = 0; j < head.length; j++) obj[head[j]] = linha[j];
    obj._row = i + 1;
    out.push(obj);
  }
  return out;
}

/** Datas viram sempre texto AAAA-MM-DD, valores viram sempre número. */
function normalizaLanc_(r) {
  var d = r.data;
  if (d instanceof Date) {
    d = Utilities.formatDate(d, ss_().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  }
  var comp = r.competencia;
  if (comp instanceof Date) {
    comp = Utilities.formatDate(comp, ss_().getSpreadsheetTimeZone(), 'yyyy-MM');
  }
  return {
    id: String(r.id || ''),
    data: String(d || ''),
    competencia: String(comp || ''),
    tipo: String(r.tipo || ''),
    descricao: String(r.descricao || ''),
    categoria: String(r.categoria || ''),
    grupo: String(r.grupo || ''),
    forma_pagamento: String(r.forma_pagamento || ''),
    cartao: String(r.cartao || ''),
    parcela: Number(r.parcela || 1),
    parcelas_total: Number(r.parcelas_total || 1),
    valor: Number(r.valor || 0),
    pago: String(r.pago || 'Não'),
    obs: String(r.obs || ''),
    _row: r._row
  };
}

function somaMeses_(comp, n) {
  var p = String(comp).split('-');
  var ano = parseInt(p[0], 10);
  var mes = parseInt(p[1], 10) - 1 + n;
  ano += Math.floor(mes / 12);
  mes = ((mes % 12) + 12) % 12;
  return ano + '-' + ('0' + (mes + 1)).slice(-2);
}

function grupoDaCategoria_(cat) {
  var cats = tabela_(ABA_CAT);
  for (var i = 0; i < cats.length; i++) {
    if (String(cats[i].categoria) === String(cat)) return String(cats[i].grupo || '');
  }
  return '';
}

function novoId_() {
  return 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function checaToken_(t) {
  if (String(t) !== TOKEN) throw new Error('Token inválido.');
}

/* -------------------------------------------------------------------- GET */

function doGet(e) {
  try {
    var p = e.parameter || {};
    checaToken_(p.token);

    var lanc = tabela_(ABA_LANC)
      .map(normalizaLanc_)
      .filter(function (r) { return r.id.indexOf('EXEMPLO') !== 0; });

    return json_({
      ok: true,
      lancamentos: lanc,
      categorias: tabela_(ABA_CAT).map(function (c) {
        return {
          categoria: String(c.categoria),
          grupo: String(c.grupo || ''),
          tipo: String(c.tipo || 'Saída'),
          essencial: String(c.essencial || '')
        };
      }),
      cartoes: tabela_(ABA_CARD).map(function (c) {
        return {
          cartao: String(c.cartao),
          titular: String(c.titular || ''),
          limite: Number(c.limite || 0)
        };
      }),
      orcamento: tabela_(ABA_ORC).map(function (o) {
        return { categoria: String(o.categoria), limite: Number(o.limite_mensal || 0) };
      })
    });
  } catch (err) {
    return json_({ ok: false, erro: String(err.message || err) });
  }
}

/* ------------------------------------------------------------------- POST */

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    checaToken_(body.token);

    switch (body.acao) {
      case 'inserir':  return json_(inserir_(body.dados));
      case 'importar': return json_(importar_(body.dados));
      case 'atualizar':return json_(atualizar_(body.dados));
      case 'excluir':  return json_(excluir_(body.id));
      case 'orcamento':return json_(salvaOrcamento_(body.dados));
      default: throw new Error('Ação desconhecida: ' + body.acao);
    }
  } catch (err) {
    return json_({ ok: false, erro: String(err.message || err) });
  }
}

/**
 * Insere um lançamento. Se parcelas_total > 1, gera automaticamente
 * uma linha por parcela, cada uma na sua competência.
 */
function inserir_(d) {
  var sh = ss_().getSheetByName(ABA_LANC);
  var n = Math.max(1, Number(d.parcelas_total || 1));
  var comp = d.competencia || String(d.data).slice(0, 7);
  var grupo = d.grupo || grupoDaCategoria_(d.categoria);
  var valorParcela = Number(d.valor);
  if (d.valor_total_informado && n > 1) {
    valorParcela = Math.round((Number(d.valor) / n) * 100) / 100;
  }

  var linhas = [];
  var base = novoId_();
  for (var i = 0; i < n; i++) {
    var desc = d.descricao + (n > 1 ? ' (' + (i + 1) + '/' + n + ')' : '');
    linhas.push([
      n > 1 ? base + '-' + (i + 1) : base,
      d.data,
      somaMeses_(comp, i),
      d.tipo || 'Saída',
      desc,
      d.categoria,
      grupo,
      d.forma_pagamento,
      d.cartao || '',
      i + 1,
      n,
      valorParcela,
      i === 0 ? (d.pago || 'Não') : 'Não',
      d.obs || ''
    ]);
  }
  sh.getRange(sh.getLastRow() + 1, 1, linhas.length, COLS.length).setValues(linhas);
  return { ok: true, inseridas: linhas.length, id: base };
}

/** Importa uma lista de lançamentos já prontos (uma linha = uma parcela). */
function importar_(lista) {
  var sh = ss_().getSheetByName(ABA_LANC);
  var linhas = lista.map(function (d) {
    return [
      d.id || novoId_(),
      d.data,
      d.competencia || String(d.data).slice(0, 7),
      d.tipo || 'Saída',
      d.descricao,
      d.categoria,
      d.grupo || grupoDaCategoria_(d.categoria),
      d.forma_pagamento,
      d.cartao || '',
      Number(d.parcela || 1),
      Number(d.parcelas_total || 1),
      Number(d.valor),
      d.pago || 'Não',
      d.obs || ''
    ];
  });
  if (!linhas.length) return { ok: true, inseridas: 0 };
  sh.getRange(sh.getLastRow() + 1, 1, linhas.length, COLS.length).setValues(linhas);
  return { ok: true, inseridas: linhas.length };
}

function achaLinha_(id) {
  var sh = ss_().getSheetByName(ABA_LANC);
  var ids = sh.getRange(1, 1, sh.getLastRow(), 1).getValues();
  for (var i = 1; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

function atualizar_(d) {
  var sh = ss_().getSheetByName(ABA_LANC);
  var row = achaLinha_(d.id);
  if (row < 0) throw new Error('Lançamento não encontrado: ' + d.id);
  var atual = sh.getRange(row, 1, 1, COLS.length).getValues()[0];
  for (var i = 0; i < COLS.length; i++) {
    if (d.hasOwnProperty(COLS[i])) atual[i] = d[COLS[i]];
  }
  sh.getRange(row, 1, 1, COLS.length).setValues([atual]);
  return { ok: true };
}

function excluir_(id) {
  var sh = ss_().getSheetByName(ABA_LANC);
  var row = achaLinha_(id);
  if (row < 0) throw new Error('Lançamento não encontrado: ' + id);
  sh.deleteRow(row);
  return { ok: true };
}

function salvaOrcamento_(lista) {
  var sh = ss_().getSheetByName(ABA_ORC);
  var vals = sh.getRange(1, 1, sh.getLastRow(), 2).getValues();
  for (var i = 1; i < vals.length; i++) {
    for (var j = 0; j < lista.length; j++) {
      if (String(vals[i][0]) === String(lista[j].categoria)) {
        vals[i][1] = Number(lista[j].limite || 0);
      }
    }
  }
  sh.getRange(1, 1, vals.length, 2).setValues(vals);
  return { ok: true };
}
