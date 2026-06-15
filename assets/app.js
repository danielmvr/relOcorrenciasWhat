/* =========================================================================
   app.js - Interface do Fluxo de Ocorrencias (fala apenas com window.Store)
   ========================================================================= */
(function () {
  "use strict";
  var Store = window.Store;
  var currentView = "painel";

  /* ---------------- Helpers ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fmtDur(ms) {
    var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return pad(h) + ":" + pad(m) + ":" + pad(s % 60);
  }
  function fmtClock(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function fmtDateBR(ymd) {
    if (!ymd) return "";
    if (ymd.indexOf("T") > -1) ymd = ymd.slice(0, 10);
    var p = ymd.split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0].slice(2) : ymd;
  }
  function copiar(texto, btn) {
    function ok() { if (btn) { var t = btn.textContent; btn.textContent = "Copiado!"; setTimeout(function () { btn.textContent = t; }, 1600); } }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok, function () { fallback(); });
    } else { fallback(); }
    function fallback() {
      var ta = document.createElement("textarea"); ta.value = texto; document.body.appendChild(ta);
      ta.select(); try { document.execCommand("copy"); ok(); } catch (e) { alert("Nao foi possivel copiar."); }
      ta.remove();
    }
  }
  function baixar(conteudo, nome, tipo) {
    var blob = new Blob([conteudo], { type: tipo || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  /* ---------------- Navegacao ---------------- */
  function showView(name) {
    currentView = name;
    $all(".view").forEach(function (v) { v.classList.remove("active"); });
    var sec = $("#view-" + name); if (sec) sec.classList.add("active");
    $all(".nav button").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-view") === name); });
    if (name === "painel") renderBoard();
    if (name === "cadastros") { renderFrota(); renderLoc(); renderPa(); }
    if (name === "historico") renderHist();
  }

  /* ---------------- PAINEL ---------------- */
  function statusBadge(st) {
    var s = Store.STATUS[st] || Store.STATUS.aberta;
    return '<span class="status-badge" style="background:' + s.cor + '"><span class="dot"></span>' + esc(s.label) + '</span>';
  }
  /* ---- Empresa (cor) e tipo de carro (formato do onibus) ---- */
  var EMPRESAS = {
    UTIL: { nome: "Util", cor: "#2f6fd0", letra: "U" },
    SAMP: { nome: "Sampaio", cor: "#5cc6ef", letra: "S" },
    RAF:  { nome: "Rapido Federal", cor: "#f2c200", letra: "F" },
    REX:  { nome: "Real Expresso", cor: "#d83a34", letra: "R" }
  };
  var SUFIXO_EMP = { U: "UTIL", S: "SAMP", F: "RAF", R: "REX" };
  function empresaDe(o) {
    var key = (o.regional && EMPRESAS[o.regional]) ? o.regional : null;
    if (!key) { var m = String(o.carro || "").match(/\.([A-Za-z])\s*$/); key = m ? SUFIXO_EMP[m[1].toUpperCase()] : null; }
    return key ? { key: key, nome: EMPRESAS[key].nome, cor: EMPRESAS[key].cor, letra: EMPRESAS[key].letra }
               : { key: "", nome: o.regional || "", cor: "#7d8198", letra: "" };
  }
  function tipoCarro(carro) { var m = String(carro || "").match(/^(\d+)/); return (m && m[1].length >= 5) ? "DD" : "RSD"; }
  function tipoNome(t) { return t === "DD" ? "Double Deck" : "Carro Baixo"; }
  function busSVG(cor, tipo) {
    function r(x, y, w, h, f) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + f + '"/>'; }
    var D = "#11142a", G = "#e4f2ff", T = "#15151f", H = "#8a8fb0", L = "#ffe46b";
    if (tipo === "DD") {
      return '<svg class="bus" viewBox="0 0 40 24" width="46" height="28" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">' +
        r(2,1,36,20,D) + r(3,2,34,18,cor) +
        r(5,3,5,4,G)+r(11,3,5,4,G)+r(17,3,5,4,G)+r(23,3,5,4,G)+r(29,3,4,4,G) +
        r(5,10,5,5,G)+r(11,10,5,5,G)+r(17,10,5,5,G)+r(23,10,4,5,G) +
        r(29,10,7,6,G) + r(36,13,3,4,L) +
        r(7,20,7,4,T)+r(26,20,7,4,T)+r(9,21,3,2,H)+r(28,21,3,2,H) + '</svg>';
    }
    return '<svg class="bus" viewBox="0 0 40 20" width="46" height="24" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">' +
      r(2,3,36,13,D) + r(3,4,34,11,cor) +
      r(5,6,5,5,G)+r(11,6,5,5,G)+r(17,6,5,5,G)+r(23,6,4,5,G) +
      r(29,6,7,6,G) + r(36,10,3,4,L) +
      r(7,15,7,4,T)+r(26,15,7,4,T)+r(9,16,3,2,H)+r(28,16,3,2,H) + '</svg>';
  }

  function cardHTML(o) {
    var s = Store.STATUS[o.status] || Store.STATUS.aberta;
    var emp = empresaDe(o), tipo = tipoCarro(o.carro);
    var ms = Store.duracaoMs(o), urg = Store.nivelUrgencia(ms);
    var ult = o.eventos && o.eventos.length ? o.eventos[o.eventos.length - 1] : null;
    var opts = Store.STATUS_ATIVOS.map(function (k) {
      return '<option value="' + k + '"' + (k === o.status ? " selected" : "") + '>' + esc(Store.STATUS[k].label) + '</option>';
    }).join("");
    return '' +
      '<div class="card" data-id="' + o.id + '">' +
        '<div class="topbar" style="background:' + s.cor + '"></div>' +
        '<div class="body">' +
          '<div class="card-head">' + busSVG(emp.cor, tipo) +
            '<div class="card-head-txt">' +
              '<p class="carro">' + esc(o.carro || "?") + (o.carroSegue ? ' <span class="segue">&rarr; ' + esc(o.carroSegue) + '</span>' : '') + '</p>' +
              '<p class="empresa">' + esc(emp.nome) + (emp.nome ? ' &middot; ' + tipoNome(tipo) : '') + '</p>' +
            '</div>' +
          '</div>' +
          '<p class="linha">' + esc(o.linha || "linha nao informada") + '</p>' +
          '<div class="crono ' + urg + '" data-aberta="' + new Date(o.abertaEm).getTime() + '">' + fmtDur(ms) + '</div>' +
          '<p class="row">' + statusBadge(o.status) + '</p>' +
          '<p class="row"><b>Local:</b> ' + esc(o.localSocorro || "-") + '</p>' +
          '<p class="row"><b>Motorista:</b> ' + esc(o.motorista || "-") + '</p>' +
          (o.defeitoMotorista ? '<p class="row"><b>Defeito:</b> ' + esc(o.defeitoMotorista) + '</p>' : '') +
          '<div class="card-actions">' +
            '<select class="status-sel" data-id="' + o.id + '" title="Mudar status">' + opts + '</select>' +
            '<button class="btn blue sm" data-action="detalhe" data-id="' + o.id + '">Detalhes</button>' +
            '<button class="btn green sm" data-action="finalizar" data-id="' + o.id + '">Finalizar</button>' +
          '</div>' +
          (ult ? '<div class="last-event"><b>' + fmtClock(ult.ts) + '</b> ' + esc(ult.texto) + '</div>' : '') +
        '</div>' +
      '</div>';
  }
  function renderBoard() {
    var board = $("#board");
    var termo = ($("#buscaPainel").value || "").toLowerCase();
    var fstatus = $("#filtroStatus").value;
    var lista = Store.listarAtivas().filter(function (o) {
      if (fstatus && o.status !== fstatus) return false;
      if (!termo) return true;
      return [o.carro, o.carroSegue, o.linha, o.motorista, o.localSocorro, o.coordenador]
        .join(" ").toLowerCase().indexOf(termo) > -1;
    });
    $("#badgeAtivas").textContent = Store.listarAtivas().length;
    if (!lista.length) {
      board.innerHTML = '<div class="empty">Nenhuma ocorrencia em andamento.<br>Clique em "+ Nova" para abrir.</div>';
      return;
    }
    board.innerHTML = lista.map(cardHTML).join("");
  }
  function tick() {
    $all("#board .crono").forEach(function (c) {
      var ms = Date.now() - Number(c.getAttribute("data-aberta"));
      c.textContent = fmtDur(ms);
      var urg = Store.nivelUrgencia(ms);
      c.classList.remove("ok", "atencao", "critico"); c.classList.add(urg);
    });
  }

  /* ---------------- NOVA / EDICAO ---------------- */
  function preencherDatalists() {
    $("#frotaList").innerHTML = Store.frota().map(function (v) {
      return '<option value="' + esc(v.veiculo) + '">' + esc(v.modelo + " | " + v.regional) + '</option>';
    }).join("");
    $("#f-gerente").innerHTML = '<option value="">-</option>' + Store.gerentes().map(function (g) {
      return '<option value="' + esc(g) + '">' + esc(g) + '</option>';
    }).join("");
    var fs = $("#filtroStatus");
    fs.innerHTML = '<option value="">Todos os status</option>' + Store.STATUS_ATIVOS.map(function (k) {
      return '<option value="' + k + '">' + esc(Store.STATUS[k].label) + '</option>';
    }).join("");
  }
  function onCarro() {
    var v = Store.buscarVeiculo($("#f-carro").value);
    $("#veicInfo").textContent = v ? (v.modelo + " | " + v.regional + " | placa " + (v.placa || "?") + " | " + (v.capacidade || 0) + " lug.") : "";
  }
  function lerForm() {
    var f = $("#form-ocorrencia"), d = {};
    $all("input, textarea, select", f).forEach(function (el) {
      if (el.type === "radio") { if (el.checked) d[el.name] = el.value; }
      else if (el.name) d[el.name] = el.value.trim();
    });
    return d;
  }
  function editar(o) {
    var f = $("#form-ocorrencia");
    f.reset();
    Object.keys(o).forEach(function (k) {
      var el = f.elements[k]; if (!el) return;
      if (el.length && el[0] && el[0].type === "radio") {
        $all('input[name="' + k + '"]', f).forEach(function (r) { r.checked = (r.value === o[k]); });
      } else if (el.type === "radio") {
        $all('input[name="' + k + '"]', f).forEach(function (r) { r.checked = (r.value === o[k]); });
      } else { el.value = o[k] == null ? "" : o[k]; }
    });
    $("#f-id").value = o.id;
    $("#cancelarEdicao").style.display = "";
    onCarro();
    showView("nova");
  }

  /* ---------------- MODAL DETALHE ---------------- */
  function whatsApp(o) {
    return [
      "Data: " + fmtClock(o.abertaEm),
      "Carro: *" + (o.carro || "") + "*" + (o.carroSegue ? " (segue: " + o.carroSegue + ")" : ""),
      "Linha: " + (o.linha || ""),
      "Local: " + (o.localSocorro || ""),
      "Motorista: " + (o.motorista || "") + (o.matricula ? " (mat " + o.matricula + ")" : ""),
      "Status: " + (Store.STATUS[o.status] ? Store.STATUS[o.status].label : o.status),
      "Defeito: " + (o.defeitoMotorista || ""),
      "Manutencao: " + (o.responsavelManutencao || ""),
      "Saida do socorro: " + (o.saidaSocorro || ""),
      "Encomendas: " + (o.encomendas || "") + " | Alimentacao: " + (o.alimentacaoFornecida || ""),
      "Qtd. clientes: " + (o.qtdClientes || ""),
      "Gerente: " + (o.gerenteRegional || "") + " | Coord.: " + (o.coordenador || ""),
      "Duracao: " + fmtDur(Store.duracaoMs(o)) + (o.status === "finalizada" ? " (final)" : " (em curso)"),
      o.obs ? "Obs: " + o.obs : ""
    ].filter(Boolean).join("\n");
  }
  function abrirDetalhe(id) {
    var o = Store.obter(id); if (!o) return;
    var empM = empresaDe(o), tipoM = tipoCarro(o.carro);
    $("#m-titulo").innerHTML = busSVG(empM.cor, tipoM) + " Carro " + esc(o.carro || "?");
    $("#m-status").innerHTML = statusBadge(o.status) + ' <span style="color:#bbb;font-size:10px">' + esc(empM.nome) + " &middot; " + tipoNome(tipoM) + "</span>";
    var info = [
      ["Linha", o.linha], ["Local", o.localSocorro], ["Regional", o.regional],
      ["Motorista", o.motorista], ["Matricula", o.matricula], ["Placa", o.placa],
      ["Defeito", o.defeitoMotorista], ["Manutencao acionada", o.responsavelManutencao],
      ["Saida do socorro", o.saidaSocorro], ["Carro que segue", o.carroSegue],
      ["Qtd. clientes", o.qtdClientes], ["Encomendas", o.encomendas],
      ["Alimentacao", o.alimentacaoFornecida], ["Gerente regional", o.gerenteRegional],
      ["Coordenador", o.coordenador], ["Obs", o.obs]
    ].filter(function (p) { return p[1]; }).map(function (p) {
      return '<p class="row"><b>' + esc(p[0]) + ':</b> ' + esc(p[1]) + '</p>';
    }).join("");

    var stBtns = Store.STATUS_ATIVOS.map(function (k) {
      return '<button class="btn sm" data-action="m-status" data-id="' + o.id + '" data-status="' + k + '" style="background:' + Store.STATUS[k].cor + '">' + esc(Store.STATUS[k].label) + '</button>';
    }).join(" ");

    var timeline = (o.eventos || []).slice().reverse().map(function (e) {
      return '<li><span class="t">' + fmtClock(e.ts) + '</span><br>' + esc(e.texto) + '</li>';
    }).join("");

    $("#m-body").innerHTML =
      '<div class="crono ' + Store.nivelUrgencia(Store.duracaoMs(o)) + '" data-aberta="' + new Date(o.abertaEm).getTime() + '">' + fmtDur(Store.duracaoMs(o)) + '</div>' +
      '<p class="row" style="text-align:center;color:#888;font-size:12px">Aberta em ' + fmtClock(o.abertaEm) + (o.finalizadaEm ? " | Finalizada em " + fmtClock(o.finalizadaEm) : "") + '</p>' +
      info +
      '<label>Mudar status</label><div style="display:flex;gap:6px;flex-wrap:wrap">' + stBtns + '</div>' +
      '<label>Registrar medida / atualizacao</label>' +
      '<div style="display:flex;gap:6px"><input type="text" id="m-evento" placeholder="Ex.: socorro saiu de RIO 08:52"><button class="btn green sm" data-action="m-add" data-id="' + o.id + '">Adicionar</button></div>' +
      '<label>Linha do tempo</label><ul class="timeline">' + (timeline || "<li>Sem eventos.</li>") + "</ul>" +
      '<div class="form-actions">' +
        (o.status === "finalizada"
          ? '<button class="btn yellow sm" data-action="m-reabrir" data-id="' + o.id + '">Reabrir</button>'
          : '<button class="btn green sm" data-action="m-finalizar" data-id="' + o.id + '">Finalizar</button>') +
        '<button class="btn blue sm" data-action="m-copiar" data-id="' + o.id + '">Copiar WhatsApp</button>' +
        '<button class="btn ghost sm" data-action="m-editar" data-id="' + o.id + '">Editar</button>' +
        '<button class="btn wine sm" data-action="m-excluir" data-id="' + o.id + '">Excluir</button>' +
      '</div>';
    $("#overlay").classList.add("open");
  }
  function fecharModal() { $("#overlay").classList.remove("open"); }

  /* ---------------- CADASTROS ---------------- */
  function renderFrota() {
    var termo = ($("#buscaFrota").value || "").toLowerCase();
    var lista = Store.frota().filter(function (v) {
      return !termo || [v.veiculo, v.placa, v.regional, v.modelo, v.nop].join(" ").toLowerCase().indexOf(termo) > -1;
    });
    $("#frotaCount").textContent = lista.length + " / " + Store.frota().length + " veiculos";
    var rows = lista.slice(0, 600).map(function (v) {
      return "<tr><td>" + esc(v.veiculo) + "</td><td>" + esc(v.modelo) + "</td><td>" + esc(v.regional) +
        "</td><td>" + esc(v.placa) + "</td><td>" + esc(v.uf) + "</td><td>" + esc(v.capacidade) + "</td><td>" + esc(v.ano) + "</td></tr>";
    }).join("");
    $("#tblFrota").innerHTML = "<thead><tr><th>Carro</th><th>Modelo</th><th>Regional</th><th>Placa</th><th>UF</th><th>Cap.</th><th>Ano</th></tr></thead><tbody>" + rows + "</tbody>";
  }
  function renderLoc() {
    var termo = (($("#buscaLoc") || {}).value || "").toLowerCase();
    var all = Store.localidades();
    var rows = all.map(function (l, i) { return { l: l, i: i }; })
      .filter(function (o) { return !termo || [o.l.sigla, o.l.nome, o.l.uf].join(" ").toLowerCase().indexOf(termo) > -1; })
      .map(function (o) {
        return "<tr><td>" + esc(o.l.sigla) + "</td><td>" + esc(o.l.nome) + "</td><td>" + esc(o.l.uf || "") +
          '</td><td><button class="btn wine sm" data-action="loc-del" data-i="' + o.i + '">x</button></td></tr>';
      }).join("");
    var c = $("#locCount"); if (c) c.textContent = all.length + " siglas";
    $("#tblLoc").innerHTML = "<thead><tr><th>Sigla</th><th>Nome</th><th>UF</th><th></th></tr></thead><tbody>" + rows + "</tbody>";
  }
  function renderPa() {
    var termo = (($("#buscaPa") || {}).value || "").toLowerCase();
    var all = Store.pontosApoio();
    var rows = all.map(function (p, i) { return { p: p, i: i }; })
      .filter(function (o) { return !termo || [o.p.nome, o.p.sigla, o.p.tipo, o.p.obs].join(" ").toLowerCase().indexOf(termo) > -1; })
      .map(function (o) {
        var p = o.p;
        return "<tr><td>" + esc(p.nome) + "</td><td>" + esc(p.sigla || "") + "</td><td>" + esc(p.tipo || "") +
          "</td><td>" + esc(p.obs || "") + '</td><td><button class="btn wine sm" data-action="pa-del" data-i="' + o.i + '">x</button></td></tr>';
      }).join("");
    var c = $("#paCount"); if (c) c.textContent = all.length + " pontos";
    $("#tblPa").innerHTML = "<thead><tr><th>Nome</th><th>Sigla</th><th>Tipo</th><th>Obs</th><th></th></tr></thead><tbody>" + rows + "</tbody>";
  }

  /* ---------------- HISTORICO ---------------- */
  var CSV_COLS = ["abertaEm", "finalizadaEm", "carro", "carroSegue", "motorista", "matricula", "linha",
    "localSocorro", "regional", "defeitoMotorista", "responsavelManutencao", "saidaSocorro",
    "encomendas", "alimentacaoFornecida", "qtdClientes", "gerenteRegional", "coordenador", "obs", "status"];
  function renderHist() {
    var termo = ($("#buscaHist").value || "").toLowerCase();
    var lista = Store.listarFinalizadas().filter(function (o) {
      return !termo || [o.carro, o.linha, o.motorista, o.localSocorro, o.coordenador].join(" ").toLowerCase().indexOf(termo) > -1;
    });
    var rows = lista.map(function (o) {
      return "<tr><td>" + fmtClock(o.abertaEm) + "</td><td>" + esc(o.carro) + "</td><td>" + esc(o.linha) +
        "</td><td>" + esc(o.localSocorro) + "</td><td>" + fmtDur(Store.duracaoMs(o)) +
        '</td><td><button class="btn blue sm" data-action="detalhe" data-id="' + o.id + '">Ver</button> ' +
        '<button class="btn wine sm" data-action="hist-del" data-id="' + o.id + '">x</button></td></tr>';
    }).join("");
    $("#tblHist").innerHTML = "<thead><tr><th>Aberta</th><th>Carro</th><th>Linha</th><th>Local</th><th>Duracao</th><th></th></tr></thead><tbody>" +
      (rows || '<tr><td colspan="6" style="text-align:center;color:#888;padding:20px">Nenhuma ocorrencia finalizada ainda.</td></tr>') + "</tbody>";
  }
  function exportarCSV() {
    var lista = Store.listarFinalizadas(); if (!lista.length) { alert("Nada para exportar."); return; }
    function cell(v) { v = String(v == null ? "" : v).replace(/"/g, '""'); return /[",\n;]/.test(v) ? '"' + v + '"' : v; }
    var linhas = [CSV_COLS.concat(["duracao"]).join(";")];
    lista.forEach(function (o) {
      var row = CSV_COLS.map(function (c) {
        if (c === "abertaEm" || c === "finalizadaEm") return cell(fmtClock(o[c]));
        return cell(o[c]);
      });
      row.push(cell(fmtDur(Store.duracaoMs(o))));
      linhas.push(row.join(";"));
    });
    baixar(linhas.join("\n"), "ocorrencias_" + new Date().toISOString().slice(0, 10) + ".csv", "text/csv;charset=utf-8");
  }

  /* ---------------- IMPORTACOES ---------------- */
  function parseCSV(texto) {
    var sep = (texto.split("\n")[0].indexOf(";") > -1) ? ";" : ",";
    var linhas = texto.replace(/\r/g, "").split("\n").filter(function (l) { return l.trim(); });
    if (!linhas.length) return [];
    var head = linhas.shift().split(sep).map(function (h) { return h.trim(); });
    return linhas.map(function (l) {
      var cols = l.split(sep), obj = {};
      head.forEach(function (h, i) { obj[h] = (cols[i] || "").trim(); });
      return obj;
    });
  }
  function parseKML(texto) {
    var doc = new DOMParser().parseFromString(texto, "text/xml");
    var pms = doc.getElementsByTagName("Placemark"), out = [];
    for (var i = 0; i < pms.length; i++) {
      var nm = pms[i].getElementsByTagName("name")[0];
      var co = pms[i].getElementsByTagName("coordinates")[0];
      var de = pms[i].getElementsByTagName("description")[0];
      if (!co) continue; // so pontos
      var c = co.textContent.trim().split(/\s+/)[0].split(",");
      out.push({ nome: nm ? nm.textContent.trim() : "", lon: c[0], lat: c[1], desc: de ? de.textContent.trim() : "" });
    }
    return out;
  }
  function lerArquivo(file, cb) { var fr = new FileReader(); fr.onload = function () { cb(fr.result); }; fr.readAsText(file, "utf-8"); }
  function guessSigla(nome) {
    var m = (nome || "").match(/^([A-Z]{2,4})\b/); return m ? m[1] : "";
  }

  /* ---------------- Eventos globais ---------------- */
  function wire() {
    // navegacao
    $all(".nav button").forEach(function (b) { b.addEventListener("click", function () { showView(b.getAttribute("data-view")); }); });
    // subtabs
    $all(".sub").forEach(function (b) {
      b.addEventListener("click", function () {
        $all(".sub").forEach(function (x) { x.classList.remove("active"); }); b.classList.add("active");
        var s = b.getAttribute("data-sub");
        $("#sub-frota").style.display = s === "frota" ? "" : "none";
        $("#sub-localidades").style.display = s === "localidades" ? "" : "none";
        $("#sub-pontos").style.display = s === "pontos" ? "" : "none";
      });
    });
    // buscas
    $("#buscaPainel").addEventListener("input", renderBoard);
    $("#filtroStatus").addEventListener("change", renderBoard);
    $("#buscaFrota").addEventListener("input", renderFrota);
    $("#buscaHist").addEventListener("input", renderHist);
    $("#buscaLoc").addEventListener("input", renderLoc);
    $("#buscaPa").addEventListener("input", renderPa);
    // carro -> info
    $("#f-carro").addEventListener("input", onCarro);
    // form submit
    $("#form-ocorrencia").addEventListener("submit", function (e) {
      e.preventDefault();
      var d = lerForm();
      if (!d.carro) { alert("Informe o carro."); return; }
      if (d.id) { Store.atualizar(d.id, d); } else { delete d.id; Store.criar(d); }
      e.target.reset(); $("#f-id").value = ""; $("#veicInfo").textContent = ""; $("#cancelarEdicao").style.display = "none";
      showView("painel");
    });
    $("#cancelarEdicao").addEventListener("click", function () {
      $("#form-ocorrencia").reset(); $("#f-id").value = ""; $("#cancelarEdicao").style.display = "none"; showView("painel");
    });
    // status select (delegacao change)
    document.addEventListener("change", function (e) {
      var sel = e.target.closest(".status-sel"); if (!sel) return;
      Store.mudarStatus(sel.getAttribute("data-id"), sel.value); renderBoard();
    });
    // cadastros add
    $("#addLoc").addEventListener("click", function () {
      var s = $("#loc-sigla").value.trim(), n = $("#loc-nome").value.trim();
      if (!s && !n) return;
      var arr = Store.localidades(); arr.push({ sigla: s.toUpperCase(), nome: n, uf: $("#loc-uf").value.trim().toUpperCase() });
      Store.salvarLocalidades(arr); $("#loc-sigla").value = $("#loc-nome").value = $("#loc-uf").value = ""; renderLoc();
    });
    $("#addPa").addEventListener("click", function () {
      var n = $("#pa-nome").value.trim(); if (!n) return;
      var arr = Store.pontosApoio(); arr.push({ nome: n, sigla: $("#pa-sigla").value.trim().toUpperCase(), tipo: $("#pa-tipo").value.trim(), obs: "" });
      Store.salvarPontosApoio(arr); $("#pa-nome").value = $("#pa-sigla").value = $("#pa-tipo").value = ""; renderPa();
    });
    // imports
    $("#impFrota").addEventListener("change", function () {
      var f = this.files[0]; if (!f) return;
      lerArquivo(f, function (txt) {
        try {
          var arr = f.name.match(/\.json$/i) ? JSON.parse(txt) : parseCSV(txt);
          arr = arr.map(function (r) {
            return { veiculo: r.veiculo || r["Veículo"] || r.carro, modelo: r.modelo || r.Frota || "", capacidade: r.capacidade || r["Capacidade Pax"] || 0,
              regional: r.regional || r.Regional || "", nop: r.nop || r.NOp || "", placa: r.placa || r.Placa || "", uf: r.uf || "", ano: r.ano || "" };
          }).filter(function (r) { return r.veiculo; });
          if (arr.length) { Store.salvarFrota(arr); preencherDatalists(); renderFrota(); alert(arr.length + " veiculos importados."); }
          else alert("Nenhum veiculo reconhecido no arquivo.");
        } catch (err) { alert("Falha ao ler: " + err.message); }
      });
      this.value = "";
    });
    $("#impLoc").addEventListener("change", function () {
      var f = this.files[0]; if (!f) return;
      lerArquivo(f, function (txt) {
        try {
          var arr;
          if (f.name.match(/\.kml$/i)) arr = parseKML(txt).map(function (p) { return { sigla: guessSigla(p.nome), nome: p.nome, uf: "" }; });
          else if (f.name.match(/\.json$/i)) arr = JSON.parse(txt);
          else arr = parseCSV(txt).map(function (r) { return { sigla: (r.sigla || "").toUpperCase(), nome: r.nome || r.name || "", uf: (r.uf || "").toUpperCase() }; });
          var atual = Store.localidades().concat(arr.filter(function (x) { return x.nome || x.sigla; }));
          Store.salvarLocalidades(atual); renderLoc(); alert(arr.length + " localidades importadas.");
        } catch (err) { alert("Falha ao ler: " + err.message); }
      });
      this.value = "";
    });
    $("#impPa").addEventListener("change", function () {
      var f = this.files[0]; if (!f) return;
      lerArquivo(f, function (txt) {
        try {
          var arr;
          if (f.name.match(/\.kml$/i)) arr = parseKML(txt).map(function (p) { return { nome: p.nome, sigla: "", tipo: "", obs: (p.desc || "") + (p.lat ? " (" + p.lat + "," + p.lon + ")" : "") }; });
          else if (f.name.match(/\.json$/i)) arr = JSON.parse(txt);
          else arr = parseCSV(txt).map(function (r) { return { nome: r.nome || r.name || "", sigla: (r.sigla || "").toUpperCase(), tipo: r.tipo || "", obs: r.obs || "" }; });
          var atual = Store.pontosApoio().concat(arr.filter(function (x) { return x.nome; }));
          Store.salvarPontosApoio(atual); renderPa(); alert(arr.length + " pontos importados.");
        } catch (err) { alert("Falha ao ler: " + err.message); }
      });
      this.value = "";
    });
    // historico export/backup
    $("#expCSV").addEventListener("click", exportarCSV);
    $("#expJSON").addEventListener("click", function () {
      baixar(JSON.stringify(Store.listarFinalizadas(), null, 2), "ocorrencias_" + new Date().toISOString().slice(0, 10) + ".json", "application/json");
    });
    $("#backup").addEventListener("click", function () {
      baixar(Store.exportarTudo(), "backup_fluxo_" + new Date().toISOString().slice(0, 10) + ".json", "application/json");
    });
    $("#restore").addEventListener("change", function () {
      var f = this.files[0]; if (!f) return;
      if (!confirm("Restaurar substitui TODOS os dados atuais. Continuar?")) { this.value = ""; return; }
      lerArquivo(f, function (txt) {
        try { Store.importarTudo(txt); preencherDatalists(); showView("painel"); alert("Backup restaurado."); }
        catch (err) { alert("Arquivo invalido: " + err.message); }
      });
      this.value = "";
    });
    // modal fechar
    $("#m-fechar").addEventListener("click", fecharModal);
    $("#overlay").addEventListener("click", function (e) { if (e.target === $("#overlay")) fecharModal(); });

    // delegacao de acoes (cliques)
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-action]"); if (!t) return;
      var a = t.getAttribute("data-action"), id = t.getAttribute("data-id"), i = t.getAttribute("data-i");
      switch (a) {
        case "detalhe": abrirDetalhe(id); break;
        case "finalizar":
          if (confirm("Finalizar esta ocorrencia?")) { Store.finalizar(id); renderBoard(); }
          break;
        case "m-status": Store.mudarStatus(id, t.getAttribute("data-status")); abrirDetalhe(id); renderBoard(); break;
        case "m-add":
          var inp = $("#m-evento"); if (inp && inp.value.trim()) { Store.addEvento(id, inp.value.trim()); abrirDetalhe(id); renderBoard(); }
          break;
        case "m-finalizar":
          if (confirm("Finalizar esta ocorrencia?")) { Store.finalizar(id); fecharModal(); renderBoard(); renderHist(); }
          break;
        case "m-reabrir": Store.reabrir(id); abrirDetalhe(id); renderBoard(); break;
        case "m-copiar": copiar(whatsApp(Store.obter(id)), t); break;
        case "m-editar": fecharModal(); editar(Store.obter(id)); break;
        case "m-excluir":
          if (confirm("Excluir definitivamente?")) { Store.remover(id); fecharModal(); renderBoard(); renderHist(); }
          break;
        case "hist-del":
          if (confirm("Excluir do historico?")) { Store.remover(id); renderHist(); }
          break;
        case "loc-del": var L = Store.localidades(); L.splice(i, 1); Store.salvarLocalidades(L); renderLoc(); break;
        case "pa-del": var P = Store.pontosApoio(); P.splice(i, 1); Store.salvarPontosApoio(P); renderPa(); break;
      }
    });
  }

  /* ---------------- Init ---------------- */
  function renderAtual() {
    if (currentView === "painel") renderBoard();
    else if (currentView === "historico") renderHist();
    else if (currentView === "cadastros") { renderFrota(); renderLoc(); renderPa(); }
  }
  function aplicarModo() {
    var chip = $("#modoChip"), txt = $("#modoTexto"), remoto = (window.MODO === "remoto");
    if (chip) { chip.textContent = remoto ? "Tempo real" : "Modo local"; chip.classList.toggle("on", remoto); }
    if (txt) txt.textContent = remoto ? "conectado ao servidor compartilhado (Supabase)" : "dados locais neste navegador";
  }
  document.addEventListener("DOMContentLoaded", function () {
    preencherDatalists();
    wire();
    aplicarModo();
    if (Store.onChange) Store.onChange(renderAtual);
    showView("painel");
    setInterval(tick, 1000);
  });
})();
