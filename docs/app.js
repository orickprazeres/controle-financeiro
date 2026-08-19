/* ============================================================ estado */
var VERSAO = '2.1.1';
/* Endereço da planilha. Pode ficar aqui porque o compartilhamento dela está
   RESTRITO — saber o endereço não dá acesso a nada. Se algum dia você mudar
   para "qualquer pessoa com o link", apague esta linha e use só o campo do ⚙. */
var SHEET_PADRAO = 'https://docs.google.com/spreadsheets/d/10pH6DLWFdvBzoGiFn4QNXJ2B_cEMpypO_scqN18O2Ic/edit';

var _sheetSalvo = localStorage.getItem('cc_sheet');
var CFG = { url: localStorage.getItem('cc_url') || '',
            token: localStorage.getItem('cc_tok') || '',
            sheet: (_sheetSalvo === null ? SHEET_PADRAO : _sheetSalvo) };
var DB = { lancamentos: [], categorias: [], cartoes: [], orcamento: [] };
var MES = '';
var CH = {};
var PAL = ['#38bdf8','#a78bfa','#34d399','#fbbf24','#f87171','#60a5fa','#f472b6',
           '#2dd4bf','#fb923c','#c084fc','#4ade80','#facc15','#94a3b8','#818cf8',
           '#e879f9','#22d3ee','#a3e635','#fca5a5','#fdba74','#67e8f9','#d8b4fe','#86efac','#cbd5e1'];

