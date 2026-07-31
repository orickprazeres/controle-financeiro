/**
 * Custos da Casa — testes automatizados da lógica crítica · v1.0.0
 *
 * Rode com:   node testes/testes.js
 * Sai com código 0 se tudo passar, 1 se algo falhar.
 *
 * As funções abaixo são cópias fiéis das que rodam em docs/importar.html
 * e apps-script/Codigo.gs. Ao alterar qualquer uma delas, atualize aqui também.
 */

/* ============================================================ sob teste */

// apps-script/Codigo.gs · aritmética de competência
function somaMeses_(comp, n) {
  var p = String(comp).split('-');
  var ano = parseInt(p[0], 10);
  var mes = parseInt(p[1], 10) - 1 + n;
  ano += Math.floor(mes / 12);
  mes = ((mes % 12) + 12) % 12;
  return ano + '-' + ('0' + (mes + 1)).slice(-2);
}

// docs/importar.html · leitura de valor em formato BR ou US
function numero(s) {
  s = String(s).replace(/[R$\s ]/g, '');
  var neg = /^-/.test(s) || /^\(.*\)$/.test(s);
  s = s.replace(/[()+-]/g, '');
  var temP = s.indexOf('.') > -1, temV = s.indexOf(',') > -1;
  if (temP && temV) {
    s = (s.lastIndexOf(',') > s.lastIndexOf('.'))
      ? s.replace(/\./g, '').replace(',', '.')
      : s.replace(/,/g, '');
  } else if (temV) {
    var pv = s.split(',');
    s = (pv.length > 2 || pv[pv.length - 1].length === 3) ? pv.join('') : pv.join('.');
  } else if (temP) {
    var pp = s.split('.');
    if (pp.length > 2 || pp[pp.length - 1].length === 3) s = pp.join('');
  }
  var n = parseFloat(s);
  if (isNaN(n)) return 0;
  return neg ? -n : n;
}

// docs/importar.html · normalização de data
function dataISO(s) {
  s = String(s).trim();
  var m;
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return m[1] + '-' + m[2] + '-' + m[3];
  if ((m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/))) return m[3] + '-' + m[2] + '-' + m[1];
  if ((m = s.match(/^(\d{2})\/(\d{2})\/(\d{2})$/))) return '20' + m[3] + '-' + m[2] + '-' + m[1];
  if ((m = s.match(/^(\d{2})-(\d{2})-(\d{4})/))) return m[3] + '-' + m[2] + '-' + m[1];
  return s.slice(0, 10);
}

// docs/importar.html · detecção de parcela N/M
function detectaParcela(desc) {
  var m = String(desc).match(/(\d{1,2})\s*\/\s*(\d{1,2})(?!\d)/);
  if (!m) return null;
  var a = +m[1], b = +m[2];
  if (b < 2 || b > 72 || a > b || a < 1) return null;
  return { num: a, total: b };
}

// docs/importar.html · CSV com aspas e separador dentro do campo
function parseLinha(linha, sep) {
  var out = [], atual = '', aspas = false;
  for (var i = 0; i < linha.length; i++) {
    var ch = linha[i];
    if (ch === '"') { if (aspas && linha[i + 1] === '"') { atual += '"'; i++; } else aspas = !aspas; }
    else if (ch === sep && !aspas) { out.push(atual); atual = ''; }
    else atual += ch;
  }
  out.push(atual);
  return out.map(function (s) { return s.trim(); });
}

function detectaSep(txt) {
  var l = txt.split(/\r?\n/)[0];
  var melhor = ',', max = 0;
  ['\t', ';', ','].forEach(function (s) { var n = l.split(s).length; if (n > max) { max = n; melhor = s; } });
  return melhor;
}

// apps-script/Codigo.gs · geração das linhas de parcela
function geraParcelas(d) {
  var n = Math.max(1, Number(d.parcelas_total || 1));
  var comp = d.competencia || String(d.data).slice(0, 7);
  var vp = Number(d.valor);
  if (d.valor_total_informado && n > 1) vp = Math.round((Number(d.valor) / n) * 100) / 100;
  var out = [];
  for (var i = 0; i < n; i++) {
    out.push({
      competencia: somaMeses_(comp, i), valor: vp,
      parcela: i + 1, parcelas_total: n,
      pago: i === 0 ? (d.pago || 'Não') : 'Não'
    });
  }
  return out;
}

