var TABS=[["panel","Panel"],["prod","Productos"],["mov","Movimientos"],["rep","Reportes"]],tab="panel",S,msg=null;
var TODAY=new Date();TODAY.setHours(0,0,0,0);
function iso(n){var d=new Date(TODAY);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
function seed(){var c={"Leche evaporada":["Lácteos",60],"Yogur natural":["Lácteos",30],"Pan de molde":["Panadería",20],"Arroz":["Granos",200],"Atún en lata":["Conservas",100],"Fideos":["Granos",100],"Aceite vegetal":["Aceites",40],"Manzana":["Frutas",80],"Papa":["Tubérculos",100],"Galletas":["Snacks",60],"Jugo de naranja":["Bebidas",50]};
var L=[["Leche evaporada","L-2411",120,5,"A-01"],["Leche evaporada","L-2412",90,40,"A-02"],["Yogur natural","Y-0932",60,3,"F-01"],["Pan de molde","P-5521",40,2,"B-03"],["Arroz","AR-118",500,300,"C-04"],["Atún en lata","AT-771",300,420,"C-07"],["Fideos","FD-310",80,200,"C-05"],["Aceite vegetal","AV-204",25,150,"D-02"],["Manzana","MZ-056",200,9,"F-03"],["Papa","PP-412",350,14,"E-01"],["Galletas","GL-640",150,60,"B-01"],["Jugo de naranja","JN-087",30,-2,"G-02"]];
return{cat:c,role:"Administrador",lots:L.map(function(x,i){return{id:i+1,name:x[0],lot:x[1],qty:x[2],ing:iso(-20),exp:iso(x[3]),loc:x[4]}}),movs:[],next:13}}
function load(){try{var r=localStorage.getItem("sgial");if(r){S=JSON.parse(r);return}}catch(e){}S=seed()}
function save(){try{localStorage.setItem("sgial",JSON.stringify(S))}catch(e){}}
function dl(l){return Math.round((new Date(l.exp+"T00:00:00")-TODAY)/864e5)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function est(l){var d=dl(l);return d<0?["Vencido","crit"]:d<=7?["Crítico","crit"]:d<=30?["Por vencer","warn"]:["Vigente","ok"]}
function tag(e){return '<span class="tag t-'+e[1]+'">'+e[0]+'</span>'}
function total(n,onlyValid){return S.lots.filter(function(l){return l.name===n&&(!onlyValid||dl(l)>=0)}).reduce(function(a,l){return a+l.qty},0)}
function fefo(n){return S.lots.filter(function(l){return l.name===n&&l.qty>0&&dl(l)>=0}).sort(function(a,b){return a.exp<b.exp?-1:1})}
function alerts(){var a=[];S.lots.filter(function(l){return l.qty>0}).forEach(function(l){var d=dl(l);
if(d<0)a.push(["crit",l.name+" (lote "+l.lot+") está vencido desde hace "+(-d)+" día(s). Retirar del despacho."]);
else if(d<=7)a.push(["crit",l.name+" (lote "+l.lot+") vence en "+d+" día(s). Despachar primero."]);
else if(d<=30)a.push(["warn",l.name+" (lote "+l.lot+") vence en "+d+" días."])});
Object.keys(S.cat).forEach(function(n){var t=total(n,true),m=S.cat[n][1];if(t<m)a.push([t<m/2?"crit":"warn","Stock bajo de "+n+": "+t+" unidades disponibles, mínimo "+m+"."])});
return a.sort(function(x,y){return x[0]==="crit"?-1:1})}
function setMsg(t,k){msg={t:t,k:k}}
function mbox(){var h=msg?'<div class="msg '+msg.k+'" role="status">'+msg.t+'</div>':"";msg=null;return h}
function panel(){var al=alerts(),crit=al.filter(function(a){return a[0]==="crit"}).length,q=S.lots.filter(function(l){return l.qty>0&&dl(l)>=0}).sort(function(a,b){return a.exp<b.exp?-1:1}).slice(0,6);
var h='<h2>Panel principal</h2><p class="sub">Resumen del inventario y alertas logísticas del día.</p><div class="kpis">'+
'<div class="kpi"><b>'+S.lots.filter(function(l){return l.qty>0}).length+'</b><span>Lotes en almacén</span></div>'+
'<div class="kpi"><b>'+S.lots.reduce(function(a,l){return a+l.qty},0)+'</b><span>Unidades totales</span></div>'+
'<div class="kpi"><b style="color:var(--crit)">'+crit+'</b><span>Alertas críticas</span></div>'+
'<div class="kpi"><b>'+al.length+'</b><span>Alertas en total</span></div></div><div class="cols"><div class="card"><h3>Despachar primero (FEFO)</h3><p class="sub" style="margin-bottom:4px">Lotes ordenados por fecha de vencimiento más cercana.</p>';
q.forEach(function(l,i){var d=dl(l),e=est(l),w=Math.max(6,Math.min(100,100-d*100/60));h+='<div class="q"><div class="rank">'+(i+1)+'</div><div><b>'+esc(l.name)+'</b> · lote '+esc(l.lot)+' · '+l.qty+' u. · '+esc(l.loc)+'<div class="bar"><i style="width:'+w+'%;background:var(--'+(e[1]==="ok"?"ok":e[1]==="warn"?"warn":"crit")+')"></i></div></div><div>'+tag(e)+'<div style="font-size:12px;color:var(--mut);text-align:right">'+d+' d</div></div></div>'});
h+='</div><div class="card"><h3>Alertas</h3>';
h+=al.length?al.map(function(a){return '<div class="al '+a[0]+'">'+(a[0]==="crit"?"⛔":"⚠️")+'<span>'+esc(a[1])+'</span></div>'}).join(""):'<p class="empty">No hay alertas. El inventario está en orden.</p>';
return h+'</div></div>'}
function prod(){var adm=S.role==="Administrador",h='<h2>Productos y lotes</h2><p class="sub">Registro de productos con los datos de trazabilidad.</p>';
if(adm){h+='<div class="card noprint"><h3>Registrar producto o lote</h3><form id="fp"><label>Producto<input name="name" list="dn" required></label><datalist id="dn">'+Object.keys(S.cat).map(function(n){return '<option value="'+esc(n)+'">'}).join("")+'</datalist><label>Categoría<input name="cat" required></label><label>Lote<input name="lot" required></label><label>Cantidad<input name="qty" type="number" min="1" required></label><label>Fecha de vencimiento<input name="exp" type="date" required></label><label>Ubicación<input name="loc" placeholder="A-01" required></label><label>Stock mínimo<input name="min" type="number" min="0" value="50"></label><button class="btn">Guardar producto</button></form>'+mbox()+'</div>'}
else h+='<p class="sub">Tu rol (Operador) puede consultar productos, pero solo el Administrador puede registrar nuevos.</p>'+mbox();
h+='<div class="card scroll"><table><thead><tr><th>Producto</th><th>Categoría</th><th>Lote</th><th class="n">Cant.</th><th>Ingreso</th><th>Vence</th><th>Ubicación</th><th>Estado</th></tr></thead><tbody>';
S.lots.slice().sort(function(a,b){return a.exp<b.exp?-1:1}).forEach(function(l){h+='<tr><td>'+esc(l.name)+'</td><td>'+esc(S.cat[l.name][0])+'</td><td>'+esc(l.lot)+'</td><td class="n">'+l.qty+'</td><td>'+l.ing+'</td><td>'+l.exp+'</td><td>'+esc(l.loc)+'</td><td>'+tag(est(l))+'</td></tr>'});
return h+'</tbody></table></div>'}
function mov(){var h='<h2>Movimientos</h2><p class="sub">Las salidas descuentan automáticamente del lote que vence primero (FEFO).</p>'+mbox()+'<div class="cols"><div class="card"><h3>Registrar salida (despacho)</h3><form id="fs"><label>Producto<select name="name">'+Object.keys(S.cat).map(function(n){return '<option value="'+esc(n)+'">'+esc(n)+' ('+total(n,true)+' disp.)</option>'}).join("")+'</select></label><label>Cantidad<input name="qty" type="number" min="1" required></label><label>Destino<input name="dest" placeholder="Comedor Santa Rosa" required></label><button class="btn">Registrar salida</button></form></div>'+
'<div class="card"><h3>Registrar entrada (donación)</h3><form id="fe"><label>Lote<select name="id">'+S.lots.map(function(l){return '<option value="'+l.id+'">'+esc(l.name)+' · '+esc(l.lot)+'</option>'}).join("")+'</select></label><label>Cantidad<input name="qty" type="number" min="1" required></label><label>Origen<input name="dest" placeholder="Supermercado donante" required></label><button class="btn">Registrar entrada</button></form></div></div>'+
'<div class="card scroll"><h3>Historial</h3>'+(S.movs.length?'<table><thead><tr><th>Fecha</th><th>Tipo</th><th>Producto</th><th>Lote</th><th class="n">Cant.</th><th>Destino / origen</th></tr></thead><tbody>'+S.movs.slice().reverse().map(function(m){return '<tr><td>'+m.f+'</td><td>'+m.t+'</td><td>'+esc(m.n)+'</td><td>'+esc(m.l)+'</td><td class="n">'+m.q+'</td><td>'+esc(m.d)+'</td></tr>'}).join("")+'</tbody></table>':'<p class="empty">Aún no hay movimientos. Registra una entrada o una salida.</p>')+'</div>';return h}
function rep(){var h='<h2>Reportes</h2><p class="sub">Vista de consulta para decisiones logísticas.</p><p class="noprint"><button class="btn sec" id="pr">Imprimir reporte</button></p><div class="card scroll"><h3>Existencias por producto</h3><table><thead><tr><th>Producto</th><th class="n">Disponible</th><th class="n">Mínimo</th><th>Estado</th></tr></thead><tbody>';
Object.keys(S.cat).forEach(function(n){var t=total(n,true),m=S.cat[n][1];h+='<tr><td>'+esc(n)+'</td><td class="n">'+t+'</td><td class="n">'+m+'</td><td>'+(t<m?tag(["Stock bajo","warn"]):tag(["Suficiente","ok"]))+'</td></tr>'});
h+='</tbody></table></div><div class="card scroll"><h3>Productos próximos a vencer (30 días o menos)</h3>';
var p=S.lots.filter(function(l){return l.qty>0&&dl(l)<=30}).sort(function(a,b){return a.exp<b.exp?-1:1});
h+=p.length?'<table><thead><tr><th>Producto</th><th>Lote</th><th class="n">Cant.</th><th>Vence</th><th class="n">Días</th><th>Estado</th></tr></thead><tbody>'+p.map(function(l){return '<tr><td>'+esc(l.name)+'</td><td>'+esc(l.lot)+'</td><td class="n">'+l.qty+'</td><td>'+l.exp+'</td><td class="n">'+dl(l)+'</td><td>'+tag(est(l))+'</td></tr>'}).join("")+'</tbody></table>':'<p class="empty">No hay lotes próximos a vencer.</p>';
var e=S.movs.filter(function(m){return m.t==="Entrada"}).reduce(function(a,m){return a+m.q},0),s=S.movs.filter(function(m){return m.t==="Salida"}).reduce(function(a,m){return a+m.q},0);
return h+'</div><div class="card"><h3>Resumen de movimientos</h3><p>Entradas registradas: <b>'+e+'</b> u. · Salidas registradas: <b>'+s+'</b> u.</p><button class="btn sec noprint" id="rs">Restablecer datos de prueba</button></div>'}
function render(){$n();var v={panel:panel,prod:prod,mov:mov,rep:rep}[tab]();document.getElementById("app").innerHTML=v;bind()}
function $n(){document.getElementById("nav").innerHTML=TABS.map(function(t){return '<button role="tab" data-t="'+t[0]+'" aria-selected="'+(t[0]===tab)+'">'+t[1]+'</button>'}).join("")}
function fd(f){var o={};new FormData(f).forEach(function(v,k){o[k]=v});return o}
function bind(){
var a=document.getElementById("fp");if(a)a.onsubmit=function(e){e.preventDefault();var o=fd(a),n=o.name.trim();
if(new Date(o.exp+"T00:00:00")<TODAY){setMsg("La fecha de vencimiento no puede ser anterior a hoy. Revisa la fecha.","err");return render()}
if(S.lots.some(function(l){return l.name===n&&l.lot===o.lot.trim()})){setMsg("Ese lote ya existe para este producto. Usa otro código o registra una entrada.","err");return render()}
if(!S.cat[n])S.cat[n]=[o.cat.trim(),+o.min||0];
S.lots.push({id:S.next++,name:n,lot:o.lot.trim(),qty:+o.qty,ing:iso(0),exp:o.exp,loc:o.loc.trim()});
S.movs.push({f:iso(0),t:"Entrada",n:n,l:o.lot.trim(),q:+o.qty,d:"Registro inicial"});save();setMsg("Producto guardado: "+esc(n)+", lote "+esc(o.lot)+".","ok");render()};
var s=document.getElementById("fs");if(s)s.onsubmit=function(e){e.preventDefault();var o=fd(s),q=+o.qty,n=o.name,av=total(n,true);
if(q>av){setMsg("No hay stock suficiente de "+esc(n)+": disponibles "+av+" u. (los lotes vencidos no se despachan).","err");return render()}
var r=q,used=[];fefo(n).forEach(function(l){if(r<=0)return;var t=Math.min(l.qty,r);l.qty-=t;r-=t;used.push(t+" u. del lote "+l.lot+" (vence "+l.exp+")");S.movs.push({f:iso(0),t:"Salida",n:n,l:l.lot,q:t,d:o.dest.trim()})});
save();setMsg("Salida registrada por FEFO: "+esc(used.join(", "))+".","ok");render()};
var i=document.getElementById("fe");if(i)i.onsubmit=function(e){e.preventDefault();var o=fd(i),l=S.lots.filter(function(x){return x.id==o.id})[0];
l.qty+=+o.qty;S.movs.push({f:iso(0),t:"Entrada",n:l.name,l:l.lot,q:+o.qty,d:o.dest.trim()});save();setMsg("Entrada registrada: +"+o.qty+" u. en "+esc(l.name)+", lote "+esc(l.lot)+".","ok");render()};
var p=document.getElementById("pr");if(p)p.onclick=function(){window.print()};
var r=document.getElementById("rs");if(r)r.onclick=function(){S=seed();save();setMsg("Datos de prueba restablecidos.","ok");tab="panel";render()}}
document.getElementById("nav").addEventListener("click",function(e){var t=e.target.getAttribute("data-t");if(t){tab=t;render()}});
document.getElementById("role").addEventListener("change",function(e){S.role=e.target.value;save();render()});
load();document.getElementById("role").value=S.role;render();