/* ============================================================ helpers */
function $(id){ return document.getElementById(id); }
function brl(n){ return (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function pct(n){ return (Number(n)||0).toLocaleString('pt-BR',{style:'percent',minimumFractionDigits:1}); }
function hoje(){ return new Date().toISOString().slice(0,10); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function somaMes(c,n){ var p=String(c).split('-'),a=+p[0],m=+p[1]-1+n; a+=Math.floor(m/12); m=((m%12)+12)%12; return a+'-'+('0'+(m+1)).slice(-2); }
var MESES_CURTOS=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

/** 2026-07 -> jul/26 */
function nomeMes(c){
  var p=String(c).split('-');
  if (p.length<2 || isNaN(+p[1])) return String(c);
  return MESES_CURTOS[(+p[1])-1] + '/' + String(p[0]).slice(-2);
}

/** Preenche um <select> de competência mostrando jul/26 e guardando 2026-07. */
function preencherMeses(sel, valor){
  var base = (valor && /^\d{4}-\d{2}$/.test(valor)) ? valor : hoje().slice(0,7);
  var lista = {};
  for (var i=-30; i<=18; i++) lista[somaMes(hoje().slice(0,7), i)] = 1;
  lista[base] = 1;
  (DB.lancamentos||[]).forEach(function(l){ if(l.competencia) lista[l.competencia]=1; });
  (DB.saldos||[]).forEach(function(l){ if(l.competencia) lista[l.competencia]=1; });
  var ks = Object.keys(lista).sort();
  sel.innerHTML = '';
  ks.forEach(function(m){
    var o=document.createElement('option'); o.value=m; o.textContent=nomeMes(m); sel.appendChild(o);
  });
  sel.value = base;
}
function aviso(txt,tipo){
  $('alerta').innerHTML = txt ? '<div class="msg '+(tipo||'i')+'">'+esc(txt)+'</div>' : '';
  if (txt && tipo === 's') setTimeout(function(){ $('alerta').innerHTML=''; }, 4000);
}
function msgEm(el,txt,tipo){
  $(el).innerHTML = txt ? '<div class="msg '+(tipo||'i')+'">'+esc(txt)+'</div>' : '';
  if (txt && tipo === 's') setTimeout(function(){ $(el).innerHTML=''; }, 4000);
}
function setSyncStatus(estado, texto){
  var el = $('syncStatus');
  el.className = 'sync-pill' + (estado ? ' ' + estado : '');
  el.querySelector('span').textContent = texto;
}
function abrirPainelAtual(){
  var ativo = document.querySelector('#nav button[data-p].on') || document.querySelector('#nav button[data-p="painel"]');
  var mapa = { painel:'pgPainel', mov:'pgMov', inv:'pgInv' };
  document.querySelectorAll('.pg').forEach(function(p){ p.classList.add('hide'); });
  if (ativo && mapa[ativo.dataset.p]) $(mapa[ativo.dataset.p]).classList.remove('hide');
}

/* ============================================================ API */
function api(){
  return fetch(CFG.url + '?token=' + encodeURIComponent(CFG.token) + '&t=' + Date.now())
    .then(function(r){ return r.json(); });
}
function apiPost(payload){
  payload.token = CFG.token;
  return fetch(CFG.url, {
    method: 'POST',
    // text/plain evita o preflight CORS, que o Apps Script não responde
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }).then(function(r){ return r.json(); });
}

/* ============================================================ carga */
function carregar(){
  if (!CFG.url || !CFG.token){ mostrarCfg(); return; }
  setSyncStatus('loading','Sincronizando…');
  aviso('Sincronizando dados…','i');
  api().then(function(res){
    if (!res.ok) throw new Error(res.erro || 'Falha ao ler a planilha');
    DB = res;
    aviso('');
    $('nav').classList.remove('hide');
    $('btAbrirNovo').classList.remove('hide');
    aplicarBotaoPlanilha();
    $('pgCfg').classList.add('hide');
    document.body.classList.add('connected');
    document.body.classList.remove('configuring');
    prepararMeses();
    preencherSelects();
    render();
    abrirPainelAtual();
    setSyncStatus('connected','Atualizado agora');
  }).catch(function(e){
    setSyncStatus('error','Falha na conexão');
    aviso('Não consegui conectar: ' + e.message + ' — confira a URL e o token em ⚙.','e');
    mostrarCfg();
  });
}
function mostrarCfg(){
  $('cfgUrl').value = CFG.url; $('cfgTok').value = CFG.token; $('cfgSheet').value = CFG.sheet;
  $('pgCfg').classList.remove('hide');
  $('btAbrirNovo').classList.add('hide');
  $('nav').classList.add('hide');
  document.body.classList.add('configuring');
  document.querySelectorAll('.pg').forEach(function(p){ p.classList.add('hide'); });
}

function prepararMeses(){
  var set = {};
  DB.lancamentos.forEach(function(l){ if(l.competencia) set[l.competencia]=1; });
  var atual = hoje().slice(0,7);
  set[atual]=1;
  var meses = Object.keys(set).sort();
  var sel = $('selMes'); sel.innerHTML='';
  meses.forEach(function(m){
    var o=document.createElement('option'); o.value=m; o.textContent=nomeMes(m); sel.appendChild(o);
  });
  if (!MES || meses.indexOf(MES)<0) MES = meses.indexOf(atual)>=0 ? atual : meses[meses.length-1];
  sel.value = MES;
}

function preencherSelects(){
  var saidas = DB.categorias.filter(function(c){ return c.tipo!=='Entrada'; });
  var entradas = DB.categorias.filter(function(c){ return c.tipo==='Entrada'; });
  function opts(sel, lista, primeira){
    sel.innerHTML = primeira ? '<option value="">'+primeira+'</option>' : '';
    lista.forEach(function(c){ var o=document.createElement('option'); o.value=o.textContent=c.categoria||c; sel.appendChild(o); });
  }
  opts($('fCat'), DB.categorias, 'Categoria: todas');
  opts($('nCat'), saidas, '');
  window._catsSaida = saidas; window._catsEntrada = entradas;
  var formas = {};
  DB.lancamentos.forEach(function(l){ if(l.forma_pagamento) formas[l.forma_pagamento]=1; });
  var ff=$('fForma'); ff.innerHTML='<option value="">Pagamento: todos</option>';
  Object.keys(formas).sort().forEach(function(f){ var o=document.createElement('option'); o.value=o.textContent=f; ff.appendChild(o); });
  var nc=$('nCartao'); nc.innerHTML='';
  DB.cartoes.forEach(function(c){ var o=document.createElement('option'); o.value=o.textContent=c.cartao; nc.appendChild(o); });
}

/* ============================================================ cálculo */
function doMes(m){ return DB.lancamentos.filter(function(l){ return l.competencia===m; }); }
function soma(arr){ return arr.reduce(function(a,b){ return a+(Number(b.valor)||0); },0); }
function saidas(m){ return doMes(m).filter(function(l){ return l.tipo!=='Entrada'; }); }
function entradas(m){ return doMes(m).filter(function(l){ return l.tipo==='Entrada'; }); }
function porChave(arr,chave){
  var o={}; arr.forEach(function(l){ var k=l[chave]||'(sem)'; o[k]=(o[k]||0)+(Number(l.valor)||0); });
  return Object.keys(o).map(function(k){ return {k:k,v:o[k]}; }).sort(function(a,b){ return b.v-a.v; });
}
function limiteDe(cat){
  var o = DB.orcamento.filter(function(x){ return x.categoria===cat; })[0];
  return o ? Number(o.limite)||0 : 0;
}

/* ============================================================ render */
function render(){
  renderKPI(); renderGraficos(); renderTabelaCat(); renderComparativo();
  renderLancamentos(); renderFuturo(); renderInvestimentos();
  renderContasAPagar();
}

/* ============================================================ resumo */

/** Tudo que ainda não foi pago, de qualquer mês. É a dívida de verdade. */
function dividaAberta(){
  return DB.lancamentos.filter(function(l){
    return l.tipo !== 'Entrada' && String(l.pago) !== 'Sim';
  });
}
/** Patrimônio = último saldo registrado, considerando até a competência dada. */
function patrimonioEm(comp){
  var meses = {};
  (DB.saldos||[]).forEach(function(s){
    if (!comp || s.competencia <= comp) meses[s.competencia] = 1;
  });
  var ks = Object.keys(meses).sort();
  if (!ks.length) return null;
  var ultimo = ks[ks.length-1];
  return (DB.saldos||[]).filter(function(s){ return s.competencia === ultimo; })
                        .reduce(function(a,b){ return a + (Number(b.saldo)||0); },0);
}
function totalAportado(){
  var m = DB.investimentos || [];
  return m.filter(function(i){ return i.tipo==='Aporte';  }).reduce(function(a,b){ return a+Number(b.valor||0); },0)
       - m.filter(function(i){ return i.tipo==='Resgate'; }).reduce(function(a,b){ return a+Number(b.valor||0); },0);
}

function renderKPI(){
  document.querySelectorAll('.lblMes').forEach(function(e){ e.textContent = nomeMes(MES); });

  /* ---------- patrimônio líquido ---------- */
  var pat = patrimonioEm(null) || 0;
  var div = dividaAberta().reduce(function(a,b){ return a+(Number(b.valor)||0); },0);
  var pl  = pat - div;
  $('rInv').textContent = brl(pat);
  $('rDiv').textContent = brl(div);
  $('rPL').textContent  = brl(pl);
  $('rPL').className    = 'pl-v pl-big ' + (pl>=0 ? 'pos' : 'neg');
  var nDiv = dividaAberta().length;
  $('rPLnota').textContent = pl >= 0
    ? 'Se você quitasse hoje as ' + nDiv + ' pendência(s) em aberto, sobrariam ' + brl(pl) + '.'
    : 'Suas pendências em aberto superam o investido em ' + brl(-pl) + '.';

  /* ---------- o mês ---------- */
  var e = soma(entradas(MES)), sa = soma(saidas(MES)), sal = e - sa;
  var cred = soma(doMes(MES).filter(function(l){ return l.forma_pagamento==='Crédito' && l.tipo!=='Entrada'; }));
  $('kEnt').textContent = brl(e);
  $('kSai').textContent = brl(sa);
  $('kSal').textContent = brl(sal);
  $('kSal').className   = 'v ' + (sal>=0?'pos':'neg');
  $('kSalS').textContent = e>0 ? pct(sal/e) + ' do que entrou' : '';
  $('kCar').textContent = brl(cred);
  $('kCarS').textContent = sa>0 ? pct(cred/sa) + ' das saídas' : '';

  /* ---------- contas ---------- */
  var abertas  = dividaAberta();
  var vencidas = abertas.filter(function(l){ return diasAte(vencDe(l)) < 0; });
  var proximas = abertas.filter(function(l){ var d=diasAte(vencDe(l)); return d>=0 && d<=7; });
  $('rVenc').textContent  = brl(vencidas.reduce(function(a,b){ return a+Number(b.valor||0); },0));
  $('rVenc').className    = 'v ' + (vencidas.length ? 'neg' : 'pos');
  $('rVencS').textContent = vencidas.length ? vencidas.length+' conta(s)' : 'nada em atraso';
  $('rProx').textContent  = brl(proximas.reduce(function(a,b){ return a+Number(b.valor||0); },0));
  $('rProxS').textContent = proximas.length+' conta(s)';

  /* ---------- carteira ---------- */
  var ap = totalAportado(), rend = pat - ap;
  $('rPat').textContent  = brl(pat);
  $('rPatS').textContent = ap>0 ? brl(ap)+' aportados' : 'sem aportes registrados';
  $('rRend').textContent = brl(rend);
  $('rRend').className   = 'v ' + (rend>=0?'pos':'neg');
  $('rRendS').textContent= ap>0 ? pct(rend/ap)+' sobre o aportado' : '';

  renderAlertas(abertas, vencidas);
  renderResumoMensal();
  renderProximos(abertas);
  renderCartoes(abertas);
}

/** Só o que exige ação. Sem nada a fazer, o bloco nem aparece. */
function renderAlertas(abertas, vencidas){
  var av = [];
  if (vencidas.length){
    av.push(['a-vermelho','⚠', '<b>'+vencidas.length+' conta(s) vencida(s)</b> somando '
      + brl(vencidas.reduce(function(a,b){ return a+Number(b.valor||0); },0))
      + '. A mais antiga venceu em ' + dataBR(vencDe(vencidas[0])) + '.']);
  }
  // orçamento estourado
  var gasto = {};
  porChave(saidas(MES),'categoria').forEach(function(c){ gasto[c.k]=c.v; });
  var estourou = (DB.orcamento||[]).filter(function(o){
    return o.limite > 0 && (gasto[o.categoria]||0) > o.limite;
  });
  estourou.forEach(function(o){
    av.push(['a-amarelo','◈','<b>'+esc(o.categoria)+'</b> passou do orçamento: '
      + brl(gasto[o.categoria]) + ' de ' + brl(o.limite) + '.']);
  });
  // saldo de investimento desatualizado
  var temAtivo = (DB.ativos||[]).length > 0;
  var temSaldoMes = (DB.saldos||[]).some(function(s){ return s.competencia === MES; });
  if (temAtivo && !temSaldoMes){
    av.push(['a-azul','◷','Sem saldo de investimento registrado em <b>'+nomeMes(MES)
      +'</b>. Sem ele o rendimento do mês não é calculado.']);
  }
  // sobrou pouco
  var e = soma(entradas(MES)), sa = soma(saidas(MES));
  if (e > 0 && (e-sa)/e < 0.05 && (e-sa) >= 0){
    av.push(['a-amarelo','◈','Você guardou menos de 5% do que entrou em '+nomeMes(MES)+'.']);
  }
  if (e > 0 && (e-sa) < 0){
    av.push(['a-vermelho','⚠','Em '+nomeMes(MES)+' você gastou <b>'+brl(sa-e)+'</b> a mais do que entrou.']);
  }

  $('alertas').innerHTML = av.length
    ? av.map(function(a){ return '<div class="alerta '+a[0]+'"><span>'+a[1]+'</span><span>'+a[2]+'</span></div>'; }).join('')
      + '<div style="height:8px"></div>'
    : '';
}

function renderResumoMensal(){
  var meses = []; for (var i=11;i>=0;i--) meses.push(somaMes(MES,-i));
  var acum = 0;
  var h = '<tr><th>Mês</th><th class="r">Entradas</th><th class="r">Saídas</th><th class="r">Saldo</th>'
        + '<th class="r">Acumulado</th><th class="r">Aportes</th><th class="r">Patrimônio</th></tr>';
  meses.forEach(function(m){
    var e = soma(entradas(m)), sa = soma(saidas(m)), s = e - sa;
    acum += s;
    var ap = (DB.investimentos||[]).filter(function(i){ return i.competencia===m && i.tipo==='Aporte'; })
              .reduce(function(a,b){ return a+Number(b.valor||0); },0);
    var temSaldo = (DB.saldos||[]).some(function(x){ return x.competencia===m; });
    var pat = temSaldo ? (DB.saldos||[]).filter(function(x){ return x.competencia===m; })
                          .reduce(function(a,b){ return a+Number(b.saldo||0); },0) : null;
    var atual = (m === MES);
    h += '<tr'+(atual?' style="background:rgba(56,189,248,.07)"':'')+'>'
       + '<td'+(atual?' style="font-weight:700"':'')+'>'+nomeMes(m)+'</td>'
       + '<td class="r '+(e?'pos':'mut')+'">'+(e?brl(e):'—')+'</td>'
       + '<td class="r '+(sa?'':'mut')+'">'+(sa?brl(sa):'—')+'</td>'
       + '<td class="r '+(s>0?'pos':s<0?'neg':'mut')+'">'+((e||sa)?brl(s):'—')+'</td>'
       + '<td class="r '+(acum>=0?'':'neg')+'">'+brl(acum)+'</td>'
       + '<td class="r '+(ap?'':'mut')+'">'+(ap?brl(ap):'—')+'</td>'
       + '<td class="r '+(pat===null?'mut':'pos')+'">'+(pat===null?'—':brl(pat))+'</td></tr>';
  });
  $('tbResumo').innerHTML = h;
}

function renderProximos(abertas){
  var lista = abertas.slice(0,6);
  var h = '<tr><th>Vence</th><th>Conta</th><th class="r">Valor</th></tr>';
  if (!lista.length) h += '<tr><td colspan="3" class="empty">Nada em aberto.</td></tr>';
  lista.forEach(function(l){
    var st = statusConta(l);
    h += '<tr><td><span class="tag '+st.k+'">'+dataBR(vencDe(l))+'</span></td>'
       + '<td>'+esc(l.descricao)+'</td><td class="r">'+brl(l.valor)+'</td></tr>';
  });
  $('tbProx').innerHTML = h;
}

function renderCartoes(abertas){
  var porCartao = {};
  abertas.filter(function(l){ return l.forma_pagamento==='Crédito'; })
    .forEach(function(l){ var c=l.cartao||'(sem cartão)'; porCartao[c]=(porCartao[c]||0)+Number(l.valor||0); });
  var ks = Object.keys(porCartao).sort(function(a,b){ return porCartao[b]-porCartao[a]; });
  var h = '<tr><th>Cartão</th><th class="r">Em aberto</th></tr>';
  if (!ks.length) h += '<tr><td colspan="2" class="empty">Nenhuma fatura em aberto.</td></tr>';
  ks.forEach(function(k){
    h += '<tr><td><span class="tag cr">'+esc(k)+'</span></td><td class="r">'+brl(porCartao[k])+'</td></tr>';
  });
  if (ks.length){
    h += '<tr><td style="font-weight:700">TOTAL</td><td class="r" style="font-weight:700">'
       + brl(ks.reduce(function(a,k){ return a+porCartao[k]; },0))+'</td></tr>';
  }
  $('tbCartoes').innerHTML = h;
}

function grafico(id, cfg){
  if (CH[id]) CH[id].destroy();
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.family = '-apple-system,Segoe UI,Roboto,Arial,sans-serif';
  CH[id] = new Chart($(id), cfg);
}

function renderGraficos(){
  var meses = []; for (var i=11;i>=0;i--) meses.push(somaMes(MES,-i));
  var pats = meses.map(function(m){
    var tem = (DB.saldos||[]).some(function(x){ return x.competencia===m; });
    return tem ? (DB.saldos||[]).filter(function(x){ return x.competencia===m; })
                   .reduce(function(a,b){ return a+Number(b.saldo||0); },0) : null;
  });
  grafico('chEvo', {
    type:'bar',
    data:{ labels: meses.map(nomeMes), datasets:[
      { type:'bar',  label:'Entradas',   data: meses.map(function(m){return soma(entradas(m));}),
        backgroundColor:'rgba(52,211,153,.75)', borderRadius:4, order:2 },
      { type:'bar',  label:'Saídas',     data: meses.map(function(m){return soma(saidas(m));}),
        backgroundColor:'rgba(248,113,113,.75)', borderRadius:4, order:2 },
      { type:'line', label:'Patrimônio', data: pats, borderColor:'#38bdf8',
        backgroundColor:'rgba(56,189,248,.10)', fill:true, tension:.3, order:1, spanGaps:true,
        pointRadius:3, yAxisID:'y' }
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'bottom',labels:{boxWidth:12,padding:14}},
        tooltip:{callbacks:{label:function(c){
          return c.dataset.label+': '+(c.parsed.y===null?'sem registro':brl(c.parsed.y)); }}} },
      scales:{ y:{ grid:{color:'rgba(51,65,85,.5)'},
                   ticks:{callback:function(v){ return 'R$'+(v/1000).toFixed(0)+'k'; }} },
               x:{ grid:{display:false} } } }
  });

  if ($('detalhes').classList.contains('hide')) return;   // não desenha o que está recolhido

  var cats = porChave(saidas(MES),'categoria').slice(0,12);
  grafico('chCat', {
    type:'doughnut',
    data:{ labels: cats.map(function(c){return c.k;}),
           datasets:[{ data:cats.map(function(c){return c.v;}), backgroundColor:PAL, borderWidth:0 }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'58%',
      plugins:{ legend:{position:'right',labels:{boxWidth:10,padding:8,font:{size:11}}},
        tooltip:{callbacks:{label:function(c){return c.label+': '+brl(c.parsed);}}} } }
  });

  var grp = porChave(saidas(MES),'grupo');
  grafico('chGrp', {
    type:'bar',
    data:{ labels: grp.map(function(g){return g.k;}),
           datasets:[{ data:grp.map(function(g){return g.v;}), backgroundColor:'#38bdf8', borderRadius:6 }]},
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:function(c){return brl(c.parsed.x);}}} },
      scales:{ x:{ grid:{color:'rgba(51,65,85,.5)'},
                   ticks:{callback:function(v){return 'R$'+(v/1000).toFixed(1)+'k';}} }, y:{grid:{display:false}} } }
  });

  var fo = porChave(saidas(MES),'forma_pagamento');
  grafico('chFor', {
    type:'doughnut',
    data:{ labels: fo.map(function(f){return f.k;}),
           datasets:[{ data:fo.map(function(f){return f.v;}), backgroundColor:PAL, borderWidth:0 }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'58%',
      plugins:{ legend:{position:'right',labels:{boxWidth:10,padding:8,font:{size:11}}},
        tooltip:{callbacks:{label:function(c){return c.label+': '+brl(c.parsed);}}} } }
  });
}

