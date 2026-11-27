// Configurazione di Luca (app personale). id vuoto = usa i dati già salvati dalle app precedenti.
const CONFIG = (() => {
const GYM = {
  lun: { name: "Lun", full: "Lunedì", items: [
    { id: "l-chestpress", n: "Chest press", s: "3×8", v: [["Chest press", "chest press machine esecuzione corretta"]] },
    { id: "l-chestfly", n: "Chest fly", s: "2×8", v: [["Chest fly", "chest fly machine pec deck esecuzione"]] },
    { id: "l-pushdips", n: "Push up + dips", s: "6/8 + max", v: [["Push up", "push up esecuzione corretta"], ["Dips", "dips parallele esecuzione corretta"]] },
    { id: "l-ohext", n: "Overhead extension", note: "tricipite", s: "3×8/10", v: [["Video", "overhead triceps extension cable"]] },
    { ss: [
      { id: "l-alzlat", n: "Alzate laterali", s: "3×10/12", v: [["Video", "alzate laterali manubri esecuzione corretta"]] },
      { id: "l-panca60", n: "Panca 60 alzate verticali", note: "gomito sotto spalla a 90°", s: "2×8", v: [["Video", "incline bench 60 degree dumbbell shoulder press"]] }
    ]},
    { id: "l-addome", n: "Addome isometrie", note: "tenuta 8 sec · 2,5 kg", s: "12 reps", v: [["Video", "weighted isometric crunch hold"]] },
    { id: "l-plank", n: "Plank + uovo", note: "prisoner v-ups", s: "10 reps", v: [["Plank", "plank esecuzione corretta"], ["Prisoner v-up", "prisoner v up abs exercise"]] }
  ]},
  mer: { name: "Mer", full: "Mercoledì", items: [
    { id: "m-stacco", n: "Stacco", note: "6 all'80%, poi 3×6", s: "6 + 3×6", v: [["Video", "stacco da terra esecuzione corretta"]] },
    { id: "m-legcurl", n: "Leg curl sdraiato", s: "3×8/10", v: [["Video", "lying leg curl machine form"]] },
    { id: "m-legpress", n: "Leg press piedi in alto", s: "3×10", v: [["Video", "leg press piedi alti glutei"]] },
    { ss: [
      { id: "m-lat", n: "Lat machine", s: "3×8", v: [["Video", "lat machine esecuzione corretta"]] },
      { id: "m-vrow", n: "V row", s: "3×8", v: [["Video", "seated cable row v grip form"]] }
    ]},
    { id: "m-curlcavo", n: "Curl cavo basso", s: "3×8", v: [["Video", "curl bicipiti cavo basso esecuzione"]] },
    { id: "m-panca30bic", n: "Panca 30 bicipiti", s: "3×8", v: [["Video", "incline dumbbell curl form"]] }
  ]},
  ven: { name: "Ven", full: "Venerdì", items: [
    { id: "v-panca30", n: "Panca 30 spinte in alto", s: "3×8", v: [["Video", "incline dumbbell press 30 degrees form"]] },
    { id: "v-chestfly", n: "Chest fly", s: "3×8", v: [["Video", "chest fly machine pec deck esecuzione"]] },
    { id: "v-military", n: "Military press", s: "3×10", v: [["Video", "military press bilanciere esecuzione corretta"]] },
    { id: "v-alzlat60", n: "Alzate laterali panca 60", s: "3×8", v: [["Video", "incline bench lateral raise"]] },
    { ss: [
      { id: "v-pushdown", n: "Push down", note: "tricipiti", s: "3×8", v: [["Video", "triceps pushdown cavo esecuzione"]] },
      { id: "v-french", n: "Tricipiti panca piana EZ", note: "french press", s: "3×8", v: [["Video", "french press bilanciere ez panca piana"]] }
    ]},
    { id: "v-hanging", n: "Hanging knee to chest", s: "2×max", v: [["Video", "hanging knee raise form"]] },
    { id: "v-plankobl", n: "Plank obliquo + barchetta", note: "45s + 30s, fino a 1 min", s: "tempo", v: [["Plank obliquo", "side plank esecuzione"], ["Barchetta", "hollow body hold esercizio"]] }
  ]},
  sab: { name: "Sab", full: "Sabato", items: [
    { id: "s-pressa", n: "Pressa piedi in basso / squat", note: "squat: 2×6/8 + 1×8/10", s: "3×8", v: [["Pressa", "leg press piedi bassi quadricipiti"], ["Squat", "squat bilanciere esecuzione corretta"]] },
    { id: "s-legext", n: "Leg extension", s: "4×8", v: [["Video", "leg extension esecuzione corretta"]] },
    { id: "s-bulgarian", n: "Bulgarian squat", s: "4×6", v: [["Video", "bulgarian split squat form"]] },
    { id: "s-pulley", n: "Pulley cavo / row T-bar", s: "3×8", v: [["Pulley", "pulley basso esecuzione corretta"], ["T-bar row", "t bar row form"]] },
    { id: "s-rematore", n: "Rematore bilanciere", note: "focus gran dorsale", s: "3×6+", v: [["Video", "rematore bilanciere gran dorsale"]] },
    { id: "s-trazioni", n: "Trazioni presa supina", note: "bicipiti", s: "max", v: [["Video", "chin up presa supina esecuzione"]] },
    { id: "s-curlhammer", n: "Curl to hammer curl", note: "3 sec in discesa", s: "4×8", v: [["Video", "curl to hammer curl"]] },
    { id: "s-addome", n: "Addome isometrie", note: "tenuta 8 sec · 2,5 kg", s: "12 reps", v: [["Video", "weighted isometric crunch hold"]] },
    { id: "s-plank", n: "Plank + uovo", note: "prisoner v-ups", s: "10 reps", v: [["Plank", "plank esecuzione corretta"], ["Prisoner v-up", "prisoner v up abs exercise"]] }
  ]}
};

const g = (s) => s.split("|").map((x) => { const i = x.lastIndexOf(" "); const m = x.match(/^(.*?)\s+(\d[\d,.]*\s*(?:g|cucchiai|cucchiaino|uova|banana|mela|pera|kiwi|pesca|arancia|mozzarella)|\d+\s*\w+)$/); return m ? [m[1], m[2]] : [x, ""]; });
const CEREALI40 = "Fiocchi d'avena 40 g|Muesli 40 g|Corn Flakes integrali 40 g|All-Bran 40 g|Granola 40 g";
const YOG5 = "Yogurt greco 5 cucchiai|Yogurt greco 0% grassi 150 g|Quark 150 g|Ricotta vaccina 150 g|Yogurt intero bianco 150 g";
const DOLCE = "Miele 1 cucchiaino|Marmellata 15 g|Sciroppo d'acero 10 g|Crema di nocciole 100% 10 g|Confettura di frutta 15 g";
const PROT = ["Petto di pollo 200 g", "Salmone 200 g", "Tonno al naturale 160 g", "Bistecca di manzo 200 g", "Merluzzo 250 g", "Orata 200 g", "Petto di tacchino 200 g"];
const protFirst = (n) => [PROT.find((p) => p.startsWith(n)), ...PROT.filter((p) => !p.startsWith(n))].join("|");
const VERD = (first) => { const v = ["Zucchine", "Melanzane", "Spinaci", "Broccoli", "Fagiolini", "Cavolfiore", "Lattuga"]; return [first, ...v.filter((x) => x !== first)].map((x) => x + " 200 g").join("|"); };
const OLIO = "Olio extravergine d'oliva 2 cucchiai";
const PANE = "Pane comune 40 g|Pane integrale 40 g|Pane di segale 40 g|Crackers 25 g|Gallette di riso 30 g|Grissini 30 g";
const PRIMO70 = "Pasta 70 g|Riso 70 g|Farro 70 g|Orzo perlato 70 g|Pasta integrale 70 g|Riso integrale 70 g|Gnocchi di patate 150 g";
const FRUTTA = "Banana 1 banana|Mela 1 mela|Pera 1 pera|Kiwi 2 kiwi|Pesca 1 pesca";

const FOOD = {
  riposo: { name: "Riposo", sub: "Non attività", full: "Giorno di NON attività", meals: [
    { id: "col", n: "Colazione", h: "07:00", items: [CEREALI40, YOG5, DOLCE] },
    { id: "pra", n: "Pranzo", h: "12:30", items: [protFirst("Petto di pollo"), VERD("Zucchine"), OLIO, PANE] },
    { id: "spu", n: "Spuntino pomeridiano", h: "16:30", items: [FRUTTA] },
    { id: "cen", n: "Cena", h: "20:00", note: "Primo + secondo + verdure", items: [PRIMO70,
      "Tonno al naturale 150 g|Petto di pollo 150 g|Merluzzo 200 g|Uova intere 3 uova|Fagioli borlotti 200 g|Bresaola 100 g|Mozzarella 1 mozzarella",
      VERD("Spinaci"), OLIO] }
  ]},
  corsa: { name: "Corsa", sub: "serale", full: "Corsa serale", meals: [
    { id: "col", n: "Colazione", h: "07:30", items: [CEREALI40 + "|Farro soffiato 40 g", YOG5, DOLCE] },
    { id: "pra", n: "Pranzo", h: "12:30", note: "C'è un primo piatto (e anche un secondo)", items: [protFirst("Salmone"), VERD("Zucchine"), OLIO,
      "Riso 80 g|Riso brillato 80 g|Pasta di semola 80 g|Orzo perlato 80 g|Farro perlato 80 g|Quinoa 80 g|Riso integrale 80 g|Pasta integrale 80 g|Couscous 80 g|Gnocchi di patate 160 g|Tortellini freschi 90 g|Trofie fresche Esselunga 100 g"] },
    { id: "spu", n: "Spuntino pomeridiano", h: "16:30", note: "2 frutti medi", items: [
      "Banana 1 banana|Mela 1 mela|Pera 1 pera|Arancia 1 arancia|Kiwi 2 kiwi|Pesca 1 pesca|Mandarini 200 g",
      "Mela (o altro frutto medio) 200 g"] },
    { id: "cen", n: "Cena", h: "20:00", items: [PRIMO70,
      "Uova intere 3 uova|Tonno al naturale 150 g|Petto di pollo 150 g|Merluzzo 200 g|Fagioli borlotti 200 g|Bresaola 100 g|Mozzarella 1 mozzarella",
      VERD("Spinaci"), OLIO] },
    { id: "ser", n: "Spuntino serale", h: "22:00", items: ["Yogurt alla frutta 125 g"] }
  ]},
  pesi: { name: "Pesi", sub: "mattino", full: "Pesi mattino", meals: [
    { id: "col", n: "Colazione", h: "07:30", note: "Cereali un po' di più", items: [
      "Fiocchi d'avena 60 g|Muesli 60 g|Corn Flakes integrali 60 g|All-Bran 60 g|Granola 60 g|Farro soffiato 60 g",
      "Yogurt greco 7 cucchiai|Yogurt greco 0% grassi 200 g|Quark 200 g|Ricotta vaccina 200 g",
      "Miele 1 cucchiaino|Marmellata 15 g|Sciroppo d'acero 10 g|Zucchero di canna 10 g|Crema di nocciole 100% 10 g|Confettura di frutta 15 g"] },
    { id: "pra", n: "Pranzo", h: "12:30", items: [protFirst("Bistecca di manzo"), VERD("Zucchine"), OLIO, PANE,
      "Grana Padano DOP 30 g|Mozzarella 50 g|Ricotta di vacca 50 g"] },
    { id: "spu", n: "Spuntino pomeridiano", h: "16:30", items: [FRUTTA] },
    { id: "cen", n: "Cena", h: "20:00", items: [PRIMO70,
      "Merluzzo 200 g|Tonno al naturale 150 g|Petto di pollo 150 g|Uova intere 3 uova|Salmone 120 g|Fagioli borlotti 200 g|Bresaola 100 g",
      VERD("Spinaci"), OLIO] },
    { id: "ser", n: "Spuntino serale", h: "22:00", items: ["Yogurt alla frutta 125 g"] }
  ]}
};
for (const d of Object.values(FOOD)) for (const m of d.meals) m.items = m.items.map(g);

const SHOP = [
  ["Cereali e derivati", "Fiocchi d'avena, Muesli, Corn Flakes integrali, All-Bran, Granola, Farro soffiato, Pane comune, Pane integrale, Pane di segale, Crackers, Gallette di riso, Grissini, Pasta, Pasta integrale, Riso, Riso integrale, Farro, Orzo perlato, Quinoa, Couscous"],
  ["Pasta fresca", "Gnocchi di patate, Tortellini freschi, Trofie fresche Esselunga"],
  ["Verdura", "Zucchine, Spinaci, Broccoli, Melanzane, Fagiolini, Cavolfiore, Lattuga"],
  ["Frutta", "Banana, Mela, Pera, Kiwi, Pesca, Arancia, Mandarini"],
  ["Carne", "Petto di pollo, Petto di tacchino, Bistecca di manzo, Bresaola"],
  ["Pesce", "Salmone, Merluzzo, Orata, Tonno al naturale"],
  ["Uova e legumi", "Uova, Fagioli borlotti"],
  ["Latticini", "Yogurt greco, Yogurt alla frutta, Quark, Ricotta, Mozzarella, Grana Padano DOP"],
  ["Dispensa", "Olio extravergine d'oliva, Miele, Marmellata, Confettura di frutta, Sciroppo d'acero, Zucchero di canna, Crema di nocciole 100%"]
];
const TIPS = [
  "Acqua: 2–2,5 litri al giorno.",
  "I pesi sono a crudo. Frutta e verdura non serve pesarle.",
  "Verdura: puoi mangiarne di più e anche di altri tipi, pure in mix (es. lattuga + pomodori).",
  "Pasti liberi (facoltativi): massimo 2 a settimana.",
  "Condimenti: tranne l'olio, il resto è libero e facoltativo. Spezie libere.",
  "Cerca di ruotare le diverse alternative dei cibi."
];

// ---------- Corsa: blocco base di 8 settimane (tecnica, fiato, resistenza), 2 sedute ----------
// Da gennaio si passa al lavoro specifico Hyrox.
const RUN = {
  A: { name: "Tecnica e ritmo", when: "Martedì", wd: [2], split: "Ritmo della parte veloce (min/km, se lo sai)", warm: "Riscaldamento: 10' facili + esercizi di tecnica (skip, calciata, corsa balzata: 2 × 20 m ciascuno) + 4 allunghi da 80 m. Alla fine 5' di defaticamento.",
    v: [["Esercizi di tecnica", "esercizi tecnica di corsa skip calciata"], ["Allunghi", "allunghi corsa come si fanno"]],
    weeks: [
      { t: "8 × 1' svelto / 1' piano", d: "Svelto = ritmo che tieni a fatica per 1 minuto ma con passo leggero e rilassato. Piano = corsa lentissima, non fermarti. Poi corsa facile fino a circa 5 km." },
      { t: "10 × 1' svelto / 1' piano", d: "Come la settimana scorsa con due ripetute in più. Cura la postura: busto dritto, braccia rilassate, passi corti e veloci." },
      { t: "Salite: 6 × 30\" forte", d: "Trova una salita media. 30\" in spinta con ginocchia alte, ritorno camminando. Poi 2 km facili. Migliora forza ed economia della corsa.", v: [["Salite", "ripetute in salita corsa tecnica"]] },
      { t: "5 km facili + 6 allunghi · scarico", d: "Settimana leggera: corsa facile e alla fine 6 allunghi da 80 m in scioltezza." },
      { t: "5 × 3' medio-forte / 2' piano", d: "Medio-forte = riesci a dire poche parole. Tieni lo stesso ritmo in tutte e 5." },
      { t: "Salite: 8 × 30\" forte", d: "Come la settimana 3 con due salite in più, poi 2 km facili.", v: [["Salite", "ripetute in salita corsa tecnica"]] },
      { t: "4 × 1 km a ritmo sostenuto / 2' piano", d: "Ritmo sostenuto = il ritmo che terresti per 10 km. Segna la media per km della parte veloce." },
      { t: "Test: 5 km costanti al massimo", d: "Dopo il riscaldamento corri 5 km al ritmo più veloce che riesci a tenere uguale fino alla fine. Confrontalo con i tuoi 5 km di adesso." }
    ]},
  B: { name: "Fondo", when: "Giovedì o domenica", wd: [4], warm: "Parti piano i primi 5'. Facile = riesci a parlare mentre corri: è qui che costruisci la resistenza.",
    v: [["Corsa facile (zona 2)", "corsa zona 2 come allenarsi"]],
    weeks: [
      { t: "5 km facili", d: "Ritmo da chiacchierata, anche se ti sembra lento. Costruisce il fiato senza stancarti per la palestra." },
      { t: "6 km facili", d: "Un km in più, sempre facile." },
      { t: "5 km progressivi", d: "Ogni km un po' più veloce del precedente; l'ultimo a ritmo sostenuto." },
      { t: "5 km facili · scarico", d: "Settimana leggera." },
      { t: "7 km facili", d: "Ritmo da chiacchierata per tutta la corsa." },
      { t: "6 km: 4 facili + 2 medio-forti", d: "Gli ultimi 2 km più veloci, ma senza arrivare sfinito." },
      { t: "8 km facili", d: "La corsa più lunga del blocco: ritmo tranquillo, bevi prima di uscire." },
      { t: "6 km facili", d: "Recupero. Da gennaio si passa all'allenamento specifico Hyrox." }
    ]}
};


return {
  id: "",
  app: { name: "Allenamento", syncHint: "sul PC la cartella DRIVE › App palestra del NAS, sul telefono Download (poi lo copi sul NAS con CX File Explorer)." },
  gym: GYM,
  run: RUN,
  runInfo: { label: "base fino a gennaio", note: "Blocco di 8 settimane per tecnica, fiato e resistenza. Da gennaio arriva il lavoro specifico Hyrox." },
  food: { plans: FOOD, shop: SHOP, tips: TIPS }
};
})();
