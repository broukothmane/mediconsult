import { createClient } from "@supabase/supabase-js";
import { useState, useEffect, useCallback, useRef } from "react";

const T = {
  primary: "#0B1F33", sidebar: "#0E2A3E", accent: "#0D8FBF", accentLight: "#E4F4FB",
  success: "#16A067", warning: "#E5940A", danger: "#D63E3E", dangerLight: "#FDE8E8",
  bg: "#F0F3F6", card: "#FFFFFF", text: "#172B3A", textMid: "#4A6070", textLight: "#8499A8",
  border: "#DEE4EA", borderLight: "#EDF1F4", hover: "#F6F8FA", ai: "#7C3AED", aiLight: "#F3EEFF",
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
const genPID = () => "PAT-" + String(Math.floor(10000 + Math.random() * 90000));
const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const fmtL = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";
const ageN = (b) => { if (!b) return ""; return Math.floor((Date.now() - new Date(b).getTime()) / 31557600000); };
const ageS = (b) => { const a = ageN(b); return a !== "" ? `${a} ans` : ""; };

const BLOODS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = [{ v: "", l: "— Sexe —" }, { v: "M", l: "Masculin" }, { v: "F", l: "Féminin" }];
const PROGS = ["Stable", "Réservé", "Engagé"];
const PC = { Stable: T.success, Réservé: T.warning, Engagé: T.danger };
const DCATS = ["Radiographie", "IRM", "Scanner", "Bilan biologique", "ECG", "Autre"];


const DOCS0 = [
  { id: "doc_chani", name: "Pr. Chani Mohamed", email: "chani.mohamed@ussi.ma", password: "ussi2026", specialty: "Médecine Générale", phone: "" },
  { id: "doc_dupont", name: "Dr. Pierre Dupont", email: "dupont@clinique.fr", password: "medecin123", specialty: "Cardiologie", phone: "06 98 76 54 32" },
];

function useR() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return { w, m: w < 768 };
}

const SB = createClient("https://ojymuxcnpkpaisnkztjp.supabase.co", "sb_publishable_sd-aM6Wz5tjpEpgGZ-rRxQ_vQ2kCP_w");
async function LD() { try { const { data } = await SB.from("app_state").select("data").eq("id","main").single(); return data?.data || null; } catch { return null; } }
async function SV(d) { try { await SB.from("app_state").upsert({ id: "main", data: d, updated_at: new Date().toISOString() }); } catch {} }
async function LDD() { try { const { data } = await SB.from("doc_state").select("docs").eq("id","main").single(); return data?.docs || []; } catch { return []; } }
async function SVD(d) { try { await SB.from("doc_state").upsert({ id: "main", docs: d, updated_at: new Date().toISOString() }); } catch {} }

/* ══════ AI ENGINE — calls local proxy at localhost:3001 ══════ */
const AI_URL = "/api/ai";

async function aiCall(messages, mt = 2000) {
  try {
    const r = await fetch(AI_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: mt, messages }) });
    const d = await r.json();
    if (d.error) return "Erreur API: " + (d.error.message || d.error.type || JSON.stringify(d.error));
    if (!d.content || !d.content.length) return "Aucune réponse de l'IA. Vérifiez que le proxy AI tourne (node ai-proxy.js)";
    return d.content.map(b => b.text || "").filter(Boolean).join("\n") || "Réponse vide";
  } catch (e) {
    if (e.message.includes("Failed to fetch") || e.message.includes("NetworkError")) return "❌ Le proxy IA n'est pas lancé.\n\nOuvrez un 2ème Terminal et tapez :\ncd ~/mediconsult && node ai-proxy.js";
    return "Erreur de connexion: " + e.message;
  }
}
async function aiImg(b64, mt, prompt) {
  try {
    const r = await fetch(AI_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2500, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mt, data: b64 } }, { type: "text", text: prompt }] }] }) });
    const d = await r.json();
    if (d.error) return "Erreur API: " + (d.error.message || d.error.type || JSON.stringify(d.error));
    if (!d.content || !d.content.length) return "Aucune réponse de l'IA.";
    return d.content.map(b => b.text || "").filter(Boolean).join("\n") || "Réponse vide";
  } catch (e) {
    if (e.message.includes("Failed to fetch") || e.message.includes("NetworkError")) return "❌ Le proxy IA n'est pas lancé.\n\nOuvrez un 2ème Terminal et tapez :\ncd ~/mediconsult && node ai-proxy.js";
    return "Erreur: " + e.message;
  }
}

/* ══════ ICONS ══════ */
const Ic = ({ d, size = 20, color = "currentColor", ...p }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>{d}</svg>;
const II = {
  home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>,
  users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
  user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  clipboard: <><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></>,
  fileText: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  back: <><polyline points="15,18 9,12 15,6"/></>,
  logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  heart: <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>,
  activity: <><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></>,
  edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  trash: <><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
  pdf: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="9" y1="15" x2="15" y2="15"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  upload: <><polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></>,
  download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  folder: <><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></>,
  menu: <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  chev: <><polyline points="9,18 15,12 9,6"/></>,
  sparkle: <><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></>,
  scan: <><path d="M3 7V5a2 2 0 012-2h2"/><path d="M17 3h2a2 2 0 012 2v2"/><path d="M21 17v2a2 2 0 01-2 2h-2"/><path d="M7 21H5a2 2 0 01-2-2v-2"/><circle cx="12" cy="12" r="4"/></>,
  brain: <><path d="M12 2a4 4 0 014 4v1a4 4 0 012 3.5 4 4 0 01-1 6.5 4 4 0 01-5 2 4 4 0 01-5-2 4 4 0 01-1-6.5A4 4 0 018 7V6a4 4 0 014-4z"/><line x1="12" y1="2" x2="12" y2="22"/></>,
  pill: <><path d="M10.5 1.5l3 3-8 8-3-3a2.12 2.12 0 010-3l5-5a2.12 2.12 0 013 0z"/><path d="M13.5 4.5l3 3-8 8-3-3"/></>,
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}html{-webkit-text-size-adjust:100%}
body{font-family:'DM Sans',sans-serif;background:${T.bg};color:${T.text};overflow-x:hidden}
input,textarea,select,button{font-family:'DM Sans',sans-serif;font-size:14px}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes sr{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes glow{0%,100%{box-shadow:0 0 8px rgba(124,58,237,.3)}50%{box-shadow:0 0 20px rgba(124,58,237,.6)}}
.fi{animation:fi .3s ease-out}.sr{animation:sr .2s ease-out}.ai-ld{animation:pulse 1.2s infinite}.ai-gl{animation:glow 2s infinite}
@media print{.np{display:none!important}body{background:#fff}}
`;

/* ══════ 3D LOGO WITH ANIMATIONS ══════ */




/* ══════ UI ══════ */
function Btn({ children, v = "primary", sz = "md", icon, onClick, disabled, style, ...p }) {
  const b = { display: "inline-flex", alignItems: "center", gap: 6, border: "none", borderRadius: 8, cursor: disabled ? "default" : "pointer", fontFamily: "inherit", fontWeight: 500, transition: "all .15s", opacity: disabled ? .5 : 1, lineHeight: 1, whiteSpace: "nowrap" };
  const ss = { xs: { padding: "5px 10px", fontSize: 12 }, sm: { padding: "8px 14px", fontSize: 13 }, md: { padding: "11px 20px", fontSize: 14 }, lg: { padding: "14px 24px", fontSize: 15 } };
  const vs = { primary: { background: T.accent, color: "#fff" }, secondary: { background: T.accentLight, color: T.accent }, danger: { background: T.dangerLight, color: T.danger }, ghost: { background: "transparent", color: T.textLight }, outline: { background: "transparent", color: T.text, border: `1.5px solid ${T.border}` }, success: { background: T.success, color: "#fff" }, ai: { background: `linear-gradient(135deg, ${T.ai}, #9333EA)`, color: "#fff", boxShadow: "0 2px 10px rgba(124,58,237,.3)" }, aiSoft: { background: T.aiLight, color: T.ai } };
  return <button onClick={onClick} disabled={disabled} style={{ ...b, ...ss[sz], ...vs[v], ...style }} {...p}>{icon && <Ic d={icon} size={sz === "xs" ? 13 : sz === "sm" ? 15 : 17} />}{children}</button>;
}
function Card({ children, style, className = "", onClick }) { return <div className={`fi ${className}`} onClick={onClick} style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, ...style }}>{children}</div>; }
function Inp({ label, value, onChange, type = "text", required, rows, options, placeholder, style: s, disabled }) {
  const b = { width: "100%", padding: "10px 13px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 14, fontFamily: "inherit", background: disabled ? T.hover : "#FAFBFC", outline: "none", WebkitAppearance: "none" };
  return <div style={{ marginBottom: 12, ...s }}>{label && <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 500, color: T.textMid }}>{label}{required && <span style={{ color: T.danger }}> *</span>}</label>}{options ? <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} style={{ ...b, cursor: "pointer" }}>{options.map(o => <option key={o.v ?? o.value ?? o} value={o.v ?? o.value ?? o}>{o.l ?? o.label ?? o}</option>)}</select> : rows ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} disabled={disabled} style={{ ...b, resize: "vertical", minHeight: 50 }} onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} /> : <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} disabled={disabled} style={b} onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />}</div>;
}
function Badge({ children, color = T.accent }) { return <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: color + "16", color }}>{children}</span>; }
function Empty({ icon, text }) { return <div style={{ textAlign: "center", padding: 40, color: T.textLight }}><Ic d={icon} size={36} color={T.border} style={{ display: "block", margin: "0 auto 10px" }} /><p style={{ fontSize: 13 }}>{text}</p></div>; }
function TabBar({ tabs, active, onChange, mob }) { return <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${T.borderLight}`, marginBottom: 14, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>{tabs.map(t => <button key={t.id} onClick={() => onChange(t.id)} style={{ padding: mob ? "9px 10px" : "10px 16px", fontSize: mob ? 11 : 13, fontWeight: active === t.id ? 600 : 400, fontFamily: "inherit", color: active === t.id ? (t.ai ? T.ai : T.accent) : T.textLight, background: "none", border: "none", cursor: "pointer", borderBottom: active === t.id ? `2px solid ${t.ai ? T.ai : T.accent}` : "2px solid transparent", marginBottom: -2, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>{t.icon && <Ic d={t.icon} size={14} />}{t.label}</button>)}</div>; }
function Confirm({ message, onYes, onNo }) { return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }}><Card style={{ maxWidth: 340, textAlign: "center", padding: 24 }}><Ic d={II.alert} size={36} color={T.warning} style={{ margin: "0 auto 12px", display: "block" }} /><p style={{ marginBottom: 20, fontSize: 15, lineHeight: 1.5 }}>{message}</p><div style={{ display: "flex", gap: 10, justifyContent: "center" }}><Btn v="outline" onClick={onNo}>Annuler</Btn><Btn v="danger" onClick={onYes}>Confirmer</Btn></div></Card></div>; }
function Modal({ title, onClose, children }) { return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1500 }}><Card style={{ width: "100%", maxWidth: 540, maxHeight: "85vh", display: "flex", flexDirection: "column", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${T.borderLight}` }}><h3 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h3><Btn v="ghost" sz="xs" icon={II.x} onClick={onClose} /></div><div style={{ padding: 18, overflowY: "auto", flex: 1 }}>{children}</div></Card></div>; }
function InfoRow({ label, value, color }) { return value ? <div style={{ marginBottom: 8 }}><span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: .7, color: T.textLight, display: "block" }}>{label}</span><span style={{ fontSize: 14, fontWeight: 500, color: color || T.text }}>{value}</span></div> : null; }