function renderTabelaCat(){
  var lista = porChave(saidas(MES),'categoria');
  var tot = lista.reduce(function(a,b){ return a+b.v; },0);
  var h = '<tr><th>Categoria</th><th class="r">Gasto</th><th class="r">% do mês</th>'
        + '<th style="width:130px">Orçamento</th><th class="r">Situação</th></tr>';
  if (!lista.length) h += '<tr><td colspan="5" class="empty">Nenhuma saída lançada neste mês.</td></tr>';
  lista.forEach(function(c,i){
    var lim = limiteDe(c.k);
    var uso = lim>0 ? c.v/lim : 0;
    var cor = uso>1 ? 'var(--bad)' : uso>.85 ? 'var(--warn)' : 'var(--ok)';
    var sit = lim>0
      ? '<span class="'+(c.v>lim?'neg':'pos')+'">'+(c.v>lim?'+':'')+brl(c.v-lim)+'</span>'
        + '<div class="bar"><i style="width:'+Math.min(100,uso*100).toFixed(0)+'%;background:'+cor+'"></i></div>'
      : '<span class="mut">sem limite</span>';
    h += '<tr><td><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+PAL[i%PAL.length]+';margin-right:8px"></span>'
       + esc(c.k)+'</td><td class="r">'+brl(c.v)+'</td><td class="r mut">'+pct(tot?c.v/tot:0)
       + '</td><td><input type="number" step="0.01" min="0" class="orcin" data-orc="'+esc(c.k)+'"'
       + ' value="'+(lim||'')+'" placeholder="sem limite"></td>'
       + '<td class="r">'+sit+'</td></tr>';
  });
  $('tbCat').innerHTML = h;
}

/** Salva o limite de UMA categoria. A API aceita lista, então mandamos uma só. */
function salvarOrcamentoDe(categoria, limite){
  apiPost({ acao:'orcamento', dados:[{ categoria: categoria, limite: Number(limite||0) }] })
    .then(function(r){
      if (!r.ok) throw new Error(r.erro);
      aviso('Orçamento de ' + categoria + ': ' + (Number(limite) ? brl(limite) : 'sem limite') + '.', 's');
      var o = (DB.orcamento||[]).filter(function(x){ return x.categoria===categoria; })[0];
      if (o) o.limite = Number(limite||0); else (DB.orcamento=DB.orcamento||[]).push({categoria:categoria,limite:Number(limite||0)});
      renderTabelaCat();
    })
    .catch(function(e){ aviso('Erro ao salvar orçamento: '+e.message,'e'); });
}

function renderComparativo(){
  var ant = somaMes(MES,-1);
  var atual = {}, anterior = {};
  porChave(saidas(MES),'categoria').forEach(function(c){ atual[c.k]=c.v; });
  porChave(saidas(ant),'categoria').forEach(function(c){ anterior[c.k]=c.v; });
  var chaves = Object.keys(atual).concat(Object.keys(anterior)).filter(function(v,i,a){ return a.indexOf(v)===i; });
  var linhas = chaves.map(function(k){
    var a=atual[k]||0, b=anterior[k]||0;
    return { k:k, a:a, b:b, d:a-b, p: b>0 ? (a-b)/b : null };
  }).sort(function(x,y){ return Math.abs(y.d)-Math.abs(x.d); });

  var h = '<tr><th>Categoria</th><th class="r">'+nomeMes(ant)+'</th><th class="r">'+nomeMes(MES)+'</th><th class="r">Diferença</th></tr>';
  if (!linhas.length) h += '<tr><td colspan="4" class="empty">Sem dados para comparar ainda.</td></tr>';
  linhas.slice(0,15).forEach(function(l){
    var cls = l.d>0?'neg':l.d<0?'pos':'mut';
    var txt = (l.d>0?'+':'')+brl(l.d) + (l.p!==null && Math.abs(l.p)>.001 ? ' <span class="mut">('+(l.p>0?'+':'')+pct(l.p)+')</span>' : '');
    h += '<tr><td>'+esc(l.k)+'</td><td class="r mut">'+brl(l.b)+'</td><td class="r">'+brl(l.a)+'</td><td class="r '+cls+'">'+txt+'</td></tr>';
  });
  $('tbComp').innerHTML = h;
}

function renderLancamentos(){
  var busca = $('fBusca').value.toLowerCase();
  var lista = doMes(MES).filter(function(l){
    if (busca && String(l.descricao).toLowerCase().indexOf(busca)<0) return false;
    if ($('fTipo').value  && l.tipo !== $('fTipo').value) return false;
    if ($('fCat').value   && l.categoria !== $('fCat').value) return false;
    if ($('fForma').value && l.forma_pagamento !== $('fForma').value) return false;
    if ($('fPago').value  && String(l.pago) !== $('fPago').value) return false;
    return true;
  }).sort(function(a,b){ return String(b.data).localeCompare(String(a.data)); });

  var totEnt = lista.filter(function(l){ return l.tipo==='Entrada'; })
                    .reduce(function(a,b){ return a + (Number(b.valor)||0); },0);
  var totSai = lista.filter(function(l){ return l.tipo!=='Entrada'; })
                    .reduce(function(a,b){ return a + (Number(b.valor)||0); },0);
  var saldo  = totEnt - totSai;
  var h = '<tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Pagamento</th><th class="c">Parc.</th><th class="r">Valor</th><th class="c">Pago</th><th></th></tr>';
  if (!lista.length) h += '<tr><td colspan="8" class="empty">Nenhum lançamento com esses filtros.</td></tr>';
  lista.forEach(function(l){
    var parc = Number(l.parcelas_total)>1 ? l.parcela+'/'+l.parcelas_total : '—';
    var pgTag = String(l.pago)==='Sim' ? '<span class="tag pg">pago</span>' : '<span class="tag np">aberto</span>';
    var frm = l.forma_pagamento==='Crédito'
      ? '<span class="tag cr">'+esc(l.cartao||'Crédito')+'</span>'
      : '<span class="tag">'+esc(l.forma_pagamento)+'</span>';
    h += '<tr class="clicavel" data-edit="'+esc(l.id)+'" title="Clique para editar">'
       + '<td class="mut">'+esc(String(l.data).slice(8,10)+'/'+String(l.data).slice(5,7))+'</td>'
       + '<td>'+esc(l.descricao)+'</td><td class="mut">'+esc(l.categoria)+'</td><td>'+frm+'</td>'
       + '<td class="c mut">'+parc+'</td>'
       + '<td class="r '+(l.tipo==='Entrada'?'pos':'')+'">'+(l.tipo==='Entrada'?'+':'')+brl(l.valor)+'</td>'
       + '<td class="c">'+pgTag+'</td>'
       + '<td class="r mut" style="font-size:11px">editar ›</td></tr>';
  });
  h += '<tr><td colspan="5" class="mut">Entradas</td>'
     + '<td class="r pos">+'+brl(totEnt)+'</td><td colspan="2"></td></tr>'
     + '<tr><td colspan="5" class="mut">Saídas</td>'
     + '<td class="r neg">−'+brl(totSai)+'</td><td colspan="2"></td></tr>'
     + '<tr><td colspan="5" style="font-weight:700">SALDO'
     + (lista.length !== doMes(MES).length ? ' <span class="mut" style="font-weight:400">(dos filtros aplicados)</span>' : '')
     + '</td>'
     + '<td class="r '+(saldo>=0?'pos':'neg')+'" style="font-weight:700">'+brl(saldo)+'</td>'
     + '<td colspan="2"></td></tr>';
  $('tbLanc').innerHTML = h;
}

