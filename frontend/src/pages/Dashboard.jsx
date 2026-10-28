import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function Dashboard() {
  const [trips, setTrips] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => { api.list().then(setTrips).catch((e) => setErr(e.message)); }, []);

  const remove = async (id) => {
    if (!confirm("Are you sure you want to delete this trip?")) return;
    await api.remove(id);
    setTrips((t) => t.filter((x) => x.id !== id));
  };

  const stats = trips && [
    ["Total trips", trips.length],
    ["Days planned", trips.reduce((s, t) => s + t.days, 0)],
    ["Destinations", new Set(trips.map((t) => t.destination.toLowerCase())).size],
  ];

  return (
    <>
      <div className="row between">
        <div><h2>Dashboard</h2><p className="muted">All your planned trips</p></div>
        <Link to="/new" className="btn primary">+ New Trip</Link>
      </div>
      {err && <div className="alert">{err}</div>}
      {!trips && !err && <p className="muted">Loading…</p>}
      {trips && (
        <>
          <div className="stats">
            {stats.map(([k, v]) => (<div className="card stat" key={k}><span className="muted">{k}</span><b>{v}</b></div>))}
          </div>
          {trips.length === 0 ? (
            <div className="card empty">No trip found yet. <Link to="/new">Create your first trip →</Link></div>
          ) : (
            <div className="grid">
              {trips.map((t) => (
                <div className="card trip" key={t.id}>
                  <div className="badge">{t.travel_style}</div>
                  <h3>{t.title}</h3>
                  <p className="muted">📍 {t.destination} · {t.days} days</p>
                  <p className="muted">💰 {Number(t.budget).toLocaleString()} {t.currency}</p>
                  <div className="row">
                    <Link className="btn primary sm" to={`/trips/${t.id}`}>Open</Link>
                    <button className="btn ghost sm" onClick={() => remove(t.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
