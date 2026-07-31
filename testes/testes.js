/**
 * Custos da Casa — testes automatizados da lógica crítica · v1.6.0
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


// docs/index.html · matemática de investimento
function taxaMensal(anual) { return Math.pow(1 + anual, 1 / 12) - 1; }
function combina(a, b) { return (1 + a) * (1 + b) - 1; }
function aliquotaIR(dias) {
  if (dias <= 180) return 0.225;
  if (dias <= 360) return 0.20;
  if (dias <= 720) return 0.175;
  return 0.15;
}
function simular(ini, aporte, anos, taxaAno, crescAno) {
  var im = taxaMensal(taxaAno);
  var saldo = ini, aportado = ini, apt = aporte;
  var linhas = [{ mes: 0, saldo: saldo, aportado: aportado, rendimento: 0 }];
  for (var m = 1; m <= anos * 12; m++) {
    if (m > 1 && (m - 1) % 12 === 0) apt = apt * (1 + crescAno);
    saldo = saldo * (1 + im) + apt;
    aportado += apt;
    linhas.push({ mes: m, saldo: saldo, aportado: aportado, rendimento: saldo - aportado });
  }
  return linhas;
}
// rendimento deduzido = saldo final - saldo inicial - aportes + resgates
function rendimentoMes(saldoIni, saldoFim, aportes, resgates) {
  return saldoFim - saldoIni - aportes + resgates;
}


// docs/index.html · contas a pagar
function diasAte(d, hojeStr){
  if (!d) return 0;
  return Math.round((new Date(d+'T00:00:00') - new Date(hojeStr+'T00:00:00')) / 86400000);
}
function statusConta(venc, hojeStr){
  var d = diasAte(venc, hojeStr);
  if (d < 0)   return 'atrasada';
  if (d === 0) return 'vence hoje';
  if (d <= 7)  return 'próxima';
  return 'futura';
}
function dataBR(d){
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(d))) return String(d||'—');
  var p=String(d).slice(0,10).split('-'); return p[2]+'/'+p[1]+'/'+p[0].slice(-2);
}
// apps-script/Codigo.gs · geração das contas fixas
function ultimoDia_(ano, mes){ return new Date(ano, mes, 0).getDate(); }
function vencimentoDaConta(comp, diaDesejado){
  var ano = +comp.split('-')[0], mes = +comp.split('-')[1];
  var dia = Math.min(Math.max(1, diaDesejado), ultimoDia_(ano, mes));
  return comp + '-' + ('0'+dia).slice(-2);
}
function gerarContas(fixas, jaExistem, comp){
  var mapa = {};
  jaExistem.forEach(function(n){ mapa[String(n).trim().toLowerCase()] = 1; });
  var criadas = [], puladas = 0;
  fixas.filter(function(f){ return f.em_uso !== 'Não'; }).forEach(function(f){
    if (mapa[f.conta.trim().toLowerCase()]) { puladas++; return; }
    criadas.push({ descricao: f.conta, vencimento: vencimentoDaConta(comp, f.dia_vencimento),
                   valor: f.valor_estimado, pago: 'Não' });
  });
  return { criadas: criadas, puladas: puladas };
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


grupo('Investimentos — taxa equivalente');
t('12% a.a. vira ~0,9489% ao mês',
  Math.round(taxaMensal(0.12) * 1e6) / 1e6, 0.009489);
t('taxa mensal composta reconstrói a anual',
  Math.round(Math.pow(1 + taxaMensal(0.1415), 12) * 1e6) / 1e6, 1.1415);
t('não é divisão simples por 12', taxaMensal(0.12) === 0.01, false);
t('110% do CDI a 14,15%',
  Math.round(0.1415 * 1.10 * 1e6) / 1e6, 0.15565);
t('IPCA 4,64% + 6,20% real = 11,13% a.a., não 10,84%',
  Math.round(combina(0.0464, 0.0620) * 1e6) / 1e6, 0.111277);
t('composição rende mais que a soma simples',
  combina(0.0464, 0.0620) > 0.0464 + 0.0620, true);
t('taxa zero não rende', taxaMensal(0), 0);

grupo('Investimentos — IR regressivo da renda fixa');
t('até 180 dias', aliquotaIR(180), 0.225);
t('181 a 360 dias', aliquotaIR(200), 0.20);
t('361 a 720 dias', aliquotaIR(500), 0.175);
t('acima de 720 dias', aliquotaIR(1000), 0.15);
t('10 anos cai na menor faixa', aliquotaIR(10 * 365), 0.15);
t('fronteira exata de 720', aliquotaIR(720), 0.175);
t('fronteira exata de 721', aliquotaIR(721), 0.15);

grupo('Investimentos — projeção de aportes');
var S = simular(0, 1000, 10, 0.1415, 0);
t('gera 121 pontos (0 a 120 meses)', S.length, 121);
t('aportado = 120 x 1000', S[120].aportado, 120000);
t('rendimento é o que sobra', Math.round(S[120].rendimento), Math.round(S[120].saldo - 120000));
t('rendimento supera o aportado em 10 anos a 14,15%', S[120].rendimento > S[120].aportado, true);
t('saldo cresce todo mês', S[60].saldo > S[59].saldo, true);

var Z = simular(0, 1000, 1, 0, 0);
t('sem juros, saldo = soma dos aportes', Z[12].saldo, 12000);
t('sem juros, rendimento zero', Z[12].rendimento, 0);

var I = simular(10000, 0, 1, 0.10, 0);
t('só valor inicial a 10% a.a. rende 10% no ano',
  Math.round(I[12].saldo), 11000);

var C = simular(0, 1000, 3, 0, 0.10);
t('aporte cresce 10% por ano', C[36].aportado, 12000 + 13200 + 14520);
t('crescimento começa só no 13º mês', C[12].aportado, 12000);

grupo('Investimentos — rendimento deduzido do saldo');
t('mês simples', rendimentoMes(1000, 1120, 100, 0), 20);
t('com resgate', rendimentoMes(5000, 4200, 0, 1000), 200);
t('primeiro mês, sem saldo anterior',
  Math.round(rendimentoMes(0, 1011.8, 1000, 0) * 100) / 100, 11.8);
t('mês sem movimento', rendimentoMes(2000, 2025, 0, 0), 25);
t('prejuízo aparece negativo', rendimentoMes(1000, 950, 0, 0), -50);
t('aporte não vira rendimento', rendimentoMes(1000, 2000, 1000, 0), 0);

grupo('Investimentos — carteira consolidada');
var MOV = [
  { competencia: '2026-07', ativo: 'CDB X', tipo: 'Aporte', valor: 1000 },
  { competencia: '2026-07', ativo: 'Tesouro Selic', tipo: 'Aporte', valor: 500 },
  { competencia: '2026-08', ativo: 'CDB X', tipo: 'Aporte', valor: 1000 },
  { competencia: '2026-08', ativo: 'Tesouro Selic', tipo: 'Resgate', valor: 200 }
];
var SLD = [
  { competencia: '2026-08', ativo: 'CDB X', saldo: 2035.20 },
  { competencia: '2026-08', ativo: 'Tesouro Selic', saldo: 306.10 }
];
function somaMov(l, tipo) {
  return l.filter(function (i) { return i.tipo === tipo; })
          .reduce(function (a, b) { return a + b.valor; }, 0);
}
var aportado = somaMov(MOV, 'Aporte') - somaMov(MOV, 'Resgate');
var patrimonio = SLD.reduce(function (a, b) { return a + b.saldo; }, 0);
t('total aportado líquido', aportado, 2300);
t('patrimônio atual', Math.round(patrimonio * 100) / 100, 2341.30);
t('rendimento acumulado', Math.round((patrimonio - aportado) * 100) / 100, 41.30);
t('resgate reduz o aportado, não vira perda', aportado < somaMov(MOV, 'Aporte'), true);


grupo('Contas a pagar — status pelo vencimento');
var HOJE = '2026-08-10';
t('vencida ontem',      statusConta('2026-08-09', HOJE), 'atrasada');
t('vencida há um mês',  statusConta('2026-07-10', HOJE), 'atrasada');
t('vence hoje',         statusConta('2026-08-10', HOJE), 'vence hoje');
t('vence amanhã',       statusConta('2026-08-11', HOJE), 'próxima');
t('vence em 7 dias',    statusConta('2026-08-17', HOJE), 'próxima');
t('vence em 8 dias',    statusConta('2026-08-18', HOJE), 'futura');
t('dias de atraso',     diasAte('2026-08-03', HOJE), -7);
t('não confunde virada de mês', statusConta('2026-09-01', HOJE), 'futura');
t('atravessa a virada do ano',  diasAte('2027-01-10', '2026-12-31'), 10);

grupo('Contas a pagar — data em formato brasileiro');
t('ISO vira BR', dataBR('2026-08-09'), '09/08/26');
t('primeiro do mês', dataBR('2026-01-01'), '01/01/26');
t('vazio', dataBR(''), '—');

grupo('Contas fixas — dia de vencimento em meses curtos');
t('dia 10 em agosto',       vencimentoDaConta('2026-08', 10), '2026-08-10');
t('dia 31 em fevereiro',    vencimentoDaConta('2026-02', 31), '2026-02-28');
t('dia 31 em abril',        vencimentoDaConta('2026-04', 31), '2026-04-30');
t('dia 31 em dezembro',     vencimentoDaConta('2026-12', 31), '2026-12-31');
t('fevereiro bissexto',     vencimentoDaConta('2028-02', 30), '2028-02-29');
t('dia 0 vira dia 1',       vencimentoDaConta('2026-05', 0),  '2026-05-01');

grupo('Contas fixas — geração do mês');
var FIXAS = [
  { conta:'ENERGIA',        dia_vencimento:7,  valor_estimado:690.78, em_uso:'Sim' },
  { conta:'PARCELA MRV',    dia_vencimento:9,  valor_estimado:1278.52, em_uso:'Sim' },
  { conta:'HUMANAS SAUDE',  dia_vencimento:20, valor_estimado:745.53, em_uso:'Sim' },
  { conta:'CEA ANTIGO',     dia_vencimento:15, valor_estimado:120,    em_uso:'Não' }
];
var g1 = gerarContas(FIXAS, [], '2026-09');
t('gera só as ativas', g1.criadas.length, 3);
t('nenhuma pulada na 1a vez', g1.puladas, 0);
t('vencimentos corretos',
  g1.criadas.map(function(c){ return c.vencimento; }),
  ['2026-09-07','2026-09-09','2026-09-20']);
t('nascem em aberto', g1.criadas.every(function(c){ return c.pago==='Não'; }), true);
t('soma prevista do mês',
  Math.round(g1.criadas.reduce(function(a,b){ return a+b.valor; },0)*100)/100, 2714.83);

var g2 = gerarContas(FIXAS, g1.criadas.map(function(c){ return c.descricao; }), '2026-09');
t('rodar de novo não duplica', g2.criadas.length, 0);
t('e conta quantas pulou', g2.puladas, 3);

var g3 = gerarContas(FIXAS, ['energia'], '2026-09');
t('compara ignorando maiúsculas', g3.criadas.length, 2);

grupo('Contas a pagar — previsto x pago');
function difPagamento(previsto, pago){ return Math.round((pago - previsto)*100)/100; }
t('pagou a mais',   difPagamento(690.78, 715.00), 24.22);
t('pagou a menos',  difPagamento(690.78, 650.00), -40.78);
t('pagou igual',    difPagamento(690.78, 690.78), 0);
t('sem valor informado usa o previsto',
  (function(){ var vp=null; return vp===null ? 690.78 : vp; })(), 690.78);


grupo('Rodapé da lista — sinal do saldo (bug da v1.7.0)');
function rodape(lista){
  var ent = lista.filter(function(l){ return l.tipo==='Entrada'; })
                 .reduce(function(a,b){ return a+b.valor; },0);
  var sai = lista.filter(function(l){ return l.tipo!=='Entrada'; })
                 .reduce(function(a,b){ return a+b.valor; },0);
  return { entradas:Math.round(ent*100)/100, saidas:Math.round(sai*100)/100,
           saldo:Math.round((ent-sai)*100)/100 };
}
var JUL = [
  { tipo:'Entrada', valor:9650.24 }, { tipo:'Saída', valor:965.02 },
  { tipo:'Saída',   valor:1276.48 }, { tipo:'Saída', valor:38.82 },
  { tipo:'Saída',   valor:41.00 },   { tipo:'Entrada', valor:1300.00 }
];
var r = rodape(JUL);
t('entradas somadas', r.entradas, 10950.24);
t('saídas somadas',   r.saidas,   2321.32);
t('saldo é POSITIVO quando entrou mais do que saiu', r.saldo, 8628.92);
t('saldo não é saídas menos entradas', r.saldo === -8628.92, false);
t('só saídas dá saldo negativo',
  rodape([{tipo:'Saída',valor:100},{tipo:'Saída',valor:50}]).saldo, -150);
t('só entradas dá saldo positivo',
  rodape([{tipo:'Entrada',valor:100}]).saldo, 100);
t('lista vazia dá zero', rodape([]).saldo, 0);
t('entradas e saídas iguais zeram',
  rodape([{tipo:'Entrada',valor:500},{tipo:'Saída',valor:500}]).saldo, 0);

/* ============================================================ resultado */

console.log('\n' + '-'.repeat(46));
console.log(ok + ' testes passaram, ' + bad + ' falharam');
process.exit(bad ? 1 : 0);
