// Esercizi del ripasso di meccanica (app "Meccanica", dal 21/11/2026).
// Ogni modello genera un esercizio nuovo a ogni giro, con numeri diversi, in 3 livelli:
//   1 Guidato     numeri comodi, impostazione già aperta
//   2 Normale     unità miste, l'aiuto si apre solo se lo chiedi
//   3 Progettista il problema al contrario: scegli tu la misura (diametro, motore, molla...)
// Per aggiungere un esercizio: un nuovo oggetto in MODELLI con id, blocco, titolo e genera(livello, R).
// genera() restituisce { contesto, richiesta, dati:[[nome,valore,unità]], impostazione:[...],
//   risposta:{nome, valore, unita}, passi:[[cosa, formula, valore, unità]], decisione?:{domanda, opzioni, giusta}, giudizio }.
(function () {
  const G = 9.81;
  const PI = Math.PI;

  function f(x) { // come fmt() di risolvi.py: virgola italiana, punto per le migliaia
    if (!isFinite(x)) return String(x);
    const a = Math.abs(x);
    if (a >= 1000) return Math.round(x).toLocaleString('it-IT');
    if (a >= 10) { const s = x.toFixed(1); return (s.endsWith('.0') ? s.slice(0, -2) : s).replace('.', ','); }
    if (a >= 0.01) return x.toFixed(3).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
    if (a === 0) return '0';
    return x.toExponential(2).replace('.', ',');
  }

  function prossimo(lista, x) { // il primo valore di catalogo che basta
    for (const v of lista) if (v >= x - 1e-9) return v;
    return lista[lista.length - 1];
  }

  function sceltaCatalogo(lista, x, unita) {
    const g = prossimo(lista, x);
    const i = lista.indexOf(g);
    const spost = Math.floor(Math.random() * 4); // la risposta giusta non sta sempre nello stesso posto
    const da = Math.max(0, Math.min(i - spost, lista.length - 4));
    const opz = lista.slice(da, da + 4);
    return { opzioni: opz.map((v) => f(v) + (unita ? ' ' + unita : '')), giusta: opz.indexOf(g), valore: g };
  }

  // Il primo valore di catalogo sopra x, scelto a caso tra quello sotto, quello giusto e quello sopra:
  // così l'esercizio a volte passa e a volte no.
  function vicino(lista, x) {
    let i = lista.findIndex((v) => v >= x);
    if (i < 0) i = lista.length - 1;
    const scelte = [i - 1, i, i, i + 1].filter((k) => k >= 0 && k < lista.length);
    return lista[scelte[Math.floor(Math.random() * scelte.length)]];
  }

  // Domanda di schema: la prima opzione è quella giusta, poi si mescolano.
  function schema(domanda, opzioni, spiega) {
    const ordine = opzioni.map((o, i) => [o, i]).sort(() => Math.random() - 0.5);
    return { domanda, opzioni: ordine.map((x) => x[0]), giusta: ordine.findIndex((x) => x[1] === 0), spiega };
  }

  const BLOCCHI = [
    { id: 'b1', nome: 'Basi applicate', dettaglio: 'unità, trigonometria, energia, dilatazioni' },
    { id: 'b2', nome: 'Statica', dettaglio: 'forze, momenti, reazioni vincolari' },
    { id: 'b3', nome: 'Scienza delle costruzioni applicata', dettaglio: 'perni, leve, ganci, Von Mises, Eulero, frecce, intagli' },
    { id: 'b4', nome: 'Materiali', dettaglio: 'estensimetri, scelta dell\'acciaio, i due mondi' },
    { id: 'b5', nome: 'Meccanica applicata', dettaglio: 'trasmissioni, attrito, freni, cinghie, avviamento' },
    { id: 'b6', nome: 'Elementi costruttivi', dettaglio: 'cuscinetti, viti, saldature, chiavette, molle' },
    { id: 'b7', nome: 'Disegno e tolleranze', dettaglio: 'accoppiamenti, montaggio a caldo' },
    { id: 'b8', nome: 'Termodinamica', dettaglio: 'calore, riscaldamento, raffreddamento' },
  ];

  const MARGINE = ['Sì, con margine (oltre il 15%)', 'Sì, ma al limite (0–15%)', 'No, non basta'];
  function giustaMargine(ha, serve) { const m = ha / serve - 1; return m > 0.15 ? 0 : m >= 0 ? 1 : 2; }

  const MODELLI = [
    // ---------------- BLOCCO 1 ----------------
    {
      id: 'cilindro', blocco: 'b1', titolo: 'Il cilindro basta per serrare il pezzo?',
      genera(liv, R) {
        const eta = 0.9;
        if (liv === 3) {
          const Fr = R.tra(800, 3000, 100), pmin = R.da([4.5, 5, 5.5]);
          const Fp = Fr * 1.2;
          const p = pmin * 0.1;
          const Dmin = Math.sqrt(4 * Fp / (PI * p * eta));
          const cat = [25, 32, 40, 50, 63, 80, 100, 125];
          const sc = sceltaCatalogo(cat, Dmin, 'mm');
          return {
            contesto: `Devi scegliere il cilindro pneumatico di un bloccaggio che deve tenere ${f(Fr)} N. La rete è a 6 bar ma nei momenti di punta scende a ${f(pmin)} bar. Vuoi il 20% di margine. Rendimento del cilindro circa 0,9.`,
            richiesta: 'Diametro minimo del pistone, in mm. Poi scegli il cilindro di catalogo.',
            dati: [['F richiesta', Fr, 'N'], ['p minima', pmin, 'bar'], ['margine', 20, '%'], ['η', eta, '']],
            impostazione: ['Si progetta sul caso peggiore: la pressione minima, non quella nominale.', 'Forza da garantire: F = 1,2 · F richiesta.', 'F = p · (π D²/4) · η, quindi D = √(4F / (π p η)), con p in MPa e D in mm.', 'Arrotonda sempre al catalogo verso l\'alto.'],
            risposta: { nome: 'D minimo', valore: Dmin, unita: 'mm' },
            passi: [['Forza con il margine', `F = ${f(Fr)} · 1,2`, Fp, 'N'], ['Pressione minima in MPa', `p = ${f(pmin)} · 0,1`, p, 'MPa'], ['Diametro minimo', 'D = √(4F / (π · p · η))', Dmin, 'mm']],
            decisione: { domanda: 'Quale cilindro di catalogo monti?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `Serve almeno Ø${f(Dmin)} mm: si monta il Ø${sc.valore}. Con la pressione nominale avrai ancora più margine, ma il progetto si fa sul caso peggiore.`,
          };
        }
        const D = liv === 1 ? R.da([40, 50, 63]) : R.da([32, 40, 50, 63, 80]);
        const pbar = liv === 1 ? 6 : R.da([5.5, 6, 6.5, 7]);
        const pTesto = liv === 1 ? `${f(pbar)} bar` : `${f(pbar * 100)} kPa`;
        const p = pbar * 0.1;
        const A = PI * D * D / 4;
        const F = p * A * eta;
        const Fr = Math.round(F * R.da([0.75, 0.9, 0.95, 1.1, 1.25]) / 50) * 50;
        return {
          contesto: `Su una macchina di montaggio un pezzo va bloccato con almeno ${f(Fr)} N. In officina c'è un cilindro pneumatico Ø${D} mm e la rete d'aria è a ${pTesto}. Il catalogo dà un rendimento di circa 0,9 per gli attriti delle guarnizioni.`,
          richiesta: 'Forza reale di spinta del cilindro, in N.',
          dati: [['D', D, 'mm'], ['p', liv === 1 ? pbar : pbar * 100, liv === 1 ? 'bar' : 'kPa'], ['η', eta, ''], ['F richiesta', Fr, 'N']],
          impostazione: ['In spinta la pressione agisce su tutta l\'area del pistone.', liv === 1 ? 'Porta i bar in MPa (1 bar = 0,1 MPa = 0,1 N/mm²): con l\'area in mm² esce subito N.' : 'Porta i kPa in MPa (1000 kPa = 1 MPa = 1 N/mm²): con l\'area in mm² esce subito N.', 'F = p · A · η.', 'Confronta con la forza richiesta e calcola il margine.'],
          risposta: { nome: 'F', valore: F, unita: 'N' },
          passi: [['Pressione in MPa', liv === 1 ? `p = ${f(pbar)} · 0,1` : `p = ${f(pbar * 100)} / 1000`, p, 'MPa'], ['Area del pistone', `A = π · ${D}² / 4`, A, 'mm²'], ['Forza teorica', 'F₀ = p · A', p * A, 'N'], ['Forza reale', 'F = F₀ · η', F, 'N'], ['Margine sul richiesto', `(F − ${f(Fr)}) / ${f(Fr)}`, (F / Fr - 1) * 100, '%']],
          decisione: { domanda: 'Il cilindro basta?', opzioni: MARGINE, giusta: giustaMargine(F, Fr) },
          giudizio: `Il cilindro spinge ${f(F)} N contro ${f(Fr)} N richiesti (${F >= Fr ? '+' : ''}${f((F / Fr - 1) * 100)}%). In officina la rete scende spesso di 1 bar: sotto il 15% di margine conviene il diametro più grande.`,
        };
      },
    },
    {
      id: 'motoriduttore', blocco: 'b1', titolo: 'Il motoriduttore muove il rullo?',
      genera(liv, R) {
        if (liv === 3) {
          const C = R.tra(120, 600, 10), n = R.tra(15, 60, 1), eta = 0.85, fs = 1.4;
          const w = 2 * PI * n / 60;
          const P = C * fs * w / eta / 1000;
          const sc = sceltaCatalogo([0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11], P, 'kW');
          return {
            contesto: `Un nastro trasportatore chiede ${f(C)} N·m al rullo a ${n} giri/min. Per gli avviamenti frequenti usi un fattore di servizio 1,4. Il riduttore ha rendimento 0,85.`,
            richiesta: 'Potenza minima del motore, in kW. Poi scegli il motore di catalogo.',
            dati: [['C rullo', C, 'N·m'], ['n uscita', n, 'giri/min'], ['fattore di servizio', fs, ''], ['η riduttore', eta, '']],
            impostazione: ['ω = 2π n / 60 in rad/s.', 'Potenza all\'uscita: P = C · ω · fattore di servizio.', 'Il motore deve dare anche quello che il riduttore perde: P motore = P uscita / η.', 'Arrotonda al motore di catalogo verso l\'alto.'],
            risposta: { nome: 'P motore', valore: P, unita: 'kW' },
            passi: [['Velocità angolare', `ω = 2π · ${n} / 60`, w, 'rad/s'], ['Potenza all\'uscita con il fattore di servizio', `P = ${f(C)} · ω · 1,4`, C * w * fs, 'W'], ['Potenza del motore', 'P = P uscita / 0,85', P, 'kW']],
            decisione: { domanda: 'Quale motore scegli?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `Servono ${f(P)} kW: si prende il ${f(sc.valore)} kW. Controlla poi la coppia di spunto del motore: all'avvio a pieno carico è quella che conta.`,
          };
        }
        const P = R.da([0.37, 0.55, 0.75, 1.1]), eta = 0.85;
        let n, nTesto, passiN;
        if (liv === 1) {
          n = R.tra(20, 60, 1);
          nTesto = `uscita a ${n} giri/min`;
          passiN = [];
        } else {
          const n1 = R.da([1400, 1450, 2800]), i = R.da([25, 30, 40, 50, 60]);
          n = n1 / i;
          nTesto = `motore a ${n1} giri/min e rapporto di riduzione i = ${i}`;
          passiN = [['Giri in uscita', `n = ${n1} / ${i}`, n, 'giri/min']];
        }
        const w = 2 * PI * n / 60;
        const C = P * 1000 * eta / w;
        const Cr = Math.round(C * R.da([0.8, 0.9, 0.95, 1.1, 1.2]) / 5) * 5;
        return {
          contesto: `Un rullo di un trasportatore chiede ${f(Cr)} N·m per partire a pieno carico. Il fornitore propone un motoriduttore da ${f(P)} kW, ${nTesto}, rendimento del riduttore 0,85.`,
          richiesta: 'Coppia disponibile all\'albero di uscita, in N·m.',
          dati: [['P motore', P, 'kW'], ...(liv === 1 ? [['n uscita', n, 'giri/min']] : []), ['η', eta, ''], ['C richiesta', Cr, 'N·m']],
          impostazione: [...(liv === 1 ? [] : ['Prima i giri all\'uscita: n = n motore / i.']), 'Potenza = coppia × velocità angolare: C = P / ω.', 'ω in rad/s: ω = 2π n / 60. P in W.', 'All\'uscita arriva P · η.'],
          risposta: { nome: 'C', valore: C, unita: 'N·m' },
          passi: [...passiN, ['Velocità angolare in uscita', 'ω = 2π · n / 60', w, 'rad/s'], ['Potenza all\'uscita', `P = ${f(P * 1000)} W · 0,85`, P * 1000 * eta, 'W'], ['Coppia all\'uscita', 'C = P / ω', C, 'N·m']],
          decisione: { domanda: 'Basta per il rullo?', opzioni: MARGINE, giusta: giustaMargine(C, Cr) },
          giudizio: `${f(C)} N·m contro ${f(Cr)} richiesti. Per la partenza a pieno carico controlla la coppia di spunto del motore sul catalogo (di solito 2–2,5 volte la nominale) e il fattore di servizio del riduttore.`,
        };
      },
    },
    {
      id: 'funi', blocco: 'b1', titolo: 'Le due funi reggono la cassa?',
      genera(liv, R) {
        const m = R.tra(200, 1200, 50);
        const W = m * G;
        if (liv === 3) {
          const T = Math.round(W * R.da([0.6, 0.7, 0.8]) / 100) * 100;
          const c = W / (2 * T);
          const a = Math.acos(c) * 180 / PI;
          return {
            contesto: `Devi sollevare una cassa di ${m} kg con due funi agganciate allo stesso gancio. Ogni fune ha un carico di lavoro di ${f(T)} N. L'operatore chiede quanto può aprire le funi.`,
            richiesta: 'Angolo massimo TRA le due funi, in gradi.',
            dati: [['m', m, 'kg'], ['T ammessa', T, 'N']],
            impostazione: ['Equilibrio al gancio: 2 · T · cos α = m · g, con α tra fune e verticale.', 'cos α = m g / (2 T), quindi α = arccos(...).', 'L\'angolo tra le funi è 2α.'],
            risposta: { nome: 'angolo tra le funi', valore: 2 * a, unita: '°' },
            passi: [['Peso', `W = ${m} · 9,81`, W, 'N'], ['cos α', `cos α = W / (2 · ${f(T)})`, c, ''], ['α con la verticale', 'α = arccos(...)', a, '°'], ['Angolo tra le funi', '2α', 2 * a, '°']],
            giudizio: `Al massimo ${f(2 * a)}° tra le funi. In pratica si sta sotto: sopra 90° le tensioni crescono in fretta e un piccolo errore di aggancio porta oltre il limite.`,
          };
        }
        const a = liv === 1 ? R.da([30, 45]) : R.da([40, 45, 50, 60]);
        const ar = a * PI / 180;
        const T = W / (2 * Math.cos(ar));
        const Ta = Math.round(T * R.da([0.85, 0.95, 1.1, 1.3]) / 100) * 100;
        const angTesto = liv === 1 ? `Ogni fune forma ${a}° con la verticale.` : `Le due funi formano ${2 * a}° tra loro.`;
        return {
          contesto: `Una cassa di ${m} kg viene sollevata con due funi agganciate allo stesso gancio. ${angTesto} Le funi in magazzino hanno un carico di lavoro di ${f(Ta)} N ciascuna.`,
          richiesta: 'Tensione in ogni fune, in N.',
          dati: [['m', m, 'kg'], [liv === 1 ? 'α (con la verticale)' : 'angolo tra le funi', liv === 1 ? a : 2 * a, '°'], ['T ammessa', Ta, 'N']],
          impostazione: [...(liv === 1 ? [] : ['L\'angolo che conta è quello con la verticale: la metà dell\'angolo tra le funi.']), 'Disegna il nodo del gancio: peso in giù, due tensioni inclinate.', 'Le orizzontali si annullano, le verticali reggono il peso: 2 · T · cos α = m · g.', 'Confronta con il carico di lavoro.'],
          risposta: { nome: 'T', valore: T, unita: 'N' },
          passi: [['Peso della cassa', `W = ${m} · 9,81`, W, 'N'], ...(liv === 1 ? [] : [['Angolo con la verticale', `α = ${2 * a} / 2`, a, '°']]), ['cos α', `cos ${a}°`, Math.cos(ar), ''], ['Tensione', 'T = W / (2 · cos α)', T, 'N']],
          decisione: { domanda: 'Le funi vanno bene?', opzioni: MARGINE, giusta: giustaMargine(Ta, T) },
          giudizio: `Ogni fune tira ${f(T)} N contro ${f(Ta)} ammessi. Più si aprono, più tirano: chiudere l'angolo (funi più lunghe) è spesso la soluzione più economica.`,
        };
      },
    },
    {
      id: 'molla', blocco: 'b1', titolo: 'La molla di fine corsa ferma il carrello?',
      genera(liv, R) {
        const m = R.tra(5, 40, 1), v = R.da([0.5, 0.6, 0.8, 1, 1.2]);
        const Ec = 0.5 * m * v * v;
        if (liv === 3) {
          const s = R.da([20, 25, 30, 40]);
          const kmin = 2 * Ec / Math.pow(s / 1000, 2) / 1000;
          const Fp = kmin * s;
          return {
            contesto: `Un carrello di ${m} kg arriva a fine corsa a ${f(v)} m/s. Hai spazio per una molla con corsa utile di ${s} mm e la vuoi scegliere dal catalogo.`,
            richiesta: 'Rigidezza minima della molla, in N/mm, per fermare il carrello dentro la corsa utile.',
            dati: [['m', m, 'kg'], ['v', v, 'm/s'], ['corsa utile', s, 'mm']],
            impostazione: ['Energia del carrello: E = ½ m v².', 'La molla a corsa piena assorbe ½ k s².', 'k = 2E / s², con s in m esce N/m: dividi per 1000 per avere N/mm.', 'Pensa anche alla forza di picco F = k · s: il telaio la deve reggere.'],
            risposta: { nome: 'k minima', valore: kmin, unita: 'N/mm' },
            passi: [['Energia cinetica', `E = 0,5 · ${m} · ${f(v)}²`, Ec, 'J'], ['Rigidezza minima', `k = 2E / (${s}/1000)²`, kmin * 1000, 'N/m'], ['In N/mm', 'k / 1000', kmin, 'N/mm'], ['Forza di picco', `F = k · ${s}`, Fp, 'N']],
            giudizio: `Serve almeno ${f(kmin)} N/mm: prendi la molla di catalogo subito sopra. Una molla più rigida ferma prima ma dà un picco più alto (qui ${f(Fp)} N): spesso conviene un ammortizzatore.`,
          };
        }
        const k = R.da([4, 6, 8, 10, 12, 15]), x = R.da([20, 25, 30, 40]);
        const Em = 0.5 * k * 1000 * Math.pow(x / 1000, 2);
        const xu = Math.sqrt(2 * Ec / (k * 1000)) * 1000;
        const base = {
          contesto: `Un carrello di ${m} kg arriva a fine corsa a ${f(v)} m/s. Come fermo c'è una molla con rigidezza ${k} N/mm e corsa utile ${x} mm.`,
          dati: [['m', m, 'kg'], ['v', v, 'm/s'], ['k', k, 'N/mm'], ['corsa utile', x, 'mm']],
          decisione: { domanda: 'Il carrello si ferma prima che la molla vada a pacco?', opzioni: ['Sì', 'No, va a pacco'], giusta: xu <= x ? 0 : 1 },
          giudizio: xu <= x ? `Si ferma dopo ${f(xu)} mm su ${x}: la molla basta. Il fermo deve reggere circa ${f(k * xu)} N di picco.` : `Servirebbero ${f(xu)} mm ma la corsa è ${x}: la molla va a pacco e il colpo arriva sul telaio. Serve una molla più rigida o più corsa.`,
        };
        if (liv === 1) {
          return Object.assign(base, {
            richiesta: 'Energia che la molla assorbe a corsa piena, in J.',
            impostazione: ['Il carrello porta E = ½ m v².', 'La molla assorbe ½ k x² (l\'area del triangolo forza-corsa).', 'Unità: k in N/m e x in m, così esce J.', 'Se E molla ≥ E carrello si ferma.'],
            risposta: { nome: 'E molla', valore: Em, unita: 'J' },
            passi: [['Energia cinetica del carrello', `E = 0,5 · ${m} · ${f(v)}²`, Ec, 'J'], ['Rigidezza in N/m', `k = ${k} · 1000`, k * 1000, 'N/m'], ['Corsa in m', `x = ${x} / 1000`, x / 1000, 'm'], ['Energia della molla a corsa piena', 'E = ½ · k · x²', Em, 'J']],
          });
        }
        return Object.assign(base, {
          richiesta: 'Corsa che la molla usa davvero per fermare il carrello, in mm.',
          impostazione: ['Il carrello porta E = ½ m v².', 'La molla si ferma quando ½ k x² = E, quindi x = √(2E / k).', 'k in N/m, il risultato in m: poi portalo in mm.'],
          risposta: { nome: 'x', valore: xu, unita: 'mm' },
          passi: [['Energia cinetica', `E = 0,5 · ${m} · ${f(v)}²`, Ec, 'J'], ['Rigidezza in N/m', `k = ${k} · 1000`, k * 1000, 'N/m'], ['Corsa usata', 'x = √(2E / k) · 1000', xu, 'mm']],
        });
      },
    },
    {
      id: 'dilatazione', blocco: 'b1', titolo: 'Il gioco del cuscinetto flottante basta?',
      genera(liv, R) {
        const aS = 12e-6;
        if (liv === 3) {
          const L = R.tra(400, 1200, 50), dTa = R.tra(40, 70, 5), dTc = R.tra(10, 25, 5), aAl = 23e-6;
          const dS = aS * L * dTa, dC = aAl * L * dTc, rel = dS - dC;
          const gioco = R.da([0.1, 0.15, 0.2, 0.3]);
          return {
            contesto: `Un albero d'acciaio lungo ${L} mm tra i cuscinetti si scalda di ${dTa} °C in esercizio. La carcassa è in alluminio e si scalda solo di ${dTc} °C. Un cuscinetto è fisso, l'altro flottante con ${f(gioco)} mm di gioco assiale. α acciaio 12·10⁻⁶ 1/°C, α alluminio 23·10⁻⁶ 1/°C.`,
            richiesta: 'Di quanto l\'albero si allunga RISPETTO alla carcassa, in mm?',
            dati: [['L', L, 'mm'], ['ΔT albero', dTa, '°C'], ['ΔT carcassa', dTc, '°C'], ['gioco', gioco, 'mm']],
            impostazione: ['Si allungano tutti e due: conta la differenza.', 'ΔL albero = α_acciaio · L · ΔT albero.', 'ΔL carcassa = α_alluminio · L · ΔT carcassa.', 'Differenza = ΔL albero − ΔL carcassa.'],
            risposta: { nome: 'ΔL relativo', valore: rel, unita: 'mm' },
            passi: [['Allungamento albero', `12·10⁻⁶ · ${L} · ${dTa}`, dS, 'mm'], ['Allungamento carcassa', `23·10⁻⁶ · ${L} · ${dTc}`, dC, 'mm'], ['Differenza', 'ΔL albero − ΔL carcassa', rel, 'mm']],
            decisione: { domanda: `Il gioco di ${f(gioco)} mm basta?`, opzioni: ['Sì', 'No'], giusta: rel <= gioco ? 0 : 1 },
            giudizio: `L'albero cresce di ${f(rel)} mm più della carcassa, contro ${f(gioco)} mm di gioco. Attenzione al transitorio: all'avviamento l'albero si scalda prima della carcassa e la differenza è peggiore.`,
          };
        }
        let L, dT, Ltesto, dTtesto, passiPre = [];
        if (liv === 1) {
          L = R.tra(400, 1200, 50); dT = R.tra(20, 60, 5);
          Ltesto = `${L} mm`; dTtesto = `lavora a ${dT} °C più dell'ambiente di montaggio`;
        } else {
          const Lm = R.da([0.6, 0.8, 1, 1.2, 1.5]); const t1 = 20, t2 = R.tra(55, 90, 5);
          L = Lm * 1000; dT = t2 - t1;
          Ltesto = `${f(Lm)} m`; dTtesto = `viene montato a ${t1} °C e in esercizio arriva a ${t2} °C`;
          passiPre = [['Lunghezza in mm', `${f(Lm)} · 1000`, L, 'mm'], ['Salto di temperatura', `${t2} − ${t1}`, dT, '°C']];
        }
        const dL = aS * L * dT;
        const gioco = R.da([0.2, 0.3, 0.5]);
        return {
          contesto: `Un albero d'acciaio lungo ${Ltesto} tra i cuscinetti ${dTtesto}. Un cuscinetto è fisso, l'altro flottante con ${f(gioco)} mm di gioco assiale. α acciaio 12·10⁻⁶ 1/°C; la carcassa si scalda poco (la trascuri).`,
          richiesta: 'Allungamento dell\'albero, in mm.',
          dati: [['L', liv === 1 ? L : L / 1000, liv === 1 ? 'mm' : 'm'], ['ΔT', dT, '°C'], ['α', '12·10⁻⁶', '1/°C'], ['gioco', gioco, 'mm']],
          impostazione: ['Dilatazione lineare: ΔL = α · L · ΔT.', 'Ordine di grandezza: 12 µm per metro e per grado.', 'Confronta con il gioco: se non basta il cuscinetto si carica assialmente e scalda.'],
          risposta: { nome: 'ΔL', valore: dL, unita: 'mm' },
          passi: [...passiPre, ['Dilatazione lineare', `ΔL = 12·10⁻⁶ · ${L} · ${dT}`, dL, 'mm'], ['Gioco che resta', `${f(gioco)} − ΔL`, gioco - dL, 'mm']],
          decisione: { domanda: `Il gioco di ${f(gioco)} mm basta?`, opzioni: ['Sì', 'No'], giusta: dL <= gioco ? 0 : 1 },
          giudizio: dL <= gioco ? `L'albero si allunga di ${f(dL)} mm: il gioco basta, con ${f(gioco - dL)} mm che restano.` : `L'albero si allunga di ${f(dL)} mm ma il gioco è ${f(gioco)}: NON basta. Più gioco, o un cuscinetto a rulli cilindrici che lascia scorrere l'albero.`,
        };
      },
    },

    // ---------------- BLOCCO 2 ----------------
    {
      id: 'trave-appoggiata', blocco: 'b2', titolo: 'Quanto carica ogni appoggio della trave?',
      genera(liv, R) {
        const L = R.da([2000, 2500, 3000, 4000, 5000]);
        if (liv === 3) {
          const m = R.tra(250, 2000, 50), q = R.da([20, 30, 42, 57]), c = R.da([200, 300, 400]);
          const P = m * G, Q = q * G * L / 1000;
          const Rmax = P * (L - c) / L + Q / 2;
          const Ramm = Math.round(Rmax * R.da([0.9, 1.05, 1.3]) / 100) * 100;
          return {
            contesto: `Una trave lunga ${f(L / 1000)} m, appoggiata alle due estremità, porta un paranco da ${m} kg che scorre su tutta la luce (il carrello si avvicina agli appoggi fino a ${c} mm). La trave pesa ${q} kg/m. Ogni mensola d'appoggio è data per ${f(Ramm)} N.`,
            richiesta: 'Reazione MASSIMA su un appoggio, in N.',
            dati: [['luce', L, 'mm'], ['m paranco', m, 'kg'], ['q trave', q, 'kg/m'], ['distanza minima', c, 'mm'], ['R ammessa', Ramm, 'N']],
            impostazione: ['Il caso peggiore per l\'appoggio A è il paranco più vicino possibile ad A.', 'Momenti attorno a B: R_A · L = P · (L − c) + Q · L/2.', 'Il peso della trave si divide a metà.'],
            risposta: { nome: 'R max', valore: Rmax, unita: 'N' },
            passi: [['Peso del paranco', `P = ${m} · 9,81`, P, 'N'], ['Peso della trave', `Q = ${q} · 9,81 · ${f(L / 1000)}`, Q, 'N'], ['Quota del paranco su A', `P · (L − ${c}) / L`, P * (L - c) / L, 'N'], ['Reazione massima', '+ Q / 2', Rmax, 'N']],
            decisione: { domanda: 'Le mensole bastano?', opzioni: MARGINE, giusta: giustaMargine(Ramm, Rmax) },
            giudizio: `Al massimo ${f(Rmax)} N su un appoggio contro ${f(Ramm)} N ammessi. Per un paranco si aggiunge anche un coefficiente dinamico (spesso 1,1–1,3) per le partenze del sollevamento.`,
          };
        }
        if (liv === 1) {
          const F = R.tra(1000, 10000, 500), a = R.tra(L * 0.2, L * 0.8, 100);
          const RA = F * (L - a) / L;
          return {
            contesto: `Una trave lunga ${L} mm è appoggiata alle due estremità A e B. A ${a} mm da A c'è un carico di ${f(F)} N (un motore appoggiato sul telaio).`,
            richiesta: 'Reazione sull\'appoggio A, in N.',
            dati: [['L', L, 'mm'], ['F', F, 'N'], ['distanza da A', a, 'mm']],
            impostazione: ['Equilibrio dei momenti attorno a B: così R_B sparisce.', 'R_A · L = F · (L − a).', 'Controllo: R_A + R_B = F.'],
            risposta: { nome: 'R_A', valore: RA, unita: 'N' },
            passi: [['Braccio del carico rispetto a B', `L − a = ${L} − ${a}`, L - a, 'mm'], ['Reazione in A', `R_A = ${f(F)} · ${L - a} / ${L}`, RA, 'N'], ['Reazione in B', 'R_B = F − R_A', F - RA, 'N']],
            giudizio: `R_A = ${f(RA)} N, R_B = ${f(F - RA)} N: l'appoggio più vicino al carico prende di più. Controllo veloce: la somma deve dare il carico.`,
          };
        }
        const F1 = R.tra(1, 6, 0.5), F2 = R.tra(1, 6, 0.5), a1 = R.tra(L * 0.15, L * 0.45, 100), a2 = R.tra(L * 0.55, L * 0.85, 100);
        const RA = (F1 * 1000 * (L - a1) + F2 * 1000 * (L - a2)) / L;
        return {
          contesto: `Una trave lunga ${f(L / 1000)} m è appoggiata in A e B. Porta due carichi: ${f(F1)} kN a ${a1} mm da A e ${f(F2)} kN a ${a2} mm da A.`,
          richiesta: 'Reazione sull\'appoggio A, in N.',
          dati: [['L', L / 1000, 'm'], ['F1', F1, 'kN'], ['a1', a1, 'mm'], ['F2', F2, 'kN'], ['a2', a2, 'mm']],
          impostazione: ['Porta tutto nelle stesse unità: N e mm.', 'Momenti attorno a B: R_A · L = F1 · (L − a1) + F2 · (L − a2).', 'Controllo: R_A + R_B = F1 + F2.'],
          risposta: { nome: 'R_A', valore: RA, unita: 'N' },
          passi: [['Luce in mm', `${f(L / 1000)} · 1000`, L, 'mm'], ['Momento di F1 attorno a B', `${f(F1 * 1000)} · ${L - a1}`, F1 * 1000 * (L - a1), 'N·mm'], ['Momento di F2 attorno a B', `${f(F2 * 1000)} · ${L - a2}`, F2 * 1000 * (L - a2), 'N·mm'], ['Reazione in A', 'R_A = somma / L', RA, 'N']],
          giudizio: `R_A = ${f(RA)} N e R_B = ${f((F1 + F2) * 1000 - RA)} N. Il trucco è scegliere il polo dei momenti su un'incognita: così ne resta una sola.`,
        };
      },
    },
    {
      id: 'mensola', blocco: 'b2', titolo: 'Che momento arriva all\'attacco della mensola?',
      genera(liv, R) {
        const L = R.da([300, 400, 500, 600, 800]);
        const F = R.tra(500, 4000, 100);
        const M = F * L / 1000;
        if (liv === 3) {
          const h = R.da([100, 120, 150, 200]);
          const Fv = M * 1000 / h;
          const sc = sceltaCatalogo([5000, 8000, 12000, 18000, 25000, 35000, 50000, 70000], Fv * 1.25, 'N');
          return {
            contesto: `Una mensola sporge ${L} mm da un montante e porta in punta ${f(F)} N. È fissata con una piastra e due viti, una in alto e una in basso, a ${h} mm di distanza. La piastra fa leva sul bordo basso: la vite alta lavora a trazione.`,
            richiesta: 'Forza di trazione sulla vite alta, in N.',
            dati: [['sbalzo', L, 'mm'], ['F', F, 'N'], ['distanza viti', h, 'mm']],
            impostazione: ['Momento all\'attacco: M = F · L.', 'La piastra ruota attorno al bordo basso: la vite alta deve dare lo stesso momento.', 'F vite = M / h (stessa unità: N·mm e mm).'],
            risposta: { nome: 'F vite', valore: Fv, unita: 'N' },
            passi: [['Momento all\'attacco', `M = ${f(F)} · ${L}`, F * L, 'N·mm'], ['Trazione sulla vite alta', `F = M / ${h}`, Fv, 'N']],
            decisione: { domanda: 'Con il 25% di margine, quale carico ammesso deve avere la vite?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `La vite alta tira ${f(Fv)} N, cioè ${f(Fv / F)} volte il carico in punta: è l'effetto leva. Allontanare le viti è il modo più economico per scaricarle.`,
          };
        }
        if (liv === 1) {
          return {
            contesto: `Una mensola sporge ${L} mm da una parete e porta in punta un carico di ${f(F)} N.`,
            richiesta: 'Momento all\'incastro, in N·m.',
            dati: [['L', L, 'mm'], ['F', F, 'N']],
            impostazione: ['Momento = forza × braccio.', 'Il braccio va in metri per avere N·m.'],
            risposta: { nome: 'M', valore: M, unita: 'N·m' },
            passi: [['Braccio in m', `${L} / 1000`, L / 1000, 'm'], ['Momento all\'incastro', `M = ${f(F)} · ${f(L / 1000)}`, M, 'N·m']],
            giudizio: `${f(M)} N·m all'incastro. È il punto più caricato della mensola: lì si controllano saldature o viti.`,
          };
        }
        const q = R.da([5, 8, 12, 20]);
        const qN = q * G;
        const Mq = qN * Math.pow(L / 1000, 2) / 2;
        return {
          contesto: `Una mensola in acciaio sporge ${L} mm e porta in punta ${f(F)} N. La mensola stessa pesa ${q} kg/m e non lo vuoi trascurare.`,
          richiesta: 'Momento totale all\'incastro, in N·m.',
          dati: [['L', L, 'mm'], ['F', F, 'N'], ['peso proprio', q, 'kg/m']],
          impostazione: ['Due contributi: il carico in punta e il peso distribuito.', 'Carico in punta: F · L.', 'Peso distribuito q (in N/m): equivale a q · L applicato a metà, quindi q · L² / 2.'],
          risposta: { nome: 'M', valore: M + Mq, unita: 'N·m' },
          passi: [['Momento del carico in punta', `${f(F)} · ${f(L / 1000)}`, M, 'N·m'], ['Peso proprio in N/m', `q = ${q} · 9,81`, qN, 'N/m'], ['Momento del peso proprio', `q · ${f(L / 1000)}² / 2`, Mq, 'N·m'], ['Momento totale', 'somma', M + Mq, 'N·m']],
          giudizio: `${f(M + Mq)} N·m, di cui ${f(Mq)} dal peso proprio (${f(Mq / (M + Mq) * 100)}%). Su mensole corte si trascura, su quelle lunghe e pesanti no.`,
        };
      },
    },

    // ---------------- BLOCCO 3 ----------------
    {
      id: 'tirante', blocco: 'b3', titolo: 'Il tirante resiste?',
      genera(liv, R) {
        const Rs = 235, nu = 1.5, amm = Rs / nu;
        if (liv === 3) {
          const F = R.tra(10, 80, 2);
          const d = Math.sqrt(4 * F * 1000 * nu / (PI * Rs));
          const sc = sceltaCatalogo([10, 12, 14, 16, 18, 20, 22, 25, 30, 35], d, 'mm');
          return {
            contesto: `Devi dimensionare un tirante tondo pieno in S235 (snervamento 235 MPa) che porta ${f(F)} kN a trazione. Coefficiente di sicurezza 1,5.`,
            richiesta: 'Diametro minimo, in mm. Poi scegli la barra commerciale.',
            dati: [['F', F, 'kN'], ['Rs', Rs, 'MPa'], ['ν', nu, '']],
            impostazione: ['Tensione ammissibile: σ amm = Rs / ν.', 'Area minima: A = F / σ amm (F in N, così esce mm²).', 'd = √(4A / π).'],
            risposta: { nome: 'd minimo', valore: d, unita: 'mm' },
            passi: [['Tensione ammissibile', '235 / 1,5', amm, 'MPa'], ['Area minima', `A = ${f(F * 1000)} / ${f(amm)}`, F * 1000 / amm, 'mm²'], ['Diametro minimo', 'd = √(4A / π)', d, 'mm']],
            decisione: { domanda: 'Che barra prendi?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `Serve almeno Ø${f(d)}: si prende il Ø${sc.valore}. Se il tirante è filettato alle estremità, la sezione che conta è quella del filetto, più piccola.`,
          };
        }
        if (liv === 1) {
          const d = R.da([10, 12, 16, 20, 24]), F = R.tra(5, 60, 1);
          const A = PI * d * d / 4, s = F * 1000 / A;
          return {
            contesto: `Un tirante tondo pieno Ø${d} mm in S235 (snervamento 235 MPa) porta ${f(F)} kN. Il progetto chiede un coefficiente di sicurezza 1,5, quindi σ ammissibile ≈ 157 MPa.`,
            richiesta: 'Tensione nel tirante, in MPa.',
            dati: [['d', d, 'mm'], ['F', F, 'kN'], ['σ amm', 157, 'MPa']],
            impostazione: ['σ = F / A.', 'F in N e A in mm²: esce N/mm², cioè MPa.'],
            risposta: { nome: 'σ', valore: s, unita: 'MPa' },
            passi: [['Forza in N', `${f(F)} · 1000`, F * 1000, 'N'], ['Area', `π · ${d}² / 4`, A, 'mm²'], ['Tensione', 'σ = F / A', s, 'MPa']],
            decisione: { domanda: 'Il tirante va bene?', opzioni: MARGINE, giusta: giustaMargine(amm, s) },
            giudizio: `${f(s)} MPa contro 157 ammessi. Ricorda: 1 MPa = 1 N/mm², per questo conviene lavorare sempre in N e mm.`,
          };
        }
        const filetti = [['M8', 36.6], ['M10', 58], ['M12', 84.3], ['M16', 157], ['M20', 245], ['M24', 353]];
        const [nome, As] = R.da(filetti);
        const F = Math.round(As * amm * R.da([0.6, 0.8, 0.95, 1.1, 1.3]) / 100) / 10;
        const s = F * 1000 / As;
        return {
          contesto: `Un tirante filettato ${nome} in S235 porta ${f(F)} kN. Da tabella la sezione resistente del filetto ${nome} è ${f(As)} mm². Sicurezza 1,5 sullo snervamento (σ amm ≈ 157 MPa).`,
          richiesta: 'Tensione nella sezione del filetto, in MPa.',
          dati: [['filetto', nome, ''], ['As', As, 'mm²'], ['F', F, 'kN']],
          impostazione: ['La sezione che cede è quella del filetto, non il diametro nominale.', 'σ = F / As, con F in N.'],
          risposta: { nome: 'σ', valore: s, unita: 'MPa' },
          passi: [['Forza in N', `${f(F)} · 1000`, F * 1000, 'N'], ['Tensione sul filetto', `σ = F / ${f(As)}`, s, 'MPa']],
          decisione: { domanda: 'Il tirante va bene?', opzioni: MARGINE, giusta: giustaMargine(amm, s) },
          giudizio: `${f(s)} MPa. Con il diametro nominale avresti trovato circa il 25–30% in meno: è l'errore classico che fa rompere i tiranti filettati.`,
        };
      },
    },
    {
      id: 'torsione', blocco: 'b3', titolo: 'L\'albero regge la coppia?',
      genera(liv, R) {
        const tamm = R.da([40, 50, 60]);
        if (liv === 3) {
          const P = R.da([1.5, 2.2, 4, 5.5, 7.5, 11]), n = R.da([300, 500, 750, 1000, 1450]);
          const T = P * 1000 / (2 * PI * n / 60);
          const d = Math.cbrt(16 * T * 1000 / (PI * tamm));
          const sc = sceltaCatalogo([12, 14, 16, 18, 20, 22, 25, 28, 30, 35, 40, 45, 50], d, 'mm');
          return {
            contesto: `Devi dimensionare un albero che trasmette ${f(P)} kW a ${n} giri/min. Per tenere conto di fatica e sedi chiavetta usi una τ ammissibile di ${tamm} MPa.`,
            richiesta: 'Diametro minimo dell\'albero, in mm.',
            dati: [['P', P, 'kW'], ['n', n, 'giri/min'], ['τ amm', tamm, 'MPa']],
            impostazione: ['Coppia: T = P / ω, con ω = 2π n / 60.', 'Tensione di torsione: τ = 16 T / (π d³).', 'Ricava d = ∛(16 T / (π τ amm)), con T in N·mm.'],
            risposta: { nome: 'd minimo', valore: d, unita: 'mm' },
            passi: [['Velocità angolare', `ω = 2π · ${n} / 60`, 2 * PI * n / 60, 'rad/s'], ['Coppia', `T = ${f(P * 1000)} / ω`, T, 'N·m'], ['Diametro minimo', 'd = ∛(16 · T · 1000 / (π · τ))', d, 'mm']],
            decisione: { domanda: 'Che diametro scegli?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `Almeno Ø${f(d)} mm: si fa Ø${sc.valore}. Più giri = meno coppia a parità di potenza: per questo gli alberi lenti dopo il riduttore sono così grossi.`,
          };
        }
        const d = R.da([16, 20, 25, 30, 35, 40]);
        let T, passiT = [], testo;
        if (liv === 1) {
          T = R.tra(20, 400, 10);
          testo = `trasmette una coppia di ${f(T)} N·m`;
        } else {
          const P = R.da([1.1, 2.2, 3, 4, 5.5]), n = R.da([300, 500, 960, 1450]);
          T = P * 1000 / (2 * PI * n / 60);
          testo = `trasmette ${f(P)} kW a ${n} giri/min`;
          passiT = [['Velocità angolare', `ω = 2π · ${n} / 60`, 2 * PI * n / 60, 'rad/s'], ['Coppia', `T = ${f(P * 1000)} / ω`, T, 'N·m']];
        }
        const tau = 16 * T * 1000 / (PI * d * d * d);
        return {
          contesto: `Un albero pieno Ø${d} mm ${testo}. Il progettista ha fissato τ ammissibile = ${tamm} MPa.`,
          richiesta: 'Tensione tangenziale massima, in MPa.',
          dati: [['d', d, 'mm'], ...(liv === 1 ? [['T', T, 'N·m']] : []), ['τ amm', tamm, 'MPa']],
          impostazione: [...(liv === 1 ? [] : ['Prima la coppia: T = P / ω.']), 'τ = 16 · T / (π · d³).', 'T in N·mm (× 1000) e d in mm: esce MPa.'],
          risposta: { nome: 'τ', valore: tau, unita: 'MPa' },
          passi: [...passiT, ['Coppia in N·mm', `${f(T)} · 1000`, T * 1000, 'N·mm'], ['Tensione di torsione', `τ = 16 · T / (π · ${d}³)`, tau, 'MPa']],
          decisione: { domanda: 'L\'albero va bene?', opzioni: MARGINE, giusta: giustaMargine(tamm, tau) },
          giudizio: `${f(tau)} MPa contro ${tamm} ammessi. Il diametro conta al cubo: passare da Ø${d} a Ø${d + 5} riduce la tensione del ${f((1 - Math.pow(d / (d + 5), 3)) * 100)}%.`,
        };
      },
    },
    {
      id: 'flessione', blocco: 'b3', titolo: 'La barra si piega troppo?',
      genera(liv, R) {
        const amm = 157;
        if (liv === 3) {
          const L = R.da([800, 1000, 1200, 1500]), F = R.tra(2, 12, 0.5), b = R.da([20, 25, 30, 40]);
          const M = F * 1000 * L / 4;
          const h = Math.sqrt(6 * M / (b * amm));
          const sc = sceltaCatalogo([30, 40, 50, 60, 70, 80, 100, 120], h, 'mm');
          return {
            contesto: `Una barra piatta in S235, appoggiata agli estremi con luce ${L} mm, porta ${f(F)} kN in mezzeria. Lo spessore è ${b} mm e la metti di costa: devi scegliere l'altezza. σ ammissibile 157 MPa.`,
            richiesta: 'Altezza minima della sezione, in mm.',
            dati: [['L', L, 'mm'], ['F', F, 'kN'], ['b', b, 'mm'], ['σ amm', amm, 'MPa']],
            impostazione: ['Momento massimo in mezzeria: M = F · L / 4.', 'Rettangolo: W = b · h² / 6.', 'σ = M / W ≤ σ amm, quindi h = √(6M / (b σ amm)).'],
            risposta: { nome: 'h minima', valore: h, unita: 'mm' },
            passi: [['Momento massimo', `M = ${f(F * 1000)} · ${L} / 4`, M, 'N·mm'], ['Altezza minima', `h = √(6M / (${b} · 157))`, h, 'mm']],
            decisione: { domanda: 'Che piatto scegli?', opzioni: sc.opzioni.map((o) => `${b} × ${o}`), giusta: sc.giusta },
            giudizio: `Almeno ${f(h)} mm di altezza: si prende ${b} × ${sc.valore}. Di costa l'altezza conta al quadrato: la stessa barra messa di piatto reggerebbe ${f(sc.valore / b)} volte meno.`,
          };
        }
        const b = R.da([20, 30, 40, 50]), h = R.da([40, 50, 60, 80]);
        let M, passiM = [], testo;
        if (liv === 1) {
          M = R.tra(200, 3000, 50);
          testo = `Nella sezione più caricata c'è un momento flettente di ${f(M)} N·m.`;
        } else {
          const L = R.da([600, 800, 1000, 1200]), F = R.tra(2, 15, 0.5);
          M = F * 1000 * L / 4 / 1000;
          testo = `È appoggiata agli estremi con luce ${L} mm e porta ${f(F)} kN in mezzeria.`;
          passiM = [['Momento massimo in mezzeria', `M = ${f(F * 1000)} · ${L} / 4 / 1000`, M, 'N·m']];
        }
        const W = b * h * h / 6, s = M * 1000 / W;
        return {
          contesto: `Una barra rettangolare in S235, ${b} mm di spessore e ${h} mm di altezza, è messa di costa (altezza verticale). ${testo} σ ammissibile 157 MPa.`,
          richiesta: 'Tensione massima di flessione, in MPa.',
          dati: [['b', b, 'mm'], ['h', h, 'mm'], ...(liv === 1 ? [['M', M, 'N·m']] : [])],
          impostazione: [...(liv === 1 ? [] : ['Trave appoggiata con carico in mezzo: M max = F · L / 4.']), 'Modulo di resistenza del rettangolo: W = b · h² / 6.', 'σ = M / W, con M in N·mm.'],
          risposta: { nome: 'σ', valore: s, unita: 'MPa' },
          passi: [...passiM, ['Modulo di resistenza', `W = ${b} · ${h}² / 6`, W, 'mm³'], ['Tensione', `σ = ${f(M * 1000)} / W`, s, 'MPa']],
          decisione: { domanda: 'La barra va bene?', opzioni: MARGINE, giusta: giustaMargine(amm, s) },
          giudizio: `${f(s)} MPa contro 157. Girata di piatto avrebbe W = ${f(h * b * b / 6)} mm³ e la tensione salirebbe a ${f(M * 1000 / (h * b * b / 6))} MPa.`,
        };
      },
    },

    // ---------------- BLOCCO 5 ----------------
    {
      id: 'ingranaggi', blocco: 'b5', titolo: 'Che giri e che coppia escono dagli ingranaggi?',
      genera(liv, R) {
        const n1 = R.da([1400, 1450, 2850, 960]);
        if (liv === 3) {
          const P = R.da([0.75, 1.1, 1.5, 2.2, 3]), z1 = R.da([15, 17, 19]), z2 = R.da([51, 57, 63]), z3 = R.da([16, 18, 20]), z4 = R.da([60, 64, 72]), eta = 0.97;
          const n = n1 * (z1 / z2) * (z3 / z4);
          const w = 2 * PI * n / 60;
          const C = P * 1000 * eta * eta / w;
          return {
            contesto: `Un motore da ${f(P)} kW a ${n1} giri/min muove un riduttore a due stadi: primo stadio ${z1}/${z2} denti, secondo ${z3}/${z4}. Ogni coppia di ruote ha rendimento 0,97.`,
            richiesta: 'Coppia all\'albero di uscita, in N·m.',
            dati: [['P', P, 'kW'], ['n motore', n1, 'giri/min'], ['stadio 1', `${z1}/${z2}`, ''], ['stadio 2', `${z3}/${z4}`, ''], ['η per stadio', eta, '']],
            impostazione: ['Rapporto totale: il prodotto dei due rapporti.', 'n uscita = n motore · (z1/z2) · (z3/z4).', 'Potenza in uscita: P · η · η (due stadi).', 'C = P uscita / ω uscita.'],
            risposta: { nome: 'C uscita', valore: C, unita: 'N·m' },
            passi: [['Giri in uscita', `${n1} · ${z1}/${z2} · ${z3}/${z4}`, n, 'giri/min'], ['Velocità angolare', 'ω = 2π n / 60', w, 'rad/s'], ['Potenza in uscita', `${f(P * 1000)} · 0,97²`, P * 1000 * eta * eta, 'W'], ['Coppia in uscita', 'C = P / ω', C, 'N·m']],
            giudizio: `${f(C)} N·m a ${f(n)} giri/min. I rendimenti si moltiplicano: con 3–4 stadi le perdite non sono più trascurabili e il riduttore scalda.`,
          };
        }
        const z1 = R.da([14, 16, 18, 20, 22]), z2 = R.da([40, 45, 50, 56, 63, 71]);
        const n2 = n1 * z1 / z2;
        if (liv === 1) {
          return {
            contesto: `Un pignone da ${z1} denti, calettato su un motore a ${n1} giri/min, ingrana con una ruota da ${z2} denti.`,
            richiesta: 'Giri al minuto della ruota condotta.',
            dati: [['z1', z1, ''], ['z2', z2, ''], ['n1', n1, 'giri/min']],
            impostazione: ['Nel punto di contatto le due ruote hanno la stessa velocità: n1 · z1 = n2 · z2.', 'La ruota più grande gira più piano.'],
            risposta: { nome: 'n2', valore: n2, unita: 'giri/min' },
            passi: [['Rapporto di trasmissione', `i = ${z2} / ${z1}`, z2 / z1, ''], ['Giri della ruota', `n2 = ${n1} / i`, n2, 'giri/min']],
            giudizio: `${f(n2)} giri/min: riduzione ${f(z2 / z1)}. Quanto perdi in giri, lo guadagni in coppia (meno il rendimento).`,
          };
        }
        const C1 = R.tra(5, 60, 1), eta = 0.97;
        const C2 = C1 * (z2 / z1) * eta;
        return {
          contesto: `Un pignone da ${z1} denti riceve ${f(C1)} N·m e ingrana con una ruota da ${z2} denti. Rendimento della coppia di ruote 0,97.`,
          richiesta: 'Coppia sulla ruota condotta, in N·m.',
          dati: [['z1', z1, ''], ['z2', z2, ''], ['C1', C1, 'N·m'], ['η', eta, '']],
          impostazione: ['La forza sul dente è la stessa per le due ruote: la coppia cresce con il raggio, cioè con i denti.', 'C2 = C1 · (z2 / z1) · η.'],
          risposta: { nome: 'C2', valore: C2, unita: 'N·m' },
          passi: [['Rapporto', `i = ${z2} / ${z1}`, z2 / z1, ''], ['Coppia teorica', `C1 · i`, C1 * z2 / z1, 'N·m'], ['Coppia reale', '· 0,97', C2, 'N·m']],
          giudizio: `${f(C2)} N·m. Controllo di buon senso: potenza in uscita = potenza in ingresso · η. Se ti esce più potenza in uscita, c'è un errore.`,
        };
      },
    },
    {
      id: 'attrito', blocco: 'b5', titolo: 'Quanta forza serve per spingere la cassa?',
      genera(liv, R) {
        const m = R.tra(50, 400, 10), mu = R.da([0.15, 0.2, 0.25, 0.3, 0.4]);
        if (liv === 1) {
          const F = mu * m * G;
          return {
            contesto: `Una cassa di ${m} kg va spinta sul pavimento del magazzino. Il coefficiente d'attrito tra cassa e pavimento è ${f(mu)}.`,
            richiesta: 'Forza orizzontale per farla scorrere a velocità costante, in N.',
            dati: [['m', m, 'kg'], ['μ', mu, '']],
            impostazione: ['A velocità costante la spinta uguaglia l\'attrito.', 'Attrito = μ · N, e sul piano N = m · g.'],
            risposta: { nome: 'F', valore: F, unita: 'N' },
            passi: [['Forza normale', `N = ${m} · 9,81`, m * G, 'N'], ['Attrito', `F = ${f(mu)} · N`, F, 'N']],
            giudizio: `${f(F)} N. Una persona spinge in modo continuativo circa 200–250 N: ${F > 250 ? 'qui serve un transpallet o un carrello.' : 'ce la fa, ma per spostamenti frequenti meglio le ruote.'}`,
          };
        }
        const th = R.da([5, 8, 10, 12, 15, 20]);
        const t = th * PI / 180;
        if (liv === 2) {
          const F = m * G * (Math.sin(t) + mu * Math.cos(t));
          return {
            contesto: `Una cassa di ${m} kg va spinta su per una rampa inclinata di ${th}°, con una forza parallela alla rampa. Coefficiente d'attrito ${f(mu)}.`,
            richiesta: 'Forza per farla salire a velocità costante, in N.',
            dati: [['m', m, 'kg'], ['θ', th, '°'], ['μ', mu, '']],
            impostazione: ['Scomponi il peso: lungo la rampa m g sin θ, perpendicolare m g cos θ.', 'L\'attrito vale μ · m g cos θ e si oppone alla salita.', 'F = m g (sin θ + μ cos θ).'],
            risposta: { nome: 'F', valore: F, unita: 'N' },
            passi: [['Peso', `${m} · 9,81`, m * G, 'N'], ['Componente lungo la rampa', 'W · sin θ', m * G * Math.sin(t), 'N'], ['Attrito', 'μ · W · cos θ', mu * m * G * Math.cos(t), 'N'], ['Forza totale', 'somma', F, 'N']],
            giudizio: `${f(F)} N, contro ${f(mu * m * G)} N in piano. Anche pochi gradi pesano: è per questo che le rampe di carico stanno sotto il 10%.`,
          };
        }
        const muMin = Math.tan(t);
        return {
          contesto: `Una cassa di ${m} kg è appoggiata su un piano inclinato di ${th}° (uno scivolo di una linea). Vuoi che resti ferma da sola senza fermi, finché qualcuno non la spinge. Tra cassa e scivolo il coefficiente d'attrito è ${f(mu)}.`,
          richiesta: 'Coefficiente d\'attrito minimo perché la cassa resti ferma da sola.',
          dati: [['θ', th, '°'], ['μ disponibile', mu, '']],
          impostazione: ['Al limite: componente lungo il piano = attrito massimo.', 'm g sin θ = μ m g cos θ, la massa si semplifica.', 'μ min = tan θ.'],
          risposta: { nome: 'μ min', valore: muMin, unita: '' },
          passi: [['Condizione di aderenza', 'μ ≥ tan θ', muMin, '']],
          decisione: { domanda: `Con μ = ${f(mu)} la cassa resta ferma?`, opzioni: ['Sì, resta ferma', 'No, scivola'], giusta: mu >= muMin ? 0 : 1 },
          giudizio: `Serve μ ≥ ${f(muMin)}: con ${f(mu)} la cassa ${mu >= muMin ? 'resta ferma, ma basta un po\' d\'olio o vibrazioni per farla partire' : 'scivola: servono un fermo o un piano meno inclinato'}. La massa non conta: è lo stesso principio delle viti autobloccanti.`,
        };
      },
    },

    // ---------------- BLOCCO 6 ----------------
    {
      id: 'cuscinetto', blocco: 'b6', titolo: 'Quanto dura il cuscinetto?',
      genera(liv, R) {
        const P = R.tra(1, 8, 0.5), n = R.da([300, 750, 1000, 1450, 3000]);
        if (liv === 3) {
          const ore = R.da([10000, 20000, 30000, 40000]);
          const L = ore * 60 * n / 1e6;
          const C = P * Math.cbrt(L);
          return {
            contesto: `Devi scegliere un cuscinetto a sfere per un albero a ${n} giri/min con carico equivalente ${f(P)} kN. La macchina deve durare ${f(ore)} ore di lavoro.`,
            richiesta: 'Coefficiente di carico dinamico minimo C, in kN.',
            dati: [['P', P, 'kN'], ['n', n, 'giri/min'], ['durata', ore, 'ore']],
            impostazione: ['Durata in milioni di giri: L10 = ore · 60 · n / 10⁶.', 'Sfere: L10 = (C / P)³.', 'Quindi C = P · ∛L10.'],
            risposta: { nome: 'C minimo', valore: C, unita: 'kN' },
            passi: [['Durata in milioni di giri', `${f(ore)} · 60 · ${n} / 10⁶`, L, 'milioni di giri'], ['Carico dinamico minimo', `C = ${f(P)} · ∛L10`, C, 'kN']],
            giudizio: `Serve C ≥ ${f(C)} kN: sul catalogo cerchi un cuscinetto con quel C e il foro del tuo albero. Raddoppiare la durata chiede solo il 26% di C in più (radice cubica).`,
          };
        }
        const C = Math.round(P * R.da([4, 5, 6, 8, 10]) * 10) / 10;
        const L = Math.pow(C / P, 3);
        if (liv === 1) {
          return {
            contesto: `Un cuscinetto a sfere ha coefficiente di carico dinamico C = ${f(C)} kN e lavora con un carico equivalente P = ${f(P)} kN.`,
            richiesta: 'Durata base L10, in milioni di giri.',
            dati: [['C', C, 'kN'], ['P', P, 'kN']],
            impostazione: ['Per i cuscinetti a sfere: L10 = (C / P)³ milioni di giri.', 'L10 è la durata che raggiunge il 90% dei cuscinetti.'],
            risposta: { nome: 'L10', valore: L, unita: 'milioni di giri' },
            passi: [['Rapporto C / P', `${f(C)} / ${f(P)}`, C / P, ''], ['Durata', '(C / P)³', L, 'milioni di giri']],
            giudizio: `${f(L)} milioni di giri. Il carico conta al cubo: se P raddoppia, la durata diventa un ottavo.`,
          };
        }
        const h = L * 1e6 / (60 * n);
        const req = R.da([10000, 20000, 30000]);
        return {
          contesto: `Un cuscinetto a sfere con C = ${f(C)} kN lavora a ${n} giri/min con carico equivalente ${f(P)} kN. Il cliente vuole almeno ${f(req)} ore.`,
          richiesta: 'Durata in ore di lavoro.',
          dati: [['C', C, 'kN'], ['P', P, 'kN'], ['n', n, 'giri/min'], ['richiesta', req, 'ore']],
          impostazione: ['L10 = (C / P)³ in milioni di giri.', 'Ore = L10 · 10⁶ / (60 · n).'],
          risposta: { nome: 'L10h', valore: h, unita: 'ore' },
          passi: [['Durata in milioni di giri', `(${f(C)} / ${f(P)})³`, L, 'milioni di giri'], ['Durata in ore', `L10 · 10⁶ / (60 · ${n})`, h, 'ore']],
          decisione: { domanda: 'Il cuscinetto basta?', opzioni: MARGINE, giusta: giustaMargine(h, req) },
          giudizio: `${f(h)} ore contro ${f(req)} richieste. Lubrificazione e pulizia contano quanto il calcolo: la maggior parte dei cuscinetti muore per sporco o grasso sbagliato.`,
        };
      },
    },

    // ---------------- BLOCCO 7 ----------------
    {
      id: 'accoppiamento', blocco: 'b7', titolo: 'Che gioco c\'è tra albero e foro?',
      genera(liv, R) {
        const tab = [
          { D: 25, H7: [0, 21], g6: [-20, -7], h6: [-13, 0], k6: [2, 15], p6: [22, 35] },
          { D: 40, H7: [0, 25], g6: [-25, -9], h6: [-16, 0], k6: [2, 18], p6: [26, 42] },
          { D: 60, H7: [0, 30], g6: [-29, -10], h6: [-19, 0], k6: [2, 21], p6: [32, 51] },
        ];
        const t = R.da(tab);
        if (liv === 3) {
          const imax = t.p6[1] - t.H7[0];
          const extra = 20;
          const dT = (imax + extra) / 1000 / (12e-6 * t.D);
          return {
            contesto: `Devi montare a caldo un mozzo d'acciaio con foro Ø${t.D} H7 (${t.H7[0]}/+${t.H7[1]} µm) su un albero Ø${t.D} p6 (+${t.p6[0]}/+${t.p6[1]} µm). Per infilarlo a mano vuoi ${extra} µm di gioco anche nel caso peggiore. α acciaio 12·10⁻⁶ 1/°C.`,
            richiesta: 'Di quanti gradi devi scaldare il mozzo, in °C?',
            dati: [['D', t.D, 'mm'], ['foro H7', `${t.H7[0]}/+${t.H7[1]}`, 'µm'], ['albero p6', `+${t.p6[0]}/+${t.p6[1]}`, 'µm'], ['gioco di montaggio', extra, 'µm']],
            impostazione: ['Caso peggiore: albero al massimo, foro al minimo → interferenza massima.', 'Il foro deve crescere di: interferenza massima + gioco di montaggio.', 'ΔD = α · D · ΔT, quindi ΔT = ΔD / (α · D), con ΔD in mm.'],
            risposta: { nome: 'ΔT', valore: dT, unita: '°C' },
            passi: [['Interferenza massima', `${t.p6[1]} − ${t.H7[0]}`, imax, 'µm'], ['Crescita del foro necessaria', `${imax} + ${extra}`, imax + extra, 'µm'], ['Salto di temperatura', `ΔT = ${f((imax + extra) / 1000)} / (12·10⁻⁶ · ${t.D})`, dT, '°C']],
            giudizio: `Circa ${f(dT)} °C sopra l'ambiente. Sopra i 200–250 °C si rischia di rovinare il trattamento termico: in quel caso meglio raffreddare l'albero (azoto) o ridurre l'interferenza.`,
          };
        }
        const tipo = liv === 1 ? R.da(['g6', 'h6']) : R.da(['g6', 'k6', 'p6']);
        const a = t[tipo];
        const gmax = t.H7[1] - a[0];
        const gmin = t.H7[0] - a[1];
        const segna = (v) => (v > 0 ? '+' : '') + v;
        const base = {
          contesto: `Dal disegno: foro Ø${t.D} H7 (${t.H7[0]}/+${t.H7[1]} µm), albero Ø${t.D} ${tipo} (${segna(a[0])}/${segna(a[1])} µm).`,
          dati: [['D', t.D, 'mm'], ['foro H7', `${t.H7[0]}/+${t.H7[1]}`, 'µm'], [`albero ${tipo}`, `${segna(a[0])}/${segna(a[1])}`, 'µm']],
        };
        if (liv === 1) {
          return Object.assign(base, {
            richiesta: 'Gioco massimo, in µm.',
            impostazione: ['Gioco = foro − albero.', 'Il gioco massimo viene con il foro più grande e l\'albero più piccolo.', 'Gioco max = scostamento superiore del foro − scostamento inferiore dell\'albero.'],
            risposta: { nome: 'gioco max', valore: gmax, unita: 'µm' },
            passi: [['Foro più grande', `+${t.H7[1]}`, t.H7[1], 'µm'], ['Albero più piccolo', segna(a[0]), a[0], 'µm'], ['Gioco massimo', `${t.H7[1]} − (${a[0]})`, gmax, 'µm']],
            giudizio: `Gioco massimo ${gmax} µm, minimo ${gmin} µm. H7/${tipo} è ${tipo === 'g6' ? 'un accoppiamento con gioco: va bene per parti che devono scorrere o ruotare.' : 'il classico accoppiamento di posizionamento: si monta a mano ma senza giochi visibili.'}`,
          });
        }
        const tipoAcc = gmin > 0 ? 0 : gmax < 0 ? 2 : 1;
        return Object.assign(base, {
          richiesta: 'Gioco minimo, in µm (negativo se è interferenza).',
          impostazione: ['Gioco minimo: foro più piccolo, albero più grande.', 'Gioco min = scostamento inferiore del foro − scostamento superiore dell\'albero.', 'Se esce negativo è interferenza: l\'albero è più grosso del foro.'],
          risposta: { nome: 'gioco min', valore: gmin, unita: 'µm' },
          passi: [['Foro più piccolo', `${t.H7[0]}`, t.H7[0], 'µm'], ['Albero più grande', segna(a[1]), a[1], 'µm'], ['Gioco minimo', `${t.H7[0]} − (${segna(a[1])})`, gmin, 'µm'], ['Gioco massimo', `${t.H7[1]} − (${segna(a[0])})`, gmax, 'µm']],
          decisione: { domanda: 'Che accoppiamento è?', opzioni: ['Con gioco', 'Incerto', 'Con interferenza'], giusta: tipoAcc },
          giudizio: `Gioco da ${gmin} a ${gmax} µm: ${['sempre gioco, le parti scorrono.', 'a volte gioco, a volte interferenza: si monta con un colpo di mazzuolo o una pressa leggera.', 'sempre interferenza: si monta a pressa o a caldo e trasmette coppia da solo.'][tipoAcc]}`,
        });
      },
    },

    // ---------------- BLOCCO 8 ----------------
    {
      id: 'calore', blocco: 'b8', titolo: 'Quanto ci vuole a scaldare l\'acqua?',
      genera(liv, R) {
        const c = 4.186;
        if (liv === 3) {
          const P = R.da([5, 8, 12, 20, 30]), dT = R.da([4, 5, 6, 8, 10]);
          const mdot = P / (c * dT);
          const lmin = mdot * 60;
          return {
            contesto: `Uno stampo deve smaltire ${P} kW di calore con acqua di raffreddamento. L'acqua può scaldarsi al massimo di ${dT} °C tra ingresso e uscita.`,
            richiesta: 'Portata d\'acqua necessaria, in litri al minuto.',
            dati: [['P', P, 'kW'], ['ΔT acqua', dT, '°C'], ['c acqua', c, 'kJ/(kg·°C)']],
            impostazione: ['Il calore portato via: P = ṁ · c · ΔT.', 'ṁ = P / (c · ΔT): con P in kW e c in kJ/(kg·°C) esce kg/s.', 'Per l\'acqua 1 kg ≈ 1 litro: moltiplica per 60.'],
            risposta: { nome: 'portata', valore: lmin, unita: 'l/min' },
            passi: [['Portata in massa', `ṁ = ${P} / (4,186 · ${dT})`, mdot, 'kg/s'], ['In litri al minuto', 'ṁ · 60', lmin, 'l/min']],
            giudizio: `Circa ${f(lmin)} l/min. Se la pompa ne dà meno, l'acqua esce più calda e lo stampo si scalda: dimezzare la portata raddoppia il ΔT.`,
          };
        }
        const V = R.da([50, 80, 100, 150, 200, 300]), t1 = R.da([10, 12, 15]), t2 = R.da([45, 50, 55, 60]);
        const Q = V * c * (t2 - t1);
        if (liv === 1) {
          return {
            contesto: `Un serbatoio contiene ${V} litri d'acqua a ${t1} °C da portare a ${t2} °C per un lavaggio pezzi.`,
            richiesta: 'Energia necessaria, in kJ.',
            dati: [['V', V, 'litri'], ['t iniziale', t1, '°C'], ['t finale', t2, '°C'], ['c', c, 'kJ/(kg·°C)']],
            impostazione: ['Per l\'acqua 1 litro ≈ 1 kg.', 'Q = m · c · ΔT.'],
            risposta: { nome: 'Q', valore: Q, unita: 'kJ' },
            passi: [['Massa', `${V} litri ≈ ${V} kg`, V, 'kg'], ['Salto di temperatura', `${t2} − ${t1}`, t2 - t1, '°C'], ['Energia', `Q = ${V} · 4,186 · ${t2 - t1}`, Q, 'kJ'], ['In kWh', 'Q / 3600', Q / 3600, 'kWh']],
            giudizio: `${f(Q)} kJ, cioè ${f(Q / 3600)} kWh. Passare a kWh serve per capire quanto costa: moltiplica per il prezzo dell'energia.`,
          };
        }
        const P = R.da([2, 3, 4.5, 6, 9]), eta = 0.9;
        const tmin = Q / (P * eta) / 60;
        return {
          contesto: `Un serbatoio di ${V} litri d'acqua a ${t1} °C va portato a ${t2} °C con una resistenza da ${f(P)} kW. Tra dispersioni e serbatoio, solo il 90% del calore va all'acqua. Il turno parte tra un'ora.`,
          richiesta: 'Tempo di riscaldamento, in minuti.',
          dati: [['V', V, 'litri'], ['t1', t1, '°C'], ['t2', t2, '°C'], ['P', P, 'kW'], ['η', eta, '']],
          impostazione: ['Energia: Q = m · c · ΔT, in kJ.', 'kW = kJ/s: tempo = Q / (P · η) in secondi.', 'Dividi per 60.'],
          risposta: { nome: 't', valore: tmin, unita: 'min' },
          passi: [['Energia', `Q = ${V} · 4,186 · ${t2 - t1}`, Q, 'kJ'], ['Potenza utile', `${f(P)} · 0,9`, P * eta, 'kW'], ['Tempo in secondi', 'Q / P utile', Q / (P * eta), 's'], ['Tempo in minuti', '/ 60', tmin, 'min']],
          decisione: { domanda: 'È pronto per l\'inizio del turno, tra un\'ora?', opzioni: ['Sì', 'No'], giusta: tmin <= 60 ? 0 : 1 },
          giudizio: `${f(tmin)} minuti. ${tmin > 60 ? 'Non ce la fa: serve accenderlo prima con un timer, o una resistenza più potente.' : 'Ce la fa. Un timer che lo accende in automatico evita di tenerlo caldo tutta la notte.'}`,
        };
      },
    },
  ];

  // =====================================================================================
  // Dal 21/11/2026: esercizi presi dal corso di Elementi costruttivi (scienza delle costruzioni
  // applicata: dondolo, perno, maniglia, gancio, pozzo di petrolio, Eulero, intagli, cuscinetti)
  // e da Meccanica applicata e Termodinamica. Il metodo del professore: diagrammi, punto più
  // sollecitato, tensione sul componente, confronto con l'ammissibile del materiale ("i due mondi").
  // =====================================================================================
  const E_ACC = 210000; // MPa
  const vm = (s, t) => Math.sqrt(s * s + 3 * t * t);

  MODELLI.push(
    // ---------------- BLOCCO 3: scienza delle costruzioni applicata ----------------
    {
      id: 'perno', blocco: 'b3', titolo: 'Il perno della forchetta regge?',
      genera(liv, R) {
        const F = R.tra(4, 30, 1) * 1000, b = R.da([20, 25, 30, 40]), a = R.da([10, 12, 15, 20]), g = 1;
        const Rs = 355, nu = 2, sa = Rs / nu, ta = sa / 2;
        const braccio = b / 4 + g + a / 3, M = F / 2 * braccio;
        const cat = [10, 12, 14, 16, 18, 20, 22, 25, 28, 30, 35, 40];
        const sch = schema('Come si schematizza il perno nella forchetta?', [
          'Flessione su 4 punti: due forze F/2 dalla boccola e due reazioni F/2 dai supporti',
          'Trave appoggiata con F concentrata in mezzo (flessione su 3 punti)',
          'Mensola incastrata in un supporto della forchetta',
          'Solo taglio: in un perno la flessione si trascura',
        ], 'La boccola carica il perno con metà forza a b/4 dal centro. I supporti cedono un poco e si trattano come cerniere, con reazione triangolare: la risultante sta a a/3 dal bordo interno. Il braccio tra le due forze è b/4 + g + a/3. Il perno è tozzo (lungo meno di 5 diametri): taglio e flessione si verificano tutti e due, separati.');
        const contesto = (d) => `Lo snodo di un cilindro idraulico è una forchetta con un perno${d ? ` Ø${d} mm` : ''}. La testa del cilindro ha una boccola larga ${b} mm e spinge con ${f(F / 1000)} kN. I due supporti della forchetta sono larghi ${a} mm ciascuno, con ${g} mm di gioco dalla boccola. Perno in S355 (Rs = 355 MPa), sicurezza 2.`;
        if (liv === 3) {
          const d = Math.cbrt(32 * M / (PI * sa));
          const sc = sceltaCatalogo(cat, d, 'mm');
          const p = 2 * F / (a * sc.valore);
          return {
            schema: sch, contesto: contesto(0),
            richiesta: 'Diametro minimo del perno a flessione, in mm. Poi scegli il perno di catalogo.',
            dati: [['F', F / 1000, 'kN'], ['boccola b', b, 'mm'], ['supporti a', a, 'mm'], ['gioco g', g, 'mm'], ['σ amm', sa, 'MPa']],
            impostazione: ['Momento massimo (flessione su 4 punti): M = F/2 · (b/4 + g + a/3).', 'Sezione circolare: σ = 32 M / (π d³).', 'd = ∛(32 M / (π σ amm)).', 'Poi controlla anche il taglio e la pressione di contatto: sono tre verifiche separate.'],
            risposta: { nome: 'd minimo', valore: d, unita: 'mm' },
            passi: [['Braccio', `${b}/4 + ${g} + ${a}/3`, braccio, 'mm'], ['Momento massimo', `M = ${f(F / 2)} · braccio`, M, 'N·mm'], ['Diametro minimo', `d = ∛(32 M / (π · ${f(sa)}))`, d, 'mm']],
            decisione: { domanda: 'Che perno scegli?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `Almeno Ø${f(d)}: si prende Ø${sc.valore}. Pressione di contatto massima sui supporti: p max = 2F / (a·d) = ${f(p)} MPa. Con boccole in bronzo si sta sotto 25–30 MPa, acciaio su acciaio temprato regge di più: spesso è questa verifica a decidere la larghezza a.`,
          };
        }
        if (liv === 1) {
          const d = vicino(cat, Math.sqrt(4 * (4 / 3) * (F / 2) / (PI * ta)));
          const A = PI * d * d / 4, t = (4 / 3) * (F / 2) / A;
          return {
            schema: sch, contesto: contesto(d),
            richiesta: 'Tensione tangenziale massima a taglio nel perno, in MPa.',
            dati: [['F', F / 1000, 'kN'], ['d', d, 'mm'], ['τ amm (metà di σ amm)', ta, 'MPa']],
            impostazione: ['Ogni sezione tra boccola e supporto porta un taglio T = F/2.', 'Sulla sezione circolare (Jourawski) il massimo è sull\'asse: τ max = 4/3 · T / A.', 'L\'ammissibile a taglio è metà di quello a trazione (Tresca).'],
            risposta: { nome: 'τ max', valore: t, unita: 'MPa' },
            passi: [['Taglio su ogni sezione', `T = ${f(F)} / 2`, F / 2, 'N'], ['Area', `π · ${d}² / 4`, A, 'mm²'], ['τ massima', '4/3 · T / A', t, 'MPa']],
            decisione: { domanda: 'A taglio il perno va bene?', opzioni: MARGINE, giusta: giustaMargine(ta, t) },
            giudizio: `${f(t)} MPa contro ${f(ta)} ammessi a taglio. Ricorda i due mondi: a sinistra la tensione sul componente, a destra l'ammissibile del materiale. Poi servono ancora flessione e pressione di contatto.`,
          };
        }
        const d = vicino(cat, Math.cbrt(32 * M / (PI * sa)));
        const s = 32 * M / (PI * d * d * d);
        return {
          schema: sch, contesto: contesto(d),
          richiesta: 'Tensione massima di flessione nel perno, in MPa.',
          dati: [['F', F / 1000, 'kN'], ['d', d, 'mm'], ['boccola b', b, 'mm'], ['supporti a', a, 'mm'], ['gioco g', g, 'mm'], ['σ amm', sa, 'MPa']],
          impostazione: ['Metà struttura: F/2 a b/4 dal centro, reazione F/2 a a/3 dal bordo interno del supporto.', 'Il braccio tra le due è b/4 + g + a/3: M = F/2 · braccio, costante nel tratto centrale.', 'σ = 32 M / (π d³).'],
          risposta: { nome: 'σ', valore: s, unita: 'MPa' },
          passi: [['Braccio', `${b}/4 + ${g} + ${a}/3`, braccio, 'mm'], ['Momento massimo', `${f(F / 2)} · ${f(braccio)}`, M, 'N·mm'], ['Tensione di flessione', `32 M / (π · ${d}³)`, s, 'MPa']],
          decisione: { domanda: 'A flessione il perno va bene?', opzioni: MARGINE, giusta: giustaMargine(sa, s) },
          giudizio: `${f(s)} MPa contro ${f(sa)}. Il gioco g sembra poco ma entra nel braccio: all'esame va tenuto. Per accorciare il braccio si stringono boccola e supporti, ma poi sale la pressione di contatto.`,
        };
      },
    },
    {
      id: 'leva-valvola', blocco: 'b3', titolo: 'La leva della valvola si piega?',
      genera(liv, R) {
        const L1 = R.da([100, 120, 150, 200]), L2 = R.da([30, 40, 50, 60]);
        const sch = schema('Nel perno della leva (il tratto tondo che entra nella valvola) che sollecitazioni ci sono?', [
          'Flessione e torsione insieme: tensione equivalente di Von Mises',
          'Solo flessione',
          'Solo torsione',
          'Trazione e flessione, che si sommano',
        ], 'Portando la forza dall\'impugnatura alla base della leva nasce un momento F·L1, che per il perno è torcente. In più la forza flette il perno con braccio L2 fino alla valvola. σ e τ sono massime sulla superficie esterna dello stesso punto e stanno su piani ortogonali: si combinano con Von Mises, σ eq = √(σ² + 3τ²). Vale solo in statica: una leva usata migliaia di volte è un problema di fatica.');
        const ctx = (F, Ftesto, d) => `Una valvola a sfera si apre con una leva lunga ${L1} mm. La leva è fissata a un perno tondo${d ? ` Ø${d} mm` : ''} che sporge ${L2} mm dal corpo valvola. Quando la valvola è dura, l'operatore spinge in punta alla leva con ${Ftesto}, perpendicolare alla leva e al perno.`;
        if (liv === 3) {
          const F = R.tra(300, 900, 50), Rm = R.da([400, 500, 600]), nu = 3, sa = Rm / nu;
          const Mf = F * L2, Mt = F * L1;
          const d = Math.cbrt(16 * Math.sqrt(4 * Mf * Mf + 3 * Mt * Mt) / (PI * sa));
          const sc = sceltaCatalogo([10, 12, 14, 16, 18, 20, 22, 25, 28, 30], d, 'mm');
          return {
            schema: sch, contesto: ctx(F, `${f(F)} N`, 0) + ` Acciaio con Rm = ${Rm} MPa, sicurezza 3 sulla rottura.`,
            richiesta: 'Diametro minimo del perno, in mm.',
            dati: [['F', F, 'N'], ['L1 leva', L1, 'mm'], ['L2 perno', L2, 'mm'], ['σ amm', sa, 'MPa']],
            impostazione: ['Nel perno, alla base: M flettente = F · L2, M torcente = F · L1.', 'σ = 32 Mf / (π d³), τ = 16 Mt / (π d³).', 'Von Mises: σ eq = 16 / (π d³) · √(4 Mf² + 3 Mt²).', 'd = ∛(16 √(4 Mf² + 3 Mt²) / (π σ amm)).'],
            risposta: { nome: 'd minimo', valore: d, unita: 'mm' },
            passi: [['Momento flettente', `${f(F)} · ${L2}`, Mf, 'N·mm'], ['Momento torcente', `${f(F)} · ${L1}`, Mt, 'N·mm'], ['√(4 Mf² + 3 Mt²)', '', Math.sqrt(4 * Mf * Mf + 3 * Mt * Mt), 'N·mm'], ['Ammissibile', `${Rm} / 3`, sa, 'MPa'], ['Diametro minimo', 'd = ∛(16 · √(...) / (π σ amm))', d, 'mm']],
            decisione: { domanda: 'Che diametro scegli?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `Almeno Ø${f(d)}: si fa Ø${sc.valore}. Qui comanda la torsione (la leva è ${f(L1 / L2)} volte più lunga del perno). Attenzione: il 3 sotto radice moltiplica solo τ², non il momento.`,
          };
        }
        const m = R.da([20, 30, 40, 50]);
        const F = liv === 1 ? R.tra(200, 500, 50) : m * G;
        const Mf = F * L2, Mt = F * L1;
        const Rm = 400, sa = Rm / 3;
        const d = vicino([10, 12, 14, 16, 18, 20, 22, 25], Math.cbrt(16 * Math.sqrt(4 * Mf * Mf + 3 * Mt * Mt) / (PI * sa)));
        const s = 32 * Mf / (PI * d ** 3), t = 16 * Mt / (PI * d ** 3), se = vm(s, t);
        return {
          schema: sch, contesto: ctx(F, liv === 1 ? `${f(F)} N` : `circa ${m} kg di spinta`, d) + ' Acciaio con Rm = 400 MPa, sicurezza 3: σ amm ≈ 133 MPa.',
          richiesta: 'Tensione equivalente di Von Mises alla base del perno, in MPa.',
          dati: [['F', liv === 1 ? F : m, liv === 1 ? 'N' : 'kg'], ['L1 leva', L1, 'mm'], ['L2 perno', L2, 'mm'], ['d perno', d, 'mm']],
          impostazione: [...(liv === 1 ? [] : ['Prima la forza in N: F = m · g.']), 'Alla base del perno: Mf = F · L2 e Mt = F · L1.', 'σ = 32 Mf / (π d³), τ = 16 Mt / (π d³).', 'σ eq = √(σ² + 3 τ²).'],
          risposta: { nome: 'σ eq', valore: se, unita: 'MPa' },
          passi: [...(liv === 1 ? [] : [['Forza', `${m} · 9,81`, F, 'N']]), ['Momento flettente', `F · ${L2}`, Mf, 'N·mm'], ['Momento torcente', `F · ${L1}`, Mt, 'N·mm'], ['σ di flessione', `32 Mf / (π · ${d}³)`, s, 'MPa'], ['τ di torsione', `16 Mt / (π · ${d}³)`, t, 'MPa'], ['Von Mises', '√(σ² + 3τ²)', se, 'MPa']],
          decisione: { domanda: 'Il perno va bene?', opzioni: MARGINE, giusta: giustaMargine(sa, se) },
          giudizio: `σ eq = ${f(se)} MPa contro ${f(sa)}. Errore tipico: sommare σ e τ, o mettere il 3 fuori dal quadrato. E la leva (sezione rettangolare) lavora solo a flessione: le sezioni rettangolari non si mettono in torsione.`,
        };
      },
    },
    {
      id: 'gancio', blocco: 'b3', titolo: 'Il gancio della gru regge?',
      genera(liv, R) {
        const Rc = R.da([40, 50, 60, 80]);
        const sch = schema('Nella sezione del gancio a 90° dal carico (all\'altezza del centro di curvatura) che tensioni ci sono e come le combini?', [
          'Sforzo normale e flessione nella stessa direzione: si sommano sul bordo interno',
          'Flessione e torsione: Von Mises',
          'Solo taglio',
          'Sforzo normale e flessione: Von Mises',
        ], 'Lì la forza P è perpendicolare alla sezione: dà trazione N = P e un momento P·R (il braccio è il raggio). Le due σ hanno la stessa direzione sullo stesso cubetto: si sommano algebricamente, il massimo è sul bordo interno. Von Mises serve solo per tensioni su piani ortogonali (σ con τ). In cima (a 180°) c\'è solo taglio, che in un gancio tozzo va verificato a parte.');
        const Rm = 600, nu = 5, sa = Rm / nu;
        const sTot = (P, d) => 4 * P / (PI * d * d) + 32 * P * Rc / (PI * d ** 3);
        if (liv === 3) {
          const t = R.da([0.5, 1, 2, 3, 5]), P = t * 1000 * G;
          let lo = 5, hi = 300;
          for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2; if (sTot(P, mid) > sa) lo = mid; else hi = mid; }
          const d = hi;
          const sc = sceltaCatalogo([16, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100], d, 'mm');
          return {
            schema: sch, contesto: `Devi dimensionare un gancio per ${f(t)} t, a sezione circolare, con raggio di curvatura ${Rc} mm, appeso a un perno. Acciaio con Rm = ${Rm} MPa; c'è gente sotto, quindi sicurezza ${nu} sulla rottura.`,
            richiesta: 'Diametro minimo della sezione, in mm (verifica a 90°).',
            dati: [['carico', t, 't'], ['R curvatura', Rc, 'mm'], ['σ amm', sa, 'MPa']],
            impostazione: ['P = massa · g.', 'Bordo interno a 90°: σ = 4P/(π d²) + 32 P R/(π d³) ≤ σ amm.', 'È un\'equazione di terzo grado in d: prova un d, calcola, correggi (2–3 tentativi bastano).'],
            risposta: { nome: 'd minimo', valore: d, unita: 'mm' },
            passi: [['Carico', `${f(t)} · 1000 · 9,81`, P, 'N'], ['Ammissibile', `${Rm} / ${nu}`, sa, 'MPa'], ['Diametro che rende σ = σ amm', '4P/(πd²) + 32PR/(πd³) = σ amm', d, 'mm'], ['Di cui: σ da flessione', '32PR/(πd³)', 32 * P * Rc / (PI * d ** 3), 'MPa']],
            decisione: { domanda: 'Che diametro scegli?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `Almeno Ø${f(d)}: si fa Ø${sc.valore}. La flessione pesa molto più della trazione: per questo i ganci veri hanno sezione a goccia, più larga all'interno, e la punta sottile dove non serve materiale.`,
          };
        }
        const t = R.da([0.5, 1, 1.5, 2, 3]);
        const P = liv === 1 ? R.tra(5, 30, 1) * 1000 : t * 1000 * G;
        let dd = 10; while (sTot(P, dd) > sa && dd < 200) dd += 1;
        const d = vicino([16, 20, 25, 30, 35, 40, 45, 50, 60, 70], dd);
        const sN = 4 * P / (PI * d * d), sM = 32 * P * Rc / (PI * d ** 3), s = sN + sM;
        return {
          schema: sch, contesto: `Un gancio a sezione circolare Ø${d} mm, con raggio di curvatura ${Rc} mm, è appeso a un perno e porta ${liv === 1 ? f(P / 1000) + ' kN' : f(t) + ' t'}. Acciaio Rm = ${Rm} MPa, sicurezza ${nu}: σ amm = ${sa} MPa.`,
          richiesta: 'Tensione massima nella sezione a 90° (bordo interno), in MPa.',
          dati: [['P', liv === 1 ? P / 1000 : t, liv === 1 ? 'kN' : 't'], ['d', d, 'mm'], ['R', Rc, 'mm']],
          impostazione: [...(liv === 1 ? [] : ['P = massa · g (1 t = 1000 kg).']), 'Sforzo normale: σ N = P / A = 4P/(π d²).', 'Flessione con braccio R: σ M = 32 P R / (π d³).', 'Stessa direzione: sul bordo interno si sommano.'],
          risposta: { nome: 'σ max', valore: s, unita: 'MPa' },
          passi: [...(liv === 1 ? [] : [['Carico', `${f(t)} · 1000 · 9,81`, P, 'N']]), ['σ da sforzo normale', `4 · P / (π · ${d}²)`, sN, 'MPa'], ['σ da flessione', `32 · P · ${Rc} / (π · ${d}³)`, sM, 'MPa'], ['Bordo interno', 'somma', s, 'MPa']],
          decisione: { domanda: 'Il gancio va bene?', opzioni: MARGINE, giusta: giustaMargine(sa, s) },
          giudizio: `${f(s)} MPa contro ${sa}: la flessione vale ${f(sM / sN)} volte la trazione. Lo spostamento massimo invece è nel punto di carico: tensione massima e deformazione massima non stanno nello stesso posto.`,
        };
      },
    },
    {
      id: 'eulero', blocco: 'b3', titolo: 'L\'asta compressa sbanda?',
      genera(liv, R) {
        const casi = [
          { b: 1, testo: 'lo stelo di un cilindro idraulico, montato con due snodi a occhiello (uno in fondo, uno sulla testa)', nome: 'cerniera-cerniera' },
          { b: 2, testo: 'il montante di uno scaffale, incastrato nella piastra a terra e libero in alto, con il carico in testa', nome: 'incastro-libero' },
          { b: 0.5, testo: 'un puntello saldato a terra e in alto infilato in una guida rigida che non lo lascia ruotare ma scorrere in verticale', nome: 'incastro-incastro scorrevole' },
          { b: 0.7, testo: 'un\'asta saldata a terra e collegata in alto con un perno a una trave che non si sposta', nome: 'incastro-cerniera' },
        ];
        const caso = liv === 1 ? casi[0] : R.da(casi);
        const sch = schema(`Che lunghezza libera di inflessione ha ${caso.testo}?`, [
          `L0 = ${f(caso.b)} · L (${caso.nome})`,
          ...casi.filter((c) => c !== caso).map((c) => `L0 = ${f(c.b)} · L (${c.nome})`),
        ], 'Cerniera-cerniera è il caso base (β = 1). Mensola incastro-libero: β = 2, carico critico 4 volte più basso. Incastro-incastro: β = 0,5, 4 volte più alto. Incastro-cerniera: β ≈ 0,7. Il carico critico è π² E I / L0²: sbanda nella direzione del momento d\'inerzia minore.');
        const L = R.da([600, 800, 1000, 1200, 1500, 2000]);
        if (liv === 3) {
          const F = R.tra(5, 60, 1) * 1000, nu = 3;
          const L0 = caso.b * L;
          const d = Math.pow(64 * nu * F * L0 * L0 / (PI ** 3 * E_ACC), 0.25);
          const sc = sceltaCatalogo([16, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100], d, 'mm');
          return {
            schema: sch, contesto: `Devi dimensionare ${caso.testo}. È un tondo pieno d'acciaio (E = 210 GPa) lungo ${L} mm, compresso con ${f(F / 1000)} kN. Vuoi sicurezza 3 sull'instabilità.`,
            richiesta: 'Diametro minimo, in mm.',
            dati: [['F', F / 1000, 'kN'], ['L', L, 'mm'], ['E', 210, 'GPa'], ['sicurezza', nu, '']],
            impostazione: ['Lunghezza libera: L0 = β · L, con β dai vincoli.', 'Tondo: I = π d⁴ / 64.', 'π² E I / L0² ≥ 3 F, quindi d = (64 · 3F · L0² / (π³ E))^¼.'],
            risposta: { nome: 'd minimo', valore: d, unita: 'mm' },
            passi: [['Lunghezza libera', `${f(caso.b)} · ${L}`, L0, 'mm'], ['Carico critico da garantire', `3 · ${f(F)}`, 3 * F, 'N'], ['Diametro minimo', '(64 · 3F · L0² / (π³ · 210000))^¼', d, 'mm'], ['Tensione di compressione (per confronto)', `4F / (π d²)`, 4 * F / (PI * d * d), 'MPa']],
            decisione: { domanda: 'Che tondo scegli?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `Almeno Ø${f(d)}: si fa Ø${sc.valore}. La tensione di compressione è solo ${f(4 * F / (PI * d * d))} MPa: comanda l'instabilità, non la resistenza. È per questo che i piloni sono larghi.`,
          };
        }
        const F = R.tra(5, 50, 1) * 1000;
        const L0 = caso.b * L;
        const target = Math.pow(64 * 3 * F * L0 * L0 / (PI ** 3 * E_ACC), 0.25);
        const d = vicino([16, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80], target);
        const I = PI * d ** 4 / 64, Pcr = PI * PI * E_ACC * I / (L0 * L0);
        return {
          schema: liv === 1 ? null : sch,
          contesto: `${caso.testo[0].toUpperCase() + caso.testo.slice(1)}: tondo pieno d'acciaio Ø${d} mm, lungo ${L} mm, E = 210 GPa. In esercizio è compresso con ${f(F / 1000)} kN e vuoi sicurezza almeno 3 sull'instabilità.${liv === 1 ? ' Vincoli: cerniera-cerniera (β = 1).' : ''}`,
          richiesta: 'Carico critico di Eulero, in kN.',
          dati: [['d', d, 'mm'], ['L', L, 'mm'], ['E', 210, 'GPa'], ['F esercizio', F / 1000, 'kN']],
          impostazione: ['Momento d\'inerzia del tondo: I = π d⁴ / 64.', 'L0 = β · L.', 'P cr = π² E I / L0² (E in MPa, I in mm⁴, L0 in mm: esce N).'],
          risposta: { nome: 'P cr', valore: Pcr / 1000, unita: 'kN' },
          passi: [['Momento d\'inerzia', `π · ${d}⁴ / 64`, I, 'mm⁴'], ['Lunghezza libera', `${f(caso.b)} · ${L}`, L0, 'mm'], ['Carico critico', 'π² · 210000 · I / L0²', Pcr, 'N'], ['In kN', '/ 1000', Pcr / 1000, 'kN'], ['Sicurezza', `P cr / ${f(F)}`, Pcr / F, '']],
          decisione: { domanda: 'Con sicurezza 3, l\'asta va bene?', opzioni: ['Sì', 'No'], giusta: Pcr / F >= 3 ? 0 : 1 },
          giudizio: `P cr = ${f(Pcr / 1000)} kN, sicurezza ${f(Pcr / F)}. Il diametro conta alla quarta: +10% di diametro dà +46% di carico critico. Se non basta, a volte conviene una "cintura" (un vincolo laterale a metà): il carico critico diventa 4 volte.`,
        };
      },
    },
    {
      id: 'albero-puleggia', blocco: 'b3', titolo: 'L\'albero con la puleggia a sbalzo regge?',
      genera(liv, R) {
        const P = R.da([2.2, 3, 4, 5.5, 7.5]), n = R.da([700, 960, 1450]), a = R.da([40, 60, 80, 100]);
        const w = 2 * PI * n / 60, T = P * 1000 / w * 1000; // N·mm
        const dp = R.da([100, 125, 160, 200]);
        const Fc = Math.round(2.5 * (T / (dp / 2)) / 10) * 10; // tiro totale dei due rami
        const M = Fc * a;
        const sa = R.da([60, 80]);
        const sch = schema('L\'albero è su due cuscinetti e la puleggia sta fuori, a sbalzo. Dov\'è il momento flettente massimo?', [
          'Sul cuscinetto vicino alla puleggia: M = F · a (più la torsione)',
          'A metà tra i cuscinetti: M = F · L / 4',
          'Sotto la puleggia',
          'Non c\'è flessione: la cinghia dà solo torsione',
        ], 'La cinghia tira l\'albero con la somma dei due rami. Con la puleggia a sbalzo lo schema è una trave su due appoggi con sbalzo: il momento cresce da zero sotto la puleggia fino a F·a sul cuscinetto vicino. Lì c\'è anche tutta la coppia: flessione e torsione insieme, quindi Von Mises.');
        const ctx = (d) => `Un motore da ${f(P)} kW a ${n} giri/min muove una puleggia Ø${dp} mm calettata a sbalzo, ${a} mm fuori dal cuscinetto. Il tiro totale della cinghia sull'albero (somma dei due rami) è ${f(Fc)} N.${d ? ` L'albero è Ø${d} mm.` : ''} Per fatica e cava della chiavetta usi σ amm = ${sa} MPa.`;
        if (liv === 3) {
          const d = Math.cbrt(16 * Math.sqrt(4 * M * M + 3 * T * T) / (PI * sa));
          const sc = sceltaCatalogo([14, 16, 18, 20, 22, 25, 28, 30, 35, 40, 45, 50], d, 'mm');
          return {
            schema: sch, contesto: ctx(0), richiesta: 'Diametro minimo dell\'albero sul cuscinetto, in mm.',
            dati: [['P', P, 'kW'], ['n', n, 'giri/min'], ['sbalzo a', a, 'mm'], ['tiro F', Fc, 'N'], ['σ amm', sa, 'MPa']],
            impostazione: ['Coppia: T = P / ω.', 'Sul cuscinetto: M = F · a.', 'Von Mises sull\'albero: d = ∛(16 √(4 M² + 3 T²) / (π σ amm)).'],
            risposta: { nome: 'd minimo', valore: d, unita: 'mm' },
            passi: [['Velocità angolare', `2π · ${n} / 60`, w, 'rad/s'], ['Coppia', `${f(P * 1000)} / ω · 1000`, T, 'N·mm'], ['Momento sul cuscinetto', `${f(Fc)} · ${a}`, M, 'N·mm'], ['Diametro minimo', 'd = ∛(16 √(4M² + 3T²) / (π σ amm))', d, 'mm']],
            decisione: { domanda: 'Che diametro scegli?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `Almeno Ø${f(d)}: si fa Ø${sc.valore}. Qui la flessione pesa ${M > T ? 'più' : 'meno'} della torsione: avvicinare la puleggia al cuscinetto è il modo più economico per alleggerire l'albero.`,
          };
        }
        const d = vicino([16, 18, 20, 22, 25, 28, 30, 35, 40, 45], Math.cbrt(16 * Math.sqrt(4 * M * M + 3 * T * T) / (PI * sa)));
        const s = 32 * M / (PI * d ** 3), t = 16 * T / (PI * d ** 3), se = vm(s, t);
        if (liv === 1) {
          return {
            schema: sch, contesto: `Sull'albero Ø${d} mm, nella sezione del cuscinetto vicino alla puleggia, agiscono un momento flettente di ${f(M / 1000)} N·m e un momento torcente di ${f(T / 1000)} N·m. σ amm = ${sa} MPa.`,
            richiesta: 'Tensione equivalente di Von Mises, in MPa.',
            dati: [['d', d, 'mm'], ['M flettente', M / 1000, 'N·m'], ['M torcente', T / 1000, 'N·m'], ['σ amm', sa, 'MPa']],
            impostazione: ['Porta i momenti in N·mm (× 1000).', 'σ = 32 M / (π d³), τ = 16 T / (π d³).', 'σ eq = √(σ² + 3τ²).'],
            risposta: { nome: 'σ eq', valore: se, unita: 'MPa' },
            passi: [['σ di flessione', `32 · ${f(M)} / (π · ${d}³)`, s, 'MPa'], ['τ di torsione', `16 · ${f(T)} / (π · ${d}³)`, t, 'MPa'], ['Von Mises', '√(σ² + 3τ²)', se, 'MPa']],
            decisione: { domanda: 'L\'albero va bene?', opzioni: MARGINE, giusta: giustaMargine(sa, se) },
            giudizio: `σ eq = ${f(se)} MPa contro ${sa}. Nota che a parità di momento la τ da torsione è metà della σ da flessione: il 16 contro il 32.`,
          };
        }
        return {
          schema: sch, contesto: ctx(d), richiesta: 'Tensione equivalente di Von Mises sul cuscinetto, in MPa.',
          dati: [['P', P, 'kW'], ['n', n, 'giri/min'], ['sbalzo a', a, 'mm'], ['tiro F', Fc, 'N'], ['d', d, 'mm']],
          impostazione: ['T = P / ω, in N·mm.', 'M = F · a sul cuscinetto.', 'σ = 32 M / (π d³), τ = 16 T / (π d³), σ eq = √(σ² + 3τ²).'],
          risposta: { nome: 'σ eq', valore: se, unita: 'MPa' },
          passi: [['Velocità angolare', `2π · ${n} / 60`, w, 'rad/s'], ['Coppia', 'P / ω', T, 'N·mm'], ['Momento flettente', `${f(Fc)} · ${a}`, M, 'N·mm'], ['σ', '32 M / (π d³)', s, 'MPa'], ['τ', '16 T / (π d³)', t, 'MPa'], ['Von Mises', '√(σ² + 3τ²)', se, 'MPa']],
          decisione: { domanda: 'L\'albero va bene?', opzioni: MARGINE, giusta: giustaMargine(sa, se) },
          giudizio: `σ eq = ${f(se)} MPa. Il tiro della cinghia (circa 2,5 volte la forza utile) carica l'albero più di quanto si pensi: per questo le pulegge si montano il più vicino possibile al cuscinetto.`,
        };
      },
    },
    {
      id: 'intaglio', blocco: 'b3', titolo: 'Lo spallamento dell\'albero è un punto debole?',
      genera(liv, R) {
        const tab = [[0.5, 2.3], [1, 1.9], [1.5, 1.75], [2, 1.6], [3, 1.45], [4, 1.35]]; // raggio di raccordo mm -> Kt (D/d = 1,2, flessione, d ≈ 20–30)
        const d = R.da([20, 25, 30]);
        const sa = 140;
        const sch = schema('Dove parte la cricca in un albero con uno spallamento, caricato a flessione?', [
          'Nel raccordo dello spallamento, sul diametro piccolo',
          'A metà del tratto con diametro grande',
          'Nel diametro grande, vicino allo spallamento',
          'In un punto qualsiasi: la sezione è piena',
        ], 'Il cambio di sezione concentra le linee di forza come l\'acqua in una strozzatura. Lì la tensione vera è Kt volte quella nominale, calcolata sul diametro piccolo. Kt si legge sui grafici (dipende da r/d e D/d): più grande il raggio di raccordo, più basso Kt.');
        const testoTab = 'Dal grafico del manuale (D/d = 1,2, flessione): ' + tab.map(([r, k]) => `r = ${f(r)} mm → Kt = ${f(k)}`).join('; ') + '.';
        if (liv === 3) {
          const sn = R.tra(50, 95, 5);
          const ktMax = sa / sn;
          const ok = tab.filter(([, k]) => k <= ktMax + 1e-9);
          const giusto = ok.length ? ok[0] : tab[tab.length - 1];
          const opz = tab.slice(0, 4).concat(tab.slice(4)).map(([r]) => `r = ${f(r)} mm`);
          return {
            schema: sch, contesto: `Su un albero Ø${d} mm con spallamento, la tensione nominale di flessione nel raccordo è ${sn} MPa. L'ammissibile è ${sa} MPa. Il cuscinetto ha uno smusso che non accetta raggi grandi: vuoi il raggio più piccolo che basta. ${testoTab}`,
            richiesta: 'Kt massimo che puoi permetterti.',
            dati: [['σ nominale', sn, 'MPa'], ['σ amm', sa, 'MPa']],
            impostazione: ['σ max = Kt · σ nominale ≤ σ amm.', 'Kt max = σ amm / σ nominale.', 'Poi dal grafico scegli il raggio più piccolo con Kt sotto quel valore.'],
            risposta: { nome: 'Kt max', valore: ktMax, unita: '' },
            passi: [['Kt massimo', `${sa} / ${sn}`, ktMax, '']],
            decisione: { domanda: 'Che raggio di raccordo scegli?', opzioni: opz, giusta: tab.indexOf(giusto) },
            giudizio: ok.length ? `Kt ≤ ${f(ktMax)}: basta r = ${f(giusto[0])} mm (Kt = ${f(giusto[1])}). Se lo smusso del cuscinetto non lo permette, si usa un anello distanziale con il raggio dentro, o una gola di scarico.` : `Nessun raggio basta (serve Kt ≤ ${f(ktMax)}): bisogna ingrandire l'albero o ridurre il carico. Il raggio più grande della tabella arriva a Kt = ${f(giusto[1])}.`,
          };
        }
        const [r, kt] = R.da(tab);
        let M, passiM = [];
        if (liv === 1) { M = R.tra(50, 350, 10) * 1000; }
        else {
          const F = R.tra(1, 6, 0.5) * 1000, a = R.da([40, 60, 80]);
          M = F * a; passiM = [['Momento nello spallamento', `${f(F)} · ${a}`, M, 'N·mm']];
          M = M; // eslint
          var Ftesto = `una forza di ${f(F)} N a ${a} mm dallo spallamento`;
        }
        const sn = 32 * M / (PI * d ** 3), smax = kt * sn;
        return {
          schema: sch, contesto: `Un albero passa da Ø${f(d * 1.2)} a Ø${d} mm con un raggio di raccordo di ${f(r)} mm. Nello spallamento ${liv === 1 ? `c'è un momento flettente di ${f(M / 1000)} N·m` : `arriva il momento di ${Ftesto}`}. ${testoTab} σ amm = ${sa} MPa.`,
          richiesta: 'Tensione massima nel raccordo, in MPa.',
          dati: [['d piccolo', d, 'mm'], ['r', r, 'mm'], ['Kt', kt, ''], ...(liv === 1 ? [['M', M / 1000, 'N·m']] : [])],
          impostazione: [...(liv === 1 ? [] : ['Prima il momento: forza per braccio.']), 'Tensione nominale sul diametro piccolo: σ n = 32 M / (π d³).', 'Tensione vera nel raccordo: σ max = Kt · σ n.'],
          risposta: { nome: 'σ max', valore: smax, unita: 'MPa' },
          passi: [...passiM, ['Tensione nominale', `32 · ${f(M)} / (π · ${d}³)`, sn, 'MPa'], ['Tensione massima', `${f(kt)} · σ n`, smax, 'MPa']],
          decisione: { domanda: 'Il raccordo va bene?', opzioni: MARGINE, giusta: giustaMargine(sa, smax) },
          giudizio: `${f(smax)} MPa contro ${sa}: senza Kt avresti trovato ${f(sn)} MPa e pensato che andasse tutto bene. In campo plastico (carico statico su acciaio duttile) l'intaglio pesa meno (Neuber); in fatica pesa tutto.`,
        };
      },
    },
    {
      id: 'bilanciere', blocco: 'b3', titolo: 'La trave basculante della pompa regge?',
      genera(liv, R) {
        const a = R.da([3, 4, 5]), b = R.da([3, 4, 5]);
        const F = R.tra(20, 120, 5) * 1000; // N, lato pozzo
        const sch = schema('La trave basculante ruota su un perno centrale: carico sul lato pozzo, biella sul lato motore. Dov\'è il momento massimo?', [
          'Sul perno centrale: M = F · a',
          'In punta, dove è attaccato il carico',
          'A metà di ogni braccio',
          'È uguale lungo tutta la trave',
        ], 'Sono due mensole attaccate al perno: il taglio è costante su ogni braccio e il momento cresce linearmente fino al perno. Lì M = F · a (uguale dai due lati, per l\'equilibrio). Il perno porta la somma delle due forze.');
        const Fb = F * a / b;
        if (liv === 1) {
          return {
            schema: sch, contesto: `Una pompa a cavalletto solleva con l'asta del pozzo ${f(F / 1000)} kN. La trave basculante ha il perno con ${a} m dal lato pozzo e ${b} m dal lato motore, dove c'è la biella.`,
            richiesta: 'Forza sulla biella lato motore, in kN.',
            dati: [['F pozzo', F / 1000, 'kN'], ['braccio pozzo', a, 'm'], ['braccio motore', b, 'm']],
            impostazione: ['Equilibrio alla rotazione attorno al perno.', 'F · a = F biella · b.'],
            risposta: { nome: 'F biella', valore: Fb / 1000, unita: 'kN' },
            passi: [['Forza sulla biella', `${f(F / 1000)} · ${a} / ${b}`, Fb / 1000, 'kN'], ['Forza sul perno', 'somma delle due', (F + Fb) / 1000, 'kN']],
            giudizio: `La biella tira ${f(Fb / 1000)} kN e il perno ne porta ${f((F + Fb) / 1000)}: il perno è il pezzo più caricato. Il contrappeso non serve a far funzionare la pompa, ma a ridurre la potenza del motore, come in un ascensore.`,
          };
        }
        const M = F * a * 1000; // N·mm
        const sa = 235 / 1.5;
        if (liv === 3) {
          const h = Math.cbrt(18 * M / sa);
          const sc = sceltaCatalogo([200, 250, 300, 350, 400, 450, 500, 600, 700, 800], h, 'mm');
          return {
            schema: sch, contesto: `La trave basculante di una pompa a cavalletto porta ${f(F / 1000)} kN in punta al braccio lato pozzo, lungo ${a} m. Per semplicità la fai a sezione rettangolare piena con base = altezza / 3. S235 con sicurezza 1,5.`,
            richiesta: 'Altezza minima della sezione sul perno, in mm.',
            dati: [['F', F / 1000, 'kN'], ['braccio', a, 'm'], ['base', 'h/3', ''], ['σ amm', sa, 'MPa']],
            impostazione: ['M max sul perno = F · a, in N·mm (attenzione: m → mm).', 'Rettangolo b × h con b = h/3: W = b h² / 6 = h³ / 18.', 'h = ∛(18 M / σ amm).'],
            risposta: { nome: 'h minima', valore: h, unita: 'mm' },
            passi: [['Momento sul perno', `${f(F)} · ${a * 1000}`, M, 'N·mm'], ['Ammissibile', '235 / 1,5', sa, 'MPa'], ['Altezza minima', 'h = ∛(18 M / σ amm)', h, 'mm']],
            decisione: { domanda: 'Che altezza scegli?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `Almeno ${f(h)} mm: si fa ${sc.valore}. Nella realtà si usa una trave a I, che a parità di peso ha un W molto più alto: il materiale sta lontano dall'asse neutro, dove lavora.`,
          };
        }
        const bs = R.da([80, 100, 120]);
        const h = vicino([200, 250, 300, 350, 400, 450, 500], Math.sqrt(6 * M / (bs * sa)));
        const W = bs * h * h / 6, s = M / W;
        return {
          schema: sch, contesto: `La trave basculante di una pompa a cavalletto porta ${f(F / 1000)} kN in punta al braccio lato pozzo, lungo ${a} m. Sul perno la sezione è un rettangolo ${bs} × ${h} mm (altezza verticale). S235, sicurezza 1,5: σ amm ≈ 157 MPa.`,
          richiesta: 'Tensione massima di flessione sul perno, in MPa.',
          dati: [['F', F / 1000, 'kN'], ['braccio', a, 'm'], ['sezione', `${bs} × ${h}`, 'mm']],
          impostazione: ['M sul perno = F · a. Attenzione alla conversione: kN·m → N·mm è × 10⁶.', 'W = b h² / 6.', 'σ = M / W.'],
          risposta: { nome: 'σ', valore: s, unita: 'MPa' },
          passi: [['Momento', `${f(F)} · ${a * 1000}`, M, 'N·mm'], ['Modulo di resistenza', `${bs} · ${h}² / 6`, W, 'mm³'], ['Tensione', 'M / W', s, 'MPa']],
          decisione: { domanda: 'La trave va bene?', opzioni: MARGINE, giusta: giustaMargine(sa, s) },
          giudizio: `${f(s)} MPa contro ${f(sa)}. Il metodo del professore: quando mancano dati, si mette un numero plausibile, si va avanti e si guarda se il risultato ha senso.`,
        };
      },
    },
    {
      id: 'freccia', blocco: 'b3', titolo: 'La trave è abbastanza rigida?',
      genera(liv, R) {
        const IPE = [['IPE 100', 171], ['IPE 120', 318], ['IPE 140', 541], ['IPE 160', 869], ['IPE 180', 1317], ['IPE 200', 1943], ['IPE 220', 2772], ['IPE 240', 3892], ['IPE 270', 5790], ['IPE 300', 8356]];
        const L = R.da([2000, 3000, 4000, 5000, 6000]);
        const F = R.tra(2, 20, 1) * 1000;
        const fAmm = L / 500;
        const sch = schema('La via di corsa di un paranco deve flettersi poco, sennò il carrello va in salita. Che grandezza della sezione comanda?', [
          'Il momento d\'inerzia I: la freccia è F L³ / (48 E I)',
          'Il modulo di resistenza W',
          'La tensione di snervamento dell\'acciaio',
          'L\'area della sezione',
        ], 'Rigidezza e resistenza sono conti separati. La freccia dipende da E·I: un acciaio più resistente non è più rigido (E è uguale per tutti gli acciai). Come nel blocco unico contro i due listelli: l\'altezza conta al cubo per la rigidezza e al quadrato per la resistenza.');
        if (liv === 3) {
          const I = F * L ** 3 / (48 * E_ACC * fAmm) / 1e4; // cm4
          const iGiusto = IPE.findIndex(([, ix]) => ix >= I);
          const k = iGiusto < 0 ? IPE.length - 1 : iGiusto;
          const da = Math.max(0, Math.min(k - Math.floor(Math.random() * 4), IPE.length - 4));
          const opz = IPE.slice(da, da + 4);
          return {
            schema: sch, contesto: `Devi scegliere la trave per la via di corsa di un paranco: luce ${f(L / 1000)} m tra gli appoggi, carico ${f(F / 1000)} kN che nel caso peggiore sta in mezzeria. La freccia non deve superare L/500. ${IPE.map(([n, i]) => `${n}: I = ${i} cm⁴`).join('; ')}.`,
            richiesta: 'Momento d\'inerzia minimo, in cm⁴.',
            dati: [['F', F / 1000, 'kN'], ['L', L / 1000, 'm'], ['f amm', fAmm, 'mm'], ['E', 210, 'GPa']],
            impostazione: ['Freccia ammessa: L / 500, in mm.', 'Trave appoggiata con carico in mezzo: f = F L³ / (48 E I).', 'I = F L³ / (48 E f amm), in mm⁴: dividi per 10⁴ per avere cm⁴.'],
            risposta: { nome: 'I minimo', valore: I, unita: 'cm⁴' },
            passi: [['Freccia ammessa', `${L} / 500`, fAmm, 'mm'], ['I minimo', 'F L³ / (48 E f)', I * 1e4, 'mm⁴'], ['In cm⁴', '/ 10⁴', I, 'cm⁴']],
            decisione: { domanda: 'Che profilo scegli?', opzioni: opz.map((x) => x[0]), giusta: opz.findIndex((x) => x === IPE[k]) },
            giudizio: `Serve I ≥ ${f(I)} cm⁴: ${IPE[k][0]}. Controlla poi anche la resistenza (σ = M/W), ma nelle vie di corsa di solito comanda la freccia.`,
          };
        }
        let I, sez, passiI;
        if (liv === 1) {
          const b = R.da([40, 50, 60]), h = R.da([80, 100, 120, 150]);
          I = b * h ** 3 / 12; sez = `un piatto pieno ${b} × ${h} mm messo di costa`;
          passiI = [['Momento d\'inerzia', `${b} · ${h}³ / 12`, I, 'mm⁴']];
        } else {
          const [nome, ix] = R.da(IPE.slice(2, 9)); I = ix * 1e4; sez = `una trave ${nome} (I = ${ix} cm⁴)`;
          passiI = [['Momento d\'inerzia in mm⁴', `${ix} · 10⁴`, I, 'mm⁴']];
        }
        const fr = F * L ** 3 / (48 * E_ACC * I);
        return {
          schema: sch, contesto: `La via di corsa di un paranco è ${sez}, appoggiata agli estremi con luce ${f(L / 1000)} m. Il paranco con il carico pesa ${f(F / 1000)} kN e nel caso peggiore sta in mezzeria. Limite: freccia ≤ L/500 = ${f(fAmm)} mm.`,
          richiesta: 'Freccia in mezzeria, in mm.',
          dati: [['F', F / 1000, 'kN'], ['L', L / 1000, 'm'], ['E', 210, 'GPa']],
          impostazione: [liv === 1 ? 'Rettangolo: I = b h³ / 12, con h verticale.' : 'Porta I in mm⁴ (1 cm⁴ = 10⁴ mm⁴).', 'f = F L³ / (48 E I), con L in mm ed E in MPa.'],
          risposta: { nome: 'f', valore: fr, unita: 'mm' },
          passi: [...passiI, ['Freccia', `${f(F)} · ${L}³ / (48 · 210000 · I)`, fr, 'mm']],
          decisione: { domanda: 'La trave è abbastanza rigida?', opzioni: ['Sì', 'No'], giusta: fr <= fAmm ? 0 : 1 },
          giudizio: `${f(fr)} mm contro ${f(fAmm)} ammessi. La luce conta al cubo: raddoppiarla fa la freccia 8 volte più grande.`,
        };
      },
    },

    // ---------------- BLOCCO 4: materiali ----------------
    {
      id: 'estensimetro', blocco: 'b4', titolo: 'Cosa dice l\'estensimetro?',
      genera(liv, R) {
        const mat = R.da([['acciaio', 210000], ['alluminio', 70000]]);
        if (liv === 3) {
          const d = R.da([20, 25, 30, 40]), F = R.tra(10, 80, 5) * 1000;
          const eps = F / (PI * d * d / 4) / mat[1] * 1e6;
          return {
            contesto: `Vuoi un allarme su un tirante tondo in ${mat[0]} Ø${d} mm (E = ${f(mat[1] / 1000)} GPa) quando il carico supera ${f(F / 1000)} kN. Ci incolli un estensimetro.`,
            richiesta: 'A quale deformazione deve scattare l\'allarme, in µm/m?',
            dati: [['F soglia', F / 1000, 'kN'], ['d', d, 'mm'], ['E', mat[1] / 1000, 'GPa']],
            impostazione: ['σ = F / A.', 'ε = σ / E.', 'In µm/m: moltiplica per 10⁶.'],
            risposta: { nome: 'ε', valore: eps, unita: 'µm/m' },
            passi: [['Area', `π · ${d}² / 4`, PI * d * d / 4, 'mm²'], ['Tensione', 'F / A', F / (PI * d * d / 4), 'MPa'], ['Deformazione', 'σ / E · 10⁶', eps, 'µm/m']],
            giudizio: `Soglia a ${f(eps)} µm/m. Gli estensimetri misurano pochi µm/m: la temperatura sposta la lettura quasi come il carico, per questo si usa un ponte con un secondo estensimetro di compensazione.`,
          };
        }
        const eps = R.tra(200, 1200, 10);
        const s = mat[1] * eps * 1e-6;
        if (liv === 1) {
          return {
            contesto: `Su un pezzo in ${mat[0]} (E = ${f(mat[1] / 1000)} GPa) un estensimetro legge ${eps} µm/m nella direzione del carico.`,
            richiesta: 'Tensione nel pezzo, in MPa.',
            dati: [['ε', eps, 'µm/m'], ['E', mat[1] / 1000, 'GPa']],
            impostazione: ['Legge di Hooke: σ = E · ε.', 'µm/m = 10⁻⁶. E in MPa.'],
            risposta: { nome: 'σ', valore: s, unita: 'MPa' },
            passi: [['ε adimensionale', `${eps} · 10⁻⁶`, eps * 1e-6, ''], ['Tensione', `${mat[1]} · ε`, s, 'MPa']],
            giudizio: `${f(s)} MPa. A parità di deformazione l'alluminio lavora a un terzo della tensione dell'acciaio: E è tre volte più basso.`,
          };
        }
        const d = R.da([16, 20, 25, 30]);
        const Fk = s * PI * d * d / 4 / 1000;
        return {
          contesto: `Un tirante tondo in ${mat[0]} Ø${d} mm (E = ${f(mat[1] / 1000)} GPa) ha un estensimetro che legge ${eps} µm/m.`,
          richiesta: 'Forza nel tirante, in kN.',
          dati: [['ε', eps, 'µm/m'], ['E', mat[1] / 1000, 'GPa'], ['d', d, 'mm']],
          impostazione: ['σ = E · ε.', 'F = σ · A, con A in mm²: esce N.'],
          risposta: { nome: 'F', valore: Fk, unita: 'kN' },
          passi: [['Tensione', `${mat[1]} · ${eps} · 10⁻⁶`, s, 'MPa'], ['Area', `π · ${d}² / 4`, PI * d * d / 4, 'mm²'], ['Forza', 'σ · A / 1000', Fk, 'kN']],
          giudizio: `Circa ${f(Fk)} kN. È così che si pesano le cose in officina: le celle di carico sono estensimetri incollati su un pezzo d'acciaio.`,
        };
      },
    },
    {
      id: 'scelta-acciaio', blocco: 'b4', titolo: 'Quale acciaio prendi?',
      genera(liv, R) {
        const mat = [['S235', 235], ['S355', 355], ['C45 bonificato', 430], ['42CrMo4 bonificato', 650]];
        const nu = R.da([1.5, 2, 2.5]);
        const sch = schema('Alla fine di una verifica, che cosa confronti?', [
          'La tensione equivalente sul componente con l\'ammissibile del materiale',
          'Lo snervamento del materiale con la sua rottura',
          'La tensione equivalente con la tensione nominale',
          'Il modulo elastico con lo snervamento',
        ], 'I due mondi del corso: il componente (carichi e geometria danno una sola tensione equivalente, uguale in legno o in acciaio) e il materiale (dà l\'ammissibile = limite / sicurezza). Si confrontano solo all\'ultimo passaggio, uno contro l\'altro. L\'errore tipico è confrontare due cose dello stesso mondo.');
        let se, passi, ctx;
        if (liv === 1) {
          se = R.tra(60, 300, 5);
          ctx = `Dai conti sul componente la tensione equivalente nel punto più sollecitato è ${se} MPa.`;
          passi = [];
        } else if (liv === 2) {
          const d = R.da([20, 25, 30]), F = R.tra(30, 150, 5) * 1000;
          se = F / (PI * d * d / 4);
          ctx = `Un tirante tondo Ø${d} mm porta ${f(F / 1000)} kN a trazione.`;
          passi = [['Tensione sul componente', `${f(F)} / (π · ${d}² / 4)`, se, 'MPa']];
        } else {
          const s = R.tra(60, 250, 5), t = R.tra(30, 150, 5);
          se = vm(s, t);
          ctx = `Nel punto più sollecitato di un albero ci sono σ = ${s} MPa di flessione e τ = ${t} MPa di torsione.`;
          passi = [['Von Mises', `√(${s}² + 3 · ${t}²)`, se, 'MPa']];
        }
        const Rs = se * nu;
        const k = mat.findIndex(([, r]) => r >= Rs);
        return {
          schema: sch,
          contesto: `${ctx} Il pezzo non deve snervare e vuoi sicurezza ${f(nu)}. Snervamento minimo garantito dal fornitore per il tuo diametro: ${mat.map(([n, r]) => `${n} ${r} MPa`).join(', ')}. Vuoi il più economico che basta (sono in ordine di prezzo).`,
          richiesta: 'Snervamento minimo che deve avere il materiale, in MPa.',
          dati: [['sicurezza', nu, '']],
          impostazione: [...(liv === 3 ? ['Prima la tensione equivalente: σ eq = √(σ² + 3τ²).'] : liv === 2 ? ['Prima la tensione: σ = F / A.'] : []), 'σ eq ≤ Rs / ν, quindi Rs ≥ ν · σ eq.'],
          risposta: { nome: 'Rs minimo', valore: Rs, unita: 'MPa' },
          passi: [...passi, ['Snervamento minimo', `${f(nu)} · ${f(se)}`, Rs, 'MPa']],
          decisione: { domanda: 'Che acciaio prendi?', opzioni: mat.map((m) => m[0]).concat(['Nessuno basta: cambio geometria']), giusta: k < 0 ? 4 : k },
          giudizio: k < 0 ? `Serve Rs ≥ ${f(Rs)} MPa: nessuno di questi basta. Si cambia la geometria (più sezione) prima di cercare acciai speciali.` : `Serve Rs ≥ ${f(Rs)} MPa: basta ${mat[k][0]}. Un acciaio più resistente non è più rigido: se il problema è la freccia, cambiare acciaio non serve.`,
        };
      },
    },

    // ---------------- BLOCCO 5: meccanica applicata ----------------
    {
      id: 'frizione', blocco: 'b5', titolo: 'La frizione trasmette la coppia?',
      genera(liv, R) {
        const De = R.da([160, 200, 250, 300]), Di = Math.round(De * R.da([0.55, 0.6, 0.65]) / 5) * 5;
        const mu = R.da([0.25, 0.3, 0.35]), nS = R.da([2, 2, 4]);
        const Rm = (De + Di) / 4; // raggio medio in mm
        const sch = schema('Con la frizione già rodata, che ipotesi usi per la pressione sul disco?', [
          'Usura uniforme: p · r costante, la forza lavora al raggio medio (Re + Ri)/2',
          'Pressione uniforme su tutta la corona',
          'Tutta la forza sul raggio esterno',
          'Tutta la forza sul raggio interno',
        ], 'Dove il disco striscia più veloce (raggio esterno) si consuma di più, finché l\'usura si uniforma: p · r = costante. Con questa ipotesi la coppia è μ · F · (Re + Ri)/2 per ogni superficie di attrito. È anche l\'ipotesi più cauta.');
        const ctx = `Una frizione piana ha la corona d'attrito con diametro esterno ${De} mm e interno ${Di} mm, coefficiente d'attrito ${f(mu)} e ${nS} superfici di attrito.`;
        if (liv === 3) {
          const P = R.da([5.5, 7.5, 11, 15]), n = R.da([960, 1450]), fs = 1.5;
          const C = P * 1000 / (2 * PI * n / 60);
          const F = C * fs / (mu * Rm / 1000 * nS);
          return {
            schema: sch, contesto: `${ctx} Deve trasmettere un motore da ${f(P)} kW a ${n} giri/min con fattore di sicurezza 1,5 sullo slittamento.`,
            richiesta: 'Forza minima delle molle, in N.',
            dati: [['De', De, 'mm'], ['Di', Di, 'mm'], ['μ', mu, ''], ['superfici', nS, ''], ['P', P, 'kW'], ['n', n, 'giri/min']],
            impostazione: ['Coppia del motore: C = P / ω.', 'Coppia da trasmettere: 1,5 · C.', 'Usura uniforme: C = μ · F · r medio · n superfici, con r medio = (De + Di)/4.', 'F = 1,5 C / (μ · r medio · n).'],
            risposta: { nome: 'F molle', valore: F, unita: 'N' },
            passi: [['Coppia del motore', `${f(P * 1000)} / (2π · ${n} / 60)`, C, 'N·m'], ['Raggio medio', `(${De} + ${Di}) / 4`, Rm, 'mm'], ['Forza delle molle', `1,5 · C / (${f(mu)} · ${f(Rm / 1000)} · ${nS})`, F, 'N']],
            giudizio: `Almeno ${f(F)} N. Poi si verifica la pressione sul lato interno, dove con l'usura uniforme è massima: p max = F / (2π · r i · (r e − r i)).`,
          };
        }
        const F = R.tra(1, 8, 0.5) * 1000;
        const C = mu * F * Rm / 1000 * nS;
        if (liv === 1) {
          return {
            schema: sch, contesto: `${ctx} Le molle la chiudono con ${f(F)} N.`,
            richiesta: 'Coppia massima che trasmette prima di slittare, in N·m.',
            dati: [['De', De, 'mm'], ['Di', Di, 'mm'], ['μ', mu, ''], ['superfici', nS, ''], ['F', F, 'N']],
            impostazione: ['Raggio medio: (De + Di) / 4.', 'C = μ · F · r medio · numero di superfici.', 'r medio in metri per avere N·m.'],
            risposta: { nome: 'C', valore: C, unita: 'N·m' },
            passi: [['Raggio medio', `(${De} + ${Di}) / 4`, Rm, 'mm'], ['Coppia', `${f(mu)} · ${f(F)} · ${f(Rm / 1000)} · ${nS}`, C, 'N·m']],
            giudizio: `${f(C)} N·m. Per trasmettere di più senza ingrandirla: più dischi (frizioni a dischi multipli), non più forza, che consuma e scalda.`,
          };
        }
        const n = R.da([960, 1450]);
        const P = Math.round(C * 2 * PI * n / 60 / 1000 * R.da([0.7, 0.9, 1.1, 1.3]) * 10) / 10;
        const Cm = P * 1000 / (2 * PI * n / 60);
        return {
          schema: sch, contesto: `${ctx} Le molle la chiudono con ${f(F)} N. Deve trasmettere un motore da ${f(P)} kW a ${n} giri/min.`,
          richiesta: 'Coppia massima trasmissibile dalla frizione, in N·m.',
          dati: [['De', De, 'mm'], ['Di', Di, 'mm'], ['μ', mu, ''], ['superfici', nS, ''], ['F', F, 'N'], ['P motore', P, 'kW'], ['n', n, 'giri/min']],
          impostazione: ['C frizione = μ · F · (De + Di)/4 · superfici.', 'C motore = P / ω.', 'Confronta: la frizione deve stare sopra con margine.'],
          risposta: { nome: 'C frizione', valore: C, unita: 'N·m' },
          passi: [['Raggio medio', `(${De} + ${Di}) / 4`, Rm, 'mm'], ['Coppia della frizione', 'μ · F · r · n', C, 'N·m'], ['Coppia del motore', `${f(P * 1000)} / ω`, Cm, 'N·m']],
          decisione: { domanda: 'La frizione basta?', opzioni: MARGINE, giusta: giustaMargine(C, Cm) },
          giudizio: `Frizione ${f(C)} N·m contro motore ${f(Cm)} N·m. Una frizione al limite slitta negli avviamenti, scalda e si consuma: si vuole almeno 1,3–1,5 di margine.`,
        };
      },
    },
    {
      id: 'cinghia', blocco: 'b5', titolo: 'La cinghia slitta?',
      genera(liv, R) {
        const mu = R.da([0.25, 0.3, 0.35]), alfa = R.da([150, 160, 170, 180]);
        const e = Math.exp(mu * alfa * PI / 180);
        const sch = schema('Due pulegge di diametro diverso: dove controlli che la cinghia non slitti?', [
          'Sulla più piccola: ha l\'angolo di avvolgimento minore',
          'Sulla più grande',
          'È uguale sulle due',
          'Sempre sulla motrice',
        ], 'Il rapporto tra le tensioni che la cinghia può reggere senza slittare è e^(μα): dipende dall\'angolo di avvolgimento α. La puleggia piccola ha l\'angolo più piccolo, quindi è lì che slitta per prima.');
        if (liv === 1) {
          return {
            contesto: `Una cinghia piatta avvolge la puleggia piccola per ${alfa}°. Il coefficiente d'attrito è ${f(mu)}.`,
            richiesta: 'Rapporto massimo T1 / T2 tra ramo teso e ramo lento prima che slitti.',
            dati: [['μ', mu, ''], ['α', alfa, '°']],
            impostazione: ['Formula di Eulero delle funi: T1 / T2 = e^(μ α).', 'α in radianti: gradi · π / 180.'],
            risposta: { nome: 'T1/T2', valore: e, unita: '' },
            passi: [['Angolo in radianti', `${alfa} · π / 180`, alfa * PI / 180, 'rad'], ['Rapporto', 'e^(μ α)', e, '']],
            giudizio: `Al massimo ${f(e)}. Le cinghie trapezoidali fanno di più a parità di angolo: l'effetto cuneo aumenta l'attrito apparente.`,
          };
        }
        const P = R.da([1.5, 2.2, 3, 4, 5.5]), n = R.da([960, 1450, 2850]), dp = R.da([100, 125, 160]);
        const C = P * 1000 / (2 * PI * n / 60);
        const Fu = C / (dp / 2000);
        const T1 = Fu * e / (e - 1), T2 = T1 / e;
        const ctx = `Un motore da ${f(P)} kW a ${n} giri/min ha una puleggia Ø${dp} mm, avvolta dalla cinghia piatta per ${alfa}°, μ = ${f(mu)}.`;
        if (liv === 2) {
          return {
            schema: sch, contesto: ctx, richiesta: 'Tensione nel ramo teso al limite dello slittamento, in N.',
            dati: [['P', P, 'kW'], ['n', n, 'giri/min'], ['d puleggia', dp, 'mm'], ['μ', mu, ''], ['α', alfa, '°']],
            impostazione: ['Forza utile: T1 − T2 = C / r, con C = P / ω.', 'Al limite: T1 = T2 · e^(μα).', 'Mettendo insieme: T1 = Fu · e^(μα) / (e^(μα) − 1).'],
            risposta: { nome: 'T1', valore: T1, unita: 'N' },
            passi: [['Coppia', `${f(P * 1000)} / (2π · ${n} / 60)`, C, 'N·m'], ['Forza utile', `C / ${f(dp / 2000)}`, Fu, 'N'], ['e^(μα)', '', e, ''], ['Ramo teso', 'Fu · e / (e − 1)', T1, 'N'], ['Ramo lento', 'T1 / e', T2, 'N']],
            giudizio: `T1 = ${f(T1)} N, T2 = ${f(T2)} N. Sull'albero arriva la somma, ${f(T1 + T2)} N, cioè ${f((T1 + T2) / Fu)} volte la forza utile: è quello che carica i cuscinetti.`,
          };
        }
        const T0 = (T1 + T2) / 2;
        return {
          schema: sch, contesto: ctx + ' Devi regolare il tenditore.', richiesta: 'Precarico minimo di ogni ramo a cinghia ferma, in N.',
          dati: [['P', P, 'kW'], ['n', n, 'giri/min'], ['d puleggia', dp, 'mm'], ['μ', mu, ''], ['α', alfa, '°']],
          impostazione: ['Trova T1 e T2 al limite dello slittamento.', 'A cinghia ferma i due rami hanno lo stesso precarico T0; in moto uno sale e l\'altro scende della stessa quantità.', 'T0 = (T1 + T2) / 2.'],
          risposta: { nome: 'T0', valore: T0, unita: 'N' },
          passi: [['Coppia', 'P / ω', C, 'N·m'], ['Forza utile', 'C / r', Fu, 'N'], ['Ramo teso', 'Fu · e / (e − 1)', T1, 'N'], ['Ramo lento', 'T1 / e', T2, 'N'], ['Precarico', '(T1 + T2) / 2', T0, 'N']],
          giudizio: `Almeno ${f(T0)} N per ramo; in pratica si sta un 20–30% sopra, perché la cinghia si allunga. Troppo precarico invece consuma cinghia e cuscinetti.`,
        };
      },
    },
    {
      id: 'avviamento', blocco: 'b5', titolo: 'Quanto ci mette la macchina ad andare a regime?',
      genera(liv, R) {
        const n = R.da([1450, 2900]), w = 2 * PI * n / 60;
        const Jm = R.da([0.005, 0.01, 0.02]);
        const sch = schema('C\'è un riduttore tra motore e carico. Come porti inerzia e coppia resistente del carico all\'albero motore?', [
          'J carico · τ² e C carico · τ / η (τ = n uscita / n motore)',
          'J carico · τ e C carico · τ',
          'J carico / τ² e C carico / τ',
          'Si sommano così come sono',
        ], 'Equivalenza energetica: l\'energia cinetica del carico, ½ J ω u², vista dal motore vale ½ (J τ²) ω m². La potenza resistente C · ω u, divisa per il rendimento, vista dal motore è C τ / η. Per questo con un riduttore grande l\'inerzia del carico quasi sparisce.');
        if (liv === 1) {
          const J = R.da([0.05, 0.1, 0.2, 0.4]), Cm = R.tra(20, 80, 5), Cr = Math.round(Cm * R.da([0.3, 0.4, 0.5]));
          const t = (Jm + J) * w / (Cm - Cr);
          return {
            contesto: `Un motore (J = ${f(Jm)} kg·m²) è collegato direttamente a un ventilatore (J = ${f(J)} kg·m²). Durante l'avviamento il motore dà in media ${Cm} N·m e il ventilatore ne chiede in media ${Cr}. Regime: ${n} giri/min.`,
            richiesta: 'Tempo di avviamento, in secondi.',
            dati: [['J motore', Jm, 'kg·m²'], ['J carico', J, 'kg·m²'], ['C motore', Cm, 'N·m'], ['C resistente', Cr, 'N·m'], ['n', n, 'giri/min']],
            impostazione: ['Equazione del moto: (C m − C r) = J tot · dω/dt.', 'Con coppie medie costanti: t = J tot · ω / (C m − C r).'],
            risposta: { nome: 't', valore: t, unita: 's' },
            passi: [['Velocità di regime', `2π · ${n} / 60`, w, 'rad/s'], ['Inerzia totale', `${f(Jm)} + ${f(J)}`, Jm + J, 'kg·m²'], ['Tempo', 'J · ω / (Cm − Cr)', t, 's']],
            giudizio: `Circa ${f(t)} s. Se il motore resta a lungo ad alta corrente scalda: i ventilatori grandi a volte hanno bisogno di avviatori dolci o inverter.`,
          };
        }
        const i = R.da([10, 15, 20, 30]), tau = 1 / i, eta = 0.9;
        const Jc = R.da([2, 5, 10, 20]), Cc = R.tra(100, 600, 20);
        const Jr = Jm + Jc * tau * tau, Cr = Cc * tau / eta;
        if (liv === 3) {
          const tObj = R.da([1, 2, 3]);
          const Cm = Jr * w / tObj + Cr;
          return {
            schema: sch, contesto: `Un nastro con inerzia ${Jc} kg·m² e coppia resistente ${Cc} N·m (all'albero lento) è mosso tramite un riduttore i = ${i} (η = 0,9) da un motore con J = ${f(Jm)} kg·m², a ${n} giri/min. Vuoi che vada a regime in ${tObj} s.`,
            richiesta: 'Coppia media che deve dare il motore in avviamento, in N·m.',
            dati: [['J carico', Jc, 'kg·m²'], ['C carico', Cc, 'N·m'], ['i', i, ''], ['η', eta, ''], ['J motore', Jm, 'kg·m²'], ['n motore', n, 'giri/min'], ['t', tObj, 's']],
            impostazione: ['Riduci al motore: J rid = J m + J c · τ², C rid = C c · τ / η, con τ = 1/i.', 'C m = J rid · ω / t + C rid.'],
            risposta: { nome: 'C motore', valore: Cm, unita: 'N·m' },
            passi: [['τ', `1 / ${i}`, tau, ''], ['Inerzia ridotta', `${f(Jm)} + ${Jc} · τ²`, Jr, 'kg·m²'], ['Coppia resistente ridotta', `${Cc} · τ / 0,9`, Cr, 'N·m'], ['Velocità', `2π · ${n} / 60`, w, 'rad/s'], ['Coppia del motore', 'J rid · ω / t + C rid', Cm, 'N·m']],
            giudizio: `Circa ${f(Cm)} N·m medi. Sul catalogo guardi la coppia di spunto e la curva: la coppia media in avviamento sta tra spunto e nominale.`,
          };
        }
        const Cm = Math.round(Cr * R.da([1.6, 2, 2.5]));
        const t = Jr * w / (Cm - Cr);
        return {
          schema: sch, contesto: `Un nastro con inerzia ${Jc} kg·m² e coppia resistente ${Cc} N·m (all'albero lento) è mosso tramite un riduttore i = ${i} (η = 0,9) da un motore con J = ${f(Jm)} kg·m², a ${n} giri/min. In avviamento il motore dà in media ${Cm} N·m.`,
          richiesta: 'Tempo di avviamento, in secondi.',
          dati: [['J carico', Jc, 'kg·m²'], ['C carico', Cc, 'N·m'], ['i', i, ''], ['J motore', Jm, 'kg·m²'], ['C motore', Cm, 'N·m'], ['n', n, 'giri/min']],
          impostazione: ['τ = 1 / i.', 'J rid = J m + J c · τ², C rid = C c · τ / η.', 't = J rid · ω / (C m − C rid).'],
          risposta: { nome: 't', valore: t, unita: 's' },
          passi: [['Inerzia ridotta', `${f(Jm)} + ${Jc} / ${i}²`, Jr, 'kg·m²'], ['Coppia resistente ridotta', `${Cc} / ${i} / 0,9`, Cr, 'N·m'], ['Velocità', `2π · ${n} / 60`, w, 'rad/s'], ['Tempo', 'J rid · ω / (Cm − C rid)', t, 's']],
          giudizio: `Circa ${f(t)} s. Il carico ha ${f(Jc / Jm)} volte l'inerzia del motore, ma dopo il riduttore ne vale solo ${f(Jc * tau * tau / Jm)} volte.`,
        };
      },
    },
    {
      id: 'epicicloidale', blocco: 'b5', titolo: 'Che cosa esce dal riduttore epicicloidale?',
      genera(liv, R) {
        const Zs = R.da([18, 20, 24, 27, 30]), Zc = R.da([60, 72, 78, 84, 90]);
        const sch = schema('Corona ferma, entrata sul solare, uscita sul portatreno. Che formula usi?', [
          'Willis: (n s − n p) / (n c − n p) = − Zc / Zs, con n c = 0',
          'Rapporto semplice: n p = n s · Zs / Zc',
          'n p = n s · Zc / Zs',
          'Il portatreno gira come il solare',
        ], 'Nei rotismi epicicloidali gli assi dei satelliti si muovono: si guarda il treno "dal portatreno" (formula di Willis), dove diventa un rotismo ordinario con rapporto −Zc/Zs. Con la corona ferma: n p = n s · Zs / (Zs + Zc).');
        if (liv === 3) {
          const ns = R.da([1450, 2900]), nc = R.tra(-300, 300, 50);
          const np = (ns * Zs + nc * Zc) / (Zs + Zc);
          return {
            schema: null, contesto: `In un differenziale epicicloidale il solare (${Zs} denti) gira a ${ns} giri/min e la corona (${Zc} denti), mossa da un secondo motore, a ${nc} giri/min (stesso verso se positivo).`,
            richiesta: 'Giri al minuto del portatreno.',
            dati: [['Zs', Zs, ''], ['Zc', Zc, ''], ['n solare', ns, 'giri/min'], ['n corona', nc, 'giri/min']],
            impostazione: ['Willis: (n s − n p) / (n c − n p) = − Zc / Zs.', 'Ricava n p: n p = (n s · Zs + n c · Zc) / (Zs + Zc).'],
            risposta: { nome: 'n portatreno', valore: np, unita: 'giri/min' },
            passi: [['Portatreno', `(${ns} · ${Zs} + ${nc} · ${Zc}) / (${Zs} + ${Zc})`, np, 'giri/min']],
            giudizio: `${f(np)} giri/min. È lo stesso principio del differenziale dell'auto: due ingressi, un'uscita che fa la media pesata.`,
          };
        }
        const ns = R.da([1450, 2900, 960]);
        const i = 1 + Zc / Zs, np = ns / i;
        if (liv === 1) {
          return {
            schema: sch, contesto: `Un riduttore epicicloidale ha il solare da ${Zs} denti, la corona da ${Zc} denti ferma nella carcassa, e l'uscita sul portatreno. Il motore sul solare gira a ${ns} giri/min.`,
            richiesta: 'Giri al minuto del portatreno.',
            dati: [['Zs', Zs, ''], ['Zc', Zc, ''], ['n solare', ns, 'giri/min']],
            impostazione: ['Corona ferma: rapporto i = 1 + Zc / Zs.', 'n uscita = n solare / i.'],
            risposta: { nome: 'n portatreno', valore: np, unita: 'giri/min' },
            passi: [['Rapporto', `1 + ${Zc} / ${Zs}`, i, ''], ['Giri in uscita', `${ns} / i`, np, 'giri/min']],
            giudizio: `${f(np)} giri/min, riduzione ${f(i)} in un solo stadio e con assi coassiali: per questo gli epicicloidali sono compatti.`,
          };
        }
        const Cin = R.tra(5, 50, 1), eta = 0.97;
        const Cout = Cin * i * eta;
        return {
          schema: sch, contesto: `Un riduttore epicicloidale ha solare ${Zs} denti, corona ${Zc} denti ferma, uscita sul portatreno. Entrano ${Cin} N·m sul solare. Rendimento 0,97.`,
          richiesta: 'Coppia sul portatreno, in N·m.',
          dati: [['Zs', Zs, ''], ['Zc', Zc, ''], ['C solare', Cin, 'N·m'], ['η', eta, '']],
          impostazione: ['Rapporto con corona ferma: i = 1 + Zc / Zs.', 'C uscita = C ingresso · i · η.', 'La corona ferma scarica sulla carcassa la differenza: C corona = C uscita − C ingresso.'],
          risposta: { nome: 'C uscita', valore: Cout, unita: 'N·m' },
          passi: [['Rapporto', `1 + ${Zc} / ${Zs}`, i, ''], ['Coppia in uscita', `${Cin} · i · 0,97`, Cout, 'N·m'], ['Coppia di reazione sulla carcassa', 'C uscita − C ingresso', Cout - Cin, 'N·m']],
          giudizio: `${f(Cout)} N·m in uscita e ${f(Cout - Cin)} N·m da reggere con i fissaggi della carcassa: le viti del riduttore si calcolano con questa.`,
        };
      },
    },

    // ---------------- BLOCCO 6: elementi costruttivi ----------------
    {
      id: 'vite', blocco: 'b6', titolo: 'Che precarico dà la chiave dinamometrica?',
      genera(liv, R) {
        const viti = [['M8', 8, 36.6], ['M10', 10, 58], ['M12', 12, 84.3], ['M16', 16, 157], ['M20', 20, 245]];
        const [nome, d, As] = R.da(viti);
        const cl = R.da([['8.8', 640], ['10.9', 940]]);
        const K = 0.2;
        if (liv === 3) {
          const F = 0.7 * cl[1] * As;
          const T = K * F * d / 1000;
          return {
            contesto: `Devi dare la coppia di serraggio per viti ${nome} classe ${cl[0]} (Rp0,2 = ${cl[1]} MPa, sezione resistente ${f(As)} mm²). Vuoi un precarico pari al 70% dello snervamento. Filetto leggermente oliato: K ≈ 0,2.`,
            richiesta: 'Coppia di serraggio, in N·m.',
            dati: [['vite', nome, ''], ['As', As, 'mm²'], ['Rp0,2', cl[1], 'MPa'], ['K', K, '']],
            impostazione: ['Precarico: F = 0,7 · Rp0,2 · As.', 'Coppia: T = K · F · d (d nominale in m per avere N·m).'],
            risposta: { nome: 'T', valore: T, unita: 'N·m' },
            passi: [['Precarico', `0,7 · ${cl[1]} · ${f(As)}`, F, 'N'], ['Coppia', `0,2 · F · ${d} / 1000`, T, 'N·m']],
            giudizio: `Circa ${f(T)} N·m. K cambia molto con la lubrificazione (da 0,12 a oltre 0,2): con la stessa coppia una vite oliata si precarica molto di più. Per questo sulle tabelle c'è sempre scritto "secco" o "lubrificato".`,
          };
        }
        const T = Math.round(K * 0.7 * cl[1] * As * d / 1000 * R.da([0.6, 0.8, 1, 1.2, 1.4]));
        const F = T * 1000 / (K * d);
        if (liv === 1) {
          return {
            contesto: `Una vite ${nome} viene serrata con la chiave dinamometrica a ${T} N·m. Filetto leggermente oliato: K ≈ 0,2.`,
            richiesta: 'Precarico nella vite, in N.',
            dati: [['d', d, 'mm'], ['T', T, 'N·m'], ['K', K, '']],
            impostazione: ['Formula pratica: T = K · F · d.', 'F = T / (K · d), con T in N·mm e d in mm.'],
            risposta: { nome: 'F', valore: F, unita: 'N' },
            passi: [['Coppia in N·mm', `${T} · 1000`, T * 1000, 'N·mm'], ['Precarico', `T / (0,2 · ${d})`, F, 'N']],
            giudizio: `Circa ${f(F)} N. Il precarico è quello che tiene chiuso il giunto: finché i pezzi restano premuti, la vite vede solo una piccola parte del carico esterno.`,
          };
        }
        const s = F / As;
        return {
          contesto: `Una vite ${nome} classe ${cl[0]} (Rp0,2 = ${cl[1]} MPa, sezione resistente ${f(As)} mm²) viene serrata a ${T} N·m, K ≈ 0,2. Per non snervarla durante il serraggio si sta sotto il 90% di Rp0,2.`,
          richiesta: 'Tensione nella sezione resistente, in MPa.',
          dati: [['vite', nome, ''], ['T', T, 'N·m'], ['As', As, 'mm²'], ['Rp0,2', cl[1], 'MPa']],
          impostazione: ['Precarico: F = T / (K · d).', 'σ = F / As (la sezione del filetto, non quella nominale).'],
          risposta: { nome: 'σ', valore: s, unita: 'MPa' },
          passi: [['Precarico', `${T * 1000} / (0,2 · ${d})`, F, 'N'], ['Tensione', `F / ${f(As)}`, s, 'MPa'], ['Limite al 90%', `0,9 · ${cl[1]}`, 0.9 * cl[1], 'MPa']],
          decisione: { domanda: 'Il serraggio va bene?', opzioni: ['Sì, sotto il 90% di Rp0,2', 'No, si rischia di snervarla'], giusta: s <= 0.9 * cl[1] ? 0 : 1 },
          giudizio: `${f(s)} MPa contro ${f(0.9 * cl[1])}. Una vite allungata oltre lo snervamento perde precarico e va buttata: non si riusa.`,
        };
      },
    },
    {
      id: 'saldatura', blocco: 'b6', titolo: 'Il cordone di saldatura tiene?',
      genera(liv, R) {
        const L = R.da([60, 80, 100, 120, 150]), nC = 2, ta = R.da([80, 100]);
        const sch = schema('Che sezione resistente usi per un cordone d\'angolo?', [
          'La gola a = 0,7 · z per la lunghezza del cordone',
          'Il lato z per la lunghezza',
          'Lo spessore della lamiera per la lunghezza',
          'L\'area del triangolo del cordone',
        ], 'Il cordone d\'angolo si rompe sulla sezione più stretta, la gola: l\'altezza del triangolo, a ≈ 0,7 · z per un cordone a 45°. La sezione resistente è a · L per ogni cordone. Le estremità del cordone sono spesso difettose: nei conti seri si tolgono.');
        const ctx = (z, Ftesto) => `Una piastra è saldata a una mensola con ${nC} cordoni d'angolo lunghi ${L} mm${z ? ` con lato z = ${z} mm` : ''}. Il carico ${Ftesto} è parallelo ai cordoni. Ammissibile del cordone: τ amm = ${ta} MPa.`;
        if (liv === 3) {
          const F = R.tra(20, 120, 5) * 1000;
          const z = F / (nC * L * ta) / 0.7;
          const sc = sceltaCatalogo([3, 4, 5, 6, 7, 8, 10, 12], z, 'mm');
          return {
            schema: sch, contesto: ctx(0, `di ${f(F / 1000)} kN`), richiesta: 'Lato minimo del cordone z, in mm.',
            dati: [['F', F / 1000, 'kN'], ['L', L, 'mm'], ['cordoni', nC, ''], ['τ amm', ta, 'MPa']],
            impostazione: ['τ = F / (n · a · L) ≤ τ amm.', 'a minima = F / (n · L · τ amm).', 'z = a / 0,7.'],
            risposta: { nome: 'z minimo', valore: z, unita: 'mm' },
            passi: [['Gola minima', `${f(F)} / (${nC} · ${L} · ${ta})`, z * 0.7, 'mm'], ['Lato minimo', 'a / 0,7', z, 'mm']],
            decisione: { domanda: 'Che cordone prescrivi a disegno?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `Almeno z = ${f(z)} mm: si scrive ${sc.valore}. Il cordone non deve superare circa 0,7 volte lo spessore della lamiera più sottile, sennò si brucia il pezzo: se non basta, si allungano i cordoni.`,
          };
        }
        const z = R.da([4, 5, 6, 8]), a = 0.7 * z;
        const m = R.da([500, 1000, 1500, 2000]);
        const F = liv === 1 ? R.tra(10, 80, 5) * 1000 : m * G * R.da([2, 3]);
        const din = liv === 2 ? F / (m * G) : 1;
        const t = F / (nC * a * L);
        return {
          schema: sch, contesto: ctx(z, liv === 1 ? `di ${f(F / 1000)} kN` : `è una massa di ${m} kg con coefficiente dinamico ${din} (urti in esercizio)`),
          richiesta: 'Tensione tangenziale nei cordoni, in MPa.',
          dati: [['z', z, 'mm'], ['L', L, 'mm'], ['cordoni', nC, ''], ...(liv === 1 ? [['F', F / 1000, 'kN']] : [['m', m, 'kg'], ['coeff. dinamico', din, '']])],
          impostazione: [...(liv === 1 ? [] : ['F = m · g · coefficiente dinamico.']), 'Gola: a = 0,7 · z.', 'τ = F / (n cordoni · a · L).'],
          risposta: { nome: 'τ', valore: t, unita: 'MPa' },
          passi: [...(liv === 1 ? [] : [['Forza', `${m} · 9,81 · ${din}`, F, 'N']]), ['Gola', `0,7 · ${z}`, a, 'mm'], ['Tensione', `F / (${nC} · a · ${L})`, t, 'MPa']],
          decisione: { domanda: 'I cordoni tengono?', opzioni: MARGINE, giusta: giustaMargine(ta, t) },
          giudizio: `${f(t)} MPa contro ${ta}. Usare z al posto della gola sovrastima la resistenza del 43%: è l'errore più comune nei calcoli delle saldature.`,
        };
      },
    },
    {
      id: 'chiavetta', blocco: 'b6', titolo: 'La chiavetta trasmette la coppia?',
      genera(liv, R) {
        const tab = [[20, 6, 6, 2.8], [25, 8, 7, 3.3], [30, 8, 7, 3.3], [35, 10, 8, 3.3], [40, 12, 8, 3.3], [50, 14, 9, 3.8]]; // d, b, h, t2 (profondità nel mozzo)
        const [d, b, h, t2] = R.da(tab);
        const pa = R.da([['acciaio', 100], ['ghisa', 60]]);
        const T = R.tra(d * 3, d * 9, 10); // N·m
        const F = 2 * T * 1000 / d;
        if (liv === 3) {
          const l = F / (t2 * pa[1]);
          const sc = sceltaCatalogo([16, 20, 25, 28, 32, 36, 40, 45, 50, 56, 63, 70, 80, 90, 100], l, 'mm');
          return {
            contesto: `Su un albero Ø${d} mm devi calettare un mozzo in ${pa[0]} che trasmette ${T} N·m. Chiavetta ${b} × ${h}, profondità nel mozzo t2 = ${f(t2)} mm. Pressione ammissibile sul mozzo: ${pa[1]} MPa.`,
            richiesta: 'Lunghezza minima della chiavetta, in mm.',
            dati: [['T', T, 'N·m'], ['d', d, 'mm'], ['t2', t2, 'mm'], ['p amm', pa[1], 'MPa']],
            impostazione: ['Forza sulla chiavetta: F = 2T / d.', 'La chiavetta schiaccia il mozzo su un\'area t2 · l: p = F / (t2 · l).', 'l = F / (t2 · p amm).'],
            risposta: { nome: 'l minima', valore: l, unita: 'mm' },
            passi: [['Forza', `2 · ${T * 1000} / ${d}`, F, 'N'], ['Lunghezza minima', `F / (${f(t2)} · ${pa[1]})`, l, 'mm']],
            decisione: { domanda: 'Che lunghezza scegli?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `Almeno ${f(l)} mm: si prende ${sc.valore}. Se supera circa 1,5 volte il diametro, meglio due chiavette a 180° o un profilo scanalato.`,
          };
        }
        if (liv === 1) {
          return {
            contesto: `Un albero Ø${d} mm trasmette ${T} N·m a un mozzo tramite una chiavetta.`,
            richiesta: 'Forza che la chiavetta trasmette, in N.',
            dati: [['T', T, 'N·m'], ['d', d, 'mm']],
            impostazione: ['La chiavetta lavora sul raggio dell\'albero: T = F · d/2.', 'F = 2T / d, con T in N·mm.'],
            risposta: { nome: 'F', valore: F, unita: 'N' },
            passi: [['Coppia in N·mm', `${T} · 1000`, T * 1000, 'N·mm'], ['Forza', '2T / d', F, 'N']],
            giudizio: `${f(F)} N: tanta forza su un pezzetto d'acciaio. Per questo di solito si rompe prima il mozzo (pressione) della chiavetta (taglio).`,
          };
        }
        const l = vicino([20, 25, 28, 32, 36, 40, 45, 50, 56, 63, 70], F / (t2 * pa[1]));
        const p = F / (t2 * l);
        return {
          contesto: `Un albero Ø${d} mm trasmette ${T} N·m a un mozzo in ${pa[0]} con una chiavetta ${b} × ${h} lunga ${l} mm, profondità nel mozzo t2 = ${f(t2)} mm. Pressione ammissibile sul mozzo: ${pa[1]} MPa.`,
          richiesta: 'Pressione sul fianco della cava del mozzo, in MPa.',
          dati: [['T', T, 'N·m'], ['d', d, 'mm'], ['l', l, 'mm'], ['t2', t2, 'mm']],
          impostazione: ['F = 2T / d.', 'p = F / (t2 · l).'],
          risposta: { nome: 'p', valore: p, unita: 'MPa' },
          passi: [['Forza', `2 · ${T * 1000} / ${d}`, F, 'N'], ['Pressione', `F / (${f(t2)} · ${l})`, p, 'MPa']],
          decisione: { domanda: 'Il mozzo regge?', opzioni: MARGINE, giusta: giustaMargine(pa[1], p) },
          giudizio: `${f(p)} MPa contro ${pa[1]}. Con un mozzo in ghisa l'ammissibile è più basso: è il caso tipico in cui la chiavetta va allungata.`,
        };
      },
    },
    {
      id: 'molla-elicoidale', blocco: 'b6', titolo: 'Che molla serve?',
      genera(liv, R) {
        const Gm = 80000;
        const d = R.da([2, 2.5, 3, 4, 5]), c = R.da([6, 7, 8, 10]), D = d * c;
        if (liv === 3) {
          const k = R.tra(5, 40, 1);
          const n = Gm * d ** 4 / (8 * D ** 3 * k);
          return {
            contesto: `Per un premilamiera ti serve una molla di compressione da ${k} N/mm. Filo d'acciaio per molle d = ${f(d)} mm, diametro medio D = ${f(D)} mm, G = 80 GPa.`,
            richiesta: 'Numero di spire attive.',
            dati: [['k', k, 'N/mm'], ['d', d, 'mm'], ['D', D, 'mm'], ['G', 80, 'GPa']],
            impostazione: ['Rigidezza: k = G d⁴ / (8 D³ n).', 'n = G d⁴ / (8 D³ k).'],
            risposta: { nome: 'n', valore: n, unita: 'spire' },
            passi: [['Spire attive', `80000 · ${f(d)}⁴ / (8 · ${f(D)}³ · ${k})`, n, 'spire']],
            giudizio: `Circa ${f(n)} spire attive (si arrotonda a mezza spira). Ne aggiungi 2 di estremità, chiuse e molate. Se servono poche spire, la molla diventa troppo rigida da regolare: meglio un D più grande.`,
          };
        }
        const n = R.da([4, 6, 8, 10, 12]);
        const k = Gm * d ** 4 / (8 * D ** 3 * n);
        if (liv === 1) {
          return {
            contesto: `Una molla di compressione ha filo d = ${f(d)} mm, diametro medio D = ${f(D)} mm e ${n} spire attive. Acciaio per molle, G = 80 GPa.`,
            richiesta: 'Rigidezza della molla, in N/mm.',
            dati: [['d', d, 'mm'], ['D', D, 'mm'], ['n', n, ''], ['G', 80, 'GPa']],
            impostazione: ['k = G d⁴ / (8 D³ n).', 'G in MPa, misure in mm: esce N/mm.'],
            risposta: { nome: 'k', valore: k, unita: 'N/mm' },
            passi: [['Rigidezza', `80000 · ${f(d)}⁴ / (8 · ${f(D)}³ · ${n})`, k, 'N/mm']],
            giudizio: `${f(k)} N/mm. Il filo conta alla quarta, il diametro della molla al cubo: piccole variazioni cambiano molto la rigidezza.`,
          };
        }
        const Kw = (4 * c - 1) / (4 * c - 4) + 0.615 / c;
        const ta = R.da([500, 600]);
        const Fmax = Math.round(ta * PI * d ** 3 / (8 * D * Kw) * R.da([0.7, 0.9, 1.1, 1.3]) / 5) * 5;
        const t = Kw * 8 * Fmax * D / (PI * d ** 3);
        return {
          contesto: `Una molla con filo d = ${f(d)} mm e diametro medio D = ${f(D)} mm (indice c = ${c}) lavora fino a ${Fmax} N. Il filo ammette τ = ${ta} MPa. Correzione di Wahl: K w = (4c − 1)/(4c − 4) + 0,615/c.`,
          richiesta: 'Tensione tangenziale massima nel filo, in MPa.',
          dati: [['d', d, 'mm'], ['D', D, 'mm'], ['F max', Fmax, 'N'], ['τ amm', ta, 'MPa']],
          impostazione: ['Il filo della molla lavora a torsione: τ = 8 F D / (π d³).', 'Sul lato interno della spira la tensione è più alta: si moltiplica per K w.'],
          risposta: { nome: 'τ max', valore: t, unita: 'MPa' },
          passi: [['Fattore di Wahl', `(4·${c} − 1)/(4·${c} − 4) + 0,615/${c}`, Kw, ''], ['τ nominale', `8 · ${Fmax} · ${f(D)} / (π · ${f(d)}³)`, t / Kw, 'MPa'], ['τ massima', '· K w', t, 'MPa']],
          decisione: { domanda: 'La molla regge?', opzioni: MARGINE, giusta: giustaMargine(ta, t) },
          giudizio: `${f(t)} MPa contro ${ta}. Ecco perché le molle sono in acciai speciali: lavorano a tensioni che un S235 non vedrebbe mai.`,
        };
      },
    },

    // ---------------- BLOCCO 8: termodinamica e scambio termico ----------------
    {
      id: 'parete', blocco: 'b8', titolo: 'Quanto calore perde la parete del forno?',
      genera(liv, R) {
        const A = R.da([2, 4, 6, 8]), dT = R.da([150, 200, 250, 300]);
        const lamI = R.da([0.04, 0.05]);
        if (liv === 1) {
          const s = R.da([50, 80, 100, 150]);
          const Q = lamI * A * dT / (s / 1000);
          return {
            contesto: `La parete di un forno ha ${A} m² di lana di roccia spessa ${s} mm (λ = ${f(lamI)} W/(m·K)). Tra faccia interna ed esterna dell'isolante ci sono ${dT} °C di differenza.`,
            richiesta: 'Calore che passa, in W.',
            dati: [['A', A, 'm²'], ['s', s, 'mm'], ['λ', lamI, 'W/(m·K)'], ['ΔT', dT, '°C']],
            impostazione: ['Conduzione (Fourier): Q = λ · A · ΔT / s.', 's in metri.'],
            risposta: { nome: 'Q', valore: Q, unita: 'W' },
            passi: [['Spessore in m', `${s} / 1000`, s / 1000, 'm'], ['Calore', `${f(lamI)} · ${A} · ${dT} / ${f(s / 1000)}`, Q, 'W']],
            giudizio: `${f(Q)} W, cioè ${f(Q * 24 / 1000)} kWh al giorno. Raddoppiare lo spessore dimezza la perdita.`,
          };
        }
        const sAcc = 3, lamA = 50;
        if (liv === 2) {
          const s = R.da([50, 80, 100]);
          const Rt = sAcc / 1000 / lamA + s / 1000 / lamI;
          const Q = A * dT / Rt;
          return {
            contesto: `La parete di un forno è una lamiera d'acciaio da ${sAcc} mm (λ = ${lamA} W/(m·K)) più ${s} mm di isolante (λ = ${f(lamI)}). Superficie ${A} m², differenza di temperatura tra le due facce esterne ${dT} °C.`,
            richiesta: 'Calore che passa, in W.',
            dati: [['A', A, 'm²'], ['lamiera', sAcc, 'mm'], ['isolante', s, 'mm'], ['ΔT', dT, '°C']],
            impostazione: ['Strati in serie: le resistenze termiche si sommano, R = Σ s / λ (per m²).', 'Q = A · ΔT / R.'],
            risposta: { nome: 'Q', valore: Q, unita: 'W' },
            passi: [['Resistenza lamiera', `${f(sAcc / 1000)} / ${lamA}`, sAcc / 1000 / lamA, 'm²K/W'], ['Resistenza isolante', `${f(s / 1000)} / ${f(lamI)}`, s / 1000 / lamI, 'm²K/W'], ['Calore', 'A · ΔT / R tot', Q, 'W']],
            giudizio: `${f(Q)} W. La lamiera conta ${f(sAcc / 1000 / lamA / Rt * 100)}% della resistenza: in pratica tutto il lavoro lo fa l'isolante.`,
          };
        }
        const qMax = R.da([100, 150, 200]);
        const s = (dT / qMax - sAcc / 1000 / lamA) * lamI * 1000;
        const sc = sceltaCatalogo([50, 80, 100, 120, 150, 200, 250, 300], s, 'mm');
        return {
          contesto: `Per la sicurezza degli operatori la parete di un forno non deve perdere più di ${qMax} W/m². È una lamiera d'acciaio da ${sAcc} mm (λ = ${lamA}) più isolante con λ = ${f(lamI)} W/(m·K). Differenza di temperatura tra le facce ${dT} °C.`,
          richiesta: 'Spessore minimo dell\'isolante, in mm.',
          dati: [['q max', qMax, 'W/m²'], ['ΔT', dT, '°C'], ['λ isolante', lamI, 'W/(m·K)']],
          impostazione: ['Resistenza totale necessaria: R = ΔT / q.', 'R = s acc / λ acc + s iso / λ iso.', 's iso = (R − s acc / λ acc) · λ iso.'],
          risposta: { nome: 's minimo', valore: s, unita: 'mm' },
          passi: [['Resistenza necessaria', `${dT} / ${qMax}`, dT / qMax, 'm²K/W'], ['Spessore isolante', `(R − ${f(sAcc / 1000)}/${lamA}) · ${f(lamI)} · 1000`, s, 'mm']],
          decisione: { domanda: 'Che pannello scegli?', opzioni: sc.opzioni, giusta: sc.giusta },
          giudizio: `Almeno ${f(s)} mm: pannello da ${sc.valore}. Nella realtà c'è anche la convezione sulle due facce, che aiuta: questo conto è dalla parte della sicurezza.`,
        };
      },
    },
    {
      id: 'scambiatore', blocco: 'b8', titolo: 'Lo scambiatore raffredda abbastanza l\'olio?',
      genera(liv, R) {
        const th1 = R.da([60, 70, 80]), th2 = th1 - R.da([15, 20, 25]);
        const tc1 = R.da([15, 20, 25]), tc2 = tc1 + R.da([8, 10, 12]);
        const d1 = th1 - tc2, d2 = th2 - tc1;
        const ml = Math.abs(d1 - d2) < 1e-9 ? d1 : (d1 - d2) / Math.log(d1 / d2);
        const sch = schema('Scambiatore in controcorrente: quali differenze di temperatura usi nella media logaritmica?', [
          'Ingresso caldo − uscita freddo, e uscita caldo − ingresso freddo',
          'Ingresso caldo − ingresso freddo, e uscita caldo − uscita freddo',
          'La media aritmetica delle quattro temperature',
          'Solo la differenza più grande',
        ], 'In controcorrente i due fluidi entrano da lati opposti: a un\'estremità si incontrano l\'olio caldo in ingresso e l\'acqua in uscita, all\'altra l\'olio in uscita e l\'acqua in ingresso. ΔT ml = (ΔT1 − ΔT2) / ln(ΔT1/ΔT2).');
        const ctx = `In una centralina idraulica l'olio va raffreddato da ${th1} a ${th2} °C con acqua che entra a ${tc1} °C ed esce a ${tc2} °C, in controcorrente.`;
        if (liv === 1) {
          return {
            schema: sch, contesto: ctx, richiesta: 'Differenza di temperatura media logaritmica, in °C.',
            dati: [['olio in', th1, '°C'], ['olio out', th2, '°C'], ['acqua in', tc1, '°C'], ['acqua out', tc2, '°C']],
            impostazione: ['ΔT1 = olio in − acqua out, ΔT2 = olio out − acqua in.', 'ΔT ml = (ΔT1 − ΔT2) / ln(ΔT1 / ΔT2).'],
            risposta: { nome: 'ΔT ml', valore: ml, unita: '°C' },
            passi: [['ΔT1', `${th1} − ${tc2}`, d1, '°C'], ['ΔT2', `${th2} − ${tc1}`, d2, '°C'], ['Media logaritmica', '(ΔT1 − ΔT2) / ln(ΔT1/ΔT2)', ml, '°C']],
            giudizio: `${f(ml)} °C. È poco più bassa della media aritmetica (${f((d1 + d2) / 2)}): usare quella sovrastima lo scambiatore.`,
          };
        }
        const P = R.da([3, 5, 8, 12]) * 1000, U = R.da([300, 400, 500]);
        const A = P / (U * ml);
        if (liv === 2) {
          const Areale = Math.round(A * R.da([0.8, 1, 1.2, 1.5]) * 10) / 10 || 0.1;
          const Q = U * Areale * ml;
          return {
            schema: sch, contesto: `${ctx} Lo scambiatore installato ha ${f(Areale)} m² e U = ${U} W/(m²·K). La centralina deve smaltire ${f(P / 1000)} kW.`,
            richiesta: 'Potenza che lo scambiatore riesce a smaltire, in kW.',
            dati: [['A', Areale, 'm²'], ['U', U, 'W/(m²K)'], ['olio', `${th1} → ${th2}`, '°C'], ['acqua', `${tc1} → ${tc2}`, '°C']],
            impostazione: ['ΔT ml in controcorrente.', 'Q = U · A · ΔT ml.'],
            risposta: { nome: 'Q', valore: Q / 1000, unita: 'kW' },
            passi: [['ΔT1', `${th1} − ${tc2}`, d1, '°C'], ['ΔT2', `${th2} − ${tc1}`, d2, '°C'], ['ΔT ml', '', ml, '°C'], ['Potenza', `${U} · ${f(Areale)} · ΔT ml / 1000`, Q / 1000, 'kW']],
            decisione: { domanda: 'Basta per la centralina?', opzioni: MARGINE, giusta: giustaMargine(Q, P) },
            giudizio: `${f(Q / 1000)} kW contro ${f(P / 1000)} richiesti. Col tempo lo scambiatore si sporca e U scende: si tiene sempre un margine.`,
          };
        }
        return {
          schema: sch, contesto: `${ctx} La centralina deve smaltire ${f(P / 1000)} kW; per scambiatori a piastre olio-acqua stimi U = ${U} W/(m²·K).`,
          richiesta: 'Superficie di scambio necessaria, in m².',
          dati: [['P', P / 1000, 'kW'], ['U', U, 'W/(m²K)'], ['olio', `${th1} → ${th2}`, '°C'], ['acqua', `${tc1} → ${tc2}`, '°C']],
          impostazione: ['ΔT ml in controcorrente.', 'A = Q / (U · ΔT ml).'],
          risposta: { nome: 'A', valore: A, unita: 'm²' },
          passi: [['ΔT1', `${th1} − ${tc2}`, d1, '°C'], ['ΔT2', `${th2} − ${tc1}`, d2, '°C'], ['ΔT ml', '', ml, '°C'], ['Superficie', `${f(P)} / (${U} · ΔT ml)`, A, 'm²']],
          giudizio: `Circa ${f(A)} m²: sul catalogo prendi la taglia sopra, +15–20% per lo sporcamento.`,
        };
      },
    },
    {
      id: 'frigorifero', blocco: 'b8', titolo: 'Quanto consuma il gruppo frigo?',
      genera(liv, R) {
        const tf = R.da([-20, -10, 0, 5]), tc = R.da([35, 40, 45]);
        const Tf = tf + 273.15, Tc = tc + 273.15;
        const copC = Tf / (Tc - Tf);
        if (liv === 1) {
          return {
            contesto: `Un gruppo frigo lavora con evaporatore a ${tf} °C e condensatore a ${tc} °C.`,
            richiesta: 'COP ideale (di Carnot).',
            dati: [['t evaporatore', tf, '°C'], ['t condensatore', tc, '°C']],
            impostazione: ['Le temperature vanno in kelvin: + 273,15.', 'COP Carnot = T fredda / (T calda − T fredda).'],
            risposta: { nome: 'COP', valore: copC, unita: '' },
            passi: [['T fredda', `${tf} + 273,15`, Tf, 'K'], ['T calda', `${tc} + 273,15`, Tc, 'K'], ['COP ideale', 'Tf / (Tc − Tf)', copC, '']],
            giudizio: `COP ideale ${f(copC)}; una macchina vera arriva a circa il 40–50% di questo valore. L'errore classico è usare i gradi Celsius: viene un numero senza senso.`,
          };
        }
        const cop = 0.45 * copC;
        if (liv === 2) {
          const Qf = R.da([5, 10, 20, 40]);
          const Pel = Qf / cop;
          return {
            contesto: `Una cella frigorifera chiede ${Qf} kW di freddo. Il gruppo lavora tra ${tf} °C (evaporatore) e ${tc} °C (condensatore) e ha un rendimento pari al 45% di quello ideale.`,
            richiesta: 'Potenza elettrica assorbita, in kW.',
            dati: [['Q freddo', Qf, 'kW'], ['t evap', tf, '°C'], ['t cond', tc, '°C'], ['rendimento rispetto a Carnot', 0.45, '']],
            impostazione: ['COP Carnot con le temperature in K.', 'COP reale = 0,45 · COP Carnot.', 'P el = Q freddo / COP.'],
            risposta: { nome: 'P el', valore: Pel, unita: 'kW' },
            passi: [['COP ideale', `${f(Tf)} / (${f(Tc)} − ${f(Tf)})`, copC, ''], ['COP reale', '0,45 · COP', cop, ''], ['Potenza elettrica', `${Qf} / COP`, Pel, 'kW'], ['Calore al condensatore', 'Q f + P el', Qf + Pel, 'kW']],
            giudizio: `${f(Pel)} kW elettrici. Il condensatore deve buttare fuori ${f(Qf + Pel)} kW: il freddo più l'energia del compressore.`,
          };
        }
        const tc2 = tc - 10;
        const copC2 = Tf / (tc2 + 273.15 - Tf);
        const ris = (1 - copC / copC2) * 100;
        return {
          contesto: `Un gruppo frigo lavora tra ${tf} °C e ${tc} °C. Pulendo il condensatore e spostandolo all'ombra, la temperatura di condensazione scende a ${tc2} °C. Supponi che il rapporto tra COP reale e COP ideale resti uguale.`,
          richiesta: 'Risparmio di energia elettrica, in %.',
          dati: [['t evap', tf, '°C'], ['t cond prima', tc, '°C'], ['t cond dopo', tc2, '°C']],
          impostazione: ['A parità di freddo, P el = Q / COP.', 'Risparmio = 1 − COP prima / COP dopo.', 'Se il rapporto con Carnot non cambia, basta confrontare i COP di Carnot.'],
          risposta: { nome: 'risparmio', valore: ris, unita: '%' },
          passi: [['COP ideale prima', `${f(Tf)} / (${f(Tc)} − ${f(Tf)})`, copC, ''], ['COP ideale dopo', `${f(Tf)} / (${f(tc2 + 273.15)} − ${f(Tf)})`, copC2, ''], ['Risparmio', '(1 − COP prima / COP dopo) · 100', ris, '%']],
          giudizio: `Circa il ${f(ris)}% in meno di bolletta solo pulendo e ombreggiando il condensatore: è uno dei consigli che le aziende pagano volentieri, perché costa quasi zero.`,
        };
      },
    }
  );

  const TEST = [
    { id: 't01', domanda: '6 bar quanti MPa sono?', risposta: 0.6, unita: 'MPa', tolleranza: 0.02 },
    { id: 't02', domanda: 'Area di un cerchio di diametro 50 mm, in mm²?', risposta: 1963.5, unita: 'mm²', tolleranza: 0.02 },
    { id: 't03', domanda: 'Peso di una massa di 500 kg, in N (g = 9,81 m/s²)?', risposta: 4905, unita: 'N', tolleranza: 0.02 },
    { id: 't04', domanda: 'cos 30° (con 3 decimali)?', risposta: 0.866, unita: '', tolleranza: 0.01 },
    { id: 't05', domanda: 'Un motore gira a 1450 giri/min. Velocità angolare in rad/s?', risposta: 151.8, unita: 'rad/s', tolleranza: 0.02 },
    { id: 't06', domanda: 'Forza di 200 N con braccio di 0,3 m: momento in N·m?', risposta: 60, unita: 'N·m', tolleranza: 0.02 },
    { id: 't07', domanda: 'Barra tonda Ø20 mm tirata con 31,4 kN: tensione normale in MPa?', risposta: 100, unita: 'MPa', tolleranza: 0.03 },
    { id: 't08', domanda: 'Potenza 3 kW, coppia 20 N·m: velocità angolare in rad/s?', risposta: 150, unita: 'rad/s', tolleranza: 0.02 },
    { id: 't09', domanda: 'Energia cinetica di 8 kg a 0,8 m/s, in J?', risposta: 2.56, unita: 'J', tolleranza: 0.02 },
    { id: 't10', domanda: 'Molla con k = 12 N/mm compressa di 25 mm: forza in N?', risposta: 300, unita: 'N', tolleranza: 0.02 },
    { id: 't11', domanda: 'Modulo elastico tipico dell\'acciaio, in GPa?', risposta: 210, unita: 'GPa', tolleranza: 0.05 },
    { id: 't12', domanda: 'Quanti mm³ ci sono in un litro?', risposta: 1000000, unita: 'mm³', tolleranza: 0.01 },
  ];

  window.MECCANICA = { versione: '2026-11-21', BLOCCHI, MODELLI, TEST, f };
})();
