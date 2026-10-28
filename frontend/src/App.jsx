import { createContext, useContext, useEffect, useState } from "react";
import { Routes, Route, Navigate, NavLink, Outlet } from "react-router-dom";
import { supabase } from "./supabase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TripBuilder from "./pages/TripBuilder";
import TripView from "./pages/TripView";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function Layout() {
  const { session } = useAuth();
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">✈️ Wayfinder</div>
        <nav>
          <NavLink to="/" end>📊 Dashboard</NavLink>
          <NavLink to="/new">✨ New Trip</NavLink>
        </nav>
        <div className="side-foot">
          <small>{session.user.email}</small>
          <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Logout</button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}

function Guard() {
  const { session, loading } = useAuth();
  if (loading) return <div className="center">Loading…</div>;
  return session ? <Layout /> : <Navigate to="/login" replace />;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthCtx.Provider value={{ session, loading }}>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
        <Route element={<Guard />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<TripBuilder />} />
          <Route path="/trips/:id" element={<TripView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthCtx.Provider>
  );
}
