/**
 * Controle Financeiro — API do Google Sheets
 * Cole este arquivo no Apps Script da sua planilha e publique como App da Web.
 * Passo a passo completo no README.md
 */

var VERSAO = '1.8.0';

// ⚠️ TROQUE por uma senha sua. A mesma vai no site.
var TOKEN = 'troque-esta-senha';

var ABA_LANC = 'Lancamentos';
var ABA_CAT  = 'Categorias';
var ABA_CARD = 'Cartoes';
var ABA_ORC  = 'Orcamento';
var ABA_ATV  = 'Ativos';
var ABA_INV  = 'Investimentos';
var ABA_SLD  = 'Saldos';
var ABA_FIX  = 'ContasFixas';

var COLS = ['id','data','competencia','tipo','descricao','categoria','grupo',
            'forma_pagamento','cartao','parcela','parcelas_total','valor','pago','obs',
            'vencimento','data_pagamento','valor_pago'];

var COLS_INV = ['id','data','competencia','ativo','tipo','valor','obs'];
var COLS_SLD = ['id','competencia','ativo','saldo','obs'];
var COLS_ATV = ['ativo','classe','indexador','taxa_contratada',
                'instituicao','vencimento','liquidez','em_uso'];
var COLS_FIX = ['conta','categoria','forma_pagamento','cartao',
                'dia_vencimento','valor_estimado','em_uso','obs'];

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

/** Qualquer data vira texto AAAA-MM-DD; o resto vira string. */
function texto_(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, ss_().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  }
  return String(v == null ? '' : v);
}

