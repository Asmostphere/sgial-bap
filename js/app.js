var TABS = [
    ["panelPrincipal", "Panel", ["Administrador", "Operador"]],
    ["productos", "Productos", ["Administrador", "Operador"]],
    ["movimientos", "Movimientos", ["Administrador", "Operador"]],
    ["reportes", "Reportes", ["Administrador"]],
    ["usuarios", "Usuarios", ["Administrador"]],
  ],
  tab = "panelPrincipal",
  estado,
  msg = null;
var hoy = new Date();
hoy.setHours(0, 0, 0, 0);
function fechaISO(n) {
  var d = new Date(hoy);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
// Crea los productos y lotes de ejemplo (fechas relativas a hoy)
function crearDatosDePrueba() {
  var c = {
    "Leche evaporada": ["Lácteos", 60],
    "Yogur natural": ["Lácteos", 30],
    "Pan de molde": ["Panadería", 20],
    Arroz: ["Granos", 200],
    "Atún en lata": ["Conservas", 100],
    Fideos: ["Granos", 100],
    "Aceite vegetal": ["Aceites", 40],
    Manzana: ["Frutas", 80],
    Papa: ["Tubérculos", 100],
    Galletas: ["Snacks", 60],
    "Jugo de naranja": ["Bebidas", 50],
  };
  var L = [
    ["Leche evaporada", "L-2411", 120, 5, "A-01"],
    ["Leche evaporada", "L-2412", 90, 40, "A-02"],
    ["Yogur natural", "Y-0932", 60, 3, "F-01"],
    ["Pan de molde", "P-5521", 40, 2, "B-03"],
    ["Arroz", "AR-118", 500, 300, "C-04"],
    ["Atún en lata", "AT-771", 300, 420, "C-07"],
    ["Fideos", "FD-310", 80, 200, "C-05"],
    ["Aceite vegetal", "AV-204", 25, 150, "D-02"],
    ["Manzana", "MZ-056", 200, 9, "F-03"],
    ["Papa", "PP-412", 350, 14, "E-01"],
    ["Galletas", "GL-640", 150, 60, "B-01"],
    ["Jugo de naranja", "JN-087", 30, -2, "G-02"],
  ];
  return {
    cat: c,
    role: "Administrador",
    lots: L.map(function (x, i) {
      return {
        id: i + 1,
        name: x[0],
        lot: x[1],
        qty: x[2],
        ing: fechaISO(-20),
        exp: fechaISO(x[3]),
        loc: x[4],
      };
    }),
    movs: [],
    next: 13,
  };
}
// Carga los datos guardados en el navegador (localStorage)
function cargarDatos() {
  try {
    var r = localStorage.getItem("sgial");
    if (r) {
      estado = JSON.parse(r);
      return;
    }
  } catch (e) {}
  estado = crearDatosDePrueba();
}
// Guarda los datos en el navegador (localStorage)
function guardarDatos() {
  try {
    localStorage.setItem("sgial", JSON.stringify(estado));
  } catch (e) {}
}
// Días que faltan para que venza un lote (negativo = ya venció)
function diasParaVencer(l) {
  return Math.round((new Date(l.exp + "T00:00:00") - hoy) / 864e5);
}
function escapar(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}
// Estado del lote: Vencido, Crítico (7 días o menos), Por vencer (30 o menos) o Vigente
function estadoDelLote(l) {
  var d = diasParaVencer(l);
  return d < 0
    ? ["Vencido", "crit"]
    : d <= 7
      ? ["Crítico", "crit"]
      : d <= 30
        ? ["Por vencer", "warn"]
        : ["Vigente", "ok"];
}
function tag(e) {
  return '<span class="tag t-' + e[1] + '">' + e[0] + "</span>";
}
function total(n, onlyValid) {
  return estado.lots
    .filter(function (l) {
      return l.name === n && (!onlyValid || diasParaVencer(l) >= 0);
    })
    .reduce(function (a, l) {
      return a + l.qty;
    }, 0);
}
// FEFO: lotes vigentes del producto, el que vence primero va primero
function lotesPorFefo(n) {
  return estado.lots
    .filter(function (l) {
      return l.name === n && l.qty > 0 && diasParaVencer(l) >= 0;
    })
    .sort(function (a, b) {
      return a.exp < b.exp ? -1 : 1;
    });
}
// Alertas por vencimiento y por stock bajo
function generarAlertas() {
  var a = [];
  estado.lots
    .filter(function (l) {
      return l.qty > 0;
    })
    .forEach(function (l) {
      var d = diasParaVencer(l);
      if (d < 0)
        a.push([
          "crit",
          l.name +
            " (lote " +
            l.lot +
            ") está vencido desde hace " +
            -d +
            " día(s). Retirar del despacho.",
        ]);
      else if (d <= 7)
        a.push([
          "crit",
          l.name +
            " (lote " +
            l.lot +
            ") vence en " +
            d +
            " día(s). Despachar primero.",
        ]);
      else if (d <= 30)
        a.push([
          "warn",
          l.name + " (lote " + l.lot + ") vence en " + d + " días.",
        ]);
    });
  Object.keys(estado.cat).forEach(function (n) {
    var t = total(n, true),
      m = estado.cat[n][1];
    if (t < m)
      a.push([
        t < m / 2 ? "crit" : "warn",
        "Stock bajo de " +
          n +
          ": " +
          t +
          " unidades disponibles, mínimo " +
          m +
          ".",
      ]);
  });
  return a.sort(function (x, y) {
    return x[0] === "crit" ? -1 : 1;
  });
}
function setMsg(t, k) {
  msg = { t: t, k: k };
}
function cajaDeMensaje() {
  var h = msg
    ? '<div class="msg ' + msg.k + '" role="status">' + msg.t + "</div>"
    : "";
  msg = null;
  return h;
}
// Pantalla 1: Panel principal
function panelPrincipal() {
  var al = generarAlertas(),
    crit = al.filter(function (a) {
      return a[0] === "crit";
    }).length,
    q = estado.lots
      .filter(function (l) {
        return l.qty > 0 && diasParaVencer(l) >= 0;
      })
      .sort(function (a, b) {
        return a.exp < b.exp ? -1 : 1;
      })
      .slice(0, 6);
  var h =
    '<h2>Panel principal</h2><p class="sub">Resumen del inventario y alertas logísticas del día.</p><div class="kpis">' +
    '<div class="kpi"><b>' +
    estado.lots.filter(function (l) {
      return l.qty > 0;
    }).length +
    "</b><span>Lotes en almacén</span></div>" +
    '<div class="kpi"><b>' +
    estado.lots.reduce(function (a, l) {
      return a + l.qty;
    }, 0) +
    "</b><span>Unidades totales</span></div>" +
    '<div class="kpi"><b style="color:var(--crit)">' +
    crit +
    "</b><span>Alertas críticas</span></div>" +
    '<div class="kpi"><b>' +
    al.length +
    '</b><span>Alertas en total</span></div></div><div class="cols"><div class="card"><h3>Despachar primero (FEFO)</h3><p class="sub" style="margin-bottom:4px">Lotes ordenados por fecha de vencimiento más cercana.</p>';
  q.forEach(function (l, i) {
    var d = diasParaVencer(l),
      e = estadoDelLote(l),
      w = Math.max(6, Math.min(100, 100 - (d * 100) / 60));
    h +=
      '<div class="q"><div class="rank">' +
      (i + 1) +
      "</div><div><b>" +
      escapar(l.name) +
      "</b> · lote " +
      escapar(l.lot) +
      " · " +
      l.qty +
      " u. · " +
      escapar(l.loc) +
      '<div class="bar"><i style="width:' +
      w +
      "%;background:var(--" +
      (e[1] === "ok" ? "ok" : e[1] === "warn" ? "warn" : "crit") +
      ')"></i></div></div><div>' +
      tag(e) +
      '<div style="font-size:12px;color:var(--mut);text-align:right">' +
      d +
      " d</div></div></div>";
  });
  h += '</div><div class="card"><h3>Alertas</h3>';
  h += al.length
    ? al
        .map(function (a) {
          return (
            '<div class="al ' +
            a[0] +
            '">' +
            (a[0] === "crit" ? "⛔" : "⚠️") +
            "<span>" +
            escapar(a[1]) +
            "</span></div>"
          );
        })
        .join("")
    : '<p class="empty">No hay alertas. El inventario está en orden.</p>';
  return h + "</div></div>";
}
// Pantalla 2: Productos y lotes
function productos() {
  var adm = estado.role === "Administrador",
    h =
      '<h2>Productos y lotes</h2><p class="sub">Registro de productos con los datos de trazabilidad.</p>';
  if (adm) {
    h +=
      '<div class="card noprint"><h3>Registrar producto o lote</h3><form id="fp"><label>Producto<input name="name" list="dn" required></label><datalist id="dn">' +
      Object.keys(estado.cat)
        .map(function (n) {
          return '<option value="' + escapar(n) + '">';
        })
        .join("") +
      '</datalist><label>Categoría<input name="cat" required></label><label>Lote<input name="lot" required></label><label>Cantidad<input name="qty" type="number" min="1" required></label><label>Fecha de vencimiento<input name="exp" type="date" required></label><label>Ubicación<input name="loc" placeholder="A-01" required></label><label>Stock mínimo<input name="min" type="number" min="0" value="50"></label><button class="btn">Guardar producto</button></form>' +
      cajaDeMensaje() +
      "</div>";
  } else
    h +=
      '<p class="sub">Tu rol (Operador) puede consultar productos, pero solo el Administrador puede registrar nuevos.</p>' +
      cajaDeMensaje();
  h +=
    '<div class="card scroll"><table><thead><tr><th>Producto</th><th>Categoría</th><th>Lote</th><th class="n">Cant.</th><th>Ingreso</th><th>Vence</th><th>Ubicación</th><th>Estado</th></tr></thead><tbody>';
  estado.lots
    .slice()
    .sort(function (a, b) {
      return a.exp < b.exp ? -1 : 1;
    })
    .forEach(function (l) {
      h +=
        "<tr><td>" +
        escapar(l.name) +
        "</td><td>" +
        escapar(estado.cat[l.name][0]) +
        "</td><td>" +
        escapar(l.lot) +
        '</td><td class="n">' +
        l.qty +
        "</td><td>" +
        l.ing +
        "</td><td>" +
        l.exp +
        "</td><td>" +
        escapar(l.loc) +
        "</td><td>" +
        tag(estadoDelLote(l)) +
        "</td></tr>";
    });
  return h + "</tbody></table></div>";
}
// Pantalla 3: Entradas y salidas
function movimientos() {
  var h =
    '<h2>Movimientos</h2><p class="sub">Las salidas descuentan automáticamente del lote que vence primero (FEFO).</p>' +
    cajaDeMensaje() +
    '<div class="cols"><div class="card"><h3>Registrar salida (despacho)</h3><form id="fs"><label>Producto<select name="name">' +
    Object.keys(estado.cat)
      .map(function (n) {
        return (
          '<option value="' +
          escapar(n) +
          '">' +
          escapar(n) +
          " (" +
          total(n, true) +
          " disp.)</option>"
        );
      })
      .join("") +
    '</select></label><label>Cantidad<input name="qty" type="number" min="1" required></label><label>Destino<input name="dest" placeholder="Comedor Santa Rosa" required></label><button class="btn">Registrar salida</button></form></div>' +
    '<div class="card"><h3>Registrar entrada (donación)</h3><form id="fe"><label>Lote<select name="id">' +
    estado.lots
      .map(function (l) {
        return (
          '<option value="' +
          l.id +
          '">' +
          escapar(l.name) +
          " · " +
          escapar(l.lot) +
          "</option>"
        );
      })
      .join("") +
    '</select></label><label>Cantidad<input name="qty" type="number" min="1" required></label><label>Origen<input name="dest" placeholder="Supermercado donante" required></label><button class="btn">Registrar entrada</button></form></div></div>' +
    '<div class="card scroll"><h3>Historial</h3>' +
    (estado.movs.length
      ? '<table><thead><tr><th>Fecha</th><th>Tipo</th><th>Producto</th><th>Lote</th><th class="n">Cant.</th><th>Destino / origen</th></tr></thead><tbody>' +
        estado.movs
          .slice()
          .reverse()
          .map(function (m) {
            return (
              "<tr><td>" +
              m.f +
              "</td><td>" +
              m.t +
              "</td><td>" +
              escapar(m.n) +
              "</td><td>" +
              escapar(m.l) +
              '</td><td class="n">' +
              m.q +
              "</td><td>" +
              escapar(m.d) +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table>"
      : '<p class="empty">Aún no hay movimientos. Registra una entrada o una salida.</p>') +
    "</div>";
  return h;
}
// Pantalla 4: Reportes
function reportes() {
  var h =
    '<h2>Reportes</h2><p class="sub">Vista de consulta para decisiones logísticas.</p><p class="noprint"><button class="btn sec" id="pr">Imprimir reporte</button></p><div class="card scroll"><h3>Existencias por producto</h3><table><thead><tr><th>Producto</th><th class="n">Disponible</th><th class="n">Mínimo</th><th>Estado</th></tr></thead><tbody>';
  Object.keys(estado.cat).forEach(function (n) {
    var t = total(n, true),
      m = estado.cat[n][1];
    h +=
      "<tr><td>" +
      escapar(n) +
      '</td><td class="n">' +
      t +
      '</td><td class="n">' +
      m +
      "</td><td>" +
      (t < m ? tag(["Stock bajo", "warn"]) : tag(["Suficiente", "ok"])) +
      "</td></tr>";
  });
  h +=
    '</tbody></table></div><div class="card scroll"><h3>Productos próximos a vencer (30 días o menos)</h3>';
  var p = estado.lots
    .filter(function (l) {
      return l.qty > 0 && diasParaVencer(l) <= 30;
    })
    .sort(function (a, b) {
      return a.exp < b.exp ? -1 : 1;
    });
  h += p.length
    ? '<table><thead><tr><th>Producto</th><th>Lote</th><th class="n">Cant.</th><th>Vence</th><th class="n">Días</th><th>Estado</th></tr></thead><tbody>' +
      p
        .map(function (l) {
          return (
            "<tr><td>" +
            escapar(l.name) +
            "</td><td>" +
            escapar(l.lot) +
            '</td><td class="n">' +
            l.qty +
            "</td><td>" +
            l.exp +
            '</td><td class="n">' +
            diasParaVencer(l) +
            "</td><td>" +
            tag(estadoDelLote(l)) +
            "</td></tr>"
          );
        })
        .join("") +
      "</tbody></table>"
    : '<p class="empty">No hay lotes próximos a vencer.</p>';
  var e = estado.movs
      .filter(function (m) {
        return m.t === "Entrada";
      })
      .reduce(function (a, m) {
        return a + m.q;
      }, 0),
    s = estado.movs
      .filter(function (m) {
        return m.t === "Salida";
      })
      .reduce(function (a, m) {
        return a + m.q;
      }, 0);
  return (
    h +
    '</div><div class="card"><h3>Resumen de movimientos</h3><p>Entradas registradas: <b>' +
    e +
    "</b> u. · Salidas registradas: <b>" +
    s +
    '</b> u.</p><button class="btn sec noprint" id="rs">Restablecer datos de prueba</button></div>'
  );
}
// Pantalla 5: Usuarios y permisos (solo Administrador)
function usuarios() {
  var personas = [
    ["Ana Torres", "Administrador"],
    ["Luis Quispe", "Operador"],
    ["Carla Rojas", "Operador"],
  ];
  var permisos = [
    ["Consultar panel y alertas", true, true],
    ["Consultar productos y lotes", true, true],
    ["Registrar productos y lotes", true, false],
    ["Registrar entradas y salidas", true, true],
    ["Ver reportes", true, false],
    ["Gestionar usuarios y roles", true, false],
  ];
  var h = "<h2>Usuarios y roles</h2>";
  h += '<p class="sub">Control de acceso a las funcionalidades según el rol.</p>';
  h += '<div class="card scroll"><h3>Usuarios de prueba</h3>';
  h += "<table><thead><tr><th>Nombre</th><th>Rol</th></tr></thead><tbody>";
  personas.forEach(function (p) {
    h += "<tr><td>" + p[0] + "</td><td><b>" + p[1] + "</b></td></tr>";
  });
  h += "</tbody></table></div>";
  h += '<div class="card scroll"><h3>Permisos por rol</h3>';
  h += "<table><thead><tr><th>Funcionalidad</th><th>Administrador</th><th>Operador</th></tr></thead><tbody>";
  permisos.forEach(function (p) {
    h += "<tr><td>" + p[0] + "</td>";
    h += p[1] ? '<td class="si">✔</td>' : '<td class="no">—</td>';
    h += p[2] ? '<td class="si">✔</td>' : '<td class="no">—</td>';
    h += "</tr>";
  });
  h += "</tbody></table></div>";
  return h;
}
// Dibuja la pantalla de la pestaña actual (según el rol)
function mostrarPantalla() {
  var esAdmin = estado.role === "Administrador";
  // Si la pestaña no está permitida para el rol, vuelve al panel
  var permitida = TABS.some(function (t) {
    return t[0] === tab && t[2].indexOf(estado.role) >= 0;
  });
  if (!permitida) {
    tab = "panelPrincipal";
  }
  document.body.setAttribute("data-rol", esAdmin ? "admin" : "operador");
  document.getElementById("rolInsignia").textContent = estado.role;
  document.getElementById("rolInfo").textContent = esAdmin
    ? "Acceso total: registro de productos, movimientos, reportes y usuarios."
    : "Acceso limitado: consulta de productos y registro de movimientos.";
  dibujarMenu();
  var vistas = {
    panelPrincipal: panelPrincipal,
    productos: productos,
    movimientos: movimientos,
    reportes: reportes,
    usuarios: usuarios,
  };
  document.getElementById("app").innerHTML = vistas[tab]();
  activarEventos();
}
// Dibuja el menú con las pestañas que puede ver el rol actual
function dibujarMenu() {
  var visibles = TABS.filter(function (t) {
    return t[2].indexOf(estado.role) >= 0;
  });
  document.getElementById("nav").innerHTML = visibles
    .map(function (t) {
      return (
        '<button role="tab" data-t="' +
        t[0] +
        '" aria-selected="' +
        (t[0] === tab) +
        '">' +
        t[1] +
        "</button>"
      );
    })
    .join("");
}
function datosDelFormulario(f) {
  var o = {};
  new FormData(f).forEach(function (v, k) {
    o[k] = v;
  });
  return o;
}
// Conecta los formularios y botones con su lógica (registrar, salida FEFO, entrada)
function activarEventos() {
  var a = document.getElementById("fp");
  if (a)
    a.onsubmit = function (e) {
      e.preventDefault();
      var o = datosDelFormulario(a),
        n = o.name.trim();
      if (new Date(o.exp + "T00:00:00") < hoy) {
        setMsg(
          "La fecha de vencimiento no puede ser anterior a hoy. Revisa la fecha.",
          "err",
        );
        return mostrarPantalla();
      }
      if (
        estado.lots.some(function (l) {
          return l.name === n && l.lot === o.lot.trim();
        })
      ) {
        setMsg(
          "Ese lote ya existe para este producto. Usa otro código o registra una entrada.",
          "err",
        );
        return mostrarPantalla();
      }
      if (!estado.cat[n]) estado.cat[n] = [o.cat.trim(), +o.min || 0];
      estado.lots.push({
        id: estado.next++,
        name: n,
        lot: o.lot.trim(),
        qty: +o.qty,
        ing: fechaISO(0),
        exp: o.exp,
        loc: o.loc.trim(),
      });
      estado.movs.push({
        f: fechaISO(0),
        t: "Entrada",
        n: n,
        l: o.lot.trim(),
        q: +o.qty,
        d: "Registro inicial",
      });
      guardarDatos();
      setMsg(
        "Producto guardado: " + escapar(n) + ", lote " + escapar(o.lot) + ".",
        "ok",
      );
      mostrarPantalla();
    };
  var s = document.getElementById("fs");
  if (s)
    s.onsubmit = function (e) {
      e.preventDefault();
      var o = datosDelFormulario(s),
        q = +o.qty,
        n = o.name,
        av = total(n, true);
      if (q > av) {
        setMsg(
          "No hay stock suficiente de " +
            escapar(n) +
            ": disponibles " +
            av +
            " u. (los lotes vencidos no se despachan).",
          "err",
        );
        return mostrarPantalla();
      }
      var r = q,
        used = [];
      lotesPorFefo(n).forEach(function (l) {
        if (r <= 0) return;
        var t = Math.min(l.qty, r);
        l.qty -= t;
        r -= t;
        used.push(t + " u. del lote " + l.lot + " (vence " + l.exp + ")");
        estado.movs.push({
          f: fechaISO(0),
          t: "Salida",
          n: n,
          l: l.lot,
          q: t,
          d: o.dest.trim(),
        });
      });
      guardarDatos();
      setMsg("Salida registrada por FEFO: " + escapar(used.join(", ")) + ".", "ok");
      mostrarPantalla();
    };
  var i = document.getElementById("fe");
  if (i)
    i.onsubmit = function (e) {
      e.preventDefault();
      var o = datosDelFormulario(i),
        l = estado.lots.filter(function (x) {
          return x.id == o.id;
        })[0];
      l.qty += +o.qty;
      estado.movs.push({
        f: fechaISO(0),
        t: "Entrada",
        n: l.name,
        l: l.lot,
        q: +o.qty,
        d: o.dest.trim(),
      });
      guardarDatos();
      setMsg(
        "Entrada registrada: +" +
          o.qty +
          " u. en " +
          escapar(l.name) +
          ", lote " +
          escapar(l.lot) +
          ".",
        "ok",
      );
      mostrarPantalla();
    };
  var p = document.getElementById("pr");
  if (p)
    p.onclick = function () {
      window.print();
    };
  var r = document.getElementById("rs");
  if (r)
    r.onclick = function () {
      estado = crearDatosDePrueba();
      guardarDatos();
      setMsg("Datos de prueba restablecidos.", "ok");
      tab = "panelPrincipal";
      mostrarPantalla();
    };
}
document.getElementById("nav").addEventListener("click", function (e) {
  var t = e.target.getAttribute("data-t");
  if (t) {
    tab = t;
    mostrarPantalla();
  }
});
document.getElementById("role").addEventListener("change", function (e) {
  estado.role = e.target.value;
  tab = "panelPrincipal";
  guardarDatos();
  mostrarPantalla();
});
cargarDatos();
document.getElementById("role").value = estado.role;
mostrarPantalla();