// docs/index.html · agregações do painel
function doMes(db, m) { return db.filter(function (l) { return l.competencia === m; }); }
function soma(a) { return a.reduce(function (x, y) { return x + (Number(y.valor) || 0); }, 0); }
function saidas(db, m) { return doMes(db, m).filter(function (l) { return l.tipo !== 'Entrada'; }); }
function entradas(db, m) { return doMes(db, m).filter(function (l) { return l.tipo === 'Entrada'; }); }
function porChave(a, k) {
  var o = {};
  a.forEach(function (l) { var x = l[k] || '(sem)'; o[x] = (o[x] || 0) + (Number(l.valor) || 0); });
  return Object.keys(o).map(function (x) { return { k: x, v: o[x] }; })
    .sort(function (p, q) { return q.v - p.v; });
}

/* ============================================================ runner */

var ok = 0, bad = 0, grupoAtual = '';
function grupo(n) { grupoAtual = n; console.log('\n' + n); }
function t(nome, obtido, esperado) {
  var g = JSON.stringify(obtido), e = JSON.stringify(esperado);
  if (g === e) { ok++; console.log('  ok   ' + nome); }
  else { bad++; console.log('  FALHA ' + nome + '  esperado ' + e + ', obtido ' + g); }
}

/* ============================================================ casos */

grupo('Competência — aritmética de meses');
t('mês seguinte', somaMeses_('2026-01', 1), '2026-02');
t('fim do ano', somaMeses_('2026-01', 11), '2026-12');
t('vira o ano', somaMeses_('2026-01', 12), '2027-01');
t('dois anos e um mês', somaMeses_('2026-11', 25), '2028-12');
t('mês anterior', somaMeses_('2026-01', -1), '2025-12');
t('treze meses atrás', somaMeses_('2026-01', -13), '2024-12');
t('onze meses atrás', somaMeses_('2026-06', -11), '2025-07');
t('sem deslocamento', somaMeses_('2026-07', 0), '2026-07');

grupo('Leitura de valores — formato brasileiro e americano');
t('BR 1.234,56', numero('1.234,56'), 1234.56);
t('US 1,234.56', numero('1,234.56'), 1234.56);
t('duas casas com ponto', numero('412.30'), 412.30);
t('com símbolo de moeda', numero('R$ 55,90'), 55.90);
t('negativo', numero('-23,90'), -23.90);
t('negativo entre parênteses', numero('(45,00)'), -45);
t('três dígitos = milhar (vírgula)', numero('12,345'), 12345);
t('três dígitos = milhar (ponto)', numero('1.234'), 1234);
t('milhares repetidos', numero('1,234,567'), 1234567);
t('zero', numero('0,00'), 0);
t('vazio vira zero', numero(''), 0);
t('texto vira zero', numero('n/d'), 0);

grupo('Datas');
t('já em ISO', dataISO('2026-01-05'), '2026-01-05');
t('barra com ano cheio', dataISO('05/01/2026'), '2026-01-05');
t('barra com ano curto', dataISO('05/01/26'), '2026-01-05');
t('traço', dataISO('05-01-2026'), '2026-01-05');
t('ISO com hora', dataISO('2026-01-05T10:30:00'), '2026-01-05');

grupo('Detecção de parcelas');
t('3/10', detectaParcela('GELADEIRA 3/10'), { num: 3, total: 10 });
t('com espaços', detectaParcela('Loja X - Parcela 2 / 6'), { num: 2, total: 6 });
t('1/12', detectaParcela('CELULAR 1/12'), { num: 1, total: 12 });
t('não confunde com data', detectaParcela('COMPRA 05/01/2026'), null);
t('descarta invertido', detectaParcela('12/3'), null);
t('sem parcela', detectaParcela('Netflix.com'), null);
t('descarta total absurdo', detectaParcela('99/99'), null);

grupo('Leitura de CSV');
t('vírgula dentro de aspas',
  parseLinha('2026-01-05,"POSTO IPIRANGA, LTDA",123.45', ','),
  ['2026-01-05', 'POSTO IPIRANGA, LTDA', '123.45']);
t('ponto e vírgula', parseLinha('05/01/2026;Assai;412,30', ';'),
  ['05/01/2026', 'Assai', '412,30']);