/** Qualquer competência vira texto AAAA-MM. */
function mes_(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, ss_().getSpreadsheetTimeZone(), 'yyyy-MM');
  }
  return String(v == null ? '' : v).slice(0, 7);
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
    // vazio cai de volta na data do lançamento, para as linhas antigas continuarem válidas
    vencimento: texto_(r.vencimento) || String(d || ''),
    data_pagamento: texto_(r.data_pagamento),
    valor_pago: (r.valor_pago === '' || r.valor_pago == null) ? null : Number(r.valor_pago),
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
      }),

      ativos: tabela_(ABA_ATV)
        .filter(function (a) { return String(a.ativo || '').indexOf('EXEMPLO') !== 0; })
        .map(function (a) {
          return {
            ativo: String(a.ativo || ''),
            classe: String(a.classe || 'Outros'),
            indexador: String(a.indexador || ''),
            taxa: Number(a.taxa_contratada || 0),
            instituicao: String(a.instituicao || ''),
            vencimento: texto_(a.vencimento),
            liquidez: String(a.liquidez || ''),
            em_uso: String(a.em_uso || 'Sim')
          };
        }),

      investimentos: tabela_(ABA_INV)
        .filter(function (i) { return String(i.id || '').indexOf('EXEMPLO') !== 0; })
        .map(function (i) {
          return {
            id: String(i.id || ''),
            data: texto_(i.data),
            competencia: mes_(i.competencia),
            ativo: String(i.ativo || ''),
            tipo: String(i.tipo || 'Aporte'),
            valor: Number(i.valor || 0),
            obs: String(i.obs || '')
          };
        }),

      contasFixas: tabela_(ABA_FIX).map(function (f) {
        return {
          conta: String(f.conta || ''),
          categoria: String(f.categoria || ''),
          forma_pagamento: String(f.forma_pagamento || ''),
          cartao: String(f.cartao || ''),
          dia_vencimento: Number(f.dia_vencimento || 1),
          valor_estimado: Number(f.valor_estimado || 0),
          em_uso: String(f.em_uso || 'Sim'),
          obs: String(f.obs || '')
        };
      }),

      saldos: tabela_(ABA_SLD)
        .filter(function (s) { return String(s.id || '').indexOf('EXEMPLO') !== 0; })
        .map(function (s) {
          return {
            id: String(s.id || ''),
            competencia: mes_(s.competencia),
            ativo: String(s.ativo || ''),
            saldo: Number(s.saldo || 0),
            obs: String(s.obs || '')
          };
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
      case 'inv_lancar': return json_(invLancar_(body.dados));
      case 'inv_saldo':  return json_(invSaldo_(body.dados));
      case 'inv_excluir':return json_(invExcluir_(body.aba, body.id));
      case 'inv_ativo':  return json_(invAtivo_(body.dados));
      case 'pagar':        return json_(pagar_(body.dados));
      case 'desfazer_pag': return json_(desfazerPagamento_(body.id));
      case 'conta_fixa':   return json_(salvaContaFixa_(body.dados));
      case 'gerar_contas': return json_(gerarContasDoMes_(body.competencia));
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
      d.obs || '',
      d.vencimento || d.data,      // sem vencimento informado, vale a data
      '',                          // data_pagamento
      ''                           // valor_pago
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
      d.obs || '',
      d.vencimento || d.data,
      d.data_pagamento || '',
      (d.valor_pago === undefined || d.valor_pago === '') ? '' : Number(d.valor_pago)
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


/* ==================================================================
   INVESTIMENTOS
   ================================================================== */

/** Registra um aporte ou resgate. */
function invLancar_(d) {
  var sh = ss_().getSheetByName(ABA_INV);
  var comp = d.competencia || String(d.data).slice(0, 7);
  var linha = [
    novoId_().replace('L', 'V'),
    d.data,
    comp,
    d.ativo,
    d.tipo || 'Aporte',
    Number(d.valor || 0),
    d.obs || ''
  ];
  sh.getRange(sh.getLastRow() + 1, 1, 1, COLS_INV.length).setValues([linha]);
  return { ok: true, inseridas: 1 };
}

/**
 * Registra o saldo de um ativo num mês.
 * Se já existir saldo daquele ativo naquela competência, substitui — assim
 * corrigir um número é só lançar de novo, sem duplicar.
 */
function invSaldo_(d) {
  var sh = ss_().getSheetByName(ABA_SLD);
  var comp = String(d.competencia);
  var ativo = String(d.ativo);
  var vals = sh.getDataRange().getValues();

  for (var i = 1; i < vals.length; i++) {
    if (mes_(vals[i][1]) === comp && String(vals[i][2]) === ativo) {
      sh.getRange(i + 1, 4).setValue(Number(d.saldo || 0));
      if (d.obs) sh.getRange(i + 1, 5).setValue(d.obs);
      return { ok: true, atualizado: true };
    }
  }
  sh.getRange(sh.getLastRow() + 1, 1, 1, COLS_SLD.length).setValues([[
    novoId_().replace('L', 'S'), comp, ativo, Number(d.saldo || 0), d.obs || ''
  ]]);
  return { ok: true, atualizado: false };
}

/** Cadastra um ativo novo (ou atualiza, se o nome já existir). */
function invAtivo_(d) {
  var sh = ss_().getSheetByName(ABA_ATV);
  var linha = [
    d.ativo, d.classe || 'Outros', d.indexador || '', Number(d.taxa || 0),
    d.instituicao || '', d.vencimento || '', d.liquidez || '', 'Sim'
  ];
  var vals = sh.getRange(1, 1, sh.getLastRow(), 1).getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(d.ativo)) {
      sh.getRange(i + 1, 1, 1, linha.length).setValues([linha]);
      return { ok: true, atualizado: true };
    }
  }
  sh.getRange(sh.getLastRow() + 1, 1, 1, linha.length).setValues([linha]);
  return { ok: true, atualizado: false };
}

/** Exclui uma linha de Investimentos ou de Saldos pelo id. */
function invExcluir_(aba, id) {
  var nome = (aba === 'saldos') ? ABA_SLD : ABA_INV;
  var sh = ss_().getSheetByName(nome);
  var ids = sh.getRange(1, 1, sh.getLastRow(), 1).getValues();
  for (var i = 1; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) { sh.deleteRow(i + 1); return { ok: true }; }
  }
  throw new Error('Registro não encontrado: ' + id);
}