/* ══════ AI RESULT ══════ */
function AiResult({ result, loading, title }) {
  if (loading) return <div style={{ padding: 20, textAlign: "center" }}><div className="ai-gl" style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${T.ai}, #9333EA)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><Ic d={II.sparkle} size={24} color="#fff" /></div><p className="ai-ld" style={{ fontSize: 14, color: T.ai, fontWeight: 500 }}>Analyse en cours...</p></div>;
  if (!result) return null;
  return <div className="fi" style={{ background: T.aiLight, border: `1px solid ${T.ai}20`, borderRadius: 12, padding: 16, marginTop: 12 }}>{title && <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Ic d={II.sparkle} size={16} color={T.ai} /><span style={{ fontSize: 13, fontWeight: 600, color: T.ai }}>{title}</span></div>}<div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", color: T.text }}>{result}</div></div>;
}

/* ══════ AI MODULES ══════ */
function AiImages({ docs, mob }) {
  const [result, setResult] = useState(""); const [loading, setLoading] = useState(false); const [ci, setCi] = useState(null); const fr = useRef(null);
  const go = async (d, mt) => { setLoading(true); setResult(""); const r = await aiImg(d, mt, "Tu es un assistant médical expert en imagerie. Analyse cette image médicale :\n1. **Type d'image**\n2. **Description** précise\n3. **Anomalies détectées**\n4. **Hypothèses diagnostiques**\n5. **Examens complémentaires suggérés**\nRéponds en français."); setResult(r); setLoading(false); };
  const hf = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { const d = r.result; setCi({ data: d.split(",")[1], type: f.type, name: f.name, prev: d }); }; r.readAsDataURL(f); };
  const imgs = docs.filter(d => d.type?.startsWith("image/"));
  return <div><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><Ic d={II.scan} size={20} color={T.ai} /><h4 style={{ fontSize: 15, fontWeight: 600 }}>Analyse d'images médicales</h4></div><div style={{ border: `2px dashed ${T.ai}30`, borderRadius: 10, padding: 20, textAlign: "center", cursor: "pointer", background: T.aiLight + "40", marginBottom: 14 }} onClick={() => fr.current?.click()}><Ic d={II.upload} size={28} color={T.ai} style={{ margin: "0 auto 6px", display: "block" }} /><p style={{ fontSize: 13, color: T.ai, fontWeight: 500 }}>Importer une image</p><p style={{ fontSize: 11, color: T.textLight, marginTop: 2 }}>Radio, IRM, photo clinique, ECG</p><input ref={fr} type="file" accept="image/*" style={{ display: "none" }} onChange={hf} /></div>{ci && <Card style={{ padding: 12, marginBottom: 12 }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><img src={ci.prev} style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }} /><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{ci.name}</div><Btn v="ai" sz="sm" icon={II.sparkle} onClick={() => go(ci.data, ci.type)} style={{ marginTop: 6 }}>Analyser</Btn></div></div></Card>}{imgs.length > 0 && <><p style={{ fontSize: 12, color: T.textLight, marginBottom: 8 }}>Ou documents existants :</p><div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>{imgs.map(d => <div key={d.id} onClick={() => go(d.data.split(",")[1], d.type)} style={{ padding: 8, borderRadius: 8, border: `1.5px solid ${T.border}`, cursor: "pointer", textAlign: "center" }}><img src={d.data} style={{ width: "100%", height: 60, objectFit: "cover", borderRadius: 6, marginBottom: 4 }} /><div style={{ fontSize: 11 }}>{d.name}</div></div>)}</div></>}<AiResult result={result} loading={loading} title="Analyse d'image" /></div>;
}

function AiDiag({ patient, consultation }) {
  const [sym, setSym] = useState(consultation ? `Motif: ${consultation.motif || ""}\nHistoire: ${consultation.history || ""}\nExamen: ${consultation.exam || ""}` : "");
  const [result, setResult] = useState(""); const [loading, setLoading] = useState(false);
  const go = async () => { setLoading(true); setResult(""); const ctx = patient ? `Patient: ${patient.gender === "M" ? "Homme" : "Femme"}, ${ageS(patient.birthDate)}, Groupe: ${patient.bloodGroup || "?"}, Allergies: ${patient.allergies || "aucune"}, ATCD: ${patient.medicalHistory || "aucun"}` : ""; const r = await aiCall([{ role: "user", content: `Assistant médical expert. Données:\n${ctx}\n\nClinique:\n${sym}\n\nAnalyse:\n1. **Diagnostics différentiels** (classés par probabilité)\n2. **Arguments pour/contre**\n3. **Examens complémentaires**\n4. **Signaux d'alarme**\n5. **Prise en charge suggérée**\nFrançais, style clinique.` }]); setResult(r); setLoading(false); };
  return <div><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><Ic d={II.brain} size={20} color={T.ai} /><h4 style={{ fontSize: 15, fontWeight: 600 }}>Diagnostic différentiel</h4></div><Inp label="Données cliniques" value={sym} onChange={setSym} rows={6} placeholder="Symptômes, signes, résultats..." /><Btn v="ai" icon={II.sparkle} onClick={go} disabled={!sym.trim() || loading}>Analyser</Btn><AiResult result={result} loading={loading} title="Diagnostic différentiel" /></div>;
}

