import type { Files } from "./store";

export type Template = { id: string; name: string; emoji: string; description: string; files: Files };

const page = (body: string, css: string): Files => ({
  "/App.tsx": `import "./styles.css";\n\n${body}`,
  "/styles.css": `*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#09070f;color:#f4f1fb}\n${css}`,
});

export const TEMPLATES: Template[] = [
  {
    id: "rave", name: "Landingpage", emoji: "🎧", description: "Dunkler Ravesafe-Stil mit Hero und Karten",
    files: page(`const features = [
  ["🧪", "Safer Use", "Wissen, Checks und Tipps für einen sicheren Abend."],
  ["🚑", "Notfall-Hilfe", "Erste Hilfe und Notrufnummern auf einen Blick."],
  ["💜", "Community", "Gemeinsam aufeinander achten."],
];
export default function App() {
  return (
    <main>
      <section className="hero">
        <h1>RaveSafe – <span>Sicher feiern</span></h1>
        <p>Dein Guide für risikobewusstes Feiern.</p>
        <button>Jetzt informieren</button>
      </section>
      <section className="grid">
        {features.map(([icon, title, text]) => (
          <article key={title}><div className="icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>
        ))}
      </section>
      <footer>© RaveSafe</footer>
    </main>
  );
}`, `main{min-height:100vh;background:radial-gradient(ellipse at top,#3b1470 0,transparent 60%)}
.hero{padding:72px 24px 40px;text-align:center}h1{font-size:clamp(2rem,6vw,3.5rem);margin:0}h1 span{color:#c4a1ff}
.hero p{color:#b48cff}button{margin-top:24px;border:0;border-radius:999px;padding:14px 32px;font-weight:700;color:#fff;background:linear-gradient(135deg,#a855f7,#7c3aed);box-shadow:0 0 30px #7c3aed88}
.grid{display:grid;gap:16px;padding:24px;max-width:960px;margin:auto;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
article{border:1px solid #3b2a5c;border-radius:20px;padding:24px;text-align:center;background:#140f22}.icon{font-size:2.2rem}
footer{text-align:center;padding:32px;color:#7d6aa0}`),
  },
  {
    id: "todo", name: "Todo-App", emoji: "✅", description: "Aufgaben hinzufügen, abhaken, löschen",
    files: page(`import { useState } from "react";
export default function App() {
  const [items, setItems] = useState<{ id: number; text: string; done: boolean }[]>([]);
  const [text, setText] = useState("");
  const add = () => { if (!text.trim()) return; setItems([...items, { id: Date.now(), text, done: false }]); setText(""); };
  return (
    <main>
      <h1>Meine Aufgaben</h1>
      <div className="row"><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Neue Aufgabe…" /><button onClick={add}>Hinzufügen</button></div>
      <ul>{items.map((i) => (
        <li key={i.id} className={i.done ? "done" : ""}>
          <label><input type="checkbox" checked={i.done} onChange={() => setItems(items.map((x) => x.id === i.id ? { ...x, done: !x.done } : x))} /> {i.text}</label>
          <button onClick={() => setItems(items.filter((x) => x.id !== i.id))}>Löschen</button>
        </li>))}</ul>
    </main>
  );
}`, `main{max-width:520px;margin:auto;padding:40px 20px}.row{display:flex;gap:8px}input:not([type]){flex:1;padding:12px;border-radius:12px;border:1px solid #3b2a5c;background:#140f22;color:inherit}
button{border:0;border-radius:12px;padding:10px 16px;background:#7c3aed;color:#fff;font-weight:600}ul{list-style:none;padding:0}li{display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid #2a1f42}li.done label{opacity:.5;text-decoration:line-through}`),
  },
  {
    id: "dashboard", name: "Dashboard", emoji: "📊", description: "Kennzahlen und einfache Balken",
    files: page(`const stats = [["Besucher", "12.480", "+8%"], ["Umsatz", "3.920 €", "+12%"], ["Anmeldungen", "342", "+3%"]];
const bars = [40, 65, 52, 80, 72, 95, 60];
export default function App() {
  return (
    <main>
      <h1>Übersicht</h1>
      <div className="stats">{stats.map(([l, v, d]) => <div key={l} className="card"><span>{l}</span><strong>{v}</strong><em>{d}</em></div>)}</div>
      <div className="card chart">{bars.map((h, i) => <div key={i} style={{ height: h + "%" }} />)}</div>
    </main>
  );
}`, `main{padding:32px 20px;max-width:960px;margin:auto}.stats{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
.card{background:#140f22;border:1px solid #2a1f42;border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:6px}.card span{color:#9a88bd}.card strong{font-size:1.8rem}.card em{color:#4ade80;font-style:normal}
.chart{margin-top:16px;height:220px;flex-direction:row;align-items:flex-end;gap:10px}.chart div{flex:1;border-radius:8px 8px 0 0;background:linear-gradient(#a855f7,#7c3aed)}`),
  },
  {
    id: "portfolio", name: "Portfolio", emoji: "🎨", description: "Vorstellung mit Projekten und Kontakt",
    files: page(`const work = ["Branding Studio", "App-Design", "Fotografie"];
export default function App() {
  return (
    <main>
      <header><div className="avatar">M</div><h1>Hi, ich bin Marleen</h1><p>Designerin & Entwicklerin aus Berlin.</p></header>
      <section>{work.map((w) => <div key={w} className="tile">{w}</div>)}</section>
      <a href="mailto:hallo@example.com">Kontakt aufnehmen</a>
    </main>
  );
}`, `main{max-width:720px;margin:auto;padding:56px 20px;text-align:center}.avatar{width:88px;height:88px;border-radius:50%;margin:auto;display:grid;place-items:center;font-size:2rem;font-weight:800;background:linear-gradient(135deg,#a855f7,#7c3aed)}
section{display:grid;gap:14px;margin:32px 0;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}.tile{aspect-ratio:4/3;border-radius:18px;display:grid;place-items:center;background:#140f22;border:1px solid #2a1f42}
a{display:inline-block;padding:12px 28px;border-radius:999px;background:#7c3aed;color:#fff;text-decoration:none;font-weight:700}`),
  },
  {
    id: "shop", name: "Kleiner Shop", emoji: "🛍️", description: "Produkte mit Warenkorb-Zähler",
    files: page(`import { useState } from "react";
const products = [["T-Shirt", 25, "👕"], ["Cap", 18, "🧢"], ["Tasche", 32, "👜"], ["Sticker", 4, "✨"]] as const;
export default function App() {
  const [cart, setCart] = useState(0);
  const [total, setTotal] = useState(0);
  return (
    <main>
      <header><h1>Merch Shop</h1><span className="cart">🛒 {cart} · {total} €</span></header>
      <div className="grid">{products.map(([n, p, e]) => (
        <div key={n} className="item"><div className="img">{e}</div><h3>{n}</h3><p>{p} €</p><button onClick={() => { setCart(cart + 1); setTotal(total + p); }}>In den Warenkorb</button></div>
      ))}</div>
    </main>
  );
}`, `main{max-width:960px;margin:auto;padding:24px 20px}header{display:flex;justify-content:space-between;align-items:center}.cart{background:#140f22;border:1px solid #3b2a5c;border-radius:999px;padding:8px 14px}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}.item{background:#140f22;border:1px solid #2a1f42;border-radius:18px;padding:18px;text-align:center}.img{font-size:3rem}
button{border:0;border-radius:12px;padding:10px 14px;width:100%;background:#7c3aed;color:#fff;font-weight:600}`),
  },
];

export const EXAMPLE_PROMPTS = [
  "Baue eine Landingpage für ein Café mit Speisekarte und Öffnungszeiten.",
  "Mach einen Taschenrechner mit großen Tasten.",
  "Erstelle ein Quiz mit 5 Fragen und Punktestand.",
  "Baue eine Wetter-Karte mit °C/°F-Umschalter.",
];