/* ==================================================================
   MIGRAÇÃO v1.0.0 → v1.1.0

   Rode UMA VEZ, direto no editor do Apps Script:
   escolha "configurarInvestimentos" na lista de funções e clique em Executar.

   Cria as abas Ativos, Investimentos e Saldos na planilha que você já usa.
   Não toca em nada que já existe. Rodar de novo por engano não faz mal:
   a função apenas confere e segue adiante.
   ================================================================== */

function configurarInvestimentos() {
  var ss = ss_();
  var criadas = [], existiam = [];

  var PLANO = [
    { nome: ABA_ATV, cols: COLS_ATV,   larg: [260, 150, 140, 130, 180, 120, 140, 80] },
    { nome: ABA_INV, cols: COLS_INV,   larg: [130, 100, 110, 260, 100, 120, 200] },
    { nome: ABA_SLD, cols: COLS_SLD,   larg: [130, 110, 260, 130, 200] }
  ];

  PLANO.forEach(function (p) {
    var sh = ss.getSheetByName(p.nome);
    if (sh) { existiam.push(p.nome); return; }

    sh = ss.insertSheet(p.nome);
    sh.getRange(1, 1, 1, p.cols.length).setValues([p.cols]);
    sh.getRange(1, 1, 1, p.cols.length)
      .setFontFamily('Arial').setFontSize(10).setFontWeight('bold')
      .setFontColor('#FFFFFF').setBackground('#1E6B45')
      .setHorizontalAlignment('center');
    sh.setFrozenRows(1);
    sh.setRowHeight(1, 24);
    for (var i = 0; i < p.larg.length; i++) sh.setColumnWidth(i + 1, p.larg[i]);
    criadas.push(p.nome);
  });

  // formatos e listas suspensas (aplicados sempre, são idempotentes)
  var atv = ss.getSheetByName(ABA_ATV);
  var inv = ss.getSheetByName(ABA_INV);
  var sld = ss.getSheetByName(ABA_SLD);

  atv.getRange('C2:C500').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(
      ['% do CDI', 'Selic +', 'IPCA +', 'Prefixado', 'Não se aplica'], true)
      .setAllowInvalid(true).build());
  atv.getRange('H2:H500').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Sim', 'Não'], true)
      .setAllowInvalid(true).build());

  var listaAtivos = SpreadsheetApp.newDataValidation()
    .requireValueInRange(atv.getRange('A2:A500'), true)
    .setAllowInvalid(true).build();

  inv.getRange('D2:D3000').setDataValidation(listaAtivos);
  inv.getRange('E2:E3000').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Aporte', 'Resgate'], true)
      .setAllowInvalid(true).build());
  inv.getRange('F2:F3000').setNumberFormat('R$ #,##0.00');

  sld.getRange('C2:C3000').setDataValidation(listaAtivos);
  sld.getRange('D2:D3000').setNumberFormat('R$ #,##0.00');

  var msg = '';
  if (criadas.length)  msg += 'Abas criadas: ' + criadas.join(', ') + '. ';
  if (existiam.length) msg += 'Já existiam: ' + existiam.join(', ') + '. ';
  msg += 'Formatos e listas suspensas aplicados.';

  try { ss.toast(msg, 'Investimentos configurados', 10); } catch (e) {}
  Logger.log(msg);
  return msg;
}

/**
 * Confere se a planilha está pronta para a v1.1.0.
 * Rode esta função se a aba Investimentos do site aparecer vazia.
 */
function verificarInstalacao() {
  var ss = ss_();
  var faltando = [];
  [ABA_LANC, ABA_CAT, ABA_CARD, ABA_ORC, ABA_ATV, ABA_INV, ABA_SLD, ABA_FIX].forEach(function (n) {
    if (!ss.getSheetByName(n)) faltando.push(n);
  });

  var msg = faltando.length
    ? 'FALTAM as abas: ' + faltando.join(', ') + '. Rode configurarInvestimentos().'
    : 'Tudo certo. Versão ' + VERSAO + '. Abas encontradas: 8 de 8.';

  try { ss.toast(msg, 'Verificação', 10); } catch (e) {}
  Logger.log(msg);
  return msg;
}


/* ==================================================================
   CONTAS A PAGAR
   ================================================================== */