function AiSummary({ patient, consultations, docs }) {
  const [result, setResult] = useState(""); const [loading, setLoading] = useState(false);
  const go = async () => { setLoading(true); setResult(""); const cs = consultations.map(c => `[${c.date}] ${c.motif} → ${c.diagnostic || "?"}, Tx: ${c.treatment}${c.isAdvanced ? " [GRAVE: " + c.prognosis + "]" : ""}`).join("\n"); const r = await aiCall([{ role: "user", content: `Synthèse dossier patient:\nNom: ${patient.lastName} ${patient.firstName}, ${ageS(patient.birthDate)}, ${patient.gender === "M" ? "H" : "F"}\nGroupe: ${patient.bloodGroup || "?"}, Allergies: ${patient.allergies || "aucune"}\nATCD med: ${patient.medicalHistory || "aucun"}\nATCD chir: ${patient.surgicalHistory || "aucun"}\nATCD fam: ${patient.familyHistory || "aucun"}\n\nConsultations (${consultations.length}):\n${cs || "Aucune"}\nDocs: ${docs.length}\n\nGénère:\n1. **Vue d'ensemble**\n2. **Problèmes actifs**\n3. **Évolution**\n4. **Points d'attention**\n5. **Recommandations**\nFrançais, style médical.` }]); setResult(r); setLoading(false); };
  return <div><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><Ic d={II.fileText} size={20} color={T.ai} /><h4 style={{ fontSize: 15, fontWeight: 600 }}>Synthèse du dossier</h4></div><Card style={{ padding: 14, marginBottom: 12, background: T.hover }}><div style={{ fontSize: 13 }}><strong>{patient.lastName} {patient.firstName}</strong> — {ageS(patient.birthDate)} — {consultations.length} consult. — {docs.length} doc.</div></Card><Btn v="ai" icon={II.sparkle} onClick={go} disabled={loading}>Générer la synthèse</Btn><AiResult result={result} loading={loading} title="Synthèse" /></div>;
}

function AiDrugs({ consultation }) {
  const [meds, setMeds] = useState(consultation?.treatment || ""); const [result, setResult] = useState(""); const [loading, setLoading] = useState(false);
  const go = async () => { setLoading(true); setResult(""); const r = await aiCall([{ role: "user", content: `Pharmacologue expert. Prescription:\n${meds}\n\nAnalyse:\n1. **Interactions** (gravité: mineur/modéré/majeur)\n2. **Effets indésirables**\n3. **Contre-indications**\n4. **Ajustements posologiques**\n5. **Surveillance**\n6. **Alternatives**\nFrançais, précis.` }]); setResult(r); setLoading(false); };
  return <div><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><Ic d={II.pill} size={20} color={T.ai} /><h4 style={{ fontSize: 15, fontWeight: 600 }}>Interactions médicamenteuses</h4></div><Inp label="Médicaments prescrits" value={meds} onChange={setMeds} rows={4} placeholder="Médicaments + posologie..." /><Btn v="ai" icon={II.sparkle} onClick={go} disabled={!meds.trim() || loading}>Vérifier</Btn><AiResult result={result} loading={loading} title="Analyse pharmacologique" /></div>;
}

