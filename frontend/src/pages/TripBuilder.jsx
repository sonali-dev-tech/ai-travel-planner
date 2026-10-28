import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import ItineraryView from "../components/ItineraryView";

const STYLES = ["budget", "balanced", "luxury", "adventure", "cultural", "relaxation"];
const INTERESTS = ["Food", "History", "Nature", "Beaches", "Nightlife", "Shopping", "Art", "Adventure sports", "Photography", "Spiritual"];

export default function TripBuilder() {
  const nav = useNavigate();
  const [f, setF] = useState({
    destination: "", start_date: "", days: 3, budget: 30000, currency: "INR",
    travelers: 2, travel_style: "balanced", pace: "moderate", interests: [], notes: "",
  });
  const [itinerary, setItinerary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggle = (i) => set("interests", f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i]);

  const generate = async (e) => {
    e?.preventDefault();
    setBusy(true); setErr("");
    try {
      const body = { ...f, days: +f.days, budget: +f.budget, travelers: +f.travelers, start_date: f.start_date || null };
      const res = await api.generate(body);
      setItinerary(res.itinerary);
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };

  const save = async () => {
    setBusy(true);
    try {
      const body = { prefs: { ...f, days: +f.days, budget: +f.budget, travelers: +f.travelers, start_date: f.start_date || null }, itinerary };
      const trip = await api.save(body);
      nav(`/trips/${trip.id}`);
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <>
      <h2>Smart Trip Builder</h2>
      <p className="muted">Tell us your preferences,and AI will generate a personalized itinerary for you.</p>
      <form className="card form" onSubmit={generate}>
        <div className="cols">
          <label>Destination<input required value={f.destination} onChange={(e) => set("destination", e.target.value)} placeholder="e.g. Jaipur, Bali, Paris" /></label>
          <label>Start date<input type="date" value={f.start_date} onChange={(e) => set("start_date", e.target.value)} /></label>
          <label>Days (1-14)<input type="number" min={1} max={14} value={f.days} onChange={(e) => set("days", e.target.value)} /></label>
          <label>Travelers<input type="number" min={1} max={20} value={f.travelers} onChange={(e) => set("travelers", e.target.value)} /></label>
          <label>Total budget<input type="number" min={1} value={f.budget} onChange={(e) => set("budget", e.target.value)} /></label>
          <label>Currency
            <select value={f.currency} onChange={(e) => set("currency", e.target.value)}>
              {["INR", "USD", "EUR", "GBP", "AED", "SGD"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>Travel style
            <select value={f.travel_style} onChange={(e) => set("travel_style", e.target.value)}>
              {STYLES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label>Pace
            <select value={f.pace} onChange={(e) => set("pace", e.target.value)}>
              {["relaxed", "moderate", "packed"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <div>
          <span className="lbl">Interests</span>
          <div className="chips">
            {INTERESTS.map((i) => (
              <button type="button" key={i} className={"chip" + (f.interests.includes(i) ? " on" : "")} onClick={() => toggle(i)}>{i}</button>
            ))}
          </div>
        </div>
        <label>Special notes<textarea rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Vegetarian food, travelling with kids, wheelchair access…" /></label>
        <button className="btn primary" disabled={busy}>{busy ? "✨ Generating…" : itinerary ? "↻ Regenerate" : "✨ Generate itinerary"}</button>
      </form>

      {err && <div className="alert">{err}</div>}
      {itinerary && (
        <>
          <div className="row between sticky">
            <h3>Preview (you can edit)</h3>
            <button className="btn primary" onClick={save} disabled={busy}>💾 Save trip</button>
          </div>
          <ItineraryView itinerary={itinerary} budget={+f.budget} currency={f.currency} editable onChange={setItinerary} />
        </>
      )}
    </>
  );
}