/** Marca uma conta como paga, guardando quando e quanto. */
function pagar_(d) {
  var sh = ss_().getSheetByName(ABA_LANC);
  var row = achaLinha_(d.id);
  if (row < 0) throw new Error('Lançamento não encontrado: ' + d.id);

  var iPago = COLS.indexOf('pago') + 1;
  var iData = COLS.indexOf('data_pagamento') + 1;
  var iVal  = COLS.indexOf('valor_pago') + 1;
  var iPrev = COLS.indexOf('valor') + 1;

  var valor = (d.valor_pago === undefined || d.valor_pago === '' || d.valor_pago === null)
    ? Number(sh.getRange(row, iPrev).getValue())
    : Number(d.valor_pago);

  sh.getRange(row, iPago).setValue('Sim');
  sh.getRange(row, iData).setValue(d.data_pagamento || Utilities.formatDate(
    new Date(), ss_().getSpreadsheetTimeZone(), 'yyyy-MM-dd'));
  sh.getRange(row, iVal).setValue(valor);

  return { ok: true, valor_pago: valor };
}

/** Desfaz o pagamento: volta para "Não pago" e limpa data e valor. */
function desfazerPagamento_(id) {
  var sh = ss_().getSheetByName(ABA_LANC);
  var row = achaLinha_(id);
  if (row < 0) throw new Error('Lançamento não encontrado: ' + id);
  sh.getRange(row, COLS.indexOf('pago') + 1).setValue('Não');
  sh.getRange(row, COLS.indexOf('data_pagamento') + 1).setValue('');
  sh.getRange(row, COLS.indexOf('valor_pago') + 1).setValue('');
  return { ok: true };
}

/** Cadastra ou atualiza uma conta fixa (a chave é o nome). */
function salvaContaFixa_(d) {
  var sh = ss_().getSheetByName(ABA_FIX);
  var linha = [
    d.conta, d.categoria || 'Outros', d.forma_pagamento || 'Boleto', d.cartao || '',
    Number(d.dia_vencimento || 1), Number(d.valor_estimado || 0),
    d.em_uso || 'Sim', d.obs || ''
  ];
  var vals = sh.getRange(1, 1, Math.max(1, sh.getLastRow()), 1).getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(d.conta)) {
      sh.getRange(i + 1, 1, 1, linha.length).setValues([linha]);
      return { ok: true, atualizado: true };
    }
  }
  sh.getRange(sh.getLastRow() + 1, 1, 1, linha.length).setValues([linha]);
  return { ok: true, atualizado: false };
}

/** Último dia do mês — para o dia 31 não virar 03/03 em fevereiro. */
function ultimoDia_(ano, mes) { return new Date(ano, mes, 0).getDate(); }

/**
 * Gera as contas do mês a partir do cadastro de contas fixas.
 * Pula as que já existem naquela competência, então rodar duas vezes não duplica.
 */
function gerarContasDoMes_(comp) {
  if (!/^\d{4}-\d{2}$/.test(String(comp))) throw new Error('Competência inválida: ' + comp);
  var sh = ss_().getSheetByName(ABA_LANC);
  var fixas = tabela_(ABA_FIX).filter(function (f) { return String(f.em_uso || 'Sim') !== 'Não'; });
  if (!fixas.length) return { ok: true, criadas: 0, puladas: 0, motivo: 'nenhuma conta fixa cadastrada' };

  var jaTem = {};
  tabela_(ABA_LANC).forEach(function (l) {
    if (mes_(l.competencia) === comp) jaTem[String(l.descricao).trim().toLowerCase()] = 1;
  });

  var ano = parseInt(comp.split('-')[0], 10);
  var mes = parseInt(comp.split('-')[1], 10);
  var linhas = [], puladas = 0;

  fixas.forEach(function (f) {
    var nome = String(f.conta).trim();
    if (jaTem[nome.toLowerCase()]) { puladas++; return; }
    var dia = Math.min(Math.max(1, Number(f.dia_vencimento || 1)), ultimoDia_(ano, mes));
    var venc = comp + '-' + ('0' + dia).slice(-2);
    linhas.push([
      novoId_().replace('L', 'C'),
      venc, comp, 'Saída', nome,
      f.categoria || 'Outros', grupoDaCategoria_(f.categoria),
      f.forma_pagamento || 'Boleto', f.cartao || '',
      1, 1, Number(f.valor_estimado || 0), 'Não',
      'conta fixa gerada',
      venc, '', ''
    ]);
  });

  if (linhas.length) {
    sh.getRange(sh.getLastRow() + 1, 1, linhas.length, COLS.length).setValues(linhas);
  }
  return { ok: true, criadas: linhas.length, puladas: puladas };
}

