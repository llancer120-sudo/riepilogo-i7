// App "Meccanica" (dal 21/11/2026). Funziona offline. I progressi restano SOLO sul telefono di chi la usa:
// nessun server, nessun confronto tra le due app. Ogni app ha la sua chiave (window.APP).
(function () {
  const M = window.MECCANICA;
  const f = M.f;
  const CHIAVE = 'meccanica:' + (window.APP || 'app');
  const BLOCCHI = M.BLOCCHI.filter((b) => M.MODELLI.some((m) => m.blocco === b.id));
  const NOMI_LIV = { 1: 'Guidato', 2: 'Normale', 3: 'Progettista' };
  const $app = document.getElementById('app');

  // ---------- stato ----------
  function nuovoStato() {
    return { nome: '', creato: oggi(), test: null, profilo: {}, sbloccati: [BLOCCHI[0].id], storico: [], ripassi: [], giorni: [], corrente: null };
  }
  function carica() {
    try { const s = JSON.parse(localStorage.getItem(CHIAVE)); if (s && s.profilo) return Object.assign(nuovoStato(), s); } catch (e) { /* niente */ }
    return nuovoStato();
  }
  let S = carica();
  function salva() { try { localStorage.setItem(CHIAVE, JSON.stringify(S)); } catch (e) { /* memoria piena o bloccata */ } }
  function oggi() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function prof(b) { if (!S.profilo[b]) S.profilo[b] = { r: S.test ? S.test.inizio : 1.2, fatte: 0, giuste: 0, sbagliate: 0 }; return S.profilo[b]; }
  function livello(b) { return Math.max(1, Math.min(3, Math.floor(prof(b).r))); }

  // ---------- utilità ----------
  const R = {
    da: (a) => a[Math.floor(Math.random() * a.length)],
    tra: (a, b, p = 1) => { const v = Math.round((a + Math.random() * (b - a)) / p) * p; return Math.round(v * 1e6) / 1e6; },
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function numero(t) {
    t = String(t || '').trim().replace(/\s/g, '');
    if (!t) return NaN;
    if (t.includes(',') && t.includes('.')) t = t.replace(/\./g, '').replace(',', '.');
    else t = t.replace(',', '.');
    return Number(t);
  }
  function giusto(v, atteso, unita, liv) {
    const toll = liv === 1 ? 0.03 : 0.02;
    const abs = unita === 'µm' ? 1 : Math.max(Math.abs(atteso) * toll, 1e-9);
    return Math.abs(v - atteso) <= abs;
  }
  function diagnosi(v, es) {
    const out = [];
    for (const p of es.passi) {
      const pv = p[2];
      if (pv && p[1] !== es.risposta.valore && Math.abs(v / pv - 1) <= 0.02 && Math.abs(pv - es.risposta.valore) > Math.abs(es.risposta.valore) * 0.02) {
        out.push(`Il tuo numero coincide con il passo "${p[0]}": ti sei fermato lì.`);
        break;
      }
    }
    const rap = v / es.risposta.valore;
    const fattori = [[1000, 'unità: mm/m, N/kN o W/kW'], [0.001, 'unità: mm/m, N/kN o W/kW'], [10, 'bar/MPa'], [0.1, 'bar/MPa'], [100, 'bar/kPa o percentuali'], [0.01, 'bar/kPa o percentuali'],
      [9.81, 'hai usato kg al posto di N'], [1 / 9.81, 'hai usato N al posto di kg'], [60, 'minuti/secondi o giri/min'], [1 / 60, 'minuti/secondi o giri/min'],
      [2 * Math.PI, 'il 2π della velocità angolare'], [1 / (2 * Math.PI), 'il 2π della velocità angolare'], [2, 'un fattore 2 (½, diametro/raggio, due funi?)'], [0.5, 'un fattore 2 (½, diametro/raggio, due funi?)'], [-1, 'il segno']];
    const nomeFattore = (k) => (k === -1 ? '−1' : Math.abs(k - 2 * Math.PI) < 1e-9 ? '2π' : Math.abs(k - 1 / (2 * Math.PI)) < 1e-9 ? '1/2π' : k < 1 ? '1/' + f(1 / k) : f(k));
    for (const [k, motivo] of fattori) if (Math.abs(rap / k - 1) <= 0.02) { out.push(`Sei fuori di un fattore ${nomeFattore(k)}: controlla ${motivo}.`); break; }
    if (!out.length) out.push(rap > 1 ? 'Il tuo numero è troppo alto.' : 'Il tuo numero è troppo basso.');
    return out;
  }

  // ---------- scelta dell'esercizio ----------
  function scegli(bloccoForzato) {
    const n = S.storico.length;
    let modello = null;
    if (!bloccoForzato) {
      const dovuto = S.ripassi.find((r) => r.quando <= n && S.sbloccati.includes(M.MODELLI.find((m) => m.id === r.id)?.blocco));
      if (dovuto) { modello = M.MODELLI.find((m) => m.id === dovuto.id); S.ripassi = S.ripassi.filter((r) => r !== dovuto); }
    }
    let blocco = bloccoForzato;
    if (!modello && !blocco) {
      const pesi = S.sbloccati.map((b, i) => {
        const p = prof(b);
        let w = 1;
        if (i === S.sbloccati.length - 1) w += 2; // il blocco nuovo va di più
        if (p.fatte && p.sbagliate / p.fatte > 0.35) w += 1; // dove sbagli torni più spesso
        return [b, w];
      });
      let tot = pesi.reduce((a, x) => a + x[1], 0), x = Math.random() * tot;
      for (const [b, w] of pesi) { x -= w; if (x <= 0) { blocco = b; break; } }
      blocco = blocco || pesi[0][0];
    }
    if (!modello) {
      const candidati = M.MODELLI.filter((m) => m.blocco === blocco);
      const ultimaVolta = (id) => { for (let i = S.storico.length - 1; i >= 0; i--) if (S.storico[i].m === id) return i; return -1; };
      candidati.sort((a, b) => ultimaVolta(a.id) - ultimaVolta(b.id));
      modello = candidati[0];
    }
    const liv = livello(modello.blocco);
    const es = modello.genera(liv, R);
    S.corrente = Object.assign(es, { modello: modello.id, blocco: modello.blocco, titolo: modello.titolo, liv, tentativi: 0, aiuti: liv === 1 ? es.impostazione.length : 0, mostrata: false, risolto: false, fase: 'calcolo', decisa: null });
    salva();
  }

  function chiudi(esito) {
    const c = S.corrente, p = prof(c.blocco);
    let d;
    if (esito === 'giusto') d = c.tentativi <= 1 && (c.liv === 1 || c.aiuti === 0) ? 0.4 : 0.15;
    else d = -0.35;
    if (c.decisione && c.decisa !== null) d += c.decisa === c.decisione.giusta ? 0.05 : -0.1;
    if (c.liv === 3 && d > 0) d *= 0.6;
    const prima = livello(c.blocco);
    p.r = Math.max(1, Math.min(3.99, p.r + d));
    p.fatte++;
    if (esito === 'giusto') p.giuste++; else { p.sbagliate++; S.ripassi = S.ripassi.filter((r) => r.id !== c.modello); S.ripassi.push({ id: c.modello, quando: S.storico.length + 3 }); }
    S.storico.push({ g: oggi(), m: c.modello, b: c.blocco, l: c.liv, e: esito === 'giusto' ? 1 : 0 });
    if (S.storico.length > 500) S.storico = S.storico.slice(-500);
    if (!S.giorni.includes(oggi())) S.giorni.push(oggi());
    let novita = '';
    const dopo = livello(c.blocco);
    if (dopo > prima) novita = `Sali al livello ${dopo} (${NOMI_LIV[dopo]}) in ${nomeBlocco(c.blocco)}.`;
    if (dopo < prima) novita = `Torni al livello ${dopo} (${NOMI_LIV[dopo]}) in ${nomeBlocco(c.blocco)}: rifacciamo le basi con l'aiuto aperto.`;
    const i = BLOCCHI.findIndex((b) => b.id === c.blocco);
    const succ = BLOCCHI[i + 1];
    if (succ && !S.sbloccati.includes(succ.id) && p.giuste >= 3) {
      S.sbloccati.push(succ.id);
      prof(succ.id).r = Math.max(1.2, p.r - 0.8);
      novita += (novita ? ' ' : '') + `Si apre un blocco nuovo: ${succ.nome}.`;
    }
    c.novita = novita;
    c.chiuso = esito;
    salva();
  }

  function nomeBlocco(id) { const b = BLOCCHI.find((x) => x.id === id); return b ? b.nome : id; }
  function serie() {
    let n = 0; const d = new Date();
    for (;;) {
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if (S.giorni.includes(k)) { n++; d.setDate(d.getDate() - 1); } else if (n === 0 && k === oggi()) { d.setDate(d.getDate() - 1); } else break;
    }
    return n;
  }

  // ---------- schermate ----------
  function mostra(html) { $app.innerHTML = html; window.scrollTo(0, 0); }

  function benvenuto() {
    mostra(`<section class="carta centro">
      <div class="logo" aria-hidden="true">${ingranaggio()}</div>
      <h1>Ripasso di meccanica</h1>
      <p class="sotto">Esercizi veri da officina e da ufficio tecnico. L'app si adatta a te: se vai forte sale di livello, se sbagli torna sulle basi. Funziona anche senza rete.</p>
      <label class="campo">Come ti chiami?<input id="nome" autocomplete="given-name" maxlength="30" placeholder="Il tuo nome"></label>
      <button class="pieno" id="via">Inizia con il test d'ingresso</button>
      <p class="piccolo">12 domande veloci per capire da dove partire. I tuoi progressi restano solo su questo telefono.</p>
    </section>`);
    document.getElementById('via').onclick = () => {
      S.nome = document.getElementById('nome').value.trim().slice(0, 30);
      salva();
      testIngresso(0, []);
    };
  }

  function testIngresso(i, risposte) {
    if (i >= M.TEST.length) return fineTest(risposte);
    const q = M.TEST[i];
    mostra(`<section class="carta">
      <div class="riga-alta"><span class="etichetta">Test d'ingresso</span><span class="piccolo">${i + 1} di ${M.TEST.length}</span></div>
      <div class="barra"><span style="width:${(i / M.TEST.length) * 100}%"></span></div>
      <h2>${esc(q.domanda)}</h2>
      <div class="risposta"><input id="r" inputmode="decimal" autocomplete="off" placeholder="Il tuo risultato"><span class="unita">${esc(q.unita)}</span></div>
      <div class="bottoni"><button class="pieno" id="ok">Avanti</button><button class="vuoto" id="salta">Non lo so</button></div>
    </section>`);
    const inp = document.getElementById('r');
    inp.focus();
    const vai = (salta) => {
      const v = numero(inp.value);
      const ok = !salta && isFinite(v) && Math.abs(v - q.risposta) <= Math.abs(q.risposta) * q.tolleranza;
      testIngresso(i + 1, risposte.concat(ok ? 1 : 0));
    };
    document.getElementById('ok').onclick = () => vai(false);
    document.getElementById('salta').onclick = () => vai(true);
    inp.onkeydown = (e) => { if (e.key === 'Enter') vai(false); };
  }

  function fineTest(r) {
    const punti = r.reduce((a, b) => a + b, 0);
    const inizio = punti <= 5 ? 1.2 : punti <= 8 ? 1.7 : punti <= 10 ? 2.2 : 2.7;
    S.test = { punti, inizio, data: oggi() };
    S.profilo = {};
    S.sbloccati = BLOCCHI.slice(0, punti >= 11 ? 3 : punti >= 9 ? 2 : 1).map((b) => b.id);
    S.sbloccati.forEach((b) => prof(b));
    salva();
    const liv = Math.floor(inizio);
    mostra(`<section class="carta centro">
      <h1>${punti} su 12</h1>
      <p class="sotto">${punti <= 5 ? 'Partiamo dalle basi, con l\'impostazione sempre aperta. Si sale in fretta.' : punti <= 10 ? 'Buona base: si parte dal livello giusto e si sale facendo esercizi.' : 'Ottimo: parti già con i problemi da progettista dove serve.'}</p>
      <p>Livello di partenza: <b>${liv} · ${NOMI_LIV[liv]}</b>. Blocchi aperti: ${S.sbloccati.map(nomeBlocco).join(', ')}.</p>
      <button class="pieno" id="via">Vai al primo esercizio</button>
    </section>`);
    document.getElementById('via').onclick = () => { scegli(); esercizio(); };
  }

  function home() {
    const ogg = S.storico.filter((s) => s.g === oggi());
    const giuste = ogg.filter((s) => s.e).length;
    const errori = {};
    S.storico.slice(-60).forEach((s) => { if (!s.e) errori[s.m] = (errori[s.m] || 0) + 1; });
    const deboli = Object.entries(errori).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => M.MODELLI.find((m) => m.id === id)).filter(Boolean);
    const sr = serie();
    mostra(`<section class="carta">
      <div class="riga-alta"><h1>Ciao${S.nome ? ' ' + esc(S.nome) : ''}</h1><button class="icona" id="impo" aria-label="Impostazioni">${iconaImpo()}</button></div>
      <div class="numeri">
        <div><b>${ogg.length}</b><span>esercizi oggi</span></div>
        <div><b>${ogg.length ? Math.round((giuste / ogg.length) * 100) + '%' : '–'}</b><span>giusti oggi</span></div>
        <div><b>${sr}</b><span>giorni di fila</span></div>
      </div>
      <button class="pieno grande" id="vai">${S.corrente && !S.corrente.chiuso ? 'Riprendi l\'esercizio' : 'Esercizio'}</button>
      ${deboli.length ? `<p class="piccolo">Dove sbagli più spesso: ${deboli.map((m) => esc(m.titolo)).join(' · ')}. Torneranno con numeri nuovi.</p>` : ''}
    </section>
    <h3 class="titoletto">Il tuo percorso</h3>
    <section class="lista">${BLOCCHI.map((b) => {
      const aperto = S.sbloccati.includes(b.id);
      const p = S.profilo[b.id];
      const l = aperto ? livello(b.id) : 0;
      const quota = aperto ? Math.round(((p.r - 1) / 2.99) * 100) : 0;
      return `<button class="blocco${aperto ? '' : ' chiuso'}" data-b="${b.id}" ${aperto ? '' : 'disabled'}>
        <span class="bn">${esc(b.nome)}</span>
        <span class="bd">${aperto ? `Livello ${l} · ${NOMI_LIV[l]} · ${p.giuste}/${p.fatte} giusti` : 'Si apre con 3 esercizi giusti nel blocco prima'}</span>
        <span class="barra"><span style="width:${quota}%"></span></span>
      </button>`;
    }).join('')}</section>
    <p class="piccolo centro">Esercizi aggiornati al ${M.versione.split('-').reverse().join('/')} · ${M.MODELLI.length} modelli, numeri nuovi a ogni giro</p>`);
    document.getElementById('vai').onclick = () => { if (!S.corrente || S.corrente.chiuso) scegli(); esercizio(); };
    document.getElementById('impo').onclick = impostazioni;
    $app.querySelectorAll('.blocco[data-b]').forEach((el) => { el.onclick = () => { scegli(el.dataset.b); esercizio(); }; });
  }

  function esercizio() {
    const c = S.corrente;
    if (!c) { scegli(); return esercizio(); }
    const aiutiVisti = c.impostazione.slice(0, c.aiuti);
    const mostraSol = c.mostrata || c.risolto;
    mostra(`<section class="carta">
      <div class="riga-alta"><button class="vuoto piccolo-b" id="indietro">← Percorso</button><span class="etichetta liv${c.liv}">${esc(nomeBlocco(c.blocco))} · ${NOMI_LIV[c.liv]}</span></div>
      <h2>${esc(c.titolo)}</h2>
      <p>${esc(c.contesto)}</p>
      <table class="dati">${c.dati.map((d) => `<tr><td>${esc(d[0])}</td><td>${typeof d[1] === 'number' ? f(d[1]) : esc(d[1])} ${esc(d[2])}</td></tr>`).join('')}</table>
      <p class="richiesta">${esc(c.richiesta)}</p>
      ${aiutiVisti.length ? `<ol class="aiuti">${aiutiVisti.map((a) => `<li>${esc(a)}</li>`).join('')}</ol>` : ''}
      ${!mostraSol && c.aiuti < c.impostazione.length ? `<button class="vuoto" id="aiuto">${c.aiuti ? 'Un altro aiuto' : 'Come si imposta?'}</button>` : ''}
      ${!mostraSol ? `
        <div class="risposta"><input id="r" inputmode="decimal" autocomplete="off" placeholder="${esc(c.risposta.nome)} ="><span class="unita">${esc(c.risposta.unita)}</span></div>
        <div id="esito"></div>
        <div class="bottoni"><button class="pieno" id="ok">Controlla</button><button class="vuoto" id="sol">Mostra la soluzione</button></div>` : ''}
      ${mostraSol ? soluzioneHtml(c) : ''}
    </section>`);
    document.getElementById('indietro').onclick = home;
    const aiuto = document.getElementById('aiuto');
    if (aiuto) aiuto.onclick = () => { c.aiuti++; salva(); esercizio(); };
    if (!mostraSol) {
      const inp = document.getElementById('r');
      const controlla = () => {
        const v = numero(inp.value);
        const box = document.getElementById('esito');
        if (!isFinite(v)) { box.innerHTML = '<p class="avviso">Scrivi un numero (va bene anche con la virgola).</p>'; return; }
        c.tentativi++;
        if (giusto(v, c.risposta.valore, c.risposta.unita, c.liv)) {
          c.risolto = true; salva();
          esercizio();
          return;
        }
        salva();
        if (c.tentativi >= 2) { c.mostrata = true; salva(); esercizio(); return; }
        box.innerHTML = `<div class="avviso"><b>Non torna.</b> ${diagnosi(v, c).map(esc).join(' ')} Riprova: hai ancora un tentativo.</div>`;
        inp.select();
      };
      document.getElementById('ok').onclick = controlla;
      inp.onkeydown = (e) => { if (e.key === 'Enter') controlla(); };
      document.getElementById('sol').onclick = () => { c.mostrata = true; salva(); esercizio(); };
    } else {
      collegaDecisione(c);
    }
  }

  function soluzioneHtml(c) {
    const testa = c.risolto ? `<div class="ok"><b>Giusto!</b> ${esc(c.risposta.nome)} = ${f(c.risposta.valore)} ${esc(c.risposta.unita)}${c.tentativi > 1 ? ' (al secondo tentativo)' : ''}</div>`
      : `<div class="avviso"><b>Ecco come si fa.</b> Il risultato è ${esc(c.risposta.nome)} = ${f(c.risposta.valore)} ${esc(c.risposta.unita)}. Tornerà tra qualche esercizio con numeri nuovi.</div>`;
    const passi = `<details ${c.risolto ? '' : 'open'}><summary>Soluzione passo per passo</summary><ol class="passi">${c.passi.map((p) => `<li><span>${esc(p[0])}</span><code>${esc(p[1])} = ${f(p[2])} ${esc(p[3])}</code></li>`).join('')}</ol></details>`;
    let dec = '';
    if (c.decisione && !c.chiuso) {
      dec = `<div class="decisione"><p class="richiesta">E adesso decidi da progettista: ${esc(c.decisione.domanda)}</p>
        ${c.decisione.opzioni.map((o, i) => `<button class="scelta" data-i="${i}">${esc(o)}</button>`).join('')}</div>`;
    }
    let fine = '';
    if (c.chiuso || !c.decisione) {
      if (!c.chiuso) chiudi(c.risolto ? 'giusto' : 'sbagliato');
      const decTxt = c.decisione ? (c.decisa === c.decisione.giusta ? '<div class="ok">Decisione giusta.</div>' : `<div class="avviso">Decisione: la risposta era "${esc(c.decisione.opzioni[c.decisione.giusta])}".</div>`) : '';
      fine = `${decTxt}<div class="giudizio"><b>Da progettista.</b> ${esc(c.giudizio)}</div>
        ${c.novita ? `<div class="novita">${esc(c.novita)}</div>` : ''}
        <div class="bottoni"><button class="pieno" id="prossimo">Prossimo esercizio</button><button class="vuoto" id="casa">Percorso</button></div>`;
    }
    return testa + passi + dec + fine;
  }

  function collegaDecisione(c) {
    $app.querySelectorAll('.scelta').forEach((el) => {
      el.onclick = () => { c.decisa = Number(el.dataset.i); chiudi(c.risolto ? 'giusto' : 'sbagliato'); esercizio(); };
    });
    const p = document.getElementById('prossimo');
    if (p) p.onclick = () => { scegli(); esercizio(); };
    const h = document.getElementById('casa');
    if (h) h.onclick = home;
  }

  function impostazioni() {
    mostra(`<section class="carta">
      <div class="riga-alta"><button class="vuoto piccolo-b" id="indietro">← Percorso</button></div>
      <h2>Impostazioni</h2>
      <label class="campo">Nome<input id="nome" value="${esc(S.nome)}" maxlength="30"></label>
      <button class="vuoto" id="salvaNome">Salva il nome</button>
      <h3>I tuoi progressi</h3>
      <p class="piccolo">Restano solo su questo telefono. Se cambi telefono o cancelli i dati del browser si perdono: fai una copia ogni tanto.</p>
      <div class="bottoni"><button class="vuoto" id="esporta">Salva una copia</button><label class="vuoto file">Ripristina una copia<input type="file" id="importa" accept=".json,application/json" hidden></label></div>
      <p id="msg" class="piccolo"></p>
      <h3>Ricominciare</h3>
      <button class="rosso" id="reset">Cancella tutto e rifai il test</button>
      <p class="piccolo">Test d'ingresso: ${S.test ? `${S.test.punti}/12 il ${S.test.data.split('-').reverse().join('/')}` : 'non fatto'} · Esercizi fatti: ${S.storico.length}</p>
    </section>`);
    document.getElementById('indietro').onclick = home;
    document.getElementById('salvaNome').onclick = () => { S.nome = document.getElementById('nome').value.trim().slice(0, 30); salva(); document.getElementById('msg').textContent = 'Nome salvato.'; };
    document.getElementById('esporta').onclick = () => {
      const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `meccanica-progressi-${oggi()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
    };
    document.getElementById('importa').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      file.text().then((t) => {
        const s = JSON.parse(t);
        if (!s || !s.profilo || !Array.isArray(s.storico)) throw new Error('formato');
        S = Object.assign(nuovoStato(), s); salva();
        document.getElementById('msg').textContent = 'Copia ripristinata.';
      }).catch(() => { document.getElementById('msg').textContent = 'Questo file non è una copia dei progressi.'; });
    };
    document.getElementById('reset').onclick = () => {
      if (!confirm('Cancello tutti i progressi su questo telefono e rifai il test d\'ingresso?')) return;
      S = nuovoStato(); salva(); benvenuto();
    };
  }

  function ingranaggio() {
    return '<svg viewBox="0 0 100 100" width="72" height="72"><g fill="currentColor">' +
      Array.from({ length: 10 }, (_, i) => `<rect x="44" y="6" width="12" height="16" rx="2" transform="rotate(${i * 36} 50 50)"/>`).join('') +
      '<circle cx="50" cy="50" r="31"/></g><circle cx="50" cy="50" r="12" fill="var(--carta)"/></svg>';
  }
  function iconaImpo() { return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>'; }

  // ---------- avvio ----------
  if (!S.test) benvenuto(); else home();
})();
