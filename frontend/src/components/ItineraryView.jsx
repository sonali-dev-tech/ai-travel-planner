import { useState } from "react";

const ICON = { attraction: "🏛️", dining: "🍽️", transport: "🚕", accommodation: "🏨" };
const TYPES = Object.keys(ICON);

export const dayCost = (d) => (d.activities || []).reduce((s, a) => s + (Number(a.cost) || 0), 0);

export function totalCost(it) {
  const days = it.days || [];
  const nights = Math.max(days.length - 1, 1);
  return (
    days.reduce((s, d) => s + dayCost(d), 0) +
    (Number(it.accommodation?.price_per_night) || 0) * nights +
    (Number(it.transportation?.estimated_cost) || 0)
  );
}

export default function ItineraryView({ itinerary: it, budget, currency, editable, onChange, onRegenDay, busy }) {
  const [active, setActive] = useState(0);
  const days = it.days || [];
  const day = days[Math.min(active, days.length - 1)];
  const idx = Math.min(active, days.length - 1);
  const fmt = (n) => Number(n || 0).toLocaleString();

  const setDay = (patch) => onChange({ ...it, days: days.map((d, i) => (i === idx ? { ...d, ...patch } : d)) });
  const setAct = (j, patch) => setDay({ activities: day.activities.map((a, k) => (k === j ? { ...a, ...patch } : a)) });
  const delAct = (j) => setDay({ activities: day.activities.filter((_, k) => k !== j) });
  const addAct = () => setDay({ activities: [...day.activities, { time: "12:00", type: "attraction", title: "New activity", description: "", location: "", duration: "1h", cost: 0 }] });

  const total = totalCost(it);
  const pct = budget ? Math.min(100, (total / budget) * 100) : 0;
  const over = budget && total > budget;

  return (
    <div className="itin">
      <div className="card">
        <p>{it.summary}</p>
        <div className="budget">
          <div className="row between"><span>Estimated total</span><b className={over ? "over" : ""}>{fmt(total)} / {fmt(budget)} {currency}</b></div>
          <div className="bar"><div style={{ width: pct + "%" }} className={over ? "fill over" : "fill"} /></div>
        </div>
      </div>

      <div className="cols2">
        <div className="card info">
          <h4>🏨 Accommodation</h4>
          {it.accommodation && (<>
            <b>{it.accommodation.name}</b>
            <p className="muted">{it.accommodation.type} · {it.accommodation.area}</p>
            <p>{fmt(it.accommodation.price_per_night)} {currency}/night</p>
            <p className="muted">{it.accommodation.why}</p>
          </>)}
        </div>
        <div className="card info">
          <h4>🚆 Transportation</h4>
          {it.transportation && (<>
            <p><b>Getting there:</b> {it.transportation.to_destination}</p>
            <p><b>Local:</b> {it.transportation.local}</p>
            <p>{fmt(it.transportation.estimated_cost)} {currency}</p>
          </>)}
        </div>
      </div>

      <div className="tabs">
        {days.map((d, i) => (<button key={i} className={"tab" + (i === idx ? " on" : "")} onClick={() => setActive(i)}>Day {d.day}</button>))}
      </div>

      {day && (
        <div className="card">
          <div className="row between">
            <div>
              {editable ? <input className="inline h" value={day.title || ""} onChange={(e) => setDay({ title: e.target.value })} /> : <h3>{day.title}</h3>}
              <span className="muted">{day.theme} · {fmt(dayCost(day))} {currency}</span>
            </div>
            {onRegenDay && <button className="btn sm" disabled={busy} onClick={() => onRegenDay(day.day)}>↻ Regenerate day</button>}
          </div>

          <div className="timeline">
            {day.activities.map((a, j) => (
              <div className={"act " + a.type} key={j}>
                <div className="time">
                  {editable ? <input className="inline t" value={a.time || ""} onChange={(e) => setAct(j, { time: e.target.value })} /> : a.time}
                </div>
                <div className="body">
                  <div className="row between">
                    <div className="row">
                      <span>{ICON[a.type] || "📍"}</span>
                      {editable ? <input className="inline b" value={a.title || ""} onChange={(e) => setAct(j, { title: e.target.value })} /> : <b>{a.title}</b>}
                    </div>
                    {editable && <button className="x" onClick={() => delAct(j)} title="Remove">✕</button>}
                  </div>
                  {editable ? (
                    <>
                      <textarea className="inline" rows={2} value={a.description || ""} onChange={(e) => setAct(j, { description: e.target.value })} />
                      <div className="row wrap">
                        <select className="inline" value={a.type} onChange={(e) => setAct(j, { type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
                        <input className="inline" placeholder="Location" value={a.location || ""} onChange={(e) => setAct(j, { location: e.target.value })} />
                        <input className="inline s" type="number" value={a.cost ?? 0} onChange={(e) => setAct(j, { cost: e.target.value })} />
                      </div>
                    </>
                  ) : (
                    <>
                      <p>{a.description}</p>
                      <small className="muted">📍 {a.location} · ⏱ {a.duration} · {fmt(a.cost)} {currency}</small>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {editable && <button className="btn ghost sm" onClick={addAct}>+ Add activity</button>}
        </div>
      )}

      {it.tips?.length > 0 && (
        <div className="card"><h4>💡 Tips</h4><ul>{it.tips.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
      )}
    </div>
  );
}