/* ==================================================================
   MIGRAÇÃO v1.5.0 -> v1.6.0

   Rode UMA VEZ: escolha "configurarContasAPagar" na lista de funções
   e clique em Executar. Acrescenta 3 colunas em Lancamentos e cria a
   aba ContasFixas. Não apaga nem move nada. Rodar de novo é inofensivo.
   ================================================================== */

function configurarContasAPagar() {
  var ss = ss_();
  var sh = ss.getSheetByName(ABA_LANC);
  var msg = [];

  // 1) colunas novas no fim de Lancamentos
  var head = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), COLS.length)).getValues()[0]
               .map(function (h) { return String(h).trim(); });
  var criadas = [];
  ['vencimento', 'data_pagamento', 'valor_pago'].forEach(function (c) {
    if (head.indexOf(c) < 0) {
      var col = COLS.indexOf(c) + 1;
      sh.getRange(1, col).setValue(c)
        .setFontFamily('Arial').setFontSize(10).setFontWeight('bold')
        .setFontColor('#FFFFFF').setBackground('#1F3A5F')
        .setHorizontalAlignment('center');
      sh.setColumnWidth(col, 130);
      criadas.push(c);
    }
  });
  msg.push(criadas.length ? 'Colunas criadas: ' + criadas.join(', ') + '.' : 'Colunas já existiam.');

  // 2) preencher vencimento das linhas antigas com a data delas
  var n = sh.getLastRow() - 1;
  if (n > 0) {
    var iData = COLS.indexOf('data') + 1, iVenc = COLS.indexOf('vencimento') + 1;
    var datas = sh.getRange(2, iData, n, 1).getValues();
    var vencs = sh.getRange(2, iVenc, n, 1).getValues();
    var mudou = 0;
    for (var i = 0; i < n; i++) {
      if (String(vencs[i][0]).trim() === '' && String(datas[i][0]).trim() !== '') {
        vencs[i][0] = datas[i][0]; mudou++;
      }
    }
    if (mudou) sh.getRange(2, iVenc, n, 1).setValues(vencs);
    msg.push(mudou + ' lançamento(s) antigos receberam vencimento igual à data.');
  }

  // 3) formato de moeda no valor_pago
  sh.getRange(2, COLS.indexOf('valor_pago') + 1, 3000, 1).setNumberFormat('R$ #,##0.00');

  // 4) aba ContasFixas
  var fx = ss.getSheetByName(ABA_FIX);
  if (!fx) {
    fx = ss.insertSheet(ABA_FIX);
    fx.getRange(1, 1, 1, COLS_FIX.length).setValues([COLS_FIX]);
    fx.getRange(1, 1, 1, COLS_FIX.length)
      .setFontFamily('Arial').setFontSize(10).setFontWeight('bold')
      .setFontColor('#FFFFFF').setBackground('#8A5A00')
      .setHorizontalAlignment('center');
    fx.setFrozenRows(1); fx.setRowHeight(1, 24);
    [220, 220, 150, 150, 130, 140, 90, 200].forEach(function (w, i) { fx.setColumnWidth(i + 1, w); });
    msg.push('Aba ContasFixas criada.');
  } else {
    msg.push('Aba ContasFixas já existia.');
  }
  fx.getRange('F2:F500').setNumberFormat('R$ #,##0.00');
  fx.getRange('G2:G500').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Sim', 'Não'], true)
      .setAllowInvalid(true).build());

  var txt = msg.join(' ');
  try { ss.toast(txt, 'Contas a pagar configurado', 10); } catch (e) {}
  Logger.log(txt);
  return txt;
}