function renderFuturo(){
  var futuros = DB.lancamentos.filter(function(l){
    return l.tipo!=='Entrada' && String(l.competencia) > MES;
  });
  var meses = []; for (var i=1;i<=12;i++) meses.push(somaMes(MES,i));
  var vals = meses.map(function(m){ return soma(futuros.filter(function(l){ return l.competencia===m; })); });
  grafico('chFut', {
    type:'bar',
    data:{ labels: meses.map(nomeMes), datasets:[{ label:'Já comprometido', data: vals, backgroundColor:'#a78bfa', borderRadius:6 }]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:function(c){return brl(c.parsed.y);}}} },
      scales:{ y:{ grid:{color:'rgba(51,65,85,.5)'}, ticks:{callback:function(v){return 'R$'+(v/1000).toFixed(1)+'k';}} }, x:{grid:{display:false}} } }
  });

  var parcelados = futuros.filter(function(l){ return Number(l.parcelas_total)>1; });
  var grupos = {};
  parcelados.forEach(function(l){
    var raiz = String(l.id).replace(/-\d+$/,'');
    if (!grupos[raiz]) grupos[raiz] = { desc:String(l.descricao).replace(/\s*\(\d+\/\d+\)\s*$/,''), cat:l.categoria, cartao:l.cartao, tot:l.parcelas_total, restam:0, soma:0, ate:'' };
    grupos[raiz].restam++; grupos[raiz].soma += Number(l.valor)||0;
    if (l.competencia > grupos[raiz].ate) grupos[raiz].ate = l.competencia;
  });
  var arr = Object.keys(grupos).map(function(k){ return grupos[k]; }).sort(function(a,b){ return b.soma-a.soma; });
  var h = '<tr><th>Compra</th><th>Categoria</th><th>Cartão</th><th class="c">Faltam</th><th>Até</th><th class="r">Total restante</th></tr>';
  if (!arr.length) h += '<tr><td colspan="6" class="empty">Nenhuma compra parcelada em aberto. 👍</td></tr>';
  arr.forEach(function(g){
    h += '<tr><td>'+esc(g.desc)+'</td><td class="mut">'+esc(g.cat)+'</td><td class="mut">'+esc(g.cartao||'—')+'</td>'
       + '<td class="c">'+g.restam+' de '+g.tot+'</td><td class="mut">'+nomeMes(g.ate)+'</td>'
       + '<td class="r">'+brl(g.soma)+'</td></tr>';
  });
  var totFut = futuros.reduce(function(a,b){ return a+(Number(b.valor)||0); },0);
  h += '<tr><td colspan="5" style="font-weight:700">Total comprometido nos próximos meses</td><td class="r" style="font-weight:700">'+brl(totFut)+'</td></tr>';
  $('tbFut').innerHTML = h;
}


/* ============================================================ investimentos */

/* --- matemática --- */

/** Taxa mensal equivalente a uma taxa anual (juros compostos, não divisão por 12). */
function taxaMensal(anual){ return Math.pow(1 + anual, 1/12) - 1; }

/** Combina dois índices: (1+a)*(1+b)-1. Usado em IPCA + juro real. */
function combina(a, b){ return (1+a)*(1+b) - 1; }

/** Tabela regressiva de IR da renda fixa, pelo prazo em dias. */
function aliquotaIR(dias){
  if (dias <= 180) return 0.225;
  if (dias <= 360) return 0.20;
  if (dias <= 720) return 0.175;
  return 0.15;
}

/** Taxa anual efetiva conforme o modo escolhido no simulador. */
function taxaAnualSim(){
  var modo = $('sModo').value;
  var t = Number($('sTaxa').value || 0) / 100;
  var cdi = Number($('sCDI').value || 0) / 100;
  var ipca = Number($('sIPCA').value || 0) / 100;
  if (modo === 'cdi')  return cdi * t;   // 110% do CDI -> t = 1.10
  if (modo === 'ipca') return combina(ipca, t);
  return t;
}

/**
 * Projeta mês a mês. Devolve uma linha por mês com saldo, aportado e rendimento.
 * O aporte cresce uma vez por ano, se configurado.
 */
function simular(ini, aporte, anos, taxaAno, crescAno){
  var im = taxaMensal(taxaAno);
  var saldo = ini, aportado = ini, apt = aporte;
  var linhas = [{ mes:0, saldo:saldo, aportado:aportado, rendimento:0 }];
  for (var m = 1; m <= anos*12; m++){
    if (m > 1 && (m-1) % 12 === 0) apt = apt * (1 + crescAno);
    saldo = saldo * (1 + im) + apt;
    aportado += apt;
    linhas.push({ mes:m, saldo:saldo, aportado:aportado, rendimento: saldo - aportado });
  }
  return linhas;
}

/* --- simulador --- */

function renderSimulador(){
  var modo = $('sModo').value;
  $('sTaxaLab').textContent = modo==='cdi' ? 'Percentual do CDI'
    : modo==='ipca' ? 'Juro real acima do IPCA (% a.a.)' : 'Rendimento (% a.a.)';

  var ini   = Number($('sIni').value || 0);
  var apt   = Number($('sApt').value || 0);
  var anos  = Math.max(1, Math.min(50, parseInt($('sAnos').value || 1, 10)));
  var cresc = Number($('sCres').value || 0) / 100;
  var ta    = taxaAnualSim();

  var L = simular(ini, apt, anos, ta, cresc);
  var fim = L[L.length-1];
  var rend = fim.rendimento;

  var ir = $('sIR').checked ? rend * aliquotaIR(anos * 365) : 0;
  var liquido = fim.saldo - ir;
  var ipca = Number($('sIPCA').value || 0) / 100;
  var real = liquido / Math.pow(1 + ipca, anos);

  $('iFinal').textContent = brl(liquido);
  $('iFinalS').textContent = 'em ' + anos + (anos>1?' anos':' ano') + ' · ' + pct(ta) + ' a.a.';
  $('iApt').textContent  = brl(fim.aportado);
  $('iAptS').textContent = fim.saldo>0 ? pct(fim.aportado/fim.saldo) + ' do total' : '';
  $('iRend').textContent = brl(rend);
  $('iRendS').textContent = fim.saldo>0 ? pct(rend/fim.saldo) + ' do total' : '';
  $('iIR').textContent   = $('sIR').checked ? '− ' + brl(ir) : 'isento/não';
  $('iIRS').textContent  = $('sIR').checked ? 'alíquota de ' + pct(aliquotaIR(anos*365)) : 'sem desconto';
  $('iReal').textContent = $('sReal').checked ? brl(real) : brl(liquido);

  var anosLbl = [], dApt = [], dRen = [];
  for (var a = 0; a <= anos; a++){
    var x = L[a*12];
    anosLbl.push(a === 0 ? 'hoje' : 'ano ' + a);
    dApt.push(x.aportado);
    dRen.push(x.rendimento);
  }
  grafico('chSim', {
    type:'bar',
    data:{ labels:anosLbl, datasets:[
      { label:'Do seu bolso', data:dApt, backgroundColor:'#38bdf8', borderRadius:4 },
      { label:'Rendimento',   data:dRen, backgroundColor:'#34d399', borderRadius:4 }
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'bottom',labels:{boxWidth:12,padding:14}},
        tooltip:{ callbacks:{
          label:function(c){ return c.dataset.label+': '+brl(c.parsed.y); },
          footer:function(it){ var t=it.reduce(function(a,b){return a+b.parsed.y;},0); return 'Total: '+brl(t); } } } },
      scales:{ x:{stacked:true, grid:{display:false}},
               y:{stacked:true, grid:{color:'rgba(51,65,85,.5)'},
                  ticks:{callback:function(v){ return v>=1000000 ? 'R$'+(v/1000000).toFixed(1)+'M' : 'R$'+(v/1000).toFixed(0)+'k'; }}} } }
  });

  var h = '<tr><th>Ano</th><th class="r">Aportado</th><th class="r">Rendimento</th><th class="r">Saldo</th><th class="r">Rendeu no ano</th></tr>';
  for (var y = 1; y <= anos; y++){
    var at = L[y*12], ant = L[(y-1)*12];
    h += '<tr><td>'+y+'</td><td class="r mut">'+brl(at.aportado)+'</td>'
       + '<td class="r pos">'+brl(at.rendimento)+'</td>'
       + '<td class="r" style="font-weight:600">'+brl(at.saldo)+'</td>'
       + '<td class="r pos">'+brl(at.rendimento-ant.rendimento)+'</td></tr>';
  }
  $('tbSim').innerHTML = h;
}

/* --- carteira real --- */