t('aspas escapadas', parseLinha('a,"diz ""oi""",1', ','), ['a', 'diz "oi"', '1']);
t('campo vazio', parseLinha('a,,c', ','), ['a', '', 'c']);
t('detecta ponto e vírgula', detectaSep('a;b;c\nx;y;z'), ';');
t('detecta tabulação', detectaSep('a\tb\tc'), '\t');
t('detecta vírgula', detectaSep('a,b,c'), ',');

grupo('Geração de parcelas');
var g = geraParcelas({ data: '2026-11-20', valor: 4200, parcelas_total: 10,
                       valor_total_informado: true, pago: 'Sim' });
t('quantidade de linhas', g.length, 10);
t('rateio do valor total', g[0].valor, 420);
t('soma bate com o total', g.reduce(function (a, b) { return a + b.valor; }, 0), 4200);
t('primeira competência', g[0].competencia, '2026-11');
t('última competência vira o ano', g[9].competencia, '2027-08');
t('só a primeira herda "pago"',
  g.map(function (x) { return x.pago; }).join(','),
  'Sim,Não,Não,Não,Não,Não,Não,Não,Não,Não');
var av = geraParcelas({ data: '2026-03-02', valor: 99.9, parcelas_total: 1, pago: 'Não' });
t('à vista gera 1 linha', av.length, 1);
t('à vista usa o mês da data', av[0].competencia, '2026-03');
t('rateio com dízima (1000 em 3x)',
  geraParcelas({ data: '2026-01-01', valor: 1000, parcelas_total: 3,
                 valor_total_informado: true })[0].valor, 333.33);

grupo('Agregações do painel');
var DB = [];
g.forEach(function (x, i) {
  DB.push({ competencia: x.competencia, tipo: 'Saída', categoria: 'Manutenção/Móveis',
            grupo: 'Moradia', forma_pagamento: 'Crédito', cartao: 'VISA RICARDO',
            valor: x.valor, pago: x.pago, parcelas_total: 10, parcela: i + 1 });
});
DB.push({ competencia: '2026-11', tipo: 'Entrada', categoria: 'Salário', grupo: 'Receita',
          forma_pagamento: 'Pix', valor: 7500, pago: 'Sim' });
DB.push({ competencia: '2026-11', tipo: 'Saída', categoria: 'Mercado', grupo: 'Alimentação',
          forma_pagamento: 'Crédito', cartao: 'NU RICARDO', valor: 860.45, pago: 'Não' });
DB.push({ competencia: '2026-11', tipo: 'Saída', categoria: 'Aluguel/Condomínio', grupo: 'Moradia',
          forma_pagamento: 'Boleto', valor: 2200, pago: 'Sim' });

var M = '2026-11';
t('total de entradas', soma(entradas(DB, M)), 7500);
t('total de saídas', soma(saidas(DB, M)), 3480.45);
t('saldo do mês', Math.round((soma(entradas(DB, M)) - soma(saidas(DB, M))) * 100) / 100, 4019.55);
t('gasto no crédito', soma(doMes(DB, M).filter(function (l) {
  return l.forma_pagamento === 'Crédito' && l.tipo !== 'Entrada'; })), 1280.45);
t('ainda a pagar', soma(saidas(DB, M).filter(function (l) {
  return String(l.pago) !== 'Sim'; })), 860.45);
t('maior categoria', porChave(saidas(DB, M), 'categoria')[0].k, 'Aluguel/Condomínio');
t('grupos ordenados', porChave(saidas(DB, M), 'grupo').map(function (x) { return x.k; }),
  ['Moradia', 'Alimentação']);
t('cartão não vira categoria',
  porChave(saidas(DB, M), 'categoria').map(function (x) { return x.k; })
    .indexOf('Cartão de Crédito'), -1);

grupo('Comprometimento futuro');
var fut = DB.filter(function (l) { return l.tipo !== 'Entrada' && l.competencia > M; });
t('parcelas em aberto no futuro', fut.length, 9);
t('valor total comprometido', soma(fut), 3780);
t('até quando vai', fut.map(function (l) { return l.competencia; }).sort().pop(), '2027-08');
t('não conta o mês corrente',
  fut.filter(function (l) { return l.competencia === M; }).length, 0);

/* ============================================================ resultado */

console.log('\n' + '-'.repeat(46));
console.log(ok + ' testes passaram, ' + bad + ' falharam');
process.exit(bad ? 1 : 0);