/* ══════ REPORT ══════ */
function genRpt(doc, pat, con) {
  const adv = con.isAdvanced, vs = con.vitalSigns || {};
  const vsRows = [["Tension artérielle", vs.tension, "mmHg"], ["Fréquence cardiaque", vs.fc, "bpm"], ["Température", vs.temp, "°C"], ["SpO2", vs.spo2, "%"], ["Poids", vs.weight, "kg"], ["Taille", vs.height, "cm"]].filter(x => x[1]);
  const vsH = vsRows.length ? `<div class="s"><h2>Signes Vitaux</h2><table class="vt">${vsRows.map(r => `<tr><td class="vtl">${r[0]}</td><td class="vtv">${r[1]} ${r[2]}</td></tr>`).join("")}</table></div>` : "";
  const sec = (title, val) => val ? `<div class="s"><h2>${title}</h2><p>${val}</p></div>` : "";

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rapport Médical — ${pat.lastName} ${pat.firstName}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',sans-serif;color:#1a2a36;padding:0;line-height:1.65;background:#fff}
.page{max-width:780px;margin:0 auto;padding:40px 50px}
.toolbar{background:#0B1F33;padding:10px 20px;display:flex;justify-content:center;gap:12px;position:sticky;top:0;z-index:10}
.toolbar button{padding:10px 28px;border:none;border-radius:8px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer}
.btn-print{background:#0D8FBF;color:#fff}
.btn-close{background:rgba(255,255,255,.15);color:#fff}

.hd{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;margin-bottom:24px;border-bottom:3px solid #C41E1E;flex-wrap:wrap;gap:16px}
.hd .org{font-family:'Playfair Display',serif;font-size:24px;color:#C41E1E;font-weight:700;letter-spacing:0.5px}
.hd .org-sub{font-size:11px;color:#C41E1E;text-transform:uppercase;letter-spacing:2px;margin-top:2px}
.hd .doc-name{font-family:'Playfair Display',serif;font-size:17px;color:#0B1F33;margin-top:8px}
.hd .doc-info{font-size:12px;color:#6B7D8A}
.hd-right{text-align:right}
.hd-right .label{font-size:10px;color:#8499A8;text-transform:uppercase;letter-spacing:1px}
.hd-right .val{font-size:13px;font-weight:600;color:#0B1F33}

.title-bar{background:linear-gradient(135deg,#0B1F33,#163550);color:#fff;padding:14px 20px;border-radius:10px;margin-bottom:24px;text-align:center}
.title-bar h1{font-family:'Playfair Display',serif;font-size:20px;font-weight:600;letter-spacing:1px}

.pb{background:#F4F7FA;padding:18px 22px;border-radius:10px;margin-bottom:26px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;border:1px solid #E8EDF2}
.pb .item .lb{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#8499A8;margin-bottom:2px}
.pb .item .vl{font-size:14px;font-weight:600;color:#0B1F33}
.pb .item .vl.danger{color:#C41E1E}
.pb .full{grid-column:1/-1}

.s{margin-bottom:22px}
.s h2{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#0D8FBF;font-weight:700;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #E4F0F5}
.s p{font-size:13.5px;white-space:pre-wrap;line-height:1.7}

.vt{width:100%;border-collapse:collapse}
.vt td{padding:6px 14px;font-size:13px;border-bottom:1px solid #EDF1F4}
.vtl{color:#6B7D8A;width:45%}
.vtv{font-weight:600;color:#0B1F33}

.prg{display:inline-block;padding:4px 18px;border-radius:20px;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px}
.prg-stable{background:#E6F9F0;color:#16A067}
.prg-reserve{background:#FFF6E5;color:#E5940A}
.prg-engage{background:#FDE8E8;color:#D63E3E}

.sg{margin-top:50px;padding-top:20px;border-top:2px solid #DEE4EA;display:flex;justify-content:flex-end}
.sg-box{text-align:center;min-width:200px}
.sg-box .line{width:160px;height:1px;background:#0B1F33;margin:30px auto 8px}
.sg-box .nm{font-family:'Playfair Display',serif;font-size:16px;color:#0B1F33;font-weight:600}
.sg-box .sp{font-size:11px;color:#6B7D8A}
.sg-box .label{font-size:10px;color:#8499A8;margin-bottom:4px}

.ft{margin-top:40px;text-align:center;font-size:9px;color:#AAB8C2;border-top:1px solid #EEE;padding-top:12px}
.ft span{margin:0 8px}

@media print{
  .toolbar{display:none!important}
  body{padding:0}
  .page{padding:20px 30px}
  @page{margin:1.5cm;size:A4}
}
</style></head><body>
<div class="toolbar">
  <button class="btn-print" onclick="window.print()">Imprimer / Sauvegarder PDF</button>
  <button class="btn-close" onclick="window.close()">Fermer</button>
</div>
<div class="page">
<div class="hd">
  <div>
    <div class="org">USSI</div>
    <div class="org-sub">Urgences Santé Secours International</div>
    <div class="doc-name">${doc.name}</div>
    <div class="doc-info">${doc.specialty || ""}${doc.phone ? " — " + doc.phone : ""}</div>
  </div>
  <div class="hd-right">
    <div class="label">Date du rapport</div>
    <div class="val">${fmtL(new Date())}</div>
    <div style="margin-top:8px"><div class="label">Date de consultation</div>
    <div class="val">${fmtL(con.date)}</div></div>
  </div>
</div>

<div class="title-bar"><h1>RAPPORT MÉDICAL${adv ? " — CAS CRITIQUE" : ""}</h1></div>

<div class="pb">
  <div class="item"><div class="lb">Nom complet</div><div class="vl">${pat.lastName} ${pat.firstName}</div></div>
  <div class="item"><div class="lb">Date de naissance</div><div class="vl">${fmt(pat.birthDate)} (${ageS(pat.birthDate)})</div></div>
  <div class="item"><div class="lb">Sexe</div><div class="vl">${pat.gender === "M" ? "Masculin" : pat.gender === "F" ? "Féminin" : "—"}</div></div>
  <div class="item"><div class="lb">N° Dossier</div><div class="vl">${pat.patientId || "—"}</div></div>
  ${pat.phone ? `<div class="item"><div class="lb">Téléphone</div><div class="vl">${pat.phone}</div></div>` : ""}
  ${pat.bloodGroup ? `<div class="item"><div class="lb">Groupe sanguin</div><div class="vl">${pat.bloodGroup}</div></div>` : ""}
  ${pat.address ? `<div class="item full"><div class="lb">Adresse</div><div class="vl">${pat.address}</div></div>` : ""}
  ${pat.allergies ? `<div class="item full"><div class="lb">⚠ Allergies</div><div class="vl danger">${pat.allergies}</div></div>` : ""}
</div>

${sec("Motif de consultation", con.motif)}
${sec("Histoire de la maladie", con.history)}
${adv ? sec("Histoire détaillée", con.detailedHistory) : ""}
${sec("Antécédents", con.antecedents || [pat.medicalHistory, pat.surgicalHistory, pat.familyHistory].filter(Boolean).join("\\n") || "")}
${vsH}
${sec("Examen clinique", con.exam)}
${adv ? sec("Examens complémentaires", con.complementaryExams) : ""}
${sec("Diagnostic", con.diagnostic)}
${adv ? sec("Synthèse clinique", con.synthesis) : ""}
${adv && con.prognosis ? `<div class="s"><h2>Pronostic</h2><span class="prg prg-${con.prognosis === "Stable" ? "stable" : con.prognosis === "Réservé" ? "reserve" : "engage"}">${con.prognosis}</span></div>` : ""}
${sec("Traitement", con.treatment)}
${adv ? sec("Conduite à tenir", con.conduct) : ""}
${sec("Conclusion", con.conclusion || con.diagnostic)}

<div class="sg">
  <div class="sg-box">
    <div class="label">Le médecin traitant</div>
    <div class="line"></div>
    <div class="nm">${doc.name}</div>
    <div class="sp">${doc.specialty || ""}</div>
  </div>
</div>

<div class="ft">
  <span>Document confidentiel</span>•<span>USSI — Urgences Santé Secours International</span>•<span>${pat.patientId || ""}</span>
</div>
</div>
</body></html>`;
}

/* ══════════════════════════════════════
   UNIFIED FORM: Patient + Consultation
   ══════════════════════════════════════ */
function UnifiedForm({ patient, consultation, isNew, isAdvanced: initAdv, onSave, onCancel, mob }) {
  const [step, setStep] = useState(1);
  const [adv, setAdv] = useState(initAdv || false);
  const [p, setP] = useState(patient || { firstName: "", lastName: "", birthDate: "", gender: "", phone: "", address: "", bloodGroup: "", allergies: "", medicalHistory: "", surgicalHistory: "", familyHistory: "" });
  const [c, setC] = useState(consultation || { date: new Date().toISOString().split("T")[0], motif: "", history: "", antecedents: "", exam: "", diagnostic: "", treatment: "", conclusion: "", detailedHistory: "", complementaryExams: "", synthesis: "", prognosis: "", conduct: "", vitalSigns: { tension: "", fc: "", temp: "", spo2: "", weight: "", height: "" } });
  const sp = (k, v) => setP(x => ({ ...x, [k]: v }));
  const sc = (k, v) => setC(x => ({ ...x, [k]: v }));
  const sv = (k, v) => setC(x => ({ ...x, vitalSigns: { ...x.vitalSigns, [k]: v } }));
  const vs = c.vitalSigns || {};

  const canNext = p.lastName && p.firstName && p.birthDate;
  const canSave = c.date && c.motif && c.treatment;

  const SectionTitle = ({ icon, children, color = T.accent }) => <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, marginTop: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: color + "14", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={icon} size={15} color={color} /></div><h4 style={{ fontSize: 14, fontWeight: 600, color }}>{children}</h4></div>;

  return (
    <Card style={{ padding: mob ? 16 : 24 }}>
      {/* Toggle critical */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {step === 1 && <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>1</div>}
          {step === 2 && <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>2</div>}
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>{step === 1 ? "Identité du patient" : "Consultation"}</h3>
        </div>
        <button onClick={() => setAdv(!adv)} style={{ display: "flex", alignItems: "center", gap: 5, background: adv ? T.dangerLight : T.hover, color: adv ? T.danger : T.textLight, border: `1.5px solid ${adv ? T.danger + "40" : T.border}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}><Ic d={II.alert} size={14} />{adv ? "CAS CRITIQUE" : "Cas critique ?"}</button>
      </div>

      {/* Steps indicator */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: T.accent }} />
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: step >= 2 ? T.accent : T.border }} />
      </div>

      {/* ══ STEP 1: Patient Identity ══ */}
      {step === 1 && <>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: "0 12px" }}>
          <Inp label="Nom" value={p.lastName} onChange={v => sp("lastName", v)} required placeholder="Nom de famille" />
          <Inp label="Prénom" value={p.firstName} onChange={v => sp("firstName", v)} required placeholder="Prénom" />
          <Inp label="Date de naissance" value={p.birthDate} onChange={v => sp("birthDate", v)} type="date" required />
          <Inp label="Sexe" value={p.gender} onChange={v => sp("gender", v)} options={GENDERS} />
          <Inp label="Téléphone" value={p.phone || ""} onChange={v => sp("phone", v)} placeholder="06 XX XX XX XX" />
          <Inp label="Groupe sanguin" value={p.bloodGroup || ""} onChange={v => sp("bloodGroup", v)} options={BLOODS.map(b => ({ value: b, label: b || "— Groupe —" }))} />
        </div>
        <Inp label="Adresse" value={p.address || ""} onChange={v => sp("address", v)} placeholder="Adresse complète" />
        <Inp label="Allergies" value={p.allergies || ""} onChange={v => sp("allergies", v)} rows={2} placeholder="Allergies connues..." />

        <SectionTitle icon={II.heart}>Antécédents</SectionTitle>
        <Inp label="Médicaux" value={p.medicalHistory || ""} onChange={v => sp("medicalHistory", v)} rows={2} placeholder="Diabète, HTA, asthme..." />
        <Inp label="Chirurgicaux" value={p.surgicalHistory || ""} onChange={v => sp("surgicalHistory", v)} rows={2} placeholder="Appendicectomie, césarienne..." />
        <Inp label="Familiaux" value={p.familyHistory || ""} onChange={v => sp("familyHistory", v)} rows={2} placeholder="Père diabétique..." />

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <Btn v="outline" onClick={onCancel}>Annuler</Btn>
          <Btn onClick={() => setStep(2)} disabled={!canNext} style={{ marginLeft: "auto" }}>Suivant →</Btn>
        </div>
      </>}

      {/* ══ STEP 2: Consultation ══ */}
      {step === 2 && <>
        <Inp label="Date de consultation" value={c.date} onChange={v => sc("date", v)} type="date" required />
        <Inp label="Motif de consultation" value={c.motif} onChange={v => sc("motif", v)} rows={2} required placeholder="Motif principal de la consultation..." />
        <Inp label="Histoire de la maladie" value={c.history} onChange={v => sc("history", v)} rows={3} placeholder="Début, évolution, facteurs..." />

        {adv && <>
          <div style={{ background: T.dangerLight, borderRadius: 10, padding: 14, marginBottom: 12, border: `1px solid ${T.danger}20` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Ic d={II.alert} size={16} color={T.danger} /><span style={{ fontSize: 13, fontWeight: 600, color: T.danger }}>Données cas critique</span></div>
            <Inp label="Histoire détaillée" value={c.detailedHistory || ""} onChange={v => sc("detailedHistory", v)} rows={4} placeholder="Chronologie détaillée, facteurs aggravants, évolution heure par heure..." />
            <Inp label="Examens complémentaires" value={c.complementaryExams || ""} onChange={v => sc("complementaryExams", v)} rows={3} placeholder="Biologie, imagerie, ECG, résultats détaillés..." />
          </div>
        </>}

        <SectionTitle icon={II.activity}>Signes vitaux</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "1fr 1fr 1fr", gap: "0 10px" }}>
          <Inp label="TA (mmHg)" value={vs.tension || ""} onChange={v => sv("tension", v)} placeholder="120/80" />
          <Inp label="FC (bpm)" value={vs.fc || ""} onChange={v => sv("fc", v)} placeholder="75" />
          <Inp label="T° (°C)" value={vs.temp || ""} onChange={v => sv("temp", v)} placeholder="37.0" />
          <Inp label="SpO2 (%)" value={vs.spo2 || ""} onChange={v => sv("spo2", v)} placeholder="98" />
          <Inp label="Poids (kg)" value={vs.weight || ""} onChange={v => sv("weight", v)} placeholder="70" />
          <Inp label="Taille (cm)" value={vs.height || ""} onChange={v => sv("height", v)} placeholder="175" />
        </div>

        <Inp label="Examen clinique" value={c.exam} onChange={v => sc("exam", v)} rows={3} placeholder="Inspection, palpation, auscultation..." />
        <Inp label="Diagnostic" value={c.diagnostic} onChange={v => sc("diagnostic", v)} rows={2} placeholder="Diagnostic principal et différentiel..." />

        {adv && <div style={{ background: T.dangerLight, borderRadius: 10, padding: 14, marginBottom: 12, border: `1px solid ${T.danger}20` }}>
          <Inp label="Synthèse clinique" value={c.synthesis || ""} onChange={v => sc("synthesis", v)} rows={3} placeholder="Vue d'ensemble du cas critique..." />
          <Inp label="Pronostic" value={c.prognosis || ""} onChange={v => sc("prognosis", v)} options={["", ...PROGS].map(o => ({ value: o, label: o || "— Pronostic —" }))} />
        </div>}

        <Inp label="Traitement" value={c.treatment} onChange={v => sc("treatment", v)} rows={3} required placeholder="Médicaments, posologie, durée..." />

        {adv && <div style={{ background: T.dangerLight, borderRadius: 10, padding: 14, marginBottom: 12, border: `1px solid ${T.danger}20` }}>
          <Inp label="Conduite à tenir" value={c.conduct || ""} onChange={v => sc("conduct", v)} rows={3} placeholder="Surveillance, RDV, urgences, protocole..." />
        </div>}

        <Inp label="Conclusion" value={c.conclusion || ""} onChange={v => sc("conclusion", v)} rows={2} placeholder="Résumé et orientation..." />

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <Btn v="outline" onClick={() => setStep(1)}>← Retour</Btn>
          <Btn onClick={() => onSave(p, { ...c, isAdvanced: adv })} disabled={!canSave} icon={II.clipboard} style={{ marginLeft: "auto" }}>Enregistrer</Btn>
        </div>
      </>}
    </Card>
  );
}

/* ════════════════════════════════════════════
   MAIN APP
   ════════════════════════════════════════════ */
export default function MedApp() {
  const scr = useR(); const mob = scr.m;
  const [data, setData] = useState(null);
  const [docs, setDocs] = useState([]);
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login");
  const [sel, setSel] = useState({ p: null, c: null });
  const [search, setSearch] = useState("");
  const [lf, setLF] = useState({ email: "", password: "", error: "" });
  const [cfm, setCfm] = useState(null);
  const [modal, setMdl] = useState(null);
  const [ptab, setPtab] = useState("info");
  const [aiMode, setAiMode] = useState("images"); // FIXED: moved to top level
  const [sideOpen, setSide] = useState(false);
  const [loading, setLoading] = useState(true);
  const fref = useRef(null);

  useEffect(() => { (async () => {
    let d = await LD(); if (!d) d = { doctors: DOCS0, patients: [], consultations: [] };
    if (!d.doctors?.length) d.doctors = DOCS0; await SV(d); setData(d);
    setDocs(await LDD()); setLoading(false);
  })(); }, []);

  const persist = useCallback(async nd => { setData(nd); await SV(nd); }, []);
  const persistD = useCallback(async nd => { setDocs(nd); await SVD(nd); }, []);

  const login = () => { const d = data.doctors.find(x => x.email === lf.email.trim().toLowerCase() && x.password === lf.password); if (d) { setUser(d); setView("dashboard"); setLF({ email: "", password: "", error: "" }); } else setLF(f => ({ ...f, error: "Identifiants incorrects" })); };
  const logout = () => { setUser(null); setView("login"); setSel({ p: null, c: null }); setSide(false); };

  const myP = data ? data.patients.filter(p => p.doctorId === user?.id) : [];
  const myC = data ? data.consultations.filter(c => c.doctorId === user?.id) : [];
  const pC = pid => myC.filter(c => c.patientId === pid).sort((a, b) => new Date(b.date) - new Date(a.date));
  const pD = pid => docs.filter(d => d.patientId === pid && d.doctorId === user?.id);
  const filt = myP.filter(p => { const s = search.toLowerCase(); return !s || `${p.firstName} ${p.lastName} ${p.patientId || ""}`.toLowerCase().includes(s); }).sort((a, b) => a.lastName.localeCompare(b.lastName));
  const recent = [...myC].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  /* ══ UNIFIED SAVE: patient + consultation together ══ */
  const saveUnified = async (patData, conData) => {
    const nd = { ...data };
    let patId;
    if (patData.id) {
      nd.patients = nd.patients.map(x => x.id === patData.id ? { ...x, ...patData } : x);
      patId = patData.id;
    } else {
      patId = uid();
      nd.patients = [...nd.patients, { ...patData, id: patId, patientId: genPID(), doctorId: user.id, createdAt: new Date().toISOString() }];
    }
    if (conData.id) {
      nd.consultations = nd.consultations.map(x => x.id === conData.id ? { ...x, ...conData } : x);
    } else {
      nd.consultations = [...nd.consultations, { ...conData, id: uid(), patientId: patId, doctorId: user.id, createdAt: new Date().toISOString() }];
    }
    await persist(nd);
    const savedPat = nd.patients.find(x => x.id === patId);
    nav("patient-detail", { p: savedPat });
  };

  const saveCon = async c => { const nd = { ...data }; if (c.id) nd.consultations = nd.consultations.map(x => x.id === c.id ? c : x); else nd.consultations = [...nd.consultations, { ...c, id: uid(), doctorId: user.id, createdAt: new Date().toISOString() }]; await persist(nd); };
  const delPat = async pid => { const nd = { ...data }; nd.patients = nd.patients.filter(p => p.id !== pid); nd.consultations = nd.consultations.filter(c => c.patientId !== pid); await persist(nd); await persistD(docs.filter(d => d.patientId !== pid)); nav("patients"); };
  const delCon = async cid => { const nd = { ...data }; nd.consultations = nd.consultations.filter(c => c.id !== cid); await persist(nd); setSel(s => ({ ...s, c: null })); setView("patient-detail"); setPtab("consults"); };

  const handleUpload = async (e, pid, cat) => { const f = e.target.files[0]; if (!f) return; if (f.size > 4 * 1024 * 1024) { alert("Max 4 Mo"); return; } const reader = new FileReader(); reader.onload = async () => { await persistD([...docs, { id: uid(), patientId: pid, doctorId: user.id, name: f.name, type: f.type, size: f.size, category: cat || "Autre", data: reader.result, createdAt: new Date().toISOString() }]); setMdl(null); }; reader.readAsDataURL(f); };
  const delDoc = async id => await persistD(docs.filter(d => d.id !== id));
  const prevDoc = d => { const w = window.open("", "_blank"); if (d.type?.startsWith("image/")) w.document.write(`<html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#111"><img src="${d.data}" style="max-width:100%;max-height:100vh"/></body></html>`); else w.document.write(`<html><body style="margin:0"><iframe src="${d.data}" style="width:100%;height:100vh;border:none"></iframe></body></html>`); };
  const dlDoc = d => { const a = document.createElement("a"); a.href = d.data; a.download = d.name; a.click(); };

  const nav = (v, o = {}) => { setView(v); if (o.p !== undefined) setSel(s => ({ ...s, p: o.p })); if (o.c !== undefined) setSel(s => ({ ...s, c: o.c })); if (v === "patient-detail" && !o.tab) setPtab("info"); if (o.tab) setPtab(o.tab); setSide(false); };
  const openRpt = (c, p) => { const h = genRpt(user, p || myP.find(x => x.id === c.patientId), c); const w = window.open("", "_blank"); w.document.write(h); w.document.close(); };
  const quickPdf = (pat) => { const cs = pC(pat.id); if (!cs.length) { alert("Aucune consultation pour ce patient"); return; } openRpt(cs[0], pat); };

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}><p style={{ fontSize: 13, color: T.textLight }}>Chargement...</p></div>;

  /* ═══ LOGIN ═══ */
  if (view === "login") return <><style>{CSS}</style><div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(145deg, ${T.primary} 0%, #143550 50%, #0A6E96 100%)`, padding: 16 }}><div className="fi" style={{ width: "100%", maxWidth: 380 }}><div style={{ textAlign: "center", marginBottom: 24 }}><h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: "#fff", marginTop: 8 }}>USSI <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: "rgba(124,58,237,.4)", color: "#E8DAFF" }}>AI</span></h1><p style={{ color: "rgba(255,255,255,.5)", fontSize: 11, marginTop: 4 }}>Dossiers médicaux assistés par IA</p></div><Card style={{ padding: 22 }}><Inp label="Email" value={lf.email} onChange={v => setLF(f => ({ ...f, email: v, error: "" }))} type="email" placeholder="docteur@clinique.fr" /><Inp label="Mot de passe" value={lf.password} onChange={v => setLF(f => ({ ...f, password: v, error: "" }))} type="password" placeholder="••••••••" />{lf.error && <p style={{ color: T.danger, fontSize: 13, marginBottom: 10, textAlign: "center" }}>{lf.error}</p>}<Btn sz="lg" onClick={login} style={{ width: "100%", justifyContent: "center", borderRadius: 10, fontWeight: 600, marginTop: 4 }}>Se connecter</Btn></Card></div></div></>;

  /* ═══ SIDEBAR ═══ */
  const Sidebar = () => <>{mob && sideOpen && <div onClick={() => setSide(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 299 }} />}<div className="np" style={{ width: 230, minHeight: "100vh", background: T.sidebar, display: "flex", flexDirection: "column", position: "fixed", left: mob ? (sideOpen ? 0 : -240) : 0, top: 0, zIndex: 300, transition: "left .25s", boxShadow: mob && sideOpen ? "4px 0 20px rgba(0,0,0,.3)" : "none" }}><div style={{ padding: "16px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,.08)" }}><span style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 600, color: "#fff" }}>USSI</span><span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: "rgba(124,58,237,.3)", color: "#D8B4FE" }}>AI</span>{mob && <button onClick={() => setSide(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}><Ic d={II.x} size={18} color="rgba(255,255,255,.5)" /></button>}</div><div style={{ padding: "10px 8px", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>{[{ icon: II.home, label: "Tableau de bord", id: "dashboard" }, { icon: II.users, label: "Patients", id: "patients" }, null, { icon: II.plus, label: "Nouvelle entrée", id: "new-entry" }].map((it, i) => it === null ? <div key={i} style={{ height: 1, background: "rgba(255,255,255,.06)", margin: "8px 0" }} /> : <button key={it.id} onClick={() => nav(it.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 8, background: view === it.id || (it.id === "patients" && ["patient-detail", "edit-entry", "new-followup", "consultation-detail"].includes(view)) ? "rgba(13,143,191,.12)" : "transparent", border: "none", cursor: "pointer", color: view === it.id ? T.accent : "rgba(255,255,255,.6)", fontSize: 13, fontWeight: view === it.id ? 600 : 400, fontFamily: "inherit", textAlign: "left" }}><Ic d={it.icon} size={17} />{it.label}</button>)}</div><div style={{ padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,.08)" }}><div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", marginBottom: 4 }}><div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{user.name.split(" ").pop()?.[0]}</div><div><div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{user.name}</div><div style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>{user.specialty}</div></div></div><button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}><Ic d={II.logout} size={15} />Déconnexion</button></div></div></>;

  const BottomNav = () => mob ? <div className="np" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-around", padding: "6px 0 10px", zIndex: 200 }}>{[{ icon: II.home, label: "Accueil", id: "dashboard" }, { icon: II.users, label: "Patients", id: "patients" }, { icon: II.plus, label: "Entrée", id: "new-entry", ac: true }, { icon: II.menu, label: "Menu", id: "_menu" }].map(it => { const active = view === it.id; return <button key={it.id} onClick={() => it.id === "_menu" ? setSide(true) : nav(it.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "4px 10px", fontFamily: "inherit" }}><div style={{ width: it.ac ? 38 : "auto", height: it.ac ? 38 : "auto", borderRadius: it.ac ? 10 : 0, background: it.ac ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", marginTop: it.ac ? -10 : 0, boxShadow: it.ac ? `0 3px 10px ${T.accent}40` : "none" }}><Ic d={it.icon} size={it.ac ? 18 : 20} color={it.ac ? "#fff" : active ? T.accent : T.textLight} /></div><span style={{ fontSize: 9, fontWeight: active ? 600 : 400, color: active ? T.accent : T.textLight }}>{it.label}</span></button>; })}</div> : null;

  const TopBar = () => mob ? <div className="np" style={{ background: T.primary, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 150 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><button onClick={() => setSide(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Ic d={II.menu} size={20} color="#fff" /></button><span style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 600, color: "#fff" }}>USSI</span><span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: "rgba(124,58,237,.3)", color: "#D8B4FE" }}>AI</span></div></div> : null;

  const Head = ({ title, sub, backTo, actions }) => <div className="np" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 10, flexWrap: "wrap" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}>{!mob && <button onClick={() => setSide(!sideOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}><Ic d={II.menu} size={20} color={T.textLight} /></button>}{backTo && <Btn v="ghost" sz="sm" icon={II.back} onClick={() => nav(backTo)} style={{ padding: 4 }} />}<div><h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: mob ? 17 : 19, fontWeight: 600, color: T.primary }}>{title}</h2>{sub && <p style={{ fontSize: 11, color: T.textLight, marginTop: 1 }}>{sub}</p>}</div></div>{actions && <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{actions}</div>}</div>;

  const Stat = ({ icon, label, value, color = T.accent }) => <Card style={{ flex: 1, minWidth: mob ? 100 : 140, padding: mob ? 12 : 16 }}><div style={{ display: "flex", alignItems: "center", gap: mob ? 8 : 12 }}><div style={{ width: mob ? 34 : 40, height: mob ? 34 : 40, borderRadius: 10, background: color + "12", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic d={icon} size={mob ? 17 : 20} color={color} /></div><div><div style={{ fontSize: mob ? 20 : 24, fontWeight: 700, color: T.primary, lineHeight: 1 }}>{value}</div><div style={{ fontSize: mob ? 10 : 11, color: T.textLight, marginTop: 2 }}>{label}</div></div></div></Card>;

  /* ════ VIEWS ════ */
  const V = () => {
    switch (view) {
      case "dashboard": return <div className="fi"><Head title={`Bonjour, ${user.name.replace("Dr. ", "")}`} sub={fmtL(new Date())} /><div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}><Stat icon={II.users} label="Patients" value={myP.length} /><Stat icon={II.clipboard} label="Consults" value={myC.length} color={T.success} /><Stat icon={II.alert} label="Critiques" value={myC.filter(c => c.isAdvanced).length} color={T.danger} /><Stat icon={II.sparkle} label="IA" value="ON" color={T.ai} /></div><Btn icon={II.plus} onClick={() => nav("new-entry")} style={{ width: "100%", justifyContent: "center", marginBottom: 16 }} sz="lg">Nouvelle entrée patient</Btn><h3 style={{ fontSize: 12, color: T.textLight, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Dernières consultations</h3>{recent.length === 0 ? <Empty icon={II.clipboard} text="Aucune consultation" /> : recent.map(c => { const p = myP.find(x => x.id === c.patientId); return <Card key={c.id} onClick={() => nav("consultation-detail", { c, p })} style={{ marginBottom: 6, padding: 12, cursor: "pointer" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{p ? `${p.lastName} ${p.firstName}` : "?"}</div><div style={{ fontSize: 12, color: T.textLight }}>{c.motif}</div></div><div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}><button title="PDF" onClick={(e) => { e.stopPropagation(); openRpt(c, p); }} style={{ width: 28, height: 28, borderRadius: 6, background: "#FDE8E8", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={II.pdf} size={14} color={T.danger} /></button><span style={{ fontSize: 11, color: T.textLight }}>{fmt(c.date)}</span>{c.isAdvanced && <Badge color={T.danger}>Critique</Badge>}</div></div></Card>; })}</div>;

      case "patients": return <div className="fi"><Head title="Patients" sub={`${myP.length} patient(s)`} actions={<Btn sz="sm" icon={II.plus} onClick={() => nav("new-entry")}>Nouvelle entrée</Btn>} /><div style={{ position: "relative", marginBottom: 12 }}><Ic d={II.search} size={16} color={T.textLight} style={{ position: "absolute", left: 12, top: 11 }} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ width: "100%", padding: "10px 13px 10px 36px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 14, fontFamily: "inherit", background: "#fff", outline: "none" }} /></div>{filt.length === 0 ? <Empty icon={II.users} text="Aucun patient" /> : filt.map((p, i) => <Card key={p.id} onClick={() => nav("patient-detail", { p })} className="sr" style={{ marginBottom: 6, padding: 12, cursor: "pointer", animationDelay: `${i * 25}ms`, animationFillMode: "backwards" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 38, height: 38, borderRadius: 10, background: p.gender === "F" ? "#FCE4EC" : T.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: p.gender === "F" ? T.danger : T.accent, flexShrink: 0 }}>{p.firstName?.[0]}{p.lastName?.[0]}</div><div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{p.lastName} {p.firstName}</div><div style={{ fontSize: 11, color: T.textLight }}>{p.patientId} · {ageS(p.birthDate)} · {pC(p.id).length} consult. · {pD(p.id).length} doc.</div></div></div><div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}><button title="Générer rapport PDF" onClick={(e) => { e.stopPropagation(); quickPdf(p); }} style={{ width: 32, height: 32, borderRadius: 8, background: "#FDE8E8", border: `1px solid #F5C6C6`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={II.pdf} size={15} color={T.danger} /></button><button title="Ajouter un document" onClick={(e) => { e.stopPropagation(); setSel(s => ({ ...s, p })); setMdl("upload-list"); }} style={{ width: 32, height: 32, borderRadius: 8, background: T.hover, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={II.upload} size={15} color={T.accent} /></button><button title="Nouvelle consultation" onClick={(e) => { e.stopPropagation(); nav("new-followup", { p }); }} style={{ width: 32, height: 32, borderRadius: 8, background: T.hover, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={II.plus} size={15} color={T.success} /></button></div></div></Card>)}{modal === "upload-list" && sel.p && <Modal title={`Document — ${sel.p.lastName} ${sel.p.firstName}`} onClose={() => setMdl(null)}><UploadForm patientId={sel.p.id} onUpload={handleUpload} fref={fref} /></Modal>}</div>;

      /* ══ NEW ENTRY: unified patient + consultation ══ */
      case "new-entry": return <div className="fi"><Head title="Nouvelle entrée" sub="Patient + Consultation" backTo="patients" /><UnifiedForm isNew={true} onSave={saveUnified} onCancel={() => nav("patients")} mob={mob} /></div>;

      /* ══ EDIT ENTRY: edit patient + specific consultation ══ */
      case "edit-entry": return <div className="fi"><Head title="Modifier" backTo="consultation-detail" /><UnifiedForm patient={sel.p} consultation={sel.c} isAdvanced={sel.c?.isAdvanced} onSave={saveUnified} onCancel={() => nav("consultation-detail")} mob={mob} /></div>;

      /* ══ NEW FOLLOW-UP: same patient, new consultation ══ */
      case "new-followup": return <div className="fi"><Head title="Nouvelle consultation" sub={sel.p ? `${sel.p.lastName} ${sel.p.firstName}` : ""} backTo="patient-detail" /><UnifiedForm patient={sel.p} isNew={false} onSave={saveUnified} onCancel={() => nav("patient-detail")} mob={mob} /></div>;

      /* ══ PATIENT DETAIL ══ */
      case "patient-detail": {
        const p = sel.p; if (!p) return <Empty icon={II.alert} text="Patient non trouvé" />;
        const cs = pC(p.id), ds = pD(p.id);
        const tabs = [{ id: "info", label: "Dossier", icon: II.user }, { id: "consults", label: `Consults (${cs.length})`, icon: II.clipboard }, { id: "docs", label: `Docs (${ds.length})`, icon: II.folder }, { id: "ai", label: "IA", icon: II.sparkle, ai: true }];
        return <div className="fi">
          <Head title={`${p.lastName} ${p.firstName}`} sub={`${p.patientId || ""} · ${ageS(p.birthDate)}`} backTo="patients" actions={<div style={{ display: "flex", gap: 6 }}><Btn v="danger" sz="sm" icon={II.pdf} onClick={() => quickPdf(p)}>PDF</Btn><Btn v="secondary" sz="sm" icon={II.plus} onClick={() => nav("new-followup", { p })}>Consultation</Btn><Btn v="ghost" sz="sm" icon={II.trash} onClick={() => setCfm({ msg: `Supprimer ${p.lastName} ?`, action: () => delPat(p.id) })} style={{ color: T.danger }} /></div>} />
          <TabBar tabs={tabs} active={ptab} onChange={setPtab} mob={mob} />

          {ptab === "info" && <Card style={{ padding: mob ? 16 : 20 }}><div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}><InfoRow label="Nom" value={`${p.lastName} ${p.firstName}`} /><InfoRow label="ID" value={p.patientId} color={T.accent} /><InfoRow label="Naissance" value={`${fmt(p.birthDate)} (${ageS(p.birthDate)})`} /><InfoRow label="Sexe" value={p.gender === "M" ? "Masculin" : p.gender === "F" ? "Féminin" : "—"} /><InfoRow label="Groupe" value={p.bloodGroup || "—"} /><InfoRow label="Tél" value={p.phone || "—"} /><div style={{ gridColumn: "1/-1" }}><InfoRow label="Adresse" value={p.address || "—"} /></div>{p.allergies && <div style={{ gridColumn: "1/-1" }}><InfoRow label="⚠ Allergies" value={p.allergies} color={T.danger} /></div>}</div><div style={{ height: 1, background: T.borderLight, margin: "16px 0" }} /><h4 style={{ fontSize: 13, color: T.accent, marginBottom: 10 }}>Antécédents</h4>{[{ t: "Médicaux", v: p.medicalHistory }, { t: "Chirurgicaux", v: p.surgicalHistory }, { t: "Familiaux", v: p.familyHistory }].map(x => <div key={x.t} style={{ marginBottom: 10 }}><span style={{ fontSize: 11, color: T.textLight, textTransform: "uppercase" }}>{x.t}</span><p style={{ fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{x.v || "—"}</p></div>)}</Card>}

          {ptab === "consults" && <div><div style={{ marginBottom: 10 }}><Btn sz="sm" icon={II.plus} onClick={() => nav("new-followup", { p })}>Nouvelle consultation</Btn></div>{cs.length === 0 ? <Empty icon={II.clipboard} text="Aucune" /> : cs.map((c, i) => <Card key={c.id} onClick={() => nav("consultation-detail", { c, p })} className="sr" style={{ marginBottom: 6, padding: 12, cursor: "pointer", animationDelay: `${i * 25}ms`, animationFillMode: "backwards" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ minWidth: 0 }}><div style={{ fontWeight: 500, fontSize: 13 }}>{c.motif}</div><div style={{ fontSize: 12, color: T.textLight }}>{c.diagnostic || "En cours"}</div></div><div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}><button title="Rapport PDF" onClick={(e) => { e.stopPropagation(); openRpt(c, p); }} style={{ width: 28, height: 28, borderRadius: 6, background: "#FDE8E8", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={II.pdf} size={14} color={T.danger} /></button><span style={{ fontSize: 11, color: T.textLight }}>{fmt(c.date)}</span>{c.isAdvanced && <Badge color={T.danger}>Critique</Badge>}{c.prognosis && <Badge color={PC[c.prognosis]}>{c.prognosis}</Badge>}</div></div></Card>)}</div>}

          {ptab === "docs" && <div><div style={{ marginBottom: 10 }}><Btn sz="sm" icon={II.upload} onClick={() => setMdl("upload")}>Ajouter</Btn></div>{ds.length === 0 ? <Empty icon={II.folder} text="Aucun" /> : <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 8 }}>{ds.map(d => <Card key={d.id} style={{ padding: 12 }}><div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: 8, background: d.type?.startsWith("image") ? "#FFF3E0" : T.accentLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic d={d.type?.startsWith("image") ? II.image : II.fileText} size={16} color={d.type?.startsWith("image") ? "#E65100" : T.accent} /></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div><Badge color={T.textLight}>{d.category}</Badge></div></div><div style={{ display: "flex", gap: 4, marginTop: 8 }}><Btn v="secondary" sz="xs" icon={II.eye} onClick={() => prevDoc(d)}>Voir</Btn><Btn v="outline" sz="xs" icon={II.download} onClick={() => dlDoc(d)}>DL</Btn><Btn v="ghost" sz="xs" icon={II.trash} onClick={() => setCfm({ msg: "Supprimer ?", action: () => delDoc(d.id) })} style={{ color: T.danger, marginLeft: "auto" }} /></div></Card>)}</div>}{modal === "upload" && <Modal title="Ajouter un document" onClose={() => setMdl(null)}><UploadForm patientId={p.id} onUpload={handleUpload} fref={fref} /></Modal>}</div>}

          {/* ══ AI TAB ══ */}
          {ptab === "ai" && <div>
            <Card style={{ padding: 14, marginBottom: 14, background: `linear-gradient(135deg, ${T.ai}08, ${T.ai}15)`, border: `1px solid ${T.ai}20` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${T.ai}, #9333EA)`, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={II.sparkle} size={18} color="#fff" /></div><div><div style={{ fontSize: 14, fontWeight: 600, color: T.ai }}>Assistant IA</div><div style={{ fontSize: 11, color: T.textLight }}>{p.lastName} {p.firstName}</div></div></div>
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 6 }}>
                {[{ id: "images", icon: II.scan, label: "Images" }, { id: "diagnostic", icon: II.brain, label: "Diagnostic" }, { id: "summary", icon: II.fileText, label: "Synthèse" }, { id: "drugs", icon: II.pill, label: "Médicaments" }].map(m => <button key={m.id} onClick={() => setAiMode(m.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 8px", borderRadius: 10, border: `1.5px solid ${aiMode === m.id ? T.ai : T.border}`, background: aiMode === m.id ? T.aiLight : "#fff", cursor: "pointer", fontFamily: "inherit" }}><Ic d={m.icon} size={20} color={aiMode === m.id ? T.ai : T.textLight} /><span style={{ fontSize: 11, fontWeight: aiMode === m.id ? 600 : 400, color: aiMode === m.id ? T.ai : T.textMid }}>{m.label}</span></button>)}
              </div>
            </Card>
            {aiMode === "images" && <AiImages docs={ds} mob={mob} />}
            {aiMode === "diagnostic" && <AiDiag patient={p} consultation={cs[0]} />}
            {aiMode === "summary" && <AiSummary patient={p} consultations={cs} docs={ds} />}
            {aiMode === "drugs" && <AiDrugs consultation={cs[0]} />}
          </div>}
        </div>;
      }

      /* ══ CONSULTATION DETAIL ══ */
      case "consultation-detail": {
        const c = sel.c, p = sel.p || myP.find(x => x.id === c?.patientId); if (!c) return <Empty icon={II.alert} text="Non trouvé" />;
        const vs = c.vitalSigns || {};
        const Sec = ({ t, v }) => v ? <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: .7, color: T.accent, fontWeight: 600, marginBottom: 2 }}>{t}</div><div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{v}</div></div> : null;
        const VS = ({ l, v, u }) => v ? <div style={{ background: T.hover, padding: "7px 10px", borderRadius: 8, textAlign: "center" }}><div style={{ fontSize: 10, color: T.textLight, textTransform: "uppercase" }}>{l}</div><div style={{ fontSize: 15, fontWeight: 700, color: T.primary }}>{v}<span style={{ fontSize: 10, fontWeight: 400, color: T.textLight }}> {u}</span></div></div> : null;
        return <div className="fi">
          <Head title="Consultation" sub={p ? `${p.lastName} ${p.firstName} — ${fmtL(c.date)}` : ""} backTo="patient-detail" actions={<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><Btn sz="sm" icon={II.pdf} onClick={() => openRpt(c, p)}>PDF</Btn><Btn v="ai" sz="sm" icon={II.sparkle} onClick={() => nav("patient-detail", { p, tab: "ai" })}>IA</Btn><Btn v="ghost" sz="sm" icon={II.edit} onClick={() => nav("edit-entry", { c, p })} /><Btn v="ghost" sz="sm" icon={II.trash} onClick={() => setCfm({ msg: "Supprimer ?", action: () => delCon(c.id) })} style={{ color: T.danger }} /></div>} />
          <Card style={{ padding: mob ? 16 : 20 }}>
            {c.isAdvanced && <div style={{ marginBottom: 12 }}><Badge color={T.danger}>Cas critique</Badge></div>}
            <Sec t="Motif" v={c.motif} /><Sec t="Histoire" v={c.history} />{c.isAdvanced && <Sec t="Histoire détaillée" v={c.detailedHistory} />}
            {(vs.tension || vs.fc || vs.temp || vs.spo2 || vs.weight || vs.height) && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: .7, color: T.accent, fontWeight: 600, marginBottom: 6 }}>Signes vitaux</div><div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(3,1fr)", gap: 6 }}><VS l="TA" v={vs.tension} u="mmHg" /><VS l="FC" v={vs.fc} u="bpm" /><VS l="T°" v={vs.temp} u="°C" /><VS l="SpO2" v={vs.spo2} u="%" /><VS l="Poids" v={vs.weight} u="kg" /><VS l="Taille" v={vs.height} u="cm" /></div></div>}
            <Sec t="Examen clinique" v={c.exam} />{c.isAdvanced && <Sec t="Examens complémentaires" v={c.complementaryExams} />}<Sec t="Diagnostic" v={c.diagnostic} />{c.isAdvanced && <Sec t="Synthèse" v={c.synthesis} />}
            {c.isAdvanced && c.prognosis && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: .7, color: T.accent, fontWeight: 600, marginBottom: 4 }}>Pronostic</div><Badge color={PC[c.prognosis]}>{c.prognosis}</Badge></div>}
            <Sec t="Traitement" v={c.treatment} />{c.isAdvanced && <Sec t="Conduite à tenir" v={c.conduct} />}<Sec t="Conclusion" v={c.conclusion} />
          </Card>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}><Btn sz="lg" icon={II.pdf} onClick={() => openRpt(c, p)} style={{ flex: 1, justifyContent: "center" }}>Rapport PDF</Btn><Btn v="ai" sz="lg" icon={II.sparkle} onClick={() => nav("patient-detail", { p, tab: "ai" })} style={{ flex: 1, justifyContent: "center" }}>Analyse IA</Btn></div>
        </div>;
      }

      default: return <Empty icon={II.alert} text="Vue inconnue" />;
    }
  };

  return <><style>{CSS}</style><div style={{ display: "flex", minHeight: "100vh", background: T.bg }}><Sidebar /><div style={{ flex: 1, marginLeft: mob ? 0 : 230, transition: "margin .25s", minHeight: "100vh", paddingBottom: mob ? 70 : 0 }}><TopBar /><div style={{ padding: mob ? 12 : 20, maxWidth: 920, margin: "0 auto" }}>{V()}</div></div><BottomNav /></div>{cfm && <Confirm message={cfm.msg} onYes={() => { cfm.action(); setCfm(null); }} onNo={() => setCfm(null)} />}</>;
}

function UploadForm({ patientId, onUpload, fref }) {
  const [cat, setCat] = useState("Autre");
  return <div><Inp label="Catégorie" value={cat} onChange={setCat} options={DCATS} /><div style={{ border: `2px dashed ${T.ai}30`, borderRadius: 10, padding: 24, textAlign: "center", cursor: "pointer", background: T.hover }} onClick={() => fref.current?.click()}><Ic d={II.upload} size={28} color={T.textLight} style={{ margin: "0 auto 6px", display: "block" }} /><p style={{ fontSize: 13, color: T.textMid }}>Sélectionner un fichier</p><p style={{ fontSize: 11, color: T.textLight, marginTop: 2 }}>PDF, images — Max 4 Mo</p><input ref={fref} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" style={{ display: "none" }} onChange={e => onUpload(e, patientId, cat)} /></div></div>;
}