function mesesComDados(){
  var set = {};
  (DB.saldos||[]).forEach(function(s){ if(s.competencia) set[s.competencia]=1; });
  (DB.investimentos||[]).forEach(function(i){ if(i.competencia) set[i.competencia]=1; });
  return Object.keys(set).sort();
}
function saldoDe(ativo, comp){
  var r = (DB.saldos||[]).filter(function(s){ return s.ativo===ativo && s.competencia===comp; })[0];
  return r ? Number(r.saldo)||0 : null;
}
function saldoTotal(comp){
  return (DB.saldos||[]).filter(function(s){ return s.competencia===comp; })
    .reduce(function(a,b){ return a+(Number(b.saldo)||0); },0);
}
function movDe(comp, ativo){
  return (DB.investimentos||[]).filter(function(i){
    return i.competencia===comp && (!ativo || i.ativo===ativo);
  });
}
function somaMov(lista, tipo){
  return lista.filter(function(i){ return i.tipo===tipo; })
              .reduce(function(a,b){ return a+(Number(b.valor)||0); },0);
}
function classeDe(ativo){
  var a = (DB.ativos||[]).filter(function(x){ return x.ativo===ativo; })[0];
  return a ? (a.classe||'Outros') : 'Outros';
}

function renderCarteira(){
  var meses = mesesComDados();
  var ultimo = meses.length ? meses[meses.length-1] : null;
  var patrimonio = ultimo ? saldoTotal(ultimo) : 0;

  var todos = DB.investimentos || [];
  var aportado = somaMov(todos,'Aporte') - somaMov(todos,'Resgate');
  var rendimento = patrimonio - aportado;

  $('cPat').textContent  = brl(patrimonio);
  $('cPat').className    = 'v ' + (patrimonio>0?'pos':'');
  $('cPatS').textContent = ultimo ? 'saldo de ' + nomeMes(ultimo) : 'registre um saldo para começar';
  $('cApt').textContent  = brl(aportado);
  $('cAptS').textContent = todos.length + ' movimentação(ões)';
  $('cRend').textContent = brl(rendimento);
  $('cRend').className   = 'v ' + (rendimento>=0?'pos':'neg');
  $('cRendS').textContent= aportado>0 ? pct(rendimento/aportado) + ' sobre o aportado' : '';

  var mesesApt = {};
  todos.filter(function(i){ return i.tipo==='Aporte'; })
       .forEach(function(i){ mesesApt[i.competencia]=(mesesApt[i.competencia]||0)+Number(i.valor||0); });
  var ks = Object.keys(mesesApt);
  var medio = ks.length ? ks.reduce(function(a,k){ return a+mesesApt[k]; },0)/ks.length : 0;
  $('cMed').textContent  = brl(medio);
  $('cMedS').textContent = ks.length ? 'em ' + ks.length + ' mês(es) com aporte' : '';

  // evolução
  grafico('chPat', {
    type:'bar',
    data:{ labels: meses.map(nomeMes), datasets:[
      { type:'line', label:'Patrimônio', data: meses.map(saldoTotal),
        borderColor:'#34d399', backgroundColor:'rgba(52,211,153,.12)', fill:true, tension:.3, order:0 },
      { type:'bar', label:'Aporte do mês', data: meses.map(function(m){ return somaMov(movDe(m),'Aporte'); }),
        backgroundColor:'#38bdf8', borderRadius:4, order:1 }
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'bottom',labels:{boxWidth:12,padding:14}},
        tooltip:{callbacks:{label:function(c){ return c.dataset.label+': '+brl(c.parsed.y); }}} },
      scales:{ y:{ grid:{color:'rgba(51,65,85,.5)'}, ticks:{callback:function(v){ return 'R$'+(v/1000).toFixed(0)+'k'; }} },
               x:{ grid:{display:false} } } }
  });

  // composição
  var porClasse = {};
  if (ultimo) (DB.saldos||[]).filter(function(s){ return s.competencia===ultimo; })
    .forEach(function(s){ var c=classeDe(s.ativo); porClasse[c]=(porClasse[c]||0)+Number(s.saldo||0); });
  var ck = Object.keys(porClasse);
  grafico('chClasse', {
    type:'doughnut',
    data:{ labels: ck.length?ck:['sem dados'],
           datasets:[{ data: ck.length?ck.map(function(k){return porClasse[k];}):[1],
                       backgroundColor: ck.length?PAL:['#334155'], borderWidth:0 }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'58%',
      plugins:{ legend:{position:'right',labels:{boxWidth:10,padding:8,font:{size:11}}},
        tooltip:{callbacks:{label:function(c){ return ck.length ? c.label+': '+brl(c.parsed) : 'sem saldos registrados'; }}} } }
  });

  // por ativo
  var nomes = {};
  (DB.ativos||[]).forEach(function(a){ nomes[a.ativo]=1; });
  (DB.saldos||[]).forEach(function(s){ nomes[s.ativo]=1; });
  (DB.investimentos||[]).forEach(function(i){ nomes[i.ativo]=1; });

  var h = '<tr><th>Ativo</th><th>Classe</th><th class="r">Aportado</th><th class="r">Saldo</th><th class="r">Rendimento</th><th class="r">Rentab.</th></tr>';
  var lista = Object.keys(nomes).map(function(nome){
    var movs = todos.filter(function(i){ return i.ativo===nome; });
    var ap = movs.filter(function(i){return i.tipo==='Aporte';}).reduce(function(a,b){return a+Number(b.valor||0);},0)
           - movs.filter(function(i){return i.tipo==='Resgate';}).reduce(function(a,b){return a+Number(b.valor||0);},0);
    var sd = ultimo ? (saldoDe(nome, ultimo) || 0) : 0;
    return { nome:nome, ap:ap, sd:sd, rd:sd-ap };
  }).filter(function(x){ return x.ap!==0 || x.sd!==0; })
    .sort(function(a,b){ return b.sd-a.sd; });

  if (!lista.length) h += '<tr><td colspan="6" class="empty">Nenhum investimento registrado ainda. Comece pela aba <b>Registrar</b>.</td></tr>';
  lista.forEach(function(x){
    var r = x.ap>0 ? x.rd/x.ap : 0;
    h += '<tr><td>'+esc(x.nome)+'</td><td class="mut">'+esc(classeDe(x.nome))+'</td>'
       + '<td class="r mut">'+brl(x.ap)+'</td><td class="r" style="font-weight:600">'+brl(x.sd)+'</td>'
       + '<td class="r '+(x.rd>=0?'pos':'neg')+'">'+brl(x.rd)+'</td>'
       + '<td class="r '+(x.rd>=0?'pos':'neg')+'">'+(x.ap>0?pct(r):'—')+'</td></tr>';
  });
  if (lista.length){
    h += '<tr><td colspan="2" style="font-weight:700">TOTAL</td>'
       + '<td class="r" style="font-weight:700">'+brl(aportado)+'</td>'
       + '<td class="r" style="font-weight:700">'+brl(patrimonio)+'</td>'
       + '<td class="r '+(rendimento>=0?'pos':'neg')+'" style="font-weight:700">'+brl(rendimento)+'</td>'
       + '<td class="r '+(rendimento>=0?'pos':'neg')+'" style="font-weight:700">'+(aportado>0?pct(rendimento/aportado):'—')+'</td></tr>';
  }
  $('tbAtivos').innerHTML = h;

  // aporte x sobra
  var mm = {};
  DB.lancamentos.forEach(function(l){ if(l.competencia) mm[l.competencia]=1; });
  Object.keys(mesesApt).forEach(function(k){ mm[k]=1; });
  var todosMeses = Object.keys(mm).sort().slice(-12);
  var h2 = '<tr><th>Mês</th><th class="r">Sobrou</th><th class="r">Aportou</th><th class="r">% da sobra</th></tr>';
  if (!todosMeses.length) h2 += '<tr><td colspan="4" class="empty">Sem dados ainda.</td></tr>';
  todosMeses.forEach(function(m){
    var sobra = soma(entradas(m)) - soma(saidas(m));
    var ap = mesesApt[m] || 0;
    var p = sobra>0 ? ap/sobra : null;
    h2 += '<tr><td>'+nomeMes(m)+'</td>'
       + '<td class="r '+(sobra>=0?'pos':'neg')+'">'+brl(sobra)+'</td>'
       + '<td class="r">'+brl(ap)+'</td>'
       + '<td class="r '+(p===null?'mut':p>=1?'pos':'')+'">'+(p===null?'—':pct(p))+'</td></tr>';
  });
  $('tbSobra').innerHTML = h2;

  // movimentações
  var h3 = '<tr><th>Data</th><th>Ativo</th><th>Tipo</th><th class="r">Valor</th><th></th></tr>';
  var ord = todos.slice().sort(function(a,b){ return String(b.data).localeCompare(String(a.data)); });
  if (!ord.length) h3 += '<tr><td colspan="5" class="empty">Nenhuma movimentação registrada.</td></tr>';
  ord.forEach(function(i){
    h3 += '<tr><td class="mut">'+esc(i.data)+'</td><td>'+esc(i.ativo)+'</td>'
       + '<td><span class="tag '+(i.tipo==='Aporte'?'pg':'np')+'">'+esc(i.tipo)+'</span></td>'
       + '<td class="r">'+brl(i.valor)+'</td>'
       + '<td class="r"><button class="dg" data-delinv="'+esc(i.id)+'">excluir</button></td></tr>';
  });
  $('tbMov').innerHTML = h3;

  // selects de ativo
  var ativos = (DB.ativos||[]).filter(function(a){ return a.em_uso!=='Não'; });
  [['rAtivo'],['sdAtivo']].forEach(function(par){
    var sel = $(par[0]); var atual = sel.value;
    sel.innerHTML = '';
    ativos.forEach(function(a){ var o=document.createElement('option'); o.value=o.textContent=a.ativo; sel.appendChild(o); });
    if (atual) sel.value = atual;
  });
  preencherMeses($('sdComp'), $('sdComp').value || MES || hoje().slice(0,7));

  var dl = $('listaClasses'); dl.innerHTML='';
  var classes = {}; (DB.ativos||[]).forEach(function(a){ if(a.classe) classes[a.classe]=1; });
  ['Renda Fixa','Ações','FII','Fundo','Cripto','Previdência','Outros'].forEach(function(c){ classes[c]=1; });
  Object.keys(classes).sort().forEach(function(c){ var o=document.createElement('option'); o.value=c; dl.appendChild(o); });
}

