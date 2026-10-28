import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import ItineraryView from "../components/ItineraryView";

export default function TripView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [title, setTitle] = useState("");
  const [dirty, setDirty] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get(id).then((t) => { setTrip(t); setItinerary(t.itinerary); setTitle(t.title); }).catch((e) => setErr(e.message));
  }, [id]);

  const change = (it) => { setItinerary(it); setDirty(true); };

  const save = async () => {
    setBusy("save"); setErr("");
    try {
      const t = await api.update(id, { title, itinerary });
      setTrip(t); setDirty(false);
    } catch (e) { setErr(e.message); }
    setBusy("");
  };

  const regen = async (day) => {
    setBusy("regen"); setErr("");
    try {
      const t = await api.regenerate(id, { day: day || null, instruction, itinerary });
      setTrip(t); setItinerary(t.itinerary); setDirty(false);
    } catch (e) { setErr(e.message); }
    setBusy("");
  };

  const remove = async () => {
    if (!confirm("Trip delete karein?")) return;
    await api.remove(id); nav("/");
  };

  if (err && !trip) return <div className="alert">{err}</div>;
  if (!trip) return <p className="muted">Loading…</p>;

  return (
    <>
      <div className="row between sticky">
        <input className="title-input" value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} />
        <div className="row">
          <button className="btn primary" onClick={save} disabled={!dirty || busy}>{busy === "save" ? "Saving…" : dirty ? "💾 Save changes" : "✓ Saved"}</button>
          <button className="btn ghost" onClick={remove}>🗑</button>
        </div>
      </div>
      <p className="muted">📍 {trip.destination} · {trip.days} days · {trip.travel_style}</p>

      <div className="card regen">
        <input placeholder='AI ko instruction dein, e.g. "more street food, less museums"' value={instruction} onChange={(e) => setInstruction(e.target.value)} />
        <button className="btn" onClick={() => regen(null)} disabled={!!busy}>{busy === "regen" ? "…" : "↻ Regenerate whole trip"}</button>
      </div>
      {err && <div className="alert">{err}</div>}

      <ItineraryView
        itinerary={itinerary} budget={trip.budget} currency={trip.currency}
        editable onChange={change} onRegenDay={regen} busy={!!busy}
      />
    </>
  );
}