function renderInvestimentos(){ renderSimulador(); renderCarteira(); }


/* ============================================================ contas a pagar */

function vencDe(l){ return l.vencimento || l.data || ''; }
function diasAte(d){
  if (!d) return 0;
  return Math.round((new Date(d+'T00:00:00') - new Date(hoje()+'T00:00:00')) / 86400000);
}
var ESCOPO = 'tudo';   // 'tudo' = todos os meses · 'mes' = só a competência selecionada

function noEscopo(l){ return ESCOPO === 'tudo' || l.competencia === MES; }

function emAberto(){
  return DB.lancamentos.filter(function(l){
    return l.tipo !== 'Entrada' && String(l.pago) !== 'Sim' && noEscopo(l);
  }).sort(function(a,b){ return String(vencDe(a)).localeCompare(String(vencDe(b))); });
}
function statusConta(l){
  var d = diasAte(vencDe(l));
  if (d < 0)  return { k:'atr', txt:Math.abs(d)+(Math.abs(d)===1?' dia atrasado':' dias atrasado'), ord:0 };
  if (d === 0) return { k:'hj',  txt:'vence hoje', ord:1 };
  if (d <= 7)  return { k:'hj',  txt:'em '+d+(d===1?' dia':' dias'), ord:2 };
  return { k:'fut', txt:'em '+d+' dias', ord:3 };
}
function dataBR(d){
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(d))) return String(d||'—');
  var p=String(d).slice(0,10).split('-'); return p[2]+'/'+p[1]+'/'+p[0].slice(-2);
}

function renderContasAPagar(){
  var abertas = emAberto();
  var vencidas = abertas.filter(function(l){ return diasAte(vencDe(l)) < 0; });
  var proximas = abertas.filter(function(l){ var d=diasAte(vencDe(l)); return d>=0 && d<=7; });
  var pagas    = DB.lancamentos.filter(function(l){
    return l.tipo!=='Entrada' && String(l.pago)==='Sim' && noEscopo(l); });
  var rotulo   = ESCOPO === 'tudo' ? 'em todos os meses' : 'em ' + nomeMes(MES);

  function soma2(a,campo){ return a.reduce(function(x,y){ return x + (Number(y[campo])||0); },0); }

  $('pVenc').textContent  = brl(soma2(vencidas,'valor'));
  $('pVencS').textContent = (vencidas.length ? vencidas.length+' conta(s) em atraso' : 'nenhuma em atraso') + ' · ' + rotulo;
  $('pVenc').className    = 'v ' + (vencidas.length ? 'neg' : 'pos');

  $('pProx').textContent  = brl(soma2(proximas,'valor'));
  $('pProxS').textContent = proximas.length+' conta(s) nos próximos 7 dias';
  $('pAber').textContent  = brl(soma2(abertas,'valor'));
  $('pAberS').textContent = abertas.length+' em aberto ' + rotulo;
  $('pProx').className    = 'v ' + (proximas.length ? 'neg' : '');

  var pagoReal = pagas.reduce(function(a,b){
    return a + (b.valor_pago === null || b.valor_pago === undefined ? Number(b.valor)||0 : Number(b.valor_pago));
  },0);
  $('pPago').textContent  = brl(pagoReal);
  $('pPagoS').textContent = pagas.length+' conta(s) quitada(s) ' + rotulo;
  $('lblMesPago').textContent  = ESCOPO==='tudo' ? 'todos os meses' : nomeMes(MES);
  $('lblMesGerar').textContent = nomeMes(MES);
  document.querySelectorAll('.escMes').forEach(function(e){ e.textContent = nomeMes(MES); });

  // ---- a pagar
  var h = '<tr><th>Vencimento</th><th></th><th>Conta</th><th>Categoria</th><th>Pagamento</th>'
        + '<th class="r">Previsto</th><th></th></tr>';
  if (!abertas.length) h += '<tr><td colspan="7" class="empty">Nada em aberto. Tudo pago. 👍</td></tr>';
  abertas.forEach(function(l){
    var st = statusConta(l);
    h += '<tr class="'+(st.k==='atr'?'atrasada':'')+'">'
       + '<td>'+dataBR(vencDe(l))+'</td>'
       + '<td><span class="tag '+st.k+'">'+st.txt+'</span></td>'
       + '<td>'+esc(l.descricao)+'</td>'
       + '<td class="mut">'+esc(l.categoria)+'</td>'
       + '<td class="mut">'+esc(l.cartao || l.forma_pagamento)+'</td>'
       + '<td class="r">'+brl(l.valor)+'</td>'
       + '<td class="r"><button class="mini" data-pagar="'+esc(l.id)+'">Pagar</button></td></tr>';
  });
  h += '<tr><td colspan="5" style="font-weight:700">TOTAL EM ABERTO · '+rotulo.toUpperCase()+'</td>'
     + '<td class="r" style="font-weight:700">'+brl(soma2(abertas,'valor'))+'</td><td></td></tr>';
  $('tbPagar').innerHTML = h;

  // ---- pagas no mês
  var h2 = '<tr><th>Pago em</th><th>Conta</th><th class="r">Previsto</th><th class="r">Pago</th><th class="r">Diferença</th><th></th></tr>';
  if (!pagas.length) h2 += '<tr><td colspan="6" class="empty">Nenhuma conta quitada neste mês.</td></tr>';
  pagas.slice().sort(function(a,b){ return String(b.data_pagamento).localeCompare(String(a.data_pagamento)); })
    .forEach(function(l){
      var vp = (l.valor_pago === null || l.valor_pago === undefined) ? Number(l.valor) : Number(l.valor_pago);
      var dif = vp - Number(l.valor);
      h2 += '<tr><td class="mut">'+(l.data_pagamento ? dataBR(l.data_pagamento) : '—')+'</td>'
         + '<td>'+esc(l.descricao)+'</td>'
         + '<td class="r mut">'+brl(l.valor)+'</td>'
         + '<td class="r">'+brl(vp)+'</td>'
         + '<td class="r '+(Math.abs(dif)<0.005?'mut':dif>0?'neg':'pos')+'">'
           + (Math.abs(dif)<0.005 ? 'igual' : (dif>0?'+':'')+brl(dif))+'</td>'
         + '<td class="r"><button class="dg" data-desfazer="'+esc(l.id)+'">desfazer</button></td></tr>';
    });
  $('tbPagas').innerHTML = h2;

  // ---- contas fixas
  var fixas = DB.contasFixas || [];
  var h3 = '<tr><th>Conta</th><th>Categoria</th><th class="c">Vence dia</th><th class="r">Estimado</th><th>Pagamento</th><th class="c">Ativa</th></tr>';
  if (!fixas.length) h3 += '<tr><td colspan="6" class="empty">Nenhuma conta fixa cadastrada ainda.</td></tr>';
  fixas.forEach(function(f){
    h3 += '<tr><td>'+esc(f.conta)+'</td><td class="mut">'+esc(f.categoria)+'</td>'
       + '<td class="c">'+f.dia_vencimento+'</td>'
       + '<td class="r">'+brl(f.valor_estimado)+'</td>'
       + '<td class="mut">'+esc(f.forma_pagamento)+'</td>'
       + '<td class="c">'+(f.em_uso==='Não'?'<span class="tag">não</span>':'<span class="tag pg">sim</span>')+'</td></tr>';
  });
  $('tbFixas').innerHTML = h3;

  // seletor de categoria do cadastro
  var sel=$('fCat2'), atual=sel.value;
  sel.innerHTML='';
  (DB.categorias||[]).filter(function(c){ return c.tipo!=='Entrada'; })
    .forEach(function(c){ var o=document.createElement('option'); o.value=o.textContent=c.categoria; sel.appendChild(o); });
  if (atual) sel.value = atual;
}

/* --- modal de pagamento --- */
var PAGANDO = null;

function abrirPagar(id){
  var l = DB.lancamentos.filter(function(x){ return x.id===id; })[0];
  if (!l) return;
  PAGANDO = l;
  $('pgDesc').value  = l.descricao;
  $('pgData').value  = hoje();
  $('pgValor').value = l.valor;
  msgEm('msgPag2','');
  conferirDif();
  $('modalPagar').classList.remove('hide');
  setTimeout(function(){ $('pgValor').focus(); $('pgValor').select(); }, 60);
}
function fecharPagar(){ $('modalPagar').classList.add('hide'); PAGANDO = null; }

function conferirDif(){
  if (!PAGANDO) return;
  var dif = Number($('pgValor').value||0) - Number(PAGANDO.valor||0);
  if (Math.abs(dif) < 0.005){ $('pgDif').classList.add('hide'); return; }
  $('pgDif').classList.remove('hide');
  $('pgDif').textContent = dif > 0
    ? 'Você está pagando ' + brl(dif) + ' A MAIS do que o previsto.'
    : 'Você está pagando ' + brl(-dif) + ' A MENOS do que o previsto.';
}

/* ============================================================ eventos */
$('btCfg').onclick = function(){
  if ($('pgCfg').classList.contains('hide')) {
    mostrarCfg();
  } else if (document.body.classList.contains('connected')) {
    $('pgCfg').classList.add('hide');
    $('nav').classList.remove('hide');
    $('btAbrirNovo').classList.remove('hide');
    document.body.classList.remove('configuring');
    abrirPainelAtual();
  }
};
$('btSalvarCfg').onclick = function(){
  CFG.url   = $('cfgUrl').value.trim();
  CFG.token = $('cfgTok').value.trim();
  CFG.sheet = $('cfgSheet').value.trim();
  localStorage.setItem('cc_url',CFG.url);
  localStorage.setItem('cc_tok',CFG.token);
  localStorage.setItem('cc_sheet',CFG.sheet);
  aplicarBotaoPlanilha();
  carregar();
};

function aplicarBotaoPlanilha(){
  $('btPlanilha').classList.toggle('hide', !CFG.sheet);
}
$('btPlanilha').onclick = function(){
  if (CFG.sheet) window.open(CFG.sheet, '_blank', 'noopener');
};
$('btDetalhes').onclick = function(){
  var oculto = $('detalhes').classList.toggle('hide');
  this.textContent = oculto ? '▸ mais detalhes' : '▾ menos detalhes';
  if (!oculto) renderGraficos();   // agora tem tamanho para desenhar
};

$('btRec').onclick = carregar;
$('selMes').onchange = function(){ MES = this.value; render(); };

document.querySelectorAll('#nav button[data-p]').forEach(function(b){
  b.onclick = function(){
    var mapa = { painel:'pgPainel', mov:'pgMov', inv:'pgInv' };
    var destino = mapa[b.dataset.p];
    if (!destino || !$(destino)) {
      aviso('Não foi possível abrir esta tela. Atualize a página para carregar a versão mais recente.','e');
      return;
    }
    document.querySelectorAll('#nav button').forEach(function(x){ x.classList.remove('on'); });
    b.classList.add('on');
    document.querySelectorAll('.pg').forEach(function(p){ p.classList.add('hide'); });
    $(destino).classList.remove('hide');
    $('pgCfg').classList.add('hide');
    document.body.classList.remove('configuring');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
});

document.querySelectorAll('.mov-tabs button[data-mov]').forEach(function(b){
  b.onclick = function(){
    var mapa = { contas:'movContas', historico:'movHistorico', recorrentes:'movRecorrentes' };
    document.querySelectorAll('.mov-tabs button[data-mov]').forEach(function(x){ x.classList.remove('on'); });
    document.querySelectorAll('.mov-section').forEach(function(x){ x.classList.add('hide'); });
    b.classList.add('on');
    $(mapa[b.dataset.mov]).classList.remove('hide');
    if (b.dataset.mov === 'historico') renderLancamentos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
});

$('tbCat').addEventListener('change', function(ev){
  var cat = ev.target.dataset && ev.target.dataset.orc;
  if (cat) salvarOrcamentoDe(cat, ev.target.value);
});

['fBusca','fTipo','fCat','fForma','fPago'].forEach(function(id){
  $(id).addEventListener('input', renderLancamentos);
});

$('tbLanc').addEventListener('click', function(ev){
  var tr = ev.target.closest && ev.target.closest('tr[data-edit]');
  if (tr) abrirNovo(tr.dataset.edit);
});

// formulário
$('nTipo').onchange = function(){
  var lista = this.value==='Entrada' ? window._catsEntrada : window._catsSaida;
  var s=$('nCat'); s.innerHTML='';
  lista.forEach(function(c){ var o=document.createElement('option'); o.value=o.textContent=c.categoria; s.appendChild(o); });
};
$('nForma').onchange = function(){
  $('wrapCartao').classList.toggle('hide', this.value!=='Crédito');
};
$('nData').onchange = function(){
  if (!this.value) return;
  preencherMeses($('nComp'), this.value.slice(0,7));
  if (!$('nVenc').value) $('nVenc').value = this.value;   // vencimento acompanha a data, se vazio
};
function atualizaPrevia(){
  var n = Math.max(1, parseInt($('nParc').value||1,10));
  $('wrapModo').classList.toggle('hide', n<=1);
  if (n<=1){ $('previa').classList.add('hide'); return; }
  var v = Number($('nValor').value||0);
  var vp = $('nModo').value==='total' ? v/n : v;
  var c = $('nComp').value || hoje().slice(0,7);
  $('previa').classList.remove('hide');
  $('previa').textContent = 'Vou criar ' + n + ' linhas de ' + brl(vp) + ' (total ' + brl(vp*n) + '), de '
    + nomeMes(c) + ' até ' + nomeMes(somaMes(c,n-1)) + '.';
}
['nParc','nValor','nModo','nComp'].forEach(function(id){ $(id).addEventListener('input',atualizaPrevia); });

$('btSalvarLanc').onclick = function(){
  var d = {
    acao: EDITANDO ? 'atualizar' : 'inserir',
    dados:{
      data: $('nData').value,
      competencia: $('nComp').value.trim(),
      vencimento: $('nVenc').value || $('nData').value,
      tipo: $('nTipo').value,
      descricao: $('nDesc').value.trim(),
      categoria: $('nCat').value,
      forma_pagamento: $('nForma').value,
      cartao: $('nForma').value==='Crédito' ? $('nCartao').value : '',
      valor: Number($('nValor').value),
      parcelas_total: Math.max(1, parseInt($('nParc').value||1,10)),
      valor_total_informado: $('nModo').value==='total',
      pago: $('nPago').value,
      obs: $('nObs').value.trim()
    }
  };
  if (!d.dados.data || !d.dados.descricao || !d.dados.valor){
    msgEm('msgNovo','Preencha ao menos data, descrição e valor.','e'); return;
  }
  if (!/^\d{4}-\d{2}$/.test(d.dados.competencia)) d.dados.competencia = d.dados.data.slice(0,7);

  if (EDITANDO){
    // na edição a API recebe os campos soltos, com o id
    var e = d.dados; e.id = EDITANDO.id;
    e.grupo = (DB.categorias.filter(function(c){ return c.categoria===e.categoria; })[0]||{}).grupo || '';
    delete e.parcelas_total; delete e.valor_total_informado;
    d = { acao:'atualizar', dados:e };
  }

  this.disabled = true; this.textContent = 'Salvando…';
  var bt = this, editava = !!EDITANDO;
  apiPost(d).then(function(r){
    if (!r.ok) throw new Error(r.erro);
    fecharNovo();
    aviso(editava ? 'Lançamento atualizado.'
      : (r.inseridas + (r.inseridas > 1 ? ' lançamentos gravados' : ' lançamento gravado')
         + ' na planilha.'), 's');
    $('nDesc').value=''; $('nValor').value=''; $('nObs').value=''; $('nParc').value=1; $('nVenc').value='';
    atualizaPrevia(); carregar();
  }).catch(function(e){ msgEm('msgNovo','Erro: '+e.message,'e'); })
    .then(function(){ bt.disabled=false; bt.textContent = editava ? 'Salvar alterações' : 'Lançar'; });
};

$('btExcluirLanc').onclick = function(){
  if (!EDITANDO) return;
  if (!confirm('Excluir "'+EDITANDO.descricao+'" definitivamente?')) return;
  var id = EDITANDO.id;
  apiPost({ acao:'excluir', id:id }).then(function(r){
    if(!r.ok) throw new Error(r.erro);
    fecharNovo(); aviso('Lançamento excluído.','s'); carregar();
  }).catch(function(e){ msgEm('msgNovo','Erro ao excluir: '+e.message,'e'); });
};

/* --- modal de novo lançamento --- */

var EDITANDO = null;

/** Abre o modal. Com id, entra em modo edição e preenche tudo. */
function abrirNovo(id){
  msgEm('msgNovo','');
  EDITANDO = id ? (DB.lancamentos.filter(function(l){ return l.id===id; })[0] || null) : null;

  if (EDITANDO){
    var l = EDITANDO;
    $('tituloNovo').textContent  = 'Editar lançamento';
    $('btSalvarLanc').textContent = 'Salvar alterações';
    $('wrapParc').classList.add('hide');        // editar mexe nesta linha, não recria parcelas
    $('previa').classList.add('hide');
    $('btExcluirLanc').classList.remove('hide');

    $('nTipo').value = l.tipo;  $('nTipo').onchange();
    $('nData').value = String(l.data).slice(0,10);
    $('nVenc').value = String(l.vencimento || l.data).slice(0,10);
    preencherMeses($('nComp'), l.competencia);
    $('nDesc').value  = l.descricao;
    $('nCat').value   = l.categoria;
    $('nForma').value = l.forma_pagamento; $('nForma').onchange();
    if (l.cartao) $('nCartao').value = l.cartao;
    $('nValor').value = l.valor;
    $('nParc').value  = 1;
    $('nPago').value  = String(l.pago)==='Sim' ? 'Sim' : 'Não';
    $('nObs').value   = l.obs || '';
  } else {
    $('tituloNovo').textContent   = 'Novo lançamento';
    $('btSalvarLanc').textContent = 'Lançar';
    $('wrapParc').classList.remove('hide');
    $('btExcluirLanc').classList.add('hide');
    if (!$('nData').value) $('nData').value = hoje();
    if (!$('nVenc').value) $('nVenc').value = $('nData').value;
    preencherMeses($('nComp'), MES || hoje().slice(0,7));
    atualizaPrevia();
  }
  $('modalNovo').classList.remove('hide');
  setTimeout(function(){ $('nDesc').focus(); }, 60);
}
function fecharNovo(){ $('modalNovo').classList.add('hide'); EDITANDO = null; }

$('btAbrirNovo').onclick    = abrirNovo;
$('btFecharNovo').onclick   = fecharNovo;
$('btCancelarNovo').onclick = fecharNovo;

// clicar no fundo escuro fecha
$('modalNovo').addEventListener('click', function(ev){
  if (ev.target === this) fecharNovo();
});

document.addEventListener('keydown', function(ev){
  if (ev.key === 'Escape'){
    if (!$('modalNovo').classList.contains('hide'))  fecharNovo();
    if (!$('modalPagar').classList.contains('hide')) fecharPagar();
    ['modalAporte','modalSaldo','modalAtivo'].forEach(function(id){
      if (!$(id).classList.contains('hide')) fecharModal(id);
    });
  }
  // Enter dentro do modal salva, exceto se o foco estiver num select
  if (ev.key === 'Enter' && !$('modalNovo').classList.contains('hide')
      && ev.target.tagName === 'INPUT') {
    ev.preventDefault(); $('btSalvarLanc').click();
  }
});


/* --- investimentos: eventos --- */

document.querySelectorAll('.sub button[data-sub]').forEach(function(b){
  b.onclick = function(){
    document.querySelectorAll('.sub button').forEach(function(x){ x.classList.remove('on'); });
    b.classList.add('on');
    ['subSim','subCart','subReg'].forEach(function(id){ $(id).classList.add('hide'); });
    $({ sim:'subSim', cart:'subCart', reg:'subReg' }[b.dataset.sub]).classList.remove('hide');
  };
});

['sIni','sApt','sAnos','sTaxa','sCres','sCDI','sIPCA','sModo','sIR','sReal'].forEach(function(id){
  $(id).addEventListener('input', renderSimulador);
  $(id).addEventListener('change', renderSimulador);
});

$('btAporte').onclick = function(){
  var d = { acao:'inv_lancar', dados:{
    data: $('rData').value, ativo: $('rAtivo').value, tipo: $('rTipo').value,
    valor: Number($('rValor').value), obs: $('rObs').value.trim() } };
  if (!d.dados.data || !d.dados.ativo || !d.dados.valor){
    msgEm('msgApt','Preencha ativo, data e valor.','e'); return;
  }
  var bt=this; bt.disabled=true; bt.textContent='Salvando…';
  apiPost(d).then(function(r){
    if(!r.ok) throw new Error(r.erro);
    fecharModal('modalAporte');
    aviso(d.dados.tipo+' de '+brl(d.dados.valor)+' registrado em '+esc(d.dados.ativo)+'.','s');
    $('rValor').value=''; $('rObs').value='';
    carregar();
  }).catch(function(e){ msgEm('msgApt','Erro: '+e.message,'e'); })
    .then(function(){ bt.disabled=false; bt.textContent='Registrar'; });
};

$('btSaldo').onclick = function(){
  var comp = $('sdComp').value.trim();
  if (!/^\d{4}-\d{2}$/.test(comp)){ msgEm('msgSld','Competência precisa estar no formato 2026-07.','e'); return; }
  var d = { acao:'inv_saldo', dados:{
    competencia: comp, ativo: $('sdAtivo').value, saldo: Number($('sdValor').value) } };
  if (!d.dados.ativo || isNaN(d.dados.saldo)){ msgEm('msgSld','Escolha o ativo e informe o saldo.','e'); return; }
  var bt=this; bt.disabled=true; bt.textContent='Salvando…';
  apiPost(d).then(function(r){
    if(!r.ok) throw new Error(r.erro);
    fecharModal('modalSaldo');
    aviso(r.atualizado ? 'Saldo corrigido para esse mês.' : 'Saldo registrado.','s');
    $('sdValor').value='';
    carregar();
  }).catch(function(e){ msgEm('msgSld','Erro: '+e.message,'e'); })
    .then(function(){ bt.disabled=false; bt.textContent='Registrar saldo'; });
};

$('btAtivo').onclick = function(){
  var d = { acao:'inv_ativo', dados:{
    ativo: $('aNome').value.trim(), classe: $('aClasse').value.trim() || 'Outros',
    indexador: $('aIdx').value, taxa: Number($('aTaxa').value||0),
    instituicao: $('aInst').value.trim(), vencimento: $('aVenc').value, liquidez: '' } };
  if (!d.dados.ativo){ msgEm('msgAtv','Dê um nome ao ativo.','e'); return; }
  var bt=this; bt.disabled=true; bt.textContent='Salvando…';
  apiPost(d).then(function(r){
    if(!r.ok) throw new Error(r.erro);
    fecharModal('modalAtivo');
    aviso(r.atualizado ? 'Ativo atualizado.' : 'Ativo cadastrado.','s');
    $('aNome').value=''; $('aTaxa').value=''; $('aInst').value='';
    carregar();
  }).catch(function(e){ msgEm('msgAtv','Erro: '+e.message,'e'); })
    .then(function(){ bt.disabled=false; bt.textContent='Cadastrar ativo'; });
};

$('tbMov').addEventListener('click', function(ev){
  var id = ev.target.dataset && ev.target.dataset.delinv;
  if (!id) return;
  if (!confirm('Excluir esta movimentação?')) return;
  apiPost({ acao:'inv_excluir', aba:'investimentos', id:id }).then(function(r){
    if(!r.ok) throw new Error(r.erro);
    carregar();
  }).catch(function(e){ aviso('Erro ao excluir: '+e.message,'e'); });
});


/* --- modais de investimento --- */

function abrirModal(id){
  $(id).classList.remove('hide');
  if (id==='modalAporte' && !$('rData').value) $('rData').value = hoje();
  if (id==='modalSaldo')  preencherMeses($('sdComp'), MES || hoje().slice(0,7));
}
function fecharModal(id){ $(id).classList.add('hide'); }

$('btAbrirAporte').onclick = function(){ msgEm('msgApt',''); abrirModal('modalAporte'); };
$('btAbrirSaldo').onclick  = function(){ msgEm('msgSld',''); abrirModal('modalSaldo'); };
$('btAbrirAtivo').onclick  = function(){ msgEm('msgAtv',''); abrirModal('modalAtivo'); };

document.querySelectorAll('[data-fecha]').forEach(function(b){
  b.onclick = function(){ fecharModal(b.dataset.fecha); };
});
['modalAporte','modalSaldo','modalAtivo'].forEach(function(id){
  $(id).addEventListener('click', function(ev){ if (ev.target === this) fecharModal(id); });
});

/* --- contas a pagar: eventos --- */

document.querySelectorAll('.sub button[data-esc]').forEach(function(b){
  b.onclick = function(){
    document.querySelectorAll('.sub button[data-esc]').forEach(function(x){ x.classList.remove('on'); });
    b.classList.add('on');
    ESCOPO = b.dataset.esc;
    renderContasAPagar();
  };
});

$('tbPagar').addEventListener('click', function(ev){
  var id = ev.target.dataset && ev.target.dataset.pagar;
  if (id) abrirPagar(id);
});

$('tbPagas').addEventListener('click', function(ev){
  var id = ev.target.dataset && ev.target.dataset.desfazer;
  if (!id) return;
  if (!confirm('Desfazer o pagamento? A conta volta para "em aberto" e a data e o valor pagos são apagados.')) return;
  apiPost({ acao:'desfazer_pag', id:id }).then(function(r){
    if(!r.ok) throw new Error(r.erro);
    aviso('Pagamento desfeito.','s'); carregar();
  }).catch(function(e){ aviso('Erro: '+e.message,'e'); });
});

$('btFecharPagar').onclick  = fecharPagar;
$('btCancelarPag').onclick  = fecharPagar;
$('modalPagar').addEventListener('click', function(ev){ if (ev.target === this) fecharPagar(); });
$('pgValor').addEventListener('input', conferirDif);

$('btConfirmarPag').onclick = function(){
  if (!PAGANDO) return;
  var d = { acao:'pagar', dados:{
    id: PAGANDO.id,
    data_pagamento: $('pgData').value,
    valor_pago: Number($('pgValor').value)
  }};
  if (!d.dados.data_pagamento || isNaN(d.dados.valor_pago)){
    msgEm('msgPag2','Informe a data e o valor pagos.','e'); return;
  }
  var bt=this; bt.disabled=true; bt.textContent='Salvando…';
  apiPost(d).then(function(r){
    if(!r.ok) throw new Error(r.erro);
    var nome = PAGANDO.descricao;
    fecharPagar();
    aviso(nome + ' quitada: ' + brl(r.valor_pago) + ' em ' + dataBR(d.dados.data_pagamento) + '.', 's');
    carregar();
  }).catch(function(e){ msgEm('msgPag2','Erro: '+e.message,'e'); })
    .then(function(){ bt.disabled=false; bt.textContent='Confirmar pagamento'; });
};

$('btSalvarFixa').onclick = function(){
  var d = { acao:'conta_fixa', dados:{
    conta: $('fNome').value.trim(),
    categoria: $('fCat2').value,
    forma_pagamento: $('fForma2').value,
    dia_vencimento: Math.min(31, Math.max(1, parseInt($('fDia').value||1,10))),
    valor_estimado: Number($('fValor').value||0)
  }};
  if (!d.dados.conta){ msgEm('msgFixa','Dê um nome à conta.','e'); return; }
  var bt=this; bt.disabled=true; bt.textContent='Salvando…';
  apiPost(d).then(function(r){
    if(!r.ok) throw new Error(r.erro);
    msgEm('msgFixa', r.atualizado ? 'Conta fixa atualizada.' : 'Conta fixa cadastrada.','s');
    $('fNome').value=''; $('fValor').value='';
    carregar();
  }).catch(function(e){ msgEm('msgFixa','Erro: '+e.message,'e'); })
    .then(function(){ bt.disabled=false; bt.textContent='Cadastrar conta fixa'; });
};

$('btGerar').onclick = function(){
  if (!confirm('Gerar as contas fixas de ' + nomeMes(MES) + '? As que já existirem nesse mês serão puladas.')) return;
  var bt=this; bt.disabled=true; bt.textContent='Gerando…';
  apiPost({ acao:'gerar_contas', competencia: MES }).then(function(r){
    if(!r.ok) throw new Error(r.erro);
    aviso(r.criadas + ' conta(s) criada(s) em ' + nomeMes(MES)
          + (r.puladas ? ' · ' + r.puladas + ' já existia(m) e foram puladas' : '')
          + (r.motivo ? ' — ' + r.motivo : ''), r.criadas ? 's' : 'i');
    carregar();
  }).catch(function(e){ aviso('Erro ao gerar: '+e.message,'e'); })
    .then(function(){ bt.disabled=false; bt.textContent='Gerar contas de '+nomeMes(MES); });
};

/* ============================================================ início */
$('nData').value = hoje();
$('nVenc').value = hoje();
$('rData').value = hoje();
preencherMeses($('nComp'), hoje().slice(0,7));
preencherMeses($('sdComp'), hoje().slice(0,7));
aplicarBotaoPlanilha();
renderSimulador();
carregar();
