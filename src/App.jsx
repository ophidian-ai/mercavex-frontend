import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import logoIcon from "./assets/media/logo_icon.png";
import logoText from "./assets/media/logo_text.png";

// ─────────────────────────────────────────────
//  LOGO — OphidianAI brand asset
// ─────────────────────────────────────────────
const LOGO = logoIcon;
const BG = logoText
// ─────────────────────────────────────────────
//  CONFIG — set these to your real values
// ─────────────────────────────────────────────
const BACKEND_URL    = "https://mercavex-backend.onrender.com";
const SUPABASE_URL   = import.meta.env.VITE_SUPABASE_URL   || "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON  = import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_ANON_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const PLATFORM_META = {
  instagram: { name: "Instagram",   icon: "📸" },
  facebook:  { name: "Facebook",    icon: "👥" },
  x:         { name: "X (Twitter)", icon: "✕"  },
  linkedin:  { name: "LinkedIn",    icon: "💼" },
  tiktok:    { name: "TikTok",      icon: "♪"  },
  bluesky:   { name: "Bluesky",     icon: "🦋" },
  threads:   { name: "Threads",     icon: "🧵" },
  youtube:   { name: "YouTube",     icon: "▶"  },
  reddit:    { name: "Reddit",      icon: "🔴" },
  pinterest: { name: "Pinterest",   icon: "📌" },
};

// Platforms that require an image or video — text-only posts are rejected by their API
const MEDIA_REQUIRED_PLATFORMS = ["instagram", "tiktok", "pinterest", "youtube"];

const SCHEDULES = [
  { id: "immediately", label: "Post Now",    desc: "Publish instantly", icon: "🚀", offsets: null        },
  { id: "daily",       label: "Daily",       desc: "Once every day",   icon: "🔥", offsets: [1,2,3,4,5]     },
  { id: "3x_week",     label: "3× / Week",   desc: "Mon · Wed · Fri",  icon: "⚡", offsets: [1,3,5,8,10]    },
  { id: "weekly",      label: "Weekly",      desc: "Once per week",    icon: "📅", offsets: [7,14,21,28,35]  },
  { id: "biweekly",    label: "Biweekly",    desc: "Every two weeks",  icon: "🗓", offsets: [14,28,42,56,70] },
];

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function getScheduledDates(scheduleId, time, count) {
  const sc = SCHEDULES.find(s => s.id === scheduleId);
  if (!sc || sc.offsets === null) return Array(count).fill(null);
  const [h,m] = time.split(":").map(Number);
  return sc.offsets.slice(0, count).map(offset => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  });
}

// ─────────────────────────────────────────────
//  SMALL COMPONENTS
// ─────────────────────────────────────────────
function Dots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, marginLeft: 6, alignItems: "center" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: "50%", background: "#2ECC71",
          animation: `dot 1.1s ${i*0.18}s ease-in-out infinite`,
          display: "inline-block",
        }} />
      ))}
    </span>
  );
}

function Notice({ type = "info", children }) {
  const map = {
    info:    ["rgba(59,130,246,0.08)",  "rgba(59,130,246,0.25)",  "#93C5FD"],
    warn:    ["rgba(255,181,0,0.08)",   "rgba(255,181,0,0.25)",   "#FCD34D"],
    error:   ["rgba(255,59,48,0.08)",   "rgba(255,59,48,0.25)",   "#FCA5A5"],
    success: ["rgba(34,197,94,0.08)",   "rgba(34,197,94,0.25)",   "#86EFAC"],
  };
  const [bg, bd, c] = map[type];
  return (
    <div style={{ background: bg, border: `1px solid ${bd}`, borderRadius: 10,
      padding: "12px 16px", color: c, fontSize: 13, lineHeight: 1.65, marginBottom: 18 }}>
      {children}
    </div>
  );
}

function AdCard({ ad, index, approved, onApprove, onRevise, revising, feedback, setFeedback, busy, imageUrl, videoUrl }) {
  return (
    <div style={{
      background: approved ? "rgba(46,204,113,0.05)" : "rgba(255,255,255,0.02)",
      border: `1.5px solid ${approved ? "#2ECC71" : "rgba(46,204,113,0.12)"}`,
      borderRadius: 16, padding: "24px 26px",
      animation: `up 0.4s ${index * 0.09}s ease both`, opacity: 0,
    }}>
      {/* Media thumbnail — shown when approved and visual exists */}
      {approved && (videoUrl || imageUrl) && (
        <div style={{ marginBottom: 14, borderRadius: 10, overflow: "hidden", position: "relative", aspectRatio: "16/9", background: "#000" }}>
          {videoUrl
            ? <video src={videoUrl} autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          }
          <div style={{ position: "absolute", top: 8, right: 8, background: videoUrl ? "rgba(99,179,237,0.9)" : "rgba(46,204,113,0.9)", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>
            {videoUrl ? "VIDEO READY" : "IMAGE READY"}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: "#2ECC71", fontSize: 10, fontWeight: 800, letterSpacing: 2.5 }}>VARIANT {index + 1}</span>
        {approved && <span style={{ background: "#2ECC71", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: 1 }}>APPROVED</span>}
      </div>
      <div style={{ color: "#fff", fontSize: 19, fontWeight: 700, lineHeight: 1.4, marginBottom: 10 }}>{ad.headline}</div>
      <div style={{ color: "rgba(255,255,255,0.56)", fontSize: 14, lineHeight: 1.75, marginBottom: 14 }}>{ad.body}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: approved ? 0 : 18 }}>
        <span style={{ background: "rgba(46,204,113,0.15)", border: "1px solid rgba(46,204,113,0.3)", color: "#2ECC71", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🎯 {ad.cta}</span>
        {(ad.platforms || []).map(p => (
          <span key={p} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>{p}</span>
        ))}
      </div>
      {!approved && (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ display: "flex", gap: 9 }}>
            <button onClick={() => onApprove(index)} style={{ flex: 1, background: "linear-gradient(135deg, #1A8A3C 0%, #2ECC71 100%)", color: "#fff", border: "none", borderRadius: 9, padding: "11px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 3px 12px rgba(46,204,113,0.2)" }}>✓ Approve</button>
            <button onClick={() => onRevise(index)} style={{ flex: 1, background: "transparent", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 9, padding: "11px 0", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>✏ Revise</button>
          </div>
          {revising && (
            <div style={{ display: "flex", gap: 8 }}>
              <input value={feedback} onChange={e => setFeedback(e.target.value)} onKeyDown={e => e.key === "Enter" && onRevise(index, true)}
                placeholder="Describe what to change…"
                style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(46,204,113,0.4)", borderRadius: 8, padding: "10px 13px", color: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              <button onClick={() => onRevise(index, true)} disabled={busy} style={{ background: "rgba(46,204,113,0.18)", color: "#2ECC71", border: "1px solid rgba(46,204,113,0.35)", borderRadius: 8, padding: "10px 16px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{busy ? "…" : "Send"}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  ACCOUNT SCREEN
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  TEAM MANAGEMENT  (Agency plan only)
// ─────────────────────────────────────────────
function TeamManagement({ session }) {
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]   = useState("member");
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(false);
  const [msg, setMsg]           = useState(null);

  const authH = { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` };

  useEffect(() => {
    if (!session) return;
    fetch(`${BACKEND_URL}/team/members`, { headers: authH })
      .then(r => r.json())
      .then(d => { setMembers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session]);

  const invite = async () => {
    if (!inviteEmail.trim()) return;
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`${BACKEND_URL}/team/invite`, {
        method: "POST", headers: authH,
        body: JSON.stringify({ email: inviteEmail.trim().toLowerCase(), role: inviteRole }),
      });
      const d = await r.json();
      if (d.status !== "ok") throw new Error(d.message);
      setMsg({ type: "success", text: d.message });
      setInviteEmail("");
      // Refresh list
      const r2 = await fetch(`${BACKEND_URL}/team/members`, { headers: authH });
      const d2 = await r2.json();
      setMembers(Array.isArray(d2) ? d2 : []);
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
    setBusy(false);
  };

  const remove = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/team/members/${id}`, { method: "DELETE", headers: authH });
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch {}
  };

  const S2 = {
    label: { display: "block", color: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 800, letterSpacing: 2.8, marginBottom: 8, textTransform: "uppercase" },
    inp:   { flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(46,204,113,0.18)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
    btn:   { background: "linear-gradient(135deg, #1A8A3C 0%, #2ECC71 100%)", color: "#fff", border: "none", borderRadius: 9, padding: "11px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
    msg:   (t) => ({ background: t === "success" ? "rgba(46,204,113,0.08)" : "rgba(255,59,48,0.08)", border: `1px solid ${t === "success" ? "rgba(46,204,113,0.25)" : "rgba(255,59,48,0.25)"}`, borderRadius: 9, padding: "10px 14px", color: t === "success" ? "#86EFAC" : "#FCA5A5", fontSize: 13, marginTop: 8 }),
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(46,204,113,0.1)", borderRadius: 16, padding: "26px 28px", marginBottom: 18 }}>
      <div style={{ color: "#fff", fontWeight: 700, fontSize: 15.5, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "#4DFF8F" }}>👥</span> Team Members
        <span style={{ background: "rgba(77,255,143,0.1)", border: "1px solid rgba(77,255,143,0.2)", color: "#4DFF8F", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.5, padding: "2px 8px", borderRadius: 20 }}>AGENCY</span>
      </div>
      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 20 }}>
        {members.length}/4 seats used. Members share your Ayrshare workspace and can create and post campaigns.
      </div>

      {/* Invite row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <input
          value={inviteEmail}
          onChange={e => setInviteEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && invite()}
          placeholder="colleague@company.com"
          style={S2.inp}
        />
        <select
          value={inviteRole}
          onChange={e => setInviteRole(e.target.value)}
          style={{ ...S2.inp, flex: "0 0 auto", width: 110, cursor: "pointer" }}
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={invite} disabled={busy || members.length >= 4} style={S2.btn}>
          {busy ? "Adding…" : "Add Member"}
        </button>
      </div>
      {msg && <div style={S2.msg(msg.type)}>{msg.text}</div>}

      {/* Members list */}
      {loading ? (
        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, marginTop: 16 }}>Loading team…</div>
      ) : members.length === 0 ? (
        <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 13, marginTop: 16, fontStyle: "italic" }}>No team members yet. Add a colleague above.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
          {members.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(46,204,113,0.15)", border: "1px solid rgba(46,204,113,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#2ECC71", flexShrink: 0 }}>
                {m.invitee_email.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.invitee_email}</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2, textTransform: "capitalize" }}>{m.role} · {m.status === "accepted" ? "✓ Active" : "⏳ Pending signup"}</div>
              </div>
              <button onClick={() => remove(m.id)} style={{ background: "none", border: "1px solid rgba(255,59,48,0.2)", color: "rgba(255,100,100,0.6)", borderRadius: 7, padding: "5px 11px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountScreen({ user, session, onProfileUpdate, userPlan }) {
  const [tab,          setTab]          = useState("profile");
  const [fullName,     setFullName]     = useState("");
  const [newPw,        setNewPw]        = useState("");
  const [confirmPw,    setConfirmPw]    = useState("");
  const [ayrshareKey,  setAyrshareKey]  = useState("");
  const [profileBusy,  setProfileBusy]  = useState(false);
  const [pwBusy,       setPwBusy]       = useState(false);
  const [keyBusy,      setKeyBusy]      = useState(false);
  const [profileMsg,   setProfileMsg]   = useState(null);
  const [pwMsg,        setPwMsg]        = useState(null);
  const [keyMsg,       setKeyMsg]       = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teamMembers,  setTeamMembers]  = useState([]);
  const [teamLoading,  setTeamLoading]  = useState(false);
  const [inviteEmail,  setInviteEmail]  = useState("");
  const [inviteRole,   setInviteRole]   = useState("member");
  const [inviteBusy,   setInviteBusy]   = useState(false);
  const [teamMsg,      setTeamMsg]      = useState(null);

  const isAgency   = userPlan === "agency";
  const isBusiness = userPlan === "business";
  const isPro      = userPlan === "pro" || isBusiness || isAgency;
  const authHdrs = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` });

  useEffect(() => {
    if (!session) return;
    fetch(`${BACKEND_URL}/user/profile`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.full_name)        setFullName(d.full_name);
        if (d.ayrshare_api_key) setAyrshareKey(d.ayrshare_api_key);
      }).catch(() => {});
  }, [session]);

  const loadTeam = async () => {
    setTeamLoading(true);
    try {
      const r = await fetch(`${BACKEND_URL}/team`, { headers: authHdrs() });
      const d = await r.json();
      setTeamMembers(d.members || []);
    } catch (e) {}
    setTeamLoading(false);
  };

  useEffect(() => { if (tab === "team" && isAgency) loadTeam(); }, [tab]);

  const saveProfile = async () => {
    setProfileBusy(true); setProfileMsg(null);
    try {
      const r = await fetch(`${BACKEND_URL}/user/profile`, { method: "PUT", headers: authHdrs(), body: JSON.stringify({ full_name: fullName }) });
      const d = await r.json();
      if (d.status !== "ok") throw new Error(d.message || "Failed");
      setProfileMsg({ type: "success", text: "Profile updated." });
      if (onProfileUpdate) onProfileUpdate(fullName);
    } catch (e) { setProfileMsg({ type: "error", text: e.message }); }
    setProfileBusy(false);
  };

  const changePassword = async () => {
    setPwMsg(null);
    if (!newPw) return setPwMsg({ type: "error", text: "Enter a new password." });
    if (newPw !== confirmPw) return setPwMsg({ type: "error", text: "Passwords do not match." });
    if (newPw.length < 6) return setPwMsg({ type: "error", text: "Password must be at least 6 characters." });
    setPwBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setPwMsg({ type: "success", text: "Password updated." });
      setNewPw(""); setConfirmPw("");
    } catch (e) { setPwMsg({ type: "error", text: e.message }); }
    setPwBusy(false);
  };

  const saveAyrshareKey = async () => {
    setKeyBusy(true); setKeyMsg(null);
    try {
      const r = await fetch(`${BACKEND_URL}/user/profile`, { method: "PUT", headers: authHdrs(), body: JSON.stringify({ ayrshare_api_key: ayrshareKey }) });
      const d = await r.json();
      if (d.status !== "ok") throw new Error(d.message || "Failed");
      setKeyMsg({ type: "success", text: "API key saved." });
    } catch (e) { setKeyMsg({ type: "error", text: e.message }); }
    setKeyBusy(false);
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return;
    setInviteBusy(true); setTeamMsg(null);
    try {
      const r = await fetch(`${BACKEND_URL}/team/invite`, { method: "POST", headers: authHdrs(), body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }) });
      const d = await r.json();
      if (d.status !== "ok") throw new Error(d.message || "Failed");
      setTeamMsg({ type: "success", text: d.message });
      setInviteEmail(""); setInviteRole("member");
      await loadTeam();
    } catch (e) { setTeamMsg({ type: "error", text: e.message }); }
    setInviteBusy(false);
  };

  const removeMember = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/team/${id}`, { method: "DELETE", headers: authHdrs() });
      setTeamMembers(prev => prev.filter(m => m.id !== id));
    } catch (e) {}
  };

  const updateRole = async (id, role) => {
    try {
      await fetch(`${BACKEND_URL}/team/${id}`, { method: "PATCH", headers: authHdrs(), body: JSON.stringify({ role }) });
      setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
    } catch (e) {}
  };

  const initials    = (fullName || user?.email || "?").charAt(0).toUpperCase();
  const displayEmail = user?.email || "";
  const planLabel   = { free: "FREE", pro: "PRO", business: "BUSINESS", agency: "AGENCY" }[userPlan] || "FREE";
  const planColor   = userPlan === "agency" ? "#4DFF8F" : userPlan === "business" ? "#F59E0B" : userPlan === "pro" ? "#2ECC71" : "rgba(255,255,255,0.45)";

  const S = {
    section:      { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(46,204,113,0.1)", borderRadius: 16, padding: "26px 28px", marginBottom: 18 },
    label:        { display: "block", color: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 800, letterSpacing: 2.8, marginBottom: 8, textTransform: "uppercase" },
    inp:          { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(46,204,113,0.18)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 14 },
    btn:          { background: "linear-gradient(135deg, #1A8A3C 0%, #2ECC71 100%)", color: "#fff", border: "none", borderRadius: 9, padding: "11px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 3px 12px rgba(46,204,113,0.2)" },
    ghost:        { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "11px 22px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
    danger:       { background: "rgba(255,59,48,0.08)", color: "#FF6B6B", border: "1px solid rgba(255,59,48,0.2)", borderRadius: 9, padding: "11px 22px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
    sectionTitle: { color: "#fff", fontWeight: 700, fontSize: 15.5, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 },
    msg:          (type) => ({ background: type === "success" ? "rgba(46,204,113,0.08)" : "rgba(255,59,48,0.08)", border: `1px solid ${type === "success" ? "rgba(46,204,113,0.25)" : "rgba(255,59,48,0.25)"}`, borderRadius: 9, padding: "10px 14px", color: type === "success" ? "#86EFAC" : "#FCA5A5", fontSize: 13, marginTop: 4, marginBottom: 8 }),
  };

  const tabs = [
    { id: "profile", label: "Profile" },
    ...(isPro    ? [{ id: "support", label: "Priority Support" }] : []),
    ...(isAgency ? [{ id: "team",    label: "Team Members" }] : []),
  ];

  return (
    <div style={{ animation: "up 0.35s ease both" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>
          Account<br /><span style={{ color: "#2ECC71" }}>Settings.</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 14, marginTop: 8 }}>Manage your profile, password, and integrations.</div>
      </div>

      {/* Avatar */}
      <div style={{ ...S.section, display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #1A8A3C 0%, #2ECC71 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 24, color: "#fff", flexShrink: 0, boxShadow: "0 4px 18px rgba(46,204,113,0.25)" }}>
          {initials}
        </div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>{fullName || "No name set"}</div>
          <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, marginTop: 3 }}>{displayEmail}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <span style={{ background: "rgba(46,204,113,0.12)", border: `1px solid ${planColor}60`, color: planColor, fontSize: 10.5, fontWeight: 700, letterSpacing: 1.5, padding: "3px 10px", borderRadius: 20 }}>
              {planLabel} PLAN
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div style={{ display: "flex", gap: 0, marginBottom: 22, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "none", border: "none", color: tab === t.id ? "#2ECC71" : "rgba(255,255,255,0.38)",
              fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit",
              padding: "10px 18px 12px", borderBottom: tab === t.id ? "2px solid #2ECC71" : "2px solid transparent",
              marginBottom: -1, transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>
      )}

      {/* PROFILE TAB */}
      {tab === "profile" && (
        <>
          <div style={S.section}>
            <div style={S.sectionTitle}><span style={{ color: "#2ECC71" }}>◉</span> Profile Information</div>
            <label style={S.label}>Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" style={S.inp} />
            <label style={S.label}>Email Address</label>
            <input value={displayEmail} disabled style={{ ...S.inp, opacity: 0.45, cursor: "not-allowed" }} />
            <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 12, marginTop: -8, marginBottom: 16 }}>Email changes must be requested via support.</div>
            {profileMsg && <div style={S.msg(profileMsg.type)}>{profileMsg.text}</div>}
            <button onClick={saveProfile} disabled={profileBusy} style={S.btn}>{profileBusy ? "Saving…" : "Save Profile"}</button>
          </div>

          <div style={S.section}>
            <div style={S.sectionTitle}><span style={{ color: "#2ECC71" }}>◈</span> Change Password</div>
            <label style={S.label}>New Password</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 6 characters" style={S.inp} />
            <label style={S.label}>Confirm New Password</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat password" style={S.inp} onKeyDown={e => e.key === "Enter" && changePassword()} />
            {pwMsg && <div style={S.msg(pwMsg.type)}>{pwMsg.text}</div>}
            <button onClick={changePassword} disabled={pwBusy} style={S.btn}>{pwBusy ? "Updating…" : "Update Password"}</button>
          </div>

          <div style={S.section}>
            <div style={S.sectionTitle}><span style={{ color: "#2ECC71" }}>&#8635;</span> Ayrshare Integration</div>
            <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, lineHeight: 1.65, marginBottom: 16 }}>Your Ayrshare API key connects Mercavex to your social platforms. Find it in your Ayrshare dashboard.</div>
            <label style={S.label}>API Key</label>
            <input value={ayrshareKey} onChange={e => setAyrshareKey(e.target.value)} placeholder="AYRS-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" style={{ ...S.inp, fontFamily: "monospace", fontSize: 13, letterSpacing: 0.5 }} />
            {keyMsg && <div style={S.msg(keyMsg.type)}>{keyMsg.text}</div>}
            <button onClick={saveAyrshareKey} disabled={keyBusy} style={S.btn}>{keyBusy ? "Saving…" : "Save API Key"}</button>
          </div>

          <div style={{ ...S.section, border: "1px solid rgba(255,59,48,0.15)" }}>
            <div style={{ ...S.sectionTitle, color: "#FCA5A5" }}><span>&#9888;</span> Danger Zone</div>
            <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, lineHeight: 1.65, marginBottom: 16 }}>Deleting your account is permanent. All campaigns, data, and settings will be lost.</div>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} style={S.danger}>Delete Account</button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontStyle: "italic" }}>Are you absolutely sure?</span>
                <button style={{ ...S.danger, background: "rgba(255,59,48,0.2)", border: "1px solid rgba(255,59,48,0.4)" }}
                  onClick={async () => { await supabase.auth.admin?.deleteUser?.(user.id).catch(() => {}); await supabase.auth.signOut(); }}>
                  Yes, Delete Everything
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} style={S.ghost}>Cancel</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* PRIORITY SUPPORT TAB */}
      {tab === "support" && isPro && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...S.section, borderColor: "rgba(46,204,113,0.25)" }}>
            <div style={S.sectionTitle}><span style={{ color: "#2ECC71" }}>&#9733;</span> Priority Support</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13.5, lineHeight: 1.7, marginBottom: 22 }}>
              As a {{ agency: "Agency", business: "Business", pro: "Pro" }[userPlan] || "Pro"} subscriber you have priority access to the Mercavex support team. We aim to respond within 4 business hours.
            </div>
            <a href="mailto:support@ophidianai.com?subject=Mercavex%20Priority%20Support"
              style={{ display: "inline-block", background: "linear-gradient(135deg,#1A8A3C,#2ECC71)", color: "#fff", textDecoration: "none", borderRadius: 9, padding: "11px 22px", fontWeight: 700, fontSize: 13, fontFamily: "inherit", boxShadow: "0 3px 12px rgba(46,204,113,0.2)" }}>
              &#10003; Email Priority Support
            </a>
          </div>
          {isAgency && (
            <div style={{ ...S.section, borderColor: "rgba(77,255,143,0.2)" }}>
              <div style={S.sectionTitle}><span style={{ color: "#4DFF8F" }}>&#9672;</span> Dedicated Account Manager</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13.5, lineHeight: 1.7, marginBottom: 22 }}>
                Your Agency plan includes a dedicated account manager for onboarding, strategy calls, and platform questions.
              </div>
              <a href="mailto:accounts@ophidianai.com?subject=Mercavex%20Agency%20Account"
                style={{ display: "inline-block", background: "linear-gradient(135deg,#1A8A3C,#4DFF8F)", color: "#fff", textDecoration: "none", borderRadius: 9, padding: "11px 22px", fontWeight: 700, fontSize: 13, fontFamily: "inherit", boxShadow: "0 3px 12px rgba(77,255,143,0.2)" }}>
                Contact Account Manager
              </a>
            </div>
          )}
          {isAgency && (
            <div style={{ ...S.section, borderColor: "rgba(99,102,241,0.2)" }}>
              <div style={S.sectionTitle}><span style={{ color: "#A5B4FC" }}>&#9675;</span> SLA Guarantee</div>
              {[
                { label: "Priority Email", value: "4-hour response" },
                { label: "Critical Issues", value: "1-hour escalation" },
                { label: "Uptime Target",  value: "99.9% SLA" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>{label}</span>
                  <span style={{ color: "#A5B4FC", fontWeight: 700, fontSize: 13 }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TEAM MEMBERS TAB */}
      {tab === "team" && isAgency && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={S.section}>
            <div style={S.sectionTitle}>
              <span style={{ color: "#4DFF8F" }}>&#9672;</span> Team Members
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 600 }}>({teamMembers.length}/4)</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, lineHeight: 1.65, marginBottom: 20 }}>
              Invite up to 4 colleagues. Members share your Ayrshare connection and campaign workspace.
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com"
                onKeyDown={e => e.key === "Enter" && inviteMember()}
                style={{ ...S.inp, flex: 1, minWidth: 180, marginBottom: 0 }} />
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(46,204,113,0.18)", borderRadius: 10, padding: "12px 14px", color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "inherit", outline: "none", cursor: "pointer", colorScheme: "dark" }}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={inviteMember} disabled={inviteBusy || teamMembers.length >= 4} style={{ ...S.btn, padding: "11px 20px", flexShrink: 0 }}>
                {inviteBusy ? "Inviting…" : "+ Invite"}
              </button>
            </div>
            {teamMsg && <div style={S.msg(teamMsg.type)}>{teamMsg.text}</div>}
            {teamLoading
              ? <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, padding: "20px 0", textAlign: "center" }}>Loading team…</div>
              : teamMembers.length === 0
                ? <div style={{ textAlign: "center", padding: "28px 20px", border: "1.5px dashed rgba(255,255,255,0.08)", borderRadius: 12 }}>
                    <div style={{ fontSize: 30, marginBottom: 8 }}>&#128101;</div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>No team members yet. Invite your first colleague above.</div>
                  </div>
                : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {teamMembers.map(m => (
                      <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "13px 16px", flexWrap: "wrap" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(46,204,113,0.12)", border: "1px solid rgba(46,204,113,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2ECC71", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                          {m.member_email.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <div style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 13 }}>{m.member_email}</div>
                          <span style={{ background: m.status === "active" ? "rgba(46,204,113,0.1)" : "rgba(255,255,255,0.05)", color: m.status === "active" ? "#2ECC71" : "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: 1.2, padding: "2px 8px", borderRadius: 20, marginTop: 4, display: "inline-block" }}>
                            {m.status.toUpperCase()}
                          </span>
                        </div>
                        <select value={m.role} onChange={e => updateRole(m.id, e.target.value)}
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer", colorScheme: "dark" }}>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button onClick={() => removeMember(m.id)} style={{ background: "rgba(255,59,48,0.08)", color: "#FCA5A5", border: "1px solid rgba(255,59,48,0.15)", borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
            }
          </div>
          <div style={S.section}>
            <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 }}>Role Permissions</div>
            {[
              { role: "Admin",  perms: ["Create & manage campaigns", "Post to all platforms", "View analytics", "Manage team members"] },
              { role: "Member", perms: ["Create & manage campaigns", "Post to all platforms", "View analytics"] },
            ].map(({ role, perms }) => (
              <div key={role} style={{ marginBottom: 16 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>{role}</div>
                {perms.map(p => (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 5 }}>
                    <span style={{ color: "#2ECC71", fontWeight: 700 }}>&#10003;</span> {p}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}




// ─────────────────────────────────────────────
//  AGENCY WORKSPACE SCREEN
// ─────────────────────────────────────────────
function AgencyScreen({ user, session, userPlan, campaigns = [] }) {
  const [tab, setTab]               = useState("team");
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]   = useState("member");
  const [inviteBusy, setInviteBusy]   = useState(false);
  const [teamMsg, setTeamMsg]         = useState(null);

  // Brand workspace
  const [brand, setBrand] = useState({
    brand_name: "", tagline: "", brand_voice: "professional",
    audience: "", key_messages: ["", "", ""], hashtag_sets: [], notes: "",
  });
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandBusy, setBrandBusy]       = useState(false);
  const [brandMsg, setBrandMsg]         = useState(null);
  const [newHashtagSet, setNewHashtagSet] = useState({ name: "", tags: "" });

  // Brief Library
  const [briefs, setBriefs]           = useState([]);
  const [briefsLoading, setBriefsLoading] = useState(false);
  const [briefForm, setBriefForm]     = useState({ title: "", description: "", objective: "", tone: "professional", tags: "" });
  const [briefFormOpen, setBriefFormOpen] = useState(false);
  const [briefBusy, setBriefBusy]     = useState(false);
  const [briefMsg, setBriefMsg]       = useState(null);

  // Activity Feed
  const [activity, setActivity]       = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Approval Queue
  const [approvals, setApprovals]     = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalBusy, setApprovalBusy] = useState(null);

  // Content Calendar
  const [calMonth, setCalMonth]       = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });

  const authH = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` });

  // ── Data loaders ─────────────────────────────
  const loadTeam = async () => {
    setTeamLoading(true);
    try {
      const r = await fetch(`${BACKEND_URL}/team`, { headers: authH() });
      const d = await r.json();
      setTeamMembers(d.members || []);
    } catch (e) {}
    setTeamLoading(false);
  };

  const loadBrand = async () => {
    setBrandLoading(true);
    try {
      const r = await fetch(`${BACKEND_URL}/agency/workspace`, { headers: authH() });
      const d = await r.json();
      if (d.workspace) setBrand(prev => ({ ...prev, ...d.workspace }));
    } catch (e) {}
    setBrandLoading(false);
  };

  const loadBriefs = async () => {
    setBriefsLoading(true);
    try {
      const r = await fetch(`${BACKEND_URL}/agency/briefs`, { headers: authH() });
      const d = await r.json();
      setBriefs(Array.isArray(d) ? d : []);
    } catch (e) {}
    setBriefsLoading(false);
  };

  const loadActivity = async () => {
    setActivityLoading(true);
    try {
      const r = await fetch(`${BACKEND_URL}/agency/activity`, { headers: authH() });
      const d = await r.json();
      setActivity(Array.isArray(d) ? d : []);
    } catch (e) {}
    setActivityLoading(false);
  };

  const loadApprovals = async () => {
    setApprovalsLoading(true);
    try {
      const r = await fetch(`${BACKEND_URL}/agency/approvals`, { headers: authH() });
      const d = await r.json();
      setApprovals(Array.isArray(d) ? d : []);
    } catch (e) {}
    setApprovalsLoading(false);
  };

  // ── Team actions ──────────────────────────────
  const invite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteBusy(true); setTeamMsg(null);
    try {
      const r = await fetch(`${BACKEND_URL}/team/invite`, {
        method: "POST", headers: authH(),
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const d = await r.json();
      if (d.status !== "ok") throw new Error(d.message);
      setTeamMsg({ type: "success", text: d.message });
      setInviteEmail(""); await loadTeam();
    } catch (e) { setTeamMsg({ type: "error", text: e.message }); }
    setInviteBusy(false);
  };

  const removeMember = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/team/${id}`, { method: "DELETE", headers: authH() });
      setTeamMembers(p => p.filter(m => m.id !== id));
    } catch (e) {}
  };

  const updateRole = async (id, role) => {
    try {
      await fetch(`${BACKEND_URL}/team/${id}`, { method: "PATCH", headers: authH(), body: JSON.stringify({ role }) });
      setTeamMembers(p => p.map(m => m.id === id ? { ...m, role } : m));
    } catch (e) {}
  };

  // ── Brand actions ─────────────────────────────
  const saveBrand = async () => {
    setBrandBusy(true); setBrandMsg(null);
    try {
      const r = await fetch(`${BACKEND_URL}/agency/workspace`, {
        method: "PUT", headers: authH(), body: JSON.stringify(brand),
      });
      const d = await r.json();
      if (d.status !== "ok") throw new Error(d.message);
      setBrandMsg({ type: "success", text: "Brand workspace saved." });
    } catch (e) { setBrandMsg({ type: "error", text: e.message }); }
    setBrandBusy(false);
  };

  const addHashtagSet = () => {
    if (!newHashtagSet.name.trim() || !newHashtagSet.tags.trim()) return;
    setBrand(p => ({ ...p, hashtag_sets: [...(p.hashtag_sets || []), { name: newHashtagSet.name.trim(), tags: newHashtagSet.tags.trim() }] }));
    setNewHashtagSet({ name: "", tags: "" });
  };

  const removeHashtagSet = (i) => setBrand(p => ({ ...p, hashtag_sets: p.hashtag_sets.filter((_, idx) => idx !== i) }));

  // ── Brief actions ─────────────────────────────
  const saveBreif = async () => {
    if (!briefForm.title.trim()) return;
    setBriefBusy(true); setBriefMsg(null);
    try {
      const r = await fetch(`${BACKEND_URL}/agency/briefs`, {
        method: "POST", headers: authH(),
        body: JSON.stringify({ ...briefForm, tags: briefForm.tags.split(",").map(t => t.trim()).filter(Boolean) }),
      });
      const d = await r.json();
      if (d.status !== "ok") throw new Error(d.message);
      setBriefMsg({ type: "success", text: "Brief saved to library." });
      setBriefForm({ title: "", description: "", objective: "", tone: "professional", tags: "" });
      setBriefFormOpen(false);
      await loadBriefs();
    } catch (e) { setBriefMsg({ type: "error", text: e.message }); }
    setBriefBusy(false);
  };

  const deleteBrief = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/agency/briefs/${id}`, { method: "DELETE", headers: authH() });
      setBriefs(p => p.filter(b => b.id !== id));
    } catch (e) {}
  };

  // ── Approval actions ──────────────────────────
  const decideApproval = async (id, status) => {
    setApprovalBusy(id);
    try {
      const r = await fetch(`${BACKEND_URL}/agency/approvals/${id}`, {
        method: "PATCH", headers: authH(), body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (d.status !== "ok") throw new Error(d.message);
      setApprovals(p => p.filter(a => a.id !== id));
    } catch (e) {}
    setApprovalBusy(null);
  };

  // ── Effects ───────────────────────────────────
  useEffect(() => { if (session) loadTeam(); }, [session]);
  useEffect(() => {
    if (!session) return;
    if (tab === "brand")    loadBrand();
    if (tab === "briefs")   loadBriefs();
    if (tab === "activity") loadActivity();
    if (tab === "approvals") loadApprovals();
  }, [tab, session]);

  // ── Styles ────────────────────────────────────
  const A = {
    card:  { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(77,255,143,0.1)", borderRadius: 16, padding: "24px 26px", marginBottom: 16 },
    label: { display: "block", color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 800, letterSpacing: 2.5, marginBottom: 8, textTransform: "uppercase" },
    inp:   { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(77,255,143,0.15)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 13.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
    btn:   { background: "linear-gradient(135deg,#0F5C28 0%,#2ECC71 100%)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 3px 14px rgba(46,204,113,0.25)" },
    ghost: { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
    msg:   (t) => ({ background: t === "success" ? "rgba(46,204,113,0.08)" : "rgba(255,59,48,0.08)", border: `1px solid ${t === "success" ? "rgba(46,204,113,0.2)" : "rgba(255,59,48,0.2)"}`, borderRadius: 9, padding: "10px 14px", color: t === "success" ? "#86EFAC" : "#FCA5A5", fontSize: 13, marginTop: 10 }),
    title: { color: "#fff", fontWeight: 800, fontSize: 15.5, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 },
  };

  const VOICE_OPTIONS = [
    { id: "professional", label: "Professional", desc: "Authoritative & polished" },
    { id: "casual",       label: "Casual",       desc: "Friendly & approachable" },
    { id: "bold",         label: "Bold",         desc: "Confident & assertive" },
    { id: "playful",      label: "Playful",      desc: "Fun & energetic" },
    { id: "luxury",       label: "Luxury",       desc: "Refined & premium" },
  ];

  const TONE_OPTS = ["professional","casual","bold","playful","luxury","urgent","inspirational"];

  const seatCount = teamMembers.length;

  // ── Calendar helpers ─────────────────────────
  const calDays = (() => {
    const { y, m } = calMonth;
    const first = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    return { first, total };
  })();

  const campaignsByDay = (() => {
    const map = {};
    campaigns.forEach(c => {
      if (!c.scheduled_at) return;
      const d = new Date(c.scheduled_at);
      if (d.getFullYear() === calMonth.y && d.getMonth() === calMonth.m) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(c);
      }
    });
    return map;
  })();

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const TABS = [
    { id: "team",      label: "Team",            icon: "👥" },
    { id: "brand",     label: "Brand Workspace", icon: "✦"  },
    { id: "calendar",  label: "Content Calendar",icon: "📅" },
    { id: "approvals", label: "Approvals",       icon: "✅", badge: approvals.length || null },
    { id: "briefs",    label: "Brief Library",   icon: "📁" },
    { id: "activity",  label: "Activity Feed",   icon: "📊" },
  ];

  return (
    <div className="anim">
      {/* ── Hero header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1.5, fontFamily: "'DM Sans',sans-serif", lineHeight: 1, background: "linear-gradient(135deg,#2ECC71,#4DFF8F)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Agency</div>
              <span style={{ background: "linear-gradient(135deg,#0F5C28,#2ECC71)", color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: 2, padding: "3px 10px", borderRadius: 20 }}>HQ</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 14 }}>Your team's dedicated command centre.</div>
          </div>
          {/* Seat meter */}
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(77,255,143,0.15)", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#4DFF8F", fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{seatCount}</div>
              <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 3 }}>Active</div>
            </div>
            <div style={{ width: 1, height: 34, background: "rgba(255,255,255,0.07)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 22, fontWeight: 800, lineHeight: 1 }}>4</div>
              <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 3 }}>Seats</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width: 28, height: 6, borderRadius: 3, background: i < seatCount ? "linear-gradient(90deg,#1A8A3C,#4DFF8F)" : "rgba(255,255,255,0.08)" }} />
              ))}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 2, marginTop: 24, borderBottom: "1px solid rgba(255,255,255,0.06)", marginLeft: -28, marginRight: -28, paddingLeft: 28, overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
              borderBottom: `2px solid ${tab === t.id ? "#4DFF8F" : "transparent"}`,
              color: tab === t.id ? "#4DFF8F" : "rgba(255,255,255,0.3)",
              padding: "10px 16px", fontSize: 12.5, fontWeight: 700, letterSpacing: 0.2,
              marginBottom: -1, transition: "all 0.18s", display: "flex", alignItems: "center", gap: 7,
              whiteSpace: "nowrap",
            }}>
              <span style={{ fontSize: 11 }}>{t.icon}</span>{t.label}
              {t.badge ? <span style={{ background: "#4DFF8F", color: "#0A1628", fontSize: 9, fontWeight: 900, borderRadius: 99, padding: "1px 6px", marginLeft: 2 }}>{t.badge}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          TEAM TAB
      ══════════════════════════════════════ */}
      {tab === "team" && (
        <div>
          <div style={A.card}>
            <div style={A.title}><span style={{ color: "#4DFF8F" }}>＋</span> Invite a Team Member</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>Members share your Ayrshare workspace and can create and publish campaigns. Up to 4 seats included.</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && invite()} placeholder="colleague@company.com" style={{ ...A.inp, flex: 1, minWidth: 200 }} />
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(77,255,143,0.15)", borderRadius: 10, padding: "12px 14px", color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "inherit", outline: "none", cursor: "pointer", colorScheme: "dark", flexShrink: 0 }}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={invite} disabled={inviteBusy || seatCount >= 4} style={{ ...A.btn, flexShrink: 0 }}>
                {inviteBusy ? "Sending…" : "Send Invite"}
              </button>
            </div>
            {teamMsg && <div style={A.msg(teamMsg.type)}>{teamMsg.text}</div>}
          </div>

          <div style={A.card}>
            <div style={A.title}>
              <span style={{ color: "#4DFF8F" }}>👥</span> Team Members
              <span style={{ background: "rgba(77,255,143,0.1)", border: "1px solid rgba(77,255,143,0.2)", color: "#4DFF8F", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "2px 9px", borderRadius: 20 }}>{seatCount}/4 seats</span>
            </div>
            {teamLoading ? (
              <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, textAlign: "center", padding: "30px 0" }}>Loading team…</div>
            ) : teamMembers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", border: "1.5px dashed rgba(77,255,143,0.1)", borderRadius: 12 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>No team members yet</div>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Invite your first colleague above to get started.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {teamMembers.map(m => {
                  const email = m.member_email || m.invitee_email || "";
                  const initial = email.charAt(0).toUpperCase();
                  const isActive = m.status === "accepted" || m.status === "active";
                  return (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(77,255,143,0.07)", borderRadius: 12, padding: "14px 18px", flexWrap: "wrap" }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#0F5C28,#2ECC71)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#fff", flexShrink: 0 }}>{initial}</div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ color: "#fff", fontWeight: 600, fontSize: 13.5 }}>{email}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                          <span style={{ background: isActive ? "rgba(46,204,113,0.12)" : "rgba(255,255,255,0.06)", color: isActive ? "#86EFAC" : "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "2px 8px", borderRadius: 20 }}>
                            {isActive ? "✓ ACTIVE" : "⏳ PENDING"}
                          </span>
                          <span style={{ color: m.role === "admin" ? "#FCD34D" : "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
                            {m.role === "admin" ? "★ Admin" : "Member"}
                          </span>
                        </div>
                      </div>
                      <select value={m.role} onChange={e => updateRole(m.id, e.target.value)}
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 12px", color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer", colorScheme: "dark", flexShrink: 0 }}>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button onClick={() => removeMember(m.id)} style={{ background: "rgba(255,59,48,0.07)", color: "rgba(255,100,100,0.7)", border: "1px solid rgba(255,59,48,0.15)", borderRadius: 8, padding: "7px 13px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>Remove</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={A.card}>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 18 }}>Role Permissions</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { role: "Admin",  color: "#FCD34D", icon: "★", perms: ["Create & manage campaigns", "Post to all platforms", "View analytics", "Invite & manage team members", "Edit brand workspace", "Approve & reject campaigns"] },
                { role: "Member", color: "#86EFAC", icon: "◈", perms: ["Create & manage campaigns", "Post to all platforms", "View analytics", "Submit campaigns for approval"] },
              ].map(({ role, color, icon, perms }) => (
                <div key={role} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ color, fontWeight: 800, fontSize: 13.5, marginBottom: 12 }}>{icon} {role}</div>
                  {perms.map(p => (
                    <div key={p} style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "rgba(255,255,255,0.45)", fontSize: 12.5, marginBottom: 7, lineHeight: 1.4 }}>
                      <span style={{ color: "#4DFF8F", flexShrink: 0, marginTop: 1 }}>✓</span> {p}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          BRAND WORKSPACE TAB
      ══════════════════════════════════════ */}
      {tab === "brand" && (
        <div>
          {brandLoading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Loading workspace…</div>
          ) : (
            <>
              <div style={A.card}>
                <div style={A.title}><span style={{ color: "#4DFF8F" }}>✦</span> Brand Identity</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 20 }}>Shared across your whole team. Keeps every campaign consistent.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={A.label}>Brand Name</label>
                    <input value={brand.brand_name} onChange={e => setBrand(p => ({ ...p, brand_name: e.target.value }))} placeholder="e.g. OphidianAI" style={A.inp} />
                  </div>
                  <div>
                    <label style={A.label}>Tagline</label>
                    <input value={brand.tagline} onChange={e => setBrand(p => ({ ...p, tagline: e.target.value }))} placeholder="e.g. AI that works for you" style={A.inp} />
                  </div>
                </div>
                <label style={A.label}>Target Audience</label>
                <textarea value={brand.audience} onChange={e => setBrand(p => ({ ...p, audience: e.target.value }))} placeholder="Describe your ideal customer — industry, seniority, pain points, goals…" rows={3} style={{ ...A.inp, resize: "vertical", lineHeight: 1.6 }} />
              </div>

              <div style={A.card}>
                <div style={A.title}><span style={{ color: "#4DFF8F" }}>◈</span> Brand Voice</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                  {VOICE_OPTIONS.map(v => (
                    <button key={v.id} onClick={() => setBrand(p => ({ ...p, brand_voice: v.id }))}
                      style={{ background: brand.brand_voice === v.id ? "linear-gradient(135deg,#0F5C28,#2ECC71)" : "rgba(255,255,255,0.04)", border: `1px solid ${brand.brand_voice === v.id ? "rgba(77,255,143,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.18s" }}>
                      <div style={{ color: brand.brand_voice === v.id ? "#fff" : "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 13 }}>{v.label}</div>
                      <div style={{ color: brand.brand_voice === v.id ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 2 }}>{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={A.card}>
                <div style={A.title}><span style={{ color: "#4DFF8F" }}>◉</span> Key Messages</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 16 }}>Up to 3 core messages the AI will weave into your campaigns.</div>
                {(brand.key_messages || ["","",""]).map((msg, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ color: "#4DFF8F", fontWeight: 800, fontSize: 12, width: 18, flexShrink: 0 }}>0{i+1}</span>
                    <input value={msg} onChange={e => {
                      const updated = [...(brand.key_messages || ["","",""])];
                      updated[i] = e.target.value;
                      setBrand(p => ({ ...p, key_messages: updated }));
                    }} placeholder={`Message ${i+1} — e.g. "Trusted by 500+ businesses"`} style={{ ...A.inp, marginBottom: 0 }} />
                  </div>
                ))}
              </div>

              <div style={A.card}>
                <div style={A.title}><span style={{ color: "#4DFF8F" }}>#</span> Hashtag Sets</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 16 }}>Save named sets your team can quickly reference when building campaigns.</div>
                {(brand.hashtag_sets || []).length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    {(brand.hashtag_sets || []).map((set, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(77,255,143,0.07)", borderRadius: 10, padding: "12px 16px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: "#4DFF8F", fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>{set.name}</div>
                          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.5 }}>{set.tags}</div>
                        </div>
                        <button onClick={() => removeHashtagSet(i)} style={{ background: "none", border: "none", color: "rgba(255,100,100,0.45)", fontSize: 13, cursor: "pointer", padding: "2px 6px", flexShrink: 0 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input value={newHashtagSet.name} onChange={e => setNewHashtagSet(p => ({ ...p, name: e.target.value }))} placeholder="Set name (e.g. Product Launch)" style={{ ...A.inp, flex: "0 0 180px" }} />
                  <input value={newHashtagSet.tags} onChange={e => setNewHashtagSet(p => ({ ...p, tags: e.target.value }))} placeholder="#tag1 #tag2 #tag3" style={{ ...A.inp, flex: 1, minWidth: 140 }} />
                  <button onClick={addHashtagSet} style={{ ...A.ghost, flexShrink: 0 }}>+ Add</button>
                </div>
              </div>

              <div style={A.card}>
                <div style={A.title}><span style={{ color: "#4DFF8F" }}>📝</span> Team Notes</div>
                <textarea value={brand.notes} onChange={e => setBrand(p => ({ ...p, notes: e.target.value }))} placeholder="Shared notes, reminders, links, or anything the team should know…" rows={4} style={{ ...A.inp, resize: "vertical", lineHeight: 1.65 }} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                <button onClick={saveBrand} disabled={brandBusy} style={A.btn}>
                  {brandBusy ? "Saving…" : "✓ Save Brand Workspace"}
                </button>
                {brandMsg && <span style={{ color: brandMsg.type === "success" ? "#86EFAC" : "#FCA5A5", fontSize: 13, fontWeight: 600 }}>{brandMsg.text}</span>}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          CONTENT CALENDAR TAB
      ══════════════════════════════════════ */}
      {tab === "calendar" && (() => {
        const today = new Date();
        const { first, total } = calDays;
        const dayCells = [];
        for (let i = 0; i < first; i++) dayCells.push(null);
        for (let d = 1; d <= total; d++) dayCells.push(d);
        return (
          <div>
            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <button onClick={() => setCalMonth(p => { const d = new Date(p.y, p.m - 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })} style={{ ...A.ghost, padding: "8px 16px" }}>← Prev</button>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>{MONTH_NAMES[calMonth.m]} {calMonth.y}</div>
              <button onClick={() => setCalMonth(p => { const d = new Date(p.y, p.m + 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })} style={{ ...A.ghost, padding: "8px 16px" }}>Next →</button>
            </div>

            {/* Day-of-week header */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                <div key={d} style={{ textAlign: "center", color: "rgba(255,255,255,0.28)", fontSize: 10, fontWeight: 800, letterSpacing: 1.5, padding: "6px 0" }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {dayCells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const isToday = today.getDate() === day && today.getMonth() === calMonth.m && today.getFullYear() === calMonth.y;
                const posts = campaignsByDay[day] || [];
                return (
                  <div key={day} style={{ minHeight: 88, background: isToday ? "rgba(77,255,143,0.07)" : "rgba(255,255,255,0.02)", border: `1px solid ${isToday ? "rgba(77,255,143,0.3)" : "rgba(255,255,255,0.05)"}`, borderRadius: 10, padding: "8px 9px", overflow: "hidden" }}>
                    <div style={{ color: isToday ? "#4DFF8F" : "rgba(255,255,255,0.45)", fontWeight: isToday ? 800 : 600, fontSize: 12, marginBottom: 5 }}>{day}</div>
                    {posts.slice(0, 3).map((c, pi) => (
                      <div key={pi} style={{ background: "rgba(77,255,143,0.12)", border: "1px solid rgba(77,255,143,0.2)", borderRadius: 5, padding: "2px 6px", marginBottom: 3, overflow: "hidden" }}>
                        <div style={{ color: "#4DFF8F", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name || "Campaign"}</div>
                      </div>
                    ))}
                    {posts.length > 3 && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600 }}>+{posts.length - 3} more</div>}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                {campaigns.filter(c => c.scheduled_at).length === 0
                  ? "No scheduled campaigns. Schedule a campaign to see it appear on the calendar."
                  : `${campaigns.filter(c => { const d = new Date(c.scheduled_at); return d.getFullYear() === calMonth.y && d.getMonth() === calMonth.m; }).length} campaign(s) this month`
                }
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════
          APPROVAL QUEUE TAB
      ══════════════════════════════════════ */}
      {tab === "approvals" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={A.title}>✅ Approval Queue</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, lineHeight: 1.6 }}>
              Campaigns submitted for review appear here. Approve to allow publishing, or reject with a note.
            </div>
          </div>

          {approvalsLoading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)" }}>Loading queue…</div>
          ) : approvals.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", border: "1.5px dashed rgba(77,255,143,0.1)", borderRadius: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>✅</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Queue is clear</div>
              <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No campaigns are awaiting approval right now.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {approvals.map(c => (
                <div key={c.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,193,7,0.2)", borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>{c.name || "Untitled Campaign"}</div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12.5, marginBottom: 8 }}>
                        {c.description || "No description provided."}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ background: "rgba(255,193,7,0.1)", color: "#FCD34D", fontSize: 10, fontWeight: 700, letterSpacing: 1.2, padding: "2px 9px", borderRadius: 20 }}>⏳ PENDING</span>
                        {c.created_at && <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>{new Date(c.created_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => decideApproval(c.id, "rejected")} disabled={approvalBusy === c.id} style={{ background: "rgba(255,59,48,0.08)", color: "#FCA5A5", border: "1px solid rgba(255,59,48,0.2)", borderRadius: 9, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                        {approvalBusy === c.id ? "…" : "✕ Reject"}
                      </button>
                      <button onClick={() => decideApproval(c.id, "approved")} disabled={approvalBusy === c.id} style={{ background: "linear-gradient(135deg,#0F5C28,#2ECC71)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                        {approvalBusy === c.id ? "…" : "✓ Approve"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          BRIEF LIBRARY TAB
      ══════════════════════════════════════ */}
      {tab === "briefs" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={A.title}>📁 Brief Library</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Save reusable campaign briefs your team can launch from in one click.</div>
            </div>
            <button onClick={() => setBriefFormOpen(p => !p)} style={A.btn}>
              {briefFormOpen ? "✕ Cancel" : "+ New Brief"}
            </button>
          </div>

          {/* Create form */}
          {briefFormOpen && (
            <div style={{ ...A.card, borderColor: "rgba(77,255,143,0.25)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={A.label}>Brief Title *</label>
                  <input value={briefForm.title} onChange={e => setBriefForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Q2 Product Launch" style={A.inp} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={A.label}>Description</label>
                  <textarea value={briefForm.description} onChange={e => setBriefForm(p => ({ ...p, description: e.target.value }))} placeholder="What's the campaign about? Context for your team…" rows={2} style={{ ...A.inp, resize: "vertical", lineHeight: 1.6 }} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={A.label}>Campaign Objective</label>
                  <input value={briefForm.objective} onChange={e => setBriefForm(p => ({ ...p, objective: e.target.value }))} placeholder="e.g. Drive holiday sales, grow email list, launch new product…" style={A.inp} />
                </div>
                <div>
                  <label style={A.label}>Default Tone</label>
                  <select value={briefForm.tone} onChange={e => setBriefForm(p => ({ ...p, tone: e.target.value }))}
                    style={{ ...A.inp, cursor: "pointer", colorScheme: "dark" }}>
                    {TONE_OPTS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={A.label}>Tags (comma-separated)</label>
                  <input value={briefForm.tags} onChange={e => setBriefForm(p => ({ ...p, tags: e.target.value }))} placeholder="e.g. seasonal, product, promo" style={A.inp} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={saveBreif} disabled={briefBusy || !briefForm.title.trim()} style={A.btn}>
                  {briefBusy ? "Saving…" : "Save Brief"}
                </button>
                {briefMsg && <span style={{ color: briefMsg.type === "success" ? "#86EFAC" : "#FCA5A5", fontSize: 13, fontWeight: 600 }}>{briefMsg.text}</span>}
              </div>
            </div>
          )}

          {briefsLoading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)" }}>Loading briefs…</div>
          ) : briefs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 20px", border: "1.5px dashed rgba(77,255,143,0.1)", borderRadius: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>No briefs yet</div>
              <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 13 }}>Create your first reusable campaign brief above.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {briefs.map(b => (
                <div key={b.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(77,255,143,0.1)", borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{b.title}</div>
                    <button onClick={() => deleteBrief(b.id)} style={{ background: "none", border: "none", color: "rgba(255,100,100,0.35)", fontSize: 14, cursor: "pointer", padding: 0, flexShrink: 0 }}>✕</button>
                  </div>
                  {b.description && <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 12.5, lineHeight: 1.55 }}>{b.description}</div>}
                  {b.objective && (
                    <div style={{ background: "rgba(77,255,143,0.06)", border: "1px solid rgba(77,255,143,0.12)", borderRadius: 8, padding: "7px 10px" }}>
                      <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 9.5, fontWeight: 800, letterSpacing: 1.5, marginBottom: 2 }}>OBJECTIVE</div>
                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12.5 }}>{b.objective}</div>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "2px 9px", borderRadius: 20, textTransform: "capitalize" }}>{b.tone}</span>
                    {(b.tags || []).map(t => (
                      <span key={t} style={{ background: "rgba(77,255,143,0.08)", color: "#86EFAC", fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          ACTIVITY FEED TAB
      ══════════════════════════════════════ */}
      {tab === "activity" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={A.title}>📊 Team Activity Feed</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>A real-time log of every action your team takes — campaigns, approvals, and team changes.</div>
          </div>

          {activityLoading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)" }}>Loading feed…</div>
          ) : activity.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", border: "1.5px dashed rgba(77,255,143,0.1)", borderRadius: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>No activity yet</div>
              <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 13 }}>Actions your team takes will appear here automatically.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {activity.map((a, i) => {
                const time = new Date(a.created_at);
                const label = time.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " + time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                return (
                  <div key={a.id || i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(77,255,143,0.08)", border: "1px solid rgba(77,255,143,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{a.icon || "◉"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#fff", fontSize: 13.5 }}>
                        <span style={{ fontWeight: 700, color: "#86EFAC" }}>{a.actor}</span>
                        <span style={{ color: "rgba(255,255,255,0.55)" }}> {a.action}</span>
                        {a.detail && <span style={{ color: "rgba(255,255,255,0.35)" }}> — {a.detail}</span>}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 11.5, marginTop: 3 }}>{label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  BILLING SCREEN
// ─────────────────────────────────────────────
const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    icon: "✦",
    color: "rgba(255,255,255,0.25)",
    glow: "rgba(255,255,255,0.05)",
    features: [
      "3 campaigns / month",
      "AI ad generation (3 variants)",
      "2 social platforms",
      "Campaign dashboard",
      "Basic analytics",
    ],
    missing: [
      "AI image generation",
      "AI video generation",
      "Unlimited platforms",
      "Team members",
      "Priority support",
    ],
    cta: "Current Plan",
    current: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/ month",
    icon: "◉",
    color: "#2ECC71",
    glow: "rgba(46,204,113,0.15)",
    badge: "Most Popular",
    features: [
      "25 campaigns / month",
      "AI ad generation (3 variants)",
      "All 10 social platforms",
      "AI image generation",
      "AI video generation",
      "Full analytics suite",
      "Standard export reports",
      "Priority support",
    ],
    missing: [
      "Unlimited campaigns",
      "Team members",
      "White-label reports",
    ],
    cta: "Upgrade to Pro",
    current: false,
  },
  {
    id: "business",
    name: "Business",
    price: "$49",
    period: "/ month",
    icon: "◆",
    color: "#F59E0B",
    glow: "rgba(245,158,11,0.12)",
    badge: "Best Value",
    features: [
      "Unlimited campaigns",
      "AI ad generation (3 variants)",
      "All 10 social platforms",
      "AI image generation",
      "AI video generation",
      "Full analytics suite",
      "Standard export reports",
      "Priority support",
    ],
    missing: [
      "Team members",
      "White-label reports",
    ],
    cta: "Upgrade to Business",
    current: false,
  },
  {
    id: "agency",
    name: "Agency",
    price: "$79",
    period: "/ month",
    icon: "◈",
    color: "#4DFF8F",
    glow: "rgba(77,255,143,0.12)",
    badge: "Full Suite",
    features: [
      "Everything in Business",
      "Up to 4 additional team members",
      "Role-based access control",
      "Shared Ayrshare workspace",
      "White-label client reports",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    missing: [],
    cta: "Upgrade to Agency",
    current: false,
  },
];

function BillingScreen({ user, session, userPlan, planPeriodEnd, hasStripeCustomer, campaignsUsed }) {
  const [billingMsg, setBillingMsg]     = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(null); // plan id being loaded
  const [portalLoading, setPortalLoading]     = useState(false);

  const authHdrs = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
  });

  const handleUpgrade = async (planId) => {
    setCheckoutLoading(planId);
    setBillingMsg(null);
    try {
      const resp = await fetch(`${BACKEND_URL}/billing/create-checkout`, {
        method: "POST",
        headers: authHdrs(),
        body: JSON.stringify({ plan: planId }),
      });
      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url; // redirect to Stripe Checkout
      } else {
        setBillingMsg({ type: "error", text: data.message || "Unable to start checkout. Please try again." });
      }
    } catch (e) {
      setBillingMsg({ type: "error", text: "Checkout error: " + e.message });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    setBillingMsg(null);
    try {
      const resp = await fetch(`${BACKEND_URL}/billing/create-portal`, {
        method: "POST",
        headers: authHdrs(),
      });
      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBillingMsg({ type: "error", text: data.message || "Could not open billing portal." });
      }
    } catch (e) {
      setBillingMsg({ type: "error", text: "Portal error: " + e.message });
    } finally {
      setPortalLoading(false);
    }
  };

  const activePlan  = userPlan || "free";
  const periodLabel = planPeriodEnd
    ? new Date(planPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  // Resolve PLANS with current plan as active
  const resolvedPlans = PLANS.map(p => ({ ...p, current: p.id === activePlan }));
  const usageLimits = {
    free:     { campaigns: 3,   platforms: 2  },
    pro:      { campaigns: 25,  platforms: 10 },
    business: { campaigns: "∞", platforms: 10 },
    agency:   { campaigns: "∞", platforms: 10 },
  }[activePlan] || { campaigns: 3, platforms: 2 };

  return (
    <div style={{ animation: "up 0.35s ease both" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>
          Plans &amp;<br /><span style={{ color: "#2ECC71" }}>Billing.</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 14, marginTop: 8 }}>
          Choose the plan that fits your business. Upgrade anytime — no lock-in.
        </div>
      </div>

      {billingMsg && (
        <div style={{ background: billingMsg.type === "error" ? "rgba(239,68,68,0.08)" : "rgba(59,130,246,0.08)", border: `1px solid ${billingMsg.type === "error" ? "rgba(239,68,68,0.25)" : "rgba(59,130,246,0.25)"}`, borderRadius: 10, padding: "13px 16px", color: billingMsg.type === "error" ? "#FCA5A5" : "#93C5FD", fontSize: 13, lineHeight: 1.65, marginBottom: 20 }}>
          {billingMsg.text}
        </div>
      )}

      {/* ── Plan status banner (paid plans) ── */}
      {activePlan !== "free" && (
        <div style={{ background: "rgba(46,204,113,0.06)", border: "1px solid rgba(46,204,113,0.22)", borderRadius: 14, padding: "16px 22px", marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#2ECC71", fontWeight: 800, fontSize: 13, marginBottom: 3 }}>
              ✓ {{ free: "Free", pro: "Pro", business: "Business", agency: "Agency" }[activePlan] || activePlan} Plan — Active
            </div>
            {periodLabel && (
              <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 12.5 }}>
                Renews {periodLabel}
              </div>
            )}
          </div>
          <button
            onClick={handleManageBilling}
            disabled={portalLoading}
            style={{ background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.3)", color: "#2ECC71", borderRadius: 9, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: portalLoading ? 0.6 : 1 }}>
            {portalLoading ? "Loading…" : "Manage Billing →"}
          </button>
        </div>
      )}

      {/* ── Current usage summary ── */}
      <div style={{ background: "rgba(46,204,113,0.05)", border: "1px solid rgba(46,204,113,0.15)", borderRadius: 16, padding: "22px 26px", marginBottom: 24 }}>
        <div style={{ color: "#2ECC71", fontSize: 10, fontWeight: 800, letterSpacing: 2.5, marginBottom: 16 }}>YOUR PLAN LIMITS</div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>

          {/* Campaigns — tracked & enforced */}
          <div style={{ minWidth: 110 }}>
            <div style={{ color: "rgba(255,255,255,0.32)", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>CAMPAIGNS / MO</div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 22 }}>
              {activePlan === "free"
                ? <>{campaignsUsed || 0}<span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 600 }}>/{usageLimits.campaigns}</span></>
                : activePlan === "pro"
                  ? <>{campaignsUsed || 0}<span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 600 }}>/{usageLimits.campaigns}</span></>
                  : <span style={{ color: "#2ECC71" }}>∞</span>
              }
            </div>
            {(activePlan === "free" || activePlan === "pro") && (
              <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.08)", marginTop: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(((campaignsUsed || 0) / usageLimits.campaigns) * 100, 100)}%`, background: (campaignsUsed || 0) >= usageLimits.campaigns ? "linear-gradient(90deg,#ef4444,#f87171)" : "linear-gradient(90deg,#1A8A3C,#2ECC71)", borderRadius: 99, transition: "width 0.6s ease" }} />
              </div>
            )}
          </div>

          {/* Social Platforms */}
          <div style={{ minWidth: 110 }}>
            <div style={{ color: "rgba(255,255,255,0.32)", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>PLATFORMS</div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 22 }}>
              {activePlan === "free"
                ? <><span style={{ color: "rgba(255,255,255,0.55)", fontSize: 16 }}>up to</span> {usageLimits.platforms}</>
                : <span style={{ color: "#2ECC71" }}>All 10</span>
              }
            </div>
          </div>

          {/* AI Visuals */}
          <div style={{ minWidth: 110 }}>
            <div style={{ color: "rgba(255,255,255,0.32)", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>AI VISUALS</div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 22 }}>
              {activePlan === "free"
                ? <span style={{ color: "rgba(255,59,48,0.8)", fontSize: 16, fontWeight: 700 }}>Locked</span>
                : <span style={{ color: "#2ECC71" }}>Image + Video</span>
              }
            </div>
          </div>

          {/* Team Members */}
          <div style={{ minWidth: 110 }}>
            <div style={{ color: "rgba(255,255,255,0.32)", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>TEAM MEMBERS</div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 22 }}>
              {activePlan === "agency"
                ? <span style={{ color: "#4DFF8F" }}>Up to 4</span>
                : <span style={{ color: "rgba(255,59,48,0.8)", fontSize: 16, fontWeight: 700 }}>Locked</span>
              }
            </div>
          </div>

          {/* Analytics */}
          <div style={{ minWidth: 110 }}>
            <div style={{ color: "rgba(255,255,255,0.32)", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>ANALYTICS</div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 22 }}>
              {activePlan === "free"
                ? <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: 700 }}>Basic</span>
                : <span style={{ color: "#2ECC71" }}>Full Suite</span>
              }
            </div>
          </div>

        </div>
        {activePlan === "free" && (
          <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 12, marginTop: 16 }}>
            Campaign limit resets at the start of each billing period. Upgrade to Pro for 25 campaigns, or Business for unlimited.
          </div>
        )}
        {activePlan === "pro" && (
          <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 12, marginTop: 16 }}>
            Running out of campaigns? Upgrade to Business for unlimited campaigns every month.
          </div>
        )}
      </div>

      {/* ── Plan cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
        {resolvedPlans.map((plan, i) => (
          <div key={plan.id} style={{
            background: plan.current ? `${plan.glow}` : "rgba(255,255,255,0.02)",
            border: `1.5px solid ${plan.current ? `${plan.color}50` : "rgba(255,255,255,0.07)"}`,
            borderRadius: 18,
            padding: "28px 24px",
            position: "relative",
            animation: `up 0.4s ${i * 0.08}s ease both`,
            opacity: 0,
            transition: "border-color 0.25s",
          }}>
            {plan.badge && (
              <div style={{ position: "absolute", top: -11, left: 24, background: `linear-gradient(135deg, #1A8A3C, #2ECC71)`, color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: 1.5, padding: "3px 12px", borderRadius: 20, boxShadow: "0 2px 10px rgba(46,204,113,0.3)" }}>
                {plan.badge.toUpperCase()}
              </div>
            )}
            {plan.current && (
              <div style={{ position: "absolute", top: -11, right: 24, background: "rgba(46,204,113,0.2)", border: "1px solid rgba(46,204,113,0.4)", color: "#2ECC71", fontSize: 10, fontWeight: 800, letterSpacing: 1.5, padding: "3px 12px", borderRadius: 20 }}>
                ACTIVE
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ color: plan.color, fontSize: 16 }}>{plan.icon}</span>
              <span style={{ color: plan.color, fontWeight: 800, fontSize: 16, letterSpacing: -0.3 }}>{plan.name}</span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 36, letterSpacing: -1.5 }}>{plan.price}</span>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginLeft: 4 }}>{plan.period}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9, color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                  <span style={{ color: plan.color, fontWeight: 800, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                  {f}
                </div>
              ))}
              {plan.missing.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9, color: "rgba(255,255,255,0.22)", fontSize: 13 }}>
                  <span style={{ color: "rgba(255,255,255,0.18)", fontWeight: 800, fontSize: 13, flexShrink: 0, marginTop: 1 }}>—</span>
                  {f}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                if (plan.current) return;
                if (plan.id === "free") return; // downgrade via portal
                handleUpgrade(plan.id);
              }}
              disabled={plan.current || checkoutLoading === plan.id}
              style={{
                width: "100%",
                background: plan.current
                  ? "rgba(255,255,255,0.05)"
                  : `linear-gradient(135deg, #1A8A3C 0%, ${plan.color} 100%)`,
                color: plan.current ? "rgba(255,255,255,0.35)" : "#fff",
                border: plan.current ? "1px solid rgba(255,255,255,0.1)" : "none",
                borderRadius: 10,
                padding: "13px 0",
                fontWeight: 700,
                fontSize: 13.5,
                cursor: plan.current ? "default" : "pointer",
                fontFamily: "inherit",
                boxShadow: plan.current ? "none" : "0 4px 16px rgba(46,204,113,0.22)",
                letterSpacing: 0.2,
                opacity: checkoutLoading && checkoutLoading !== plan.id ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}>
              {checkoutLoading === plan.id
                ? "Redirecting…"
                : plan.current
                  ? "✓ " + plan.cta
                  : plan.cta + " →"}
            </button>
          </div>
        ))}
      </div>

      {/* ── Secure payment badge ── */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 24px", display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
          🔒
        </div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Secure Payments via Stripe</div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, lineHeight: 1.6 }}>
            All payments are processed securely by Stripe. We never store your card details. Cancel anytime from the billing portal.
          </div>
        </div>
        {hasStripeCustomer && (
          <button
            onClick={handleManageBilling}
            disabled={portalLoading}
            style={{ marginLeft: "auto", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#A5B4FC", borderRadius: 9, padding: "9px 16px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap" }}>
            {portalLoading ? "Loading…" : "Billing Portal →"}
          </button>
        )}
      </div>

      {/* ── FAQ ── */}
      <div style={{ marginTop: 8 }}>
        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 800, letterSpacing: 2.5, marginBottom: 14 }}>FREQUENTLY ASKED</div>
        {[
          { q: "Can I cancel anytime?", a: "Yes — no contracts, no hidden fees. Cancel from the billing portal with one click." },
          { q: "What counts as a campaign?", a: "Each time you generate and publish a set of ads is one campaign. Duplicating an existing campaign also counts. Free = 3/mo, Pro = 25/mo, Business & Agency = unlimited." },
          { q: "Do unused credits roll over?", a: "Monthly limits reset at the start of each billing period and do not roll over." },
        ].map((item, i) => (
          <div key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "16px 0" }}>
            <div style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>{item.q}</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, lineHeight: 1.65 }}>{item.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  AUTH SCREEN
// ─────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode]         = useState("signin"); // "signin" | "signup" | "reset"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const S = {
    page:  { minHeight: "100vh", width: "100%", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 20px" },
    card:  { width: "100%", maxWidth: 440, background: "rgba(10,22,40,0.82)", backdropFilter: "blur(18px)", border: "1px solid rgba(46,204,113,0.18)", borderRadius: 20, padding: "44px 40px", animation: "up 0.5s ease both" },
    inp:   { width: "100%", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(46,204,113,0.18)", borderRadius: 10, padding: "13px 15px", color: "#fff", fontSize: 14.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 14, transition: "border 0.2s" },
    btn:   { width: "100%", background: "linear-gradient(135deg, #1A8A3C 0%, #2ECC71 100%)", color: "#fff", border: "none", borderRadius: 10, padding: "14px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", letterSpacing: -0.2, boxShadow: "0 4px 20px rgba(46,204,113,0.28)", marginTop: 6 },
    lbl:   { display: "block", color: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 800, letterSpacing: 2.8, marginBottom: 8, textTransform: "uppercase" },
    link:  { color: "#2ECC71", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: 0 },
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccess("Check your email for a password reset link.");
        setLoading(false); return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setSuccess("Account created! Check your email to confirm, then sign in.");
          setMode("signin"); setLoading(false); return;
        }
        onAuth(data.user, data.session);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user, data.session);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const titles = {
    signin: { h: "Welcome back.", sub: "Sign in to your Mercavex account." },
    signup: { h: "Get started.", sub: "Create your Mercavex account." },
    reset:  { h: "Reset password.", sub: "We'll send a link to your email." },
  };

  return (
    <div style={S.page}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800&display=swap" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { margin: 0; padding: 0; width: 100%; min-height: 100vh; }
        body { background-color: #0A1628; }
        @keyframes up { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{filter:drop-shadow(0 0 6px rgba(46,204,113,0.3))} 50%{filter:drop-shadow(0 0 14px rgba(46,204,113,0.7))} }
        @keyframes serpentine { 0%,100%{transform:translateY(0) rotate(0deg)} 30%{transform:translateY(-3px) rotate(0.8deg)} 70%{transform:translateY(3px) rotate(-0.8deg)} }
        input::placeholder { color: rgba(255,255,255,0.48) !important; }
        input:focus { border-color: rgba(46,204,113,0.5) !important; }
      `}</style>

      {/* Logo */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(10,22,40,0.55)", backdropFilter: "blur(8px)", borderRadius: 14, padding: "12px 22px" }}>
          <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
            <img src={LOGO} alt="OphidianAI" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: -1.2, lineHeight: 1, fontFamily: "'DM Sans',sans-serif", color: "#fff" }}>Mercavex</div>
            <div style={{ color: "#2ECC71", fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginTop: 3 }}>by OphidianAI</div>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ fontSize: "clamp(24px,4vw,32px)", fontWeight: 800, letterSpacing: -1.2, marginBottom: 6, fontFamily: "'DM Sans',sans-serif" }}>{titles[mode].h}</div>
        <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 14, marginBottom: 30, lineHeight: 1.6 }}>{titles[mode].sub}</div>

        {error   && <Notice type="error">{error}</Notice>}
        {success && <Notice type="success">{success}</Notice>}

        {mode === "signup" && (
          <>
            <label style={S.lbl}>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" style={S.inp} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </>
        )}

        {mode !== "reset" || true ? (
          <>
            <label style={S.lbl}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={S.inp} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </>
        ) : null}

        {mode !== "reset" && (
          <>
            <label style={S.lbl}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "signup" ? "Choose a strong password" : "Your password"} style={S.inp} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
          {loading ? <span>Working<span style={{ display: "inline-flex", gap: 3, marginLeft: 6 }}>{[0,1,2].map(i=><span key={i} style={{ width:4,height:4,borderRadius:"50%",background:"#fff",animation:`dot 1.1s ${i*0.18}s ease-in-out infinite`,display:"inline-block" }}/>)}</span></span>
            : mode === "signin" ? "Sign In →"
            : mode === "signup" ? "Create Account →"
            : "Send Reset Link →"}
        </button>

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
          {mode === "signin" && (
            <>
              <span>Don't have an account? <button style={S.link} onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}>Sign Up</button></span>
              <button style={{ ...S.link, color: "rgba(255,255,255,0.3)", fontSize: 12 }} onClick={() => { setMode("reset"); setError(""); setSuccess(""); }}>Forgot password?</button>
            </>
          )}
          {mode === "signup" && (
            <span>Already have an account? <button style={S.link} onClick={() => { setMode("signin"); setError(""); setSuccess(""); }}>Sign In</button></span>
          )}
          {mode === "reset" && (
            <button style={S.link} onClick={() => { setMode("signin"); setError(""); setSuccess(""); }}>← Back to Sign In</button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 28, color: "rgba(255,255,255,0.15)", fontSize: 12, textAlign: "center" }}>
        The Weaving of Commerce™ · OphidianAI
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  HELPER CHATBOT — floating AI assistant
// ─────────────────────────────────────────────
function HelperChat({ session }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [busy, setBusy]         = useState(false);
  const scrollRef               = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const newMsgs = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setInput("");
    setBusy(true);
    try {
      const token = session?.access_token;
      const resp = await fetch(`${BACKEND_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
        body: JSON.stringify({ messages: newMsgs }),
      });
      const data = await resp.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Sorry, something went wrong." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error — please try again." }]);
    }
    setBusy(false);
  };

  const CS = {
    fab: { position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #1A8A3C 0%, #2ECC71 100%)", border: "none", color: "#fff", fontSize: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(46,204,113,0.35)", zIndex: 9999, transition: "transform 0.2s, box-shadow 0.2s" },
    panel: { position: "fixed", bottom: 92, right: 24, width: 370, maxWidth: "calc(100vw - 48px)", height: 480, maxHeight: "calc(100vh - 120px)", background: "rgba(10,22,40,0.97)", border: "1px solid rgba(46,204,113,0.18)", borderRadius: 16, display: "flex", flexDirection: "column", zIndex: 9998, boxShadow: "0 12px 48px rgba(0,0,0,0.5)", backdropFilter: "blur(16px)", overflow: "hidden", animation: "up 0.25s ease both" },
    hdr: { padding: "16px 20px", borderBottom: "1px solid rgba(46,204,113,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
    body: { flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 },
    foot: { padding: "12px 14px", borderTop: "1px solid rgba(46,204,113,0.12)", display: "flex", gap: 8, flexShrink: 0 },
    msgU: { alignSelf: "flex-end", background: "rgba(46,204,113,0.15)", border: "1px solid rgba(46,204,113,0.2)", borderRadius: "14px 14px 4px 14px", padding: "10px 14px", maxWidth: "82%", fontSize: 13.5, lineHeight: 1.55, color: "#fff", wordBreak: "break-word" },
    msgA: { alignSelf: "flex-start", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px 14px 14px 4px", padding: "10px 14px", maxWidth: "82%", fontSize: 13.5, lineHeight: 1.55, color: "rgba(255,255,255,0.88)", wordBreak: "break-word" },
    inp: { flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(46,204,113,0.15)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13.5, fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none" },
    send: { background: "linear-gradient(135deg, #1A8A3C 0%, #2ECC71 100%)", border: "none", borderRadius: 10, width: 42, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 18, transition: "opacity 0.15s" },
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div style={CS.panel}>
          <div style={CS.hdr}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>✦</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", fontFamily: "'DM Sans',sans-serif" }}>Mercavex Assistant</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>AI-powered help</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 20, padding: 4 }}>✕</button>
          </div>

          <div ref={scrollRef} style={CS.body}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", marginTop: 40, color: "rgba(255,255,255,0.25)", fontSize: 13, lineHeight: 1.7 }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.6 }}>✦</div>
                <div style={{ fontWeight: 700, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>How can I help?</div>
                Ask me about campaigns, analytics,<br/>platforms, or anything Mercavex.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={m.role === "user" ? CS.msgU : CS.msgA}>
                {m.content}
              </div>
            ))}
            {busy && (
              <div style={{ ...CS.msgA, color: "rgba(255,255,255,0.35)" }}>
                <span style={{ display: "inline-flex", gap: 4 }}>
                  <span style={{ animation: "dot 1s ease infinite" }}>●</span>
                  <span style={{ animation: "dot 1s ease 0.2s infinite" }}>●</span>
                  <span style={{ animation: "dot 1s ease 0.4s infinite" }}>●</span>
                </span>
              </div>
            )}
          </div>

          <div style={CS.foot}>
            <input
              style={CS.inp}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Ask anything about Mercavex…"
              disabled={busy}
            />
            <button style={CS.send} onClick={send} disabled={busy || !input.trim()}>
              ↑
            </button>
          </div>
        </div>
      )}

      {/* Floating action button */}
      <button
        style={CS.fab}
        onClick={() => setOpen(o => !o)}
        title="Mercavex Assistant"
      >
        {open ? "✕" : "✦"}
      </button>
    </>
  );
}

// ─────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  // ── Auth ─────────────────────────────────────
  const [user, setUser]               = useState(null);
  const [session, setSession]         = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // true while checking session on mount

  // ── Billing / Plan ────────────────────────────
  const [userPlan, setUserPlan]               = useState("free");
  const [planPeriodEnd, setPlanPeriodEnd]     = useState(null);
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false);
  const [billingLoading, setBillingLoading]   = useState(false);
  const [campaignsThisMonth, setCampaignsThisMonth] = useState(0);
  const [planImageEnabled, setPlanImageEnabled] = useState(false);
  const [planVideoEnabled, setPlanVideoEnabled] = useState(false);
  const [planCampaignLimit, setPlanCampaignLimit] = useState(3);
  const [planPlatformLimit, setPlanPlatformLimit] = useState(2);
  const [planAnalyticsLevel, setPlanAnalyticsLevel] = useState("basic");
  const [planTeamEnabled, setPlanTeamEnabled]   = useState(false);
  const [planExportEnabled, setPlanExportEnabled] = useState(false);
  const [planWhitelabelEnabled, setPlanWhitelabelEnabled] = useState(false);

  // ── Ayrshare ──────────────────────────────────
  const [ayrshareKey, setAyrshareKey] = useState("");
  const [keyInput, setKeyInput]       = useState("");
  const [profiles, setProfiles]       = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [profilesLoading, setProfilesLoading]     = useState(false);
  const [savedKeyLoading, setSavedKeyLoading]     = useState(false);

  // ── Campaign ──────────────────────────────────
  // Persist navigable screens to URL hash — restores on page reload.
  // Transient flow screens (generating, publishing, review, done) are excluded.
  const HASH_SCREENS = new Set(["input","connect","dashboard","analytics","account","billing","visuals","agency"]);
  const getInitialScreen = () => {
    const hash = window.location.hash.replace("#", "");
    return HASH_SCREENS.has(hash) ? hash : "connect";
  };
  const [screen, setScreenRaw]          = useState(getInitialScreen);
  const setScreen = (s) => {
    if (HASH_SCREENS.has(s)) window.history.replaceState({}, "", "#" + s);
    setScreenRaw(s);
  };
  const [businessDesc, setBusinessDesc] = useState("");
  const [adGoal, setAdGoal]             = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const fileRef = useRef();

  // ── Ads ───────────────────────────────────────
  const [ads, setAds]                   = useState([]);
  const [approvedAds, setApprovedAds]   = useState([]);
  const [revisingIdx, setRevisingIdx]   = useState(null);
  const [reviseFeedback, setReviseFeedback] = useState("");

  // ── Schedule ──────────────────────────────────
  const [schedule, setSchedule]   = useState(null);
  const [postTime, setPostTime]   = useState("09:00");

  // ── Campaigns Dashboard ───────────────────────
  const [campaigns, setCampaigns]               = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm]       = useState(null);
  const [liveStatuses, setLiveStatuses]         = useState({});

  // ── Analytics ─────────────────────────────────
  const [analytics, setAnalytics]               = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ── Ad Visuals (image + video per approved ad) ─
  // adVisuals[adIndex] = { imageUrl, imageLoading, videoUrl, videoStatus, videoRequestId }
  const [adVisuals, setAdVisuals] = useState({});

  // ── Status ────────────────────────────────────
  const [loading, setLoading]     = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError]         = useState("");
  const [publishLog, setPublishLog] = useState([]);

  // ── Init: check existing session ──────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setSession(session);
        loadSavedProfile(session);
      }
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setSession(session);
      } else {
        setUser(null);
        setSession(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Auto-load campaigns when navigating to dashboard ──
  useEffect(() => {
    if (screen === "dashboard" && user && session) loadCampaigns(ayrshareKey);
  }, [screen, ayrshareKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-load analytics when navigating to analytics tab ──
  useEffect(() => {
    if (screen === "analytics" && user && session && ayrshareKey) loadAnalytics();
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch billing status when user logs in ──
  useEffect(() => {
    if (!session) return;
    const fetchBillingStatus = async () => {
      try {
        const resp = await fetch(`${BACKEND_URL}/billing/status`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
        });
        if (!resp.ok) return;
        const data = await resp.json();
        setUserPlan(data.plan || "free");
        setPlanPeriodEnd(data.planPeriodEnd || null);
        setHasStripeCustomer(!!data.hasCustomer);
        setCampaignsThisMonth(data.campaignsThisMonth || 0);
        setPlanImageEnabled(!!data.imageEnabled);
        setPlanVideoEnabled(!!data.videoEnabled);
        setPlanCampaignLimit(data.campaignLimit || 3);
        setPlanPlatformLimit(data.platformLimit || 2);
        setPlanAnalyticsLevel(data.analyticsLevel || "basic");
        setPlanTeamEnabled(!!data.teamEnabled);
        setPlanExportEnabled(!!data.exportEnabled);
        setPlanWhitelabelEnabled(!!data.whitelabelEnabled);
      } catch (e) { /* silent — defaults to free */ }
    };
    fetchBillingStatus();
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle Stripe redirect back (success / cancel) ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billingStatus = params.get("billing");
    if (billingStatus === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      setScreen("billing");
    } else if (billingStatus === "cancel" || billingStatus === "portal-return") {
      window.history.replaceState({}, "", window.location.pathname);
      setScreen("billing");
    }
    // Listen for cross-component navigation events (e.g. from AccountScreen)
    const onNav = (e) => setScreen(e.detail);
    window.addEventListener("navigate", onNav);
    return () => window.removeEventListener("navigate", onNav);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Poll video status for any ads currently processing ──
  useEffect(() => {
    const processing = Object.entries(adVisuals).filter(([, v]) => v.videoStatus === "processing");
    if (processing.length === 0) return;
    const timer = setTimeout(async () => {
      for (const [idx, v] of processing) {
        if (!v.videoRequestId) continue;
        try {
          const resp = await fetch(`${BACKEND_URL}/ai/video-status/${v.videoRequestId}`, { headers: authHeaders() });
          const data = await resp.json();
          if (data.status === "completed" && data.videoUrl) {
            setAdVisuals(prev => ({ ...prev, [idx]: { ...prev[idx], videoUrl: data.videoUrl, videoStatus: "done" } }));
          } else if (data.status === "failed") {
            setAdVisuals(prev => ({ ...prev, [idx]: { ...prev[idx], videoStatus: "failed" } }));
          }
          // still processing — loop will re-trigger via dependency change
        } catch (e) { /* silent poll failure — will retry */ }
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [adVisuals]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth helper: get token headers ────────────
  const authHeaders = (extra = {}) => {
    const token = session?.access_token;
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...extra,
    };
  };

  // ── Load saved Ayrshare key from backend ──────
  // Fast path: if we have a cached key + profiles from a previous session,
  // restore them instantly (no loading splash) then re-verify in the background.
  const loadSavedProfile = async (sess) => {
    if (!sess?.access_token) return;

    const cacheKey = `mercavex_profile_${sess.user.id}`;
    const cached   = (() => { try { return JSON.parse(localStorage.getItem(cacheKey) || "null"); } catch { return null; } })();

    if (cached?.ayrshareKey && cached?.profiles?.length > 0) {
      // Instant restore — skip the loading splash entirely for returning users
      setKeyInput(cached.ayrshareKey);
      setAyrshareKey(cached.ayrshareKey);
      setProfiles(cached.profiles);
      setSelectedPlatforms(cached.profiles.map(p => p.platform));
      if (cached.businessDesc) setBusinessDesc(cached.businessDesc);
      setSavedKeyLoading(false);
      // Background re-verify (silent — only updates if something changed)
      fetch(`${BACKEND_URL}/user/profile`, { headers: { "Authorization": `Bearer ${sess.access_token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          if (data.ayrshare_api_key && data.ayrshare_api_key !== cached.ayrshareKey) {
            // Key changed — do a full re-connect
            loadProfilesWithKey(data.ayrshare_api_key, sess.user.id);
          }
          if (data.business_desc) setBusinessDesc(data.business_desc);
        })
        .catch(() => {});
      return;
    }

    // No cache — normal blocking load (first login or after cache cleared)
    setSavedKeyLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/user/profile`, {
        headers: { "Authorization": `Bearer ${sess.access_token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.ayrshare_api_key) {
          setKeyInput(data.ayrshare_api_key);
          await loadProfilesWithKey(data.ayrshare_api_key, sess.user.id);
        }
        if (data.business_desc) setBusinessDesc(data.business_desc);
      }
    } catch (e) { /* silent — user can connect manually */ }
    setSavedKeyLoading(false);
  };

  // ── Save profile to backend ───────────────────
  const saveProfile = async (updates) => {
    if (!session?.access_token) return;
    try {
      await fetch(`${BACKEND_URL}/user/profile`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });
    } catch (e) { /* silent */ }
  };

  // ── Handle auth callback from AuthScreen ──────
  const handleAuth = (u, sess) => {
    setUser(u);
    setSession(sess);
    loadSavedProfile(sess);
  };

  // ── Logout ────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.history.replaceState({}, "", window.location.pathname);
    // Clear cached profile so next user starts fresh
    try { Object.keys(localStorage).filter(k => k.startsWith("mercavex_profile_")).forEach(k => localStorage.removeItem(k)); } catch {}
    setUser(null); setSession(null);
    setScreen("connect"); setAyrshareKey(""); setKeyInput("");
    setProfiles([]); setSelectedPlatforms([]);
    setAds([]); setApprovedAds([]); setBusinessDesc(""); setAdGoal("");
    setUploadedImages([]); setPublishLog([]); setAdVisuals({});
  };

  // ── Ayrshare: Load Profiles ───────────────────
  const loadProfilesWithKey = async (key, userId = null) => {
    setProfilesLoading(true); setError("");
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const resp = await fetch(`${BACKEND_URL}/social/profiles?key=${encodeURIComponent(key)}`, {
        headers: { "Authorization": `Bearer ${currentSession?.access_token}` },
      });
      const data = await resp.json();
      if (data.status === "error") throw new Error(data.message || "Invalid API key.");
      const connected = data.displayNames || [];
      if (connected.length === 0)
        throw new Error("No social accounts found. Connect your accounts at app.ayrshare.com first.");
      setAyrshareKey(key);
      setProfiles(connected);
      setSelectedPlatforms(connected.map(p => p.platform));
      // Cache for instant restore on next reload
      const uid = userId || currentSession?.user?.id;
      if (uid) {
        try {
          localStorage.setItem(`mercavex_profile_${uid}`, JSON.stringify({ ayrshareKey: key, profiles: connected }));
        } catch {}
      }
      // Only navigate to "input" if the user has no saved screen (fresh load / first connect).
      const HASH_SCREENS_LOCAL = new Set(["input","connect","dashboard","analytics","account","billing","visuals"]);
      const currentHash = window.location.hash.replace("#", "");
      if (!HASH_SCREENS_LOCAL.has(currentHash) || currentHash === "connect") {
        setScreenRaw("input");
        window.history.replaceState({}, "", "#input");
      }
    } catch (e) { setError(e.message); }
    setProfilesLoading(false);
  };

  const loadProfiles = async (key) => {
    await loadProfilesWithKey(key);
    // Save key to user profile after successful connect
    await saveProfile({ ayrshare_api_key: key });
  };

  // ── Images ────────────────────────────────────
  // Compresses images to max 1024px / quality 0.82 before encoding.
  // iPad camera photos can be 10–15MB each — without this the base64
  // payload sent to the Anthropic API is too large and times out
  // mid-response, causing "JSON Parse error: Unexpected EOF" on iOS.
  const compressImage = (file) => new Promise(res => {
    const MAX_PX = 1024;
    const QUALITY = 0.82;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_PX || height > MAX_PX) {
        if (width > height) { height = Math.round(height * MAX_PX / width); width = MAX_PX; }
        else                { width  = Math.round(width  * MAX_PX / height); height = MAX_PX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      res({ name: file.name, data: canvas.toDataURL("image/jpeg", QUALITY) });
    };
    img.src = url;
  });

  const handleImages = (files) => {
    Promise.all(Array.from(files).map(compressImage))
      .then(imgs => setUploadedImages(prev => [...prev, ...imgs].slice(0, 4)));
  };

  // ── AI: Generate Ads ──────────────────────────
  const generateAds = async () => {
    if (!businessDesc) { setError("Please describe your business."); return; }
    setError(""); setScreen("generating"); setLoadingMsg("Crafting ad concepts…");
    // Save business desc
    saveProfile({ business_desc: businessDesc });
    try {
      const platformNames = selectedPlatforms.map(p => PLATFORM_META[p]?.name || p).join(", ");
      const images = uploadedImages.map(img => ({
        mediaType: img.data.split(";")[0].replace("data:", ""),
        data: img.data.split(",")[1],
      }));
      const resp = await fetch(`${BACKEND_URL}/ai/generate-ads`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ businessDesc, adGoal, platforms: platformNames, images }),
      });
      const data = await resp.json();

      // Plan limit gate
      if (resp.status === 403 && data.code === "PLAN_LIMIT") {
        setScreen("input");
        setError(data.message + " — ");
        // Show upgrade CTA inline via error — handled in input screen
        return;
      }

      const raw    = data.content?.find(b => b.type === "text")?.text || "";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setAds(parsed);
      setApprovedAds(new Array(parsed.length).fill(false));
      setCampaignsThisMonth(prev => prev + 1); // optimistic update
      setScreen("review");
    } catch (e) { setError("Generation failed: " + e.message); setScreen("input"); }
  };

  // ── AI: Revise Ad ─────────────────────────────
  const handleRevise = async (idx, submit = false) => {
    if (!submit) { setRevisingIdx(idx); return; }
    setLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/ai/revise-ad`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ad: ads[idx], feedback: reviseFeedback }),
      });
      const data    = await resp.json();
      const raw     = data.content?.find(b => b.type === "text")?.text || "";
      const revised = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setAds(prev => { const n = [...prev]; n[idx] = revised; return n; });
      setRevisingIdx(null); setReviseFeedback("");
    } catch (e) { setError("Revision failed: " + e.message); }
    setLoading(false);
  };

  const handleApprove = (idx) => {
    setApprovedAds(prev => { const n = [...prev]; n[idx] = true; return n; });
    setRevisingIdx(null);
  };

  // ── Ayrshare: Publish ─────────────────────────
  const publishCampaign = async () => {
    setScreen("publishing");
    const approvedItems = ads.map((ad, i) => ({ ad, i })).filter(({ i }) => approvedAds[i]);
    const dates         = getScheduledDates(schedule, postTime, approvedItems.length);
    const log           = [];
    for (let j = 0; j < approvedItems.length; j++) {
      const { ad, i: adIdx } = approvedItems[j];
      const visual       = adVisuals[adIdx] || {};
      const text         = `${ad.headline}\n\n${ad.body}\n\n${ad.cta}`;
      const scheduleDate = dates[j] || null;
      // Video takes priority over AI image; both are optional
      const mediaUrls    = visual.videoUrl
        ? [visual.videoUrl]
        : visual.imageUrl
        ? [visual.imageUrl]
        : undefined;

      // Fall back to user-uploaded images when no AI visual was generated
      const fallbackImages = !mediaUrls && uploadedImages.length > 0
        ? uploadedImages.map(img => ({
            data:      img.data.split(",")[1],
            mediaType: img.data.split(";")[0].replace("data:", ""),
          }))
        : [];

      const hasMedia = !!mediaUrls || fallbackImages.length > 0;

      // Strip platforms that require media when none is available
      const postPlatforms = hasMedia
        ? selectedPlatforms
        : selectedPlatforms.filter(p => !MEDIA_REQUIRED_PLATFORMS.includes(p));
      const skippedPlatforms = hasMedia
        ? []
        : selectedPlatforms.filter(p => MEDIA_REQUIRED_PLATFORMS.includes(p));

      if (!postPlatforms.length) {
        // All selected platforms require media and none is available — skip entirely
        log.push({
          adTitle: ad.headline, platforms: selectedPlatforms, scheduleDate,
          ayrshareId: null, hasImage: false,
          status: "error",
          message: `Skipped — ${selectedPlatforms.map(p => PLATFORM_META[p]?.name || p).join(", ")} require an image or video. Generate a visual and re-publish.`,
        });
        continue;
      }

      setLoadingMsg(`Scheduling post ${j + 1} of ${approvedItems.length}…`);
      try {
        const resp = await fetch(`${BACKEND_URL}/social/post`, {
          method: "POST", headers: authHeaders(),
          body: JSON.stringify({
            key: ayrshareKey, text, platforms: postPlatforms, scheduleDate,
            ...(mediaUrls         ? { mediaUrls }         : {}),
            ...(fallbackImages.length > 0 ? { images: fallbackImages } : {}),
          }),
        });
        const result = await resp.json();
        const skippedNote = skippedPlatforms.length
          ? ` (${skippedPlatforms.map(p => PLATFORM_META[p]?.name || p).join(", ")} skipped — no visual)`
          : "";

        // Ayrshare can return a mixed response: top-level status may be "error"
        // even when some platforms succeeded. Derive true status from postIds.
        const succeededPlatforms = (result.postIds || []).filter(p => p.status === "success").map(p => p.platform);
        const failedErrors       = (result.errors  || []);
        let derivedStatus, derivedMessage;

        if (succeededPlatforms.length > 0 && failedErrors.length === 0) {
          derivedStatus  = "scheduled";
          derivedMessage = "Post queued" + skippedNote;
        } else if (succeededPlatforms.length > 0 && failedErrors.length > 0) {
          derivedStatus  = "partial";
          const failedNames = failedErrors.map(e => e.platform ? (PLATFORM_META[e.platform]?.name || e.platform) : "unknown").join(", ");
          derivedMessage = `Partial: succeeded on ${succeededPlatforms.map(p => PLATFORM_META[p]?.name || p).join(", ")}; failed on ${failedNames} — ${failedErrors[0]?.message || "unknown error"}${skippedNote}`;
        } else {
          derivedStatus  = "error";
          derivedMessage = (failedErrors[0]?.message || result.message || "Post failed") + skippedNote;
        }

        log.push({
          adTitle: ad.headline, platforms: postPlatforms, scheduleDate,
          ayrshareId: result.id || null,
          hasImage: hasMedia,
          status: derivedStatus,
          message: derivedMessage,
        });
      } catch (e) {
        log.push({ adTitle: ad.headline, platforms: postPlatforms, scheduleDate, status: "error", message: e.message });
      }
      await new Promise(r => setTimeout(r, 400));
    }
    setPublishLog(log);
    await saveCampaign(log);
    setScreen("done");
  };

  // ── AI: Generate Image for approved ad ────────
  const generateImage = async (adIdx) => {
    const ad = ads[adIdx];
    if (!ad) return;
    setAdVisuals(prev => ({ ...prev, [adIdx]: { ...(prev[adIdx] || {}), imageLoading: true, imageUrl: null, imagePlanLimit: false } }));
    try {
      // Use first uploaded product image as source if available
      const sourceImg = uploadedImages[0];
      const body = {
        businessDesc,
        adHeadline: ad.headline,
        adBody:     ad.body,
        platforms:  selectedPlatforms.map(p => PLATFORM_META[p]?.name || p).join(", "),
      };
      if (sourceImg) {
        body.sourceImageBase64 = sourceImg.data.split(",")[1];
        body.sourceMediaType   = sourceImg.data.split(";")[0].replace("data:", "");
      }
      const resp = await fetch(`${BACKEND_URL}/ai/generate-image`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (resp.status === 403 && data.code === "PLAN_LIMIT") {
        setAdVisuals(prev => ({ ...prev, [adIdx]: { ...(prev[adIdx] || {}), imageLoading: false, imageUrl: null, imagePlanLimit: true } }));
        return;
      }
      if (data.status === "error") throw new Error(data.message);
      setAdVisuals(prev => ({ ...prev, [adIdx]: { ...(prev[adIdx] || {}), imageLoading: false, imageUrl: data.imageUrl, imagePlanLimit: false } }));
    } catch (e) {
      setAdVisuals(prev => ({ ...prev, [adIdx]: { ...(prev[adIdx] || {}), imageLoading: false, imageUrl: null } }));
      setError("Image generation failed: " + e.message);
    }
  };

  // ── AI: Generate Video for approved ad ────────
  const generateVideo = async (adIdx) => {
    const ad      = ads[adIdx];
    const imageUrl = adVisuals[adIdx]?.imageUrl;
    if (!ad || !imageUrl) return;
    setAdVisuals(prev => ({ ...prev, [adIdx]: { ...prev[adIdx], videoStatus: "submitting" } }));
    try {
      const resp = await fetch(`${BACKEND_URL}/ai/generate-video`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ imageUrl, adHeadline: ad.headline, adBody: ad.body, businessDesc }),
      });
      const data = await resp.json();
      if (resp.status === 403 && data.code === "PLAN_LIMIT") {
        setAdVisuals(prev => ({ ...prev, [adIdx]: { ...prev[adIdx], videoStatus: "plan_limit" } }));
        return;
      }
      if (data.status === "error") throw new Error(data.message);
      setAdVisuals(prev => ({ ...prev, [adIdx]: { ...prev[adIdx], videoStatus: "processing", videoRequestId: data.requestId } }));
    } catch (e) {
      setAdVisuals(prev => ({ ...prev, [adIdx]: { ...prev[adIdx], videoStatus: "failed" } }));
      setError("Video generation failed: " + e.message);
    }
  };

  // ── Analytics: Load from backend ─────────────
  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const resp = await fetch(
        `${BACKEND_URL}/analytics?key=${encodeURIComponent(ayrshareKey)}`,
        { headers: authHeaders() }
      );
      const data = await resp.json();
      setAnalytics(data.status === "error" ? null : data);
    } catch (e) { setAnalytics(null); }
    setAnalyticsLoading(false);
  };

  // ── Campaigns: Load from backend ─────────────
  const loadCampaigns = async (keyOverride) => {
    setCampaignsLoading(true);
    const key = keyOverride !== undefined ? keyOverride : ayrshareKey;
    try {
      const resp = await fetch(`${BACKEND_URL}/campaigns`, { headers: authHeaders() });
      const data = await resp.json();
      setCampaigns(Array.isArray(data) ? data : []);

      // Also fetch live post statuses from Ayrshare to update "queued" → "published"
      if (key) {
        try {
          const histResp = await fetch(
            `${BACKEND_URL}/social/history?key=${encodeURIComponent(key)}`,
            { headers: authHeaders() }
          );
          const histData = await histResp.json();
          if (histData.statusMap) {
            setLiveStatuses(histData.statusMap);
          }
        } catch (e) { /* non-fatal — dashboard still works with stored statuses */ }
      }
    } catch (e) { setCampaigns([]); }
    setCampaignsLoading(false);
  };

  // ── Campaigns: Save after publish ────────────
  const saveCampaign = async (log) => {
    try {
      await fetch(`${BACKEND_URL}/campaigns`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          business_desc: businessDesc,
          ad_goal:       adGoal,
          platforms:     selectedPlatforms,
          schedule_id:   schedule,
          post_time:     postTime,
          ads:           ads.filter((_, i) => approvedAds[i]),
          publish_log:   log,
        }),
      });
    } catch (e) { /* silent — campaign still activated */ }
  };

  // ── Campaigns: Delete ─────────────────────────
  const deleteCampaign = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/campaigns/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setCampaigns(prev => prev.filter(c => c.id !== id));
      setDeleteConfirm(null);
    } catch (e) { setError("Delete failed. Please try again."); }
  };

  // ── Campaigns: Duplicate (pre-fill input) ────
  const duplicateCampaign = (campaign) => {
    setBusinessDesc(campaign.business_desc || "");
    setAdGoal(campaign.ad_goal || "");
    // Only restore platforms that are still connected to this account
    const validPlatforms = (campaign.platforms || []).filter(p =>
      profiles.some(pr => pr.platform === p)
    );
    setSelectedPlatforms(validPlatforms.length > 0 ? validPlatforms : selectedPlatforms);
    setAds([]); setApprovedAds([]); setUploadedImages([]);
    setSchedule(null); setPublishLog([]); setDeleteConfirm(null);
    setScreen("input");
  };

  // ── Derived ───────────────────────────────────
  const approvedCount = approvedAds.filter(Boolean).length;
  const userName      = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const userInitial   = userName[0]?.toUpperCase() || "U";
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  // ── Styles ────────────────────────────────────
  const S = {
    page:  { minHeight: "100vh", width: "100%", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#fff" },
    hdr:   { borderBottom: "1px solid rgba(46,204,113,0.1)", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,22,40,0.85)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 },
    logo:  { fontSize: 20, fontWeight: 800, letterSpacing: -0.8, fontFamily: "'DM Sans',sans-serif" },
    wrap:  { maxWidth: 680, margin: "0 auto", padding: "50px 22px 80px" },
    h1:    { fontSize: "clamp(30px,5vw,50px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: -2, marginBottom: 10, fontFamily: "'DM Sans',sans-serif" },
    sub:   { color: "rgba(255,255,255,0.4)", fontSize: 15, lineHeight: 1.7, marginBottom: 34 },
    lbl:   { display: "block", color: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 800, letterSpacing: 2.8, marginBottom: 8, textTransform: "uppercase" },
    inp:   { width: "100%", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(46,204,113,0.15)", borderRadius: 10, padding: "12px 15px", color: "#fff", fontSize: 14.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "vertical", transition: "border 0.2s" },
    btn:   { background: "linear-gradient(135deg, #1A8A3C 0%, #2ECC71 100%)", color: "#fff", border: "none", borderRadius: 10, padding: "14px 30px", fontWeight: 700, fontSize: 14.5, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 9, letterSpacing: -0.2, transition: "opacity 0.15s", boxShadow: "0 4px 20px rgba(46,204,113,0.25)" },
    ghost: { background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "13px 26px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s" },
    card:  { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(46,204,113,0.1)", borderRadius: 14, padding: "24px 26px" },
    row:   { display: "flex", flexDirection: "column", gap: 20 },
  };

  // ── Loading splash (checking session) ─────────
  if (authLoading) {
    return (
      <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@700;800&display=swap" />
        <style>{`html,body,#root{margin:0;padding:0;width:100%;min-height:100vh;}body{background-color:#0A1628;}@keyframes glowPulse{0%,100%{filter:drop-shadow(0 0 6px rgba(46,204,113,0.3))}50%{filter:drop-shadow(0 0 18px rgba(46,204,113,0.8))}}`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ animation: "glowPulse 1.6s ease-in-out infinite", fontSize: 40 }}>⚙️</div>
          <div style={{ color: "rgba(255,255,255,0.25)", marginTop: 14, fontSize: 13 }}>Loading Mercavex…</div>
        </div>
      </div>
    );
  }

  // ── Not logged in → show auth screen ──────────
  if (!user) return <AuthScreen onAuth={handleAuth} />;

  // ── Loading saved Ayrshare key splash ─────────
  if (savedKeyLoading) {
    return (
      <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@700;800&display=swap" />
        <style>{`html,body,#root{margin:0;padding:0;width:100%;min-height:100vh;}body{background-color:#0A1628;}@keyframes glowPulse{0%,100%{filter:drop-shadow(0 0 6px rgba(46,204,113,0.3))}50%{filter:drop-shadow(0 0 18px rgba(46,204,113,0.8))}}`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ animation: "glowPulse 1.6s ease-in-out infinite", fontSize: 36 }}>🔗</div>
          <div style={{ color: "rgba(255,255,255,0.3)", marginTop: 14, fontSize: 13 }}>Restoring your connections…</div>
        </div>
      </div>
    );
  }

  // ── Logged-in app ─────────────────────────────
  return (
    <div style={S.page}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { margin: 0; padding: 0; width: 100%; min-height: 100vh; }
        body { background-color: #0A1628; }
        @keyframes dot        { 0%,100%{opacity:.2;transform:scale(.7)} 50%{opacity:1;transform:scale(1)} }
        @keyframes up         { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        @keyframes serpentine { 0%,100%{transform:translateY(0) rotate(0deg)} 30%{transform:translateY(-3px) rotate(0.8deg)} 70%{transform:translateY(3px) rotate(-0.8deg)} }
        @keyframes glowPulse  { 0%,100%{filter:drop-shadow(0 0 6px rgba(46,204,113,0.3))} 50%{filter:drop-shadow(0 0 14px rgba(46,204,113,0.7))} }
        .anim { animation: up 0.45s ease both; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.48) !important; }
        input:focus, textarea:focus { border-color: rgba(46,204,113,0.45) !important; }
        button:hover { opacity: 0.88; }
        button:active { opacity: 0.75; }
        button:disabled { opacity: 0.45; cursor: not-allowed; }
        /* ── Hover sidebar ── */
        .sidebar-trigger { position: fixed; left: 0; top: 0; bottom: 0; width: 8px; z-index: 199; }
        .sidebar-panel { position: fixed; left: 0; top: 0; bottom: 0; width: 220px; background: rgba(8,18,32,0.97); border-right: 1px solid rgba(46,204,113,0.1); backdrop-filter: blur(16px); z-index: 200; display: flex; flex-direction: column; padding: 0 12px 24px; transform: translateX(-100%); transition: transform 0.22s cubic-bezier(0.4,0,0.2,1); pointer-events: none; }
        .sidebar-panel.open { transform: translateX(0); pointer-events: all; }
        .sidebar-nav-btn { background: none; border: none; width: 100%; display: flex; align-items: center; gap: 12px; padding: 11px 16px; border-radius: 10px; color: rgba(255,255,255,0.45); font-size: 13.5px; font-weight: 700; font-family: 'DM Sans','Segoe UI',sans-serif; cursor: pointer; transition: all 0.15s; text-align: left; letter-spacing: 0.1px; }
        .sidebar-nav-btn:hover { background: rgba(46,204,113,0.08); color: rgba(255,255,255,0.85); opacity: 1; }
        /* ── User dropdown ── */
        .user-dropdown-item { background: none; border: none; width: 100%; display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-radius: 8px; color: rgba(255,255,255,0.65); font-size: 13px; font-weight: 600; font-family: 'DM Sans','Segoe UI',sans-serif; cursor: pointer; transition: all 0.15s; text-align: left; }
        .user-dropdown-item:hover { background: rgba(46,204,113,0.08); color: #fff; opacity: 1; }
        .user-dropdown-item.danger { color: rgba(255,100,100,0.75); }
        .user-dropdown-item.danger:hover { background: rgba(255,59,48,0.08); color: #FF6B6B; }
      `}</style>

      {/* ══ HOVER SIDEBAR ══ */}
      {/* Invisible 8px trigger strip on left edge */}
      <div className="sidebar-trigger" onMouseEnter={() => setSidebarOpen(true)} />

      {/* Slide-in panel */}
      <nav className={`sidebar-panel${sidebarOpen ? " open" : ""}`} onMouseLeave={() => setSidebarOpen(false)}>
        {/* Logo lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "22px 8px 30px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 7, overflow: "hidden", flexShrink: 0 }}>
            <img src={LOGO} alt="OphidianAI" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.6, fontFamily: "'DM Sans',sans-serif", lineHeight: 1 }}>Mercavex</div>
            <div style={{ color: "#2ECC71", fontSize: 8, fontWeight: 700, letterSpacing: 2.2, textTransform: "uppercase", marginTop: 2 }}>by OphidianAI</div>
          </div>
        </div>

        <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 9.5, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", padding: "0 6px", marginBottom: 8 }}>Menu</div>

        <button className="sidebar-nav-btn" onClick={() => { setScreen(ayrshareKey ? "input" : "connect"); setSidebarOpen(false); }}>
          <span style={{ fontSize: 14 }}>⌂</span> Home
        </button>
        <button className="sidebar-nav-btn" onClick={() => { setScreen("dashboard"); setSidebarOpen(false); }}>
          <span style={{ fontSize: 13 }}>◉</span> Ad Campaigns
          {campaigns.length > 0 && (
            <span style={{ marginLeft: "auto", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>
              {campaigns.length}
            </span>
          )}
        </button>

        {planTeamEnabled && (
          <>
            <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "10px 6px" }} />
            <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 9.5, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", padding: "0 6px", marginBottom: 8 }}>Workspace</div>
            <button className="sidebar-nav-btn" onClick={() => { setScreen("agency"); setSidebarOpen(false); }}
              style={{ color: screen === "agency" ? "#4DFF8F" : undefined, borderLeft: screen === "agency" ? "2px solid #4DFF8F" : "2px solid transparent", paddingLeft: 10 }}>
              <span style={{ fontSize: 13 }}>◈</span> Agency
              <span style={{ marginLeft: "auto", background: "rgba(77,255,143,0.1)", border: "1px solid rgba(77,255,143,0.25)", borderRadius: 20, padding: "1px 7px", fontSize: 9, fontWeight: 800, color: "#4DFF8F", letterSpacing: 1 }}>
                TEAM
              </span>
            </button>
          </>
        )}

        <div style={{ flex: 1 }} />
        <div style={{ padding: "0 6px" }}>
          <div style={{ color: "rgba(255,255,255,0.1)", fontSize: 10, fontWeight: 600 }}>Mercavex v1.7</div>
        </div>
      </nav>

      {/* ══ HEADER ══ */}
      <header style={{ ...S.hdr, flexDirection: "column", alignItems: "stretch", padding: "14px 28px 0", gap: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
              <img src={LOGO} alt="OphidianAI" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ ...S.logo, lineHeight: 1 }}>Mercavex</div>
              <div style={{ color: "#2ECC71", fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", marginTop: 2 }}>by OphidianAI</div>
            </div>
          </div>

          {/* User pill with dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,0.04)", border: `1px solid ${userMenuOpen ? "rgba(46,204,113,0.3)" : "rgba(46,204,113,0.12)"}`, borderRadius: 40, padding: "6px 14px 6px 8px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
            >
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #1A8A3C, #2ECC71)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff", flexShrink: 0 }}>{userInitial}</div>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</span>
              {userPlan !== "free" && (
                <span style={{ background: userPlan === "agency" ? "linear-gradient(135deg, #1A8A3C, #4DFF8F)" : userPlan === "business" ? "linear-gradient(135deg, #B45309, #F59E0B)" : "linear-gradient(135deg, #1A8A3C, #2ECC71)", color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: 1.2, padding: "2px 7px", borderRadius: 20, textTransform: "uppercase", flexShrink: 0 }}>
                  {{ pro: "PRO", business: "BIZ", agency: "AGY" }[userPlan] || userPlan}
                </span>
              )}
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginLeft: 2 }}>{userMenuOpen ? "▲" : "▾"}</span>
            </button>

            {userMenuOpen && (
              <div
                style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#0A1628", border: "1px solid rgba(46,204,113,0.15)", borderRadius: 12, padding: "6px", minWidth: 180, zIndex: 300, boxShadow: "0 8px 32px rgba(0,0,0,0.45)" }}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9.5, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", padding: "4px 14px 6px" }}>Account</div>
                <button className="user-dropdown-item" onClick={() => { setScreen("account"); setUserMenuOpen(false); }}>
                  <span style={{ fontSize: 14 }}>⊙</span> Account Settings
                </button>
                <button className="user-dropdown-item" onClick={() => { setScreen("billing"); setUserMenuOpen(false); }}>
                  <span style={{ fontSize: 14 }}>◇</span> Plans &amp; Billing
                  {userPlan !== "free" && (
                    <span style={{ marginLeft: "auto", background: userPlan === "agency" ? "linear-gradient(135deg, #1A8A3C, #4DFF8F)" : userPlan === "business" ? "linear-gradient(135deg, #B45309, #F59E0B)" : "linear-gradient(135deg, #1A8A3C, #2ECC71)", color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: 1, padding: "2px 7px", borderRadius: 20, textTransform: "uppercase" }}>
                      {{ pro: "PRO", business: "BIZ", agency: "AGY" }[userPlan] || userPlan}
                    </span>
                  )}
                </button>
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 8px" }} />
                <button className="user-dropdown-item danger" onClick={handleLogout}>
                  <span style={{ fontSize: 14 }}>→</span> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Nav tabs (restored) ── */}
        <div style={{ display: "flex", marginLeft: -28, marginRight: -28, paddingLeft: 20, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {[
            { id: "campaign",  label: "New Campaign", icon: "✦" },
            { id: "dashboard", label: "Campaigns",    icon: "◉" },
            { id: "analytics", label: "Analytics",    icon: "◈" },
          ].map(tab => {
            const isActive = tab.id === "analytics"
              ? screen === "analytics"
              : tab.id === "dashboard"
              ? screen === "dashboard"
              : screen !== "dashboard" && screen !== "analytics" && screen !== "account" && screen !== "billing";
            return (
              <button key={tab.id}
                onClick={() => {
                  if (tab.id === "dashboard")      setScreen("dashboard");
                  else if (tab.id === "analytics") setScreen("analytics");
                  else                             setScreen(ayrshareKey ? "input" : "connect");
                }}
                style={{
                  background: "none", border: "none",
                  borderBottom: `2px solid ${isActive ? "#2ECC71" : "transparent"}`,
                  color: isActive ? "#2ECC71" : "rgba(255,255,255,0.3)",
                  padding: "11px 18px",
                  fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.2s", marginBottom: -1,
                  display: "flex", alignItems: "center", gap: 7,
                }}
              >
                <span style={{ fontSize: 10 }}>{tab.icon}</span>
                {tab.label}
                {tab.id === "dashboard" && campaigns.length > 0 && (
                  <span style={{ background: isActive ? "rgba(46,204,113,0.2)" : "rgba(255,255,255,0.07)", border: `1px solid ${isActive ? "rgba(46,204,113,0.35)" : "rgba(255,255,255,0.1)"}`, borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 800, color: isActive ? "#2ECC71" : "rgba(255,255,255,0.3)" }}>
                    {campaigns.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <div style={S.wrap}>

        {/* ══════════ CONNECT ══════════ */}
        {screen === "connect" && (
          <div className="anim">
            <div style={S.h1}>Connect Your<br /><span style={{ color: "#2ECC71" }}>Social Accounts.</span></div>
            <div style={S.sub}>Mercavex publishes through Ayrshare. Link your account once — your key is saved to your profile.</div>

            {error && <Notice type="error">{error}</Notice>}

            {/* Step 1 */}
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ background: "rgba(46,204,113,0.15)", color: "#2ECC71", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>1</span>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>Create an Ayrshare account</div>
              </div>
              <div style={{ color: "rgba(255,255,255,0.42)", fontSize: 13.5, lineHeight: 1.65, marginBottom: 14, paddingLeft: 36 }}>
                Go to <strong style={{ color: "rgba(255,255,255,0.7)" }}>app.ayrshare.com</strong>, create a free account, and connect your social platforms (Instagram, TikTok, LinkedIn, etc.).
              </div>
              <div style={{ paddingLeft: 36 }}>
                <a href="https://app.ayrshare.com" target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(46,204,113,0.09)", border: "1px solid rgba(46,204,113,0.22)", color: "#2ECC71", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: "inherit" }}>
                  Open Ayrshare ↗
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ ...S.card, marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ background: "rgba(46,204,113,0.15)", color: "#2ECC71", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>2</span>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>Paste your API key</div>
              </div>
              <div style={{ color: "rgba(255,255,255,0.42)", fontSize: 13.5, lineHeight: 1.65, marginBottom: 16, paddingLeft: 36 }}>
                In the Ayrshare dashboard go to <strong style={{ color: "rgba(255,255,255,0.7)" }}>Settings → API Key</strong> and paste it below.
              </div>
              <div style={{ display: "flex", gap: 9, paddingLeft: 36 }}>
                <input
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && keyInput && loadProfiles(keyInput)}
                  placeholder="Paste your Ayrshare API key…"
                  type="password"
                  style={{ ...S.inp, flex: 1, resize: "none" }}
                />
                <button
                  onClick={() => loadProfiles(keyInput)}
                  disabled={!keyInput || profilesLoading}
                  style={{ ...S.btn, padding: "12px 20px", flexShrink: 0 }}
                >
                  {profilesLoading ? <Dots /> : "Connect →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ INPUT ══════════ */}
        {screen === "input" && (
          <div className="anim">
            <div style={S.h1}>Build Your<br /><span style={{ color: "#2ECC71" }}>Campaign.</span></div>
            <div style={S.sub}>Describe your business, set your goal, pick your platforms, and optionally upload product photos.</div>

            {error && (
              <Notice type="error">
                {error}
                {error.includes("campaigns for this month") && (
                  <button onClick={() => { setError(""); setScreen("billing"); }} style={{ background: "none", border: "none", color: "#FCA5A5", textDecoration: "underline", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", padding: 0, fontWeight: 700 }}>
                    Upgrade now →
                  </button>
                )}
              </Notice>
            )}

            <div style={S.row}>
              {/* Business */}
              <div>
                <label style={S.lbl}>About Your Business</label>
                <textarea rows={3} value={businessDesc} onChange={e => setBusinessDesc(e.target.value)}
                  placeholder="e.g. We sell handcrafted soy candles for home-decor lovers aged 25–45…"
                  style={S.inp} />
              </div>

              {/* Goal */}
              <div>
                <label style={S.lbl}>Ad Goal</label>
                <input value={adGoal} onChange={e => setAdGoal(e.target.value)}
                  placeholder="e.g. Drive holiday sales, launch new product, grow email list…"
                  style={{ ...S.inp, resize: "none" }} />
              </div>

              {/* Social platforms */}
              <div>
                <label style={S.lbl}>Post To ({profiles.length} connected platforms)</label>
                {userPlan === "free" && (
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 8 }}>
                    Free plan: up to {planPlatformLimit} platforms. <button onClick={() => setScreen("billing")} style={{ background: "none", border: "none", color: "#2ECC71", fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 0, fontWeight: 700 }}>Upgrade for all 10 →</button>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {profiles.map(profile => {
                    const sel  = selectedPlatforms.includes(profile.platform);
                    const meta = PLATFORM_META[profile.platform] || { icon: "📱", name: profile.platform };
                    const atLimit = !sel && userPlan === "free" && selectedPlatforms.length >= planPlatformLimit;
                    return (
                      <button key={profile.platform}
                        onClick={() => {
                          if (atLimit) { setScreen("billing"); return; }
                          setSelectedPlatforms(prev =>
                            sel ? prev.filter(p => p !== profile.platform) : [...prev, profile.platform]
                          );
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: 13,
                          background: sel ? "rgba(46,204,113,0.08)" : atLimit ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.025)",
                          border: `1.5px solid ${sel ? "#2ECC71" : atLimit ? "rgba(255,255,255,0.04)" : "rgba(46,204,113,0.12)"}`,
                          borderRadius: 10, padding: "12px 15px", cursor: atLimit ? "not-allowed" : "pointer",
                          fontFamily: "inherit", textAlign: "left", transition: "all 0.2s",
                          opacity: atLimit ? 0.4 : 1,
                        }}>
                        <span style={{ fontSize: 22 }}>{meta.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: sel ? "#2ECC71" : "#fff", fontWeight: 600, fontSize: 14 }}>
                            {profile.username || profile.displayName || profile.platform}
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.32)", fontSize: 12 }}>{meta.name}</div>
                        </div>
                        {atLimit
                          ? <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>🔒</span>
                          : <span style={{ color: sel ? "#2ECC71" : "rgba(255,255,255,0.25)", fontSize: 17 }}>{sel ? "●" : "○"}</span>
                        }
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photos */}
              <div>
                <label style={S.lbl}>Product Photos (optional · up to 4)</label>
                <div
                  onClick={() => fileRef.current.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleImages(e.dataTransfer.files); }}
                  style={{ border: "1.5px dashed rgba(46,204,113,0.28)", borderRadius: 11, padding: 22, textAlign: "center", cursor: "pointer", background: "rgba(46,204,113,0.02)" }}>
                  {uploadedImages.length === 0 ? (
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>📷 Drag & drop or click to upload</span>
                  ) : (
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                      {uploadedImages.map((img, i) => (
                        <div key={i} style={{ position: "relative" }}>
                          <img src={img.data} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }} />
                          <button onClick={e => { e.stopPropagation(); setUploadedImages(p => p.filter((_, j) => j !== i)); }}
                            style={{ position: "absolute", top: -5, right: -5, background: "#FF3B30", border: "none", borderRadius: "50%", width: 17, height: 17, color: "#fff", fontSize: 9, cursor: "pointer", lineHeight: "17px" }}>✕</button>
                        </div>
                      ))}
                      {uploadedImages.length < 4 && (
                        <div style={{ width: 72, height: 72, border: "1.5px dashed rgba(255,255,255,0.14)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: 22 }}>+</div>
                      )}
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleImages(e.target.files)} />
              </div>

              <div>
                <button style={S.btn} onClick={generateAds} disabled={!businessDesc || selectedPlatforms.length === 0}>
                  Generate Ad Concepts →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ GENERATING ══════════ */}
        {screen === "generating" && (
          <div className="anim" style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 50, marginBottom: 18 }}>⚡</div>
            <div style={{ ...S.h1, textAlign: "center" }}>Generating<br /><span style={{ color: "#2ECC71" }}>Your Ads…</span></div>
            <div style={{ color: "rgba(255,255,255,0.38)", marginTop: 14 }}>{loadingMsg}<Dots /></div>
          </div>
        )}

        {/* ══════════ REVIEW ══════════ */}
        {screen === "review" && (
          <div>
            <div style={{ ...S.h1, animation: "up 0.4s ease both" }}>Review &amp; <span style={{ color: "#2ECC71" }}>Approve.</span></div>
            <div style={{ ...S.sub }}>Approve what you love, revise what you don't. Approve at least one to continue.</div>

            {error && <Notice type="error">{error}</Notice>}
            {loading && <Notice type="info">Revising ad… <Dots /></Notice>}

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 26 }}>
              {ads.map((ad, i) => (
                <AdCard key={i} ad={ad} index={i}
                  approved={approvedAds[i]}
                  onApprove={handleApprove}
                  onRevise={handleRevise}
                  revising={revisingIdx === i}
                  feedback={reviseFeedback}
                  setFeedback={setReviseFeedback}
                  busy={loading}
                  imageUrl={adVisuals[i]?.imageUrl}
                  videoUrl={adVisuals[i]?.videoUrl}
                />
              ))}
            </div>

            {approvedCount > 0 && (
              <div style={{ background: "rgba(46,204,113,0.07)", border: "1px solid rgba(46,204,113,0.22)", borderRadius: 13, padding: "17px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700 }}>{approvedCount} ad{approvedCount > 1 ? "s" : ""} approved</div>
                  <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 13 }}>Ready to schedule</div>
                </div>
                <button style={S.btn} onClick={() => setScreen("visuals")}>Create Visuals →</button>
              </div>
            )}

            <button
              style={{ ...S.ghost, textAlign: "center", fontSize: 13, marginTop: 18 }}
              onClick={() => setScreen("input")}
            >
              ← Back to Campaign Setup
            </button>
          </div>
        )}


        {/* ══════════ VISUALS ══════════ */}
        {screen === "visuals" && (
          <div className="anim">
            <div style={S.h1}>Craft Your<br /><span style={{ color: "#2ECC71" }}>Visuals.</span></div>
            <div style={S.sub}>
              AI generates scroll-stopping images and cinematic short videos for each approved ad.
              Both are optional — skip any ad and post copy-only.
            </div>

            {error && <Notice type="error">{error}</Notice>}

            {/* Warn if media-required platforms are selected but some ads have no visual */}
            {(() => {
              const mediaReqSelected = selectedPlatforms.filter(p => MEDIA_REQUIRED_PLATFORMS.includes(p));
              const missingVisual    = ads.some((_, i) => approvedAds[i] && !adVisuals[i]?.imageUrl && !adVisuals[i]?.videoUrl);
              if (!mediaReqSelected.length || !missingVisual) return null;
              const names = mediaReqSelected.map(p => PLATFORM_META[p]?.name || p).join(", ");
              return (
                <Notice type="warn">
                  <strong>{names}</strong> {mediaReqSelected.length === 1 ? "requires" : "require"} an image or video for every post. Ads posted without a visual will be skipped on {mediaReqSelected.length === 1 ? "this platform" : "these platforms"}.
                </Notice>
              );
            })()}

            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 30 }}>
              {ads.map((ad, i) => {
                if (!approvedAds[i]) return null;
                const vis           = adVisuals[i] || {};
                const imgLoading    = vis.imageLoading;
                const imgUrl        = vis.imageUrl;
                const imgPlanLimit  = vis.imagePlanLimit;
                const vidStatus     = vis.videoStatus;
                const vidUrl        = vis.videoUrl;
                const vidPlanLimit  = vidStatus === "plan_limit";
                const vidProcessing = vidStatus === "processing" || vidStatus === "submitting";

                return (
                  <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(46,204,113,0.12)", borderRadius: 16, overflow: "hidden" }}>
                    {/* Ad info strip */}
                    <div style={{ padding: "16px 22px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ color: "#2ECC71", fontSize: 9.5, fontWeight: 800, letterSpacing: 2.5, marginBottom: 5 }}>VARIANT {i + 1}</div>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 14.5, lineHeight: 1.35, marginBottom: 4 }}>{ad.headline}</div>
                      <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 12.5, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ad.body}</div>
                    </div>

                    {/* Image section */}
                    <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: imgUrl ? 14 : 0 }}>
                        <div>
                          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>🖼 AI Image</div>
                          {!imgUrl && !imgLoading && !imgPlanLimit && (
                            <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 12 }}>
                              {uploadedImages.length > 0 ? "Transforms your product photo" : "Generates from your ad copy"}
                            </div>
                          )}
                        </div>
                        {!imgLoading && !imgUrl && !imgPlanLimit && (
                          <button
                            onClick={() => generateImage(i)}
                            style={{ background: "linear-gradient(135deg, #1A8A3C 0%, #2ECC71 100%)", color: "#fff", border: "none", borderRadius: 9, padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 3px 14px rgba(46,204,113,0.28)", flexShrink: 0 }}>
                            ✨ Generate
                          </button>
                        )}
                        {imgLoading && (
                          <div style={{ color: "#2ECC71", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                            Generating<Dots />
                          </div>
                        )}
                        {imgUrl && !imgLoading && (
                          <button
                            onClick={() => generateImage(i)}
                            style={{ background: "transparent", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 13px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                            ↻ Regenerate
                          </button>
                        )}
                      </div>
                      {imgPlanLimit && (
                        <div style={{ borderRadius: 10, padding: "18px 20px", background: "rgba(77,255,143,0.04)", border: "1.5px solid rgba(77,255,143,0.2)", display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                          <div style={{ fontSize: 26, flexShrink: 0 }}>🔒</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "#4DFF8F", fontWeight: 700, fontSize: 13, marginBottom: 3 }}>Pro Feature</div>
                            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12.5, lineHeight: 1.55 }}>AI image generation is available on Pro and Agency plans.</div>
                          </div>
                          <button
                            onClick={() => setScreen("billing")}
                            style={{ background: "linear-gradient(135deg, #1A8A3C, #2ECC71)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 16px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap" }}>
                            Upgrade →
                          </button>
                        </div>
                      )}
                      {imgUrl && (
                        <div style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "16/9", background: "#000" }}>
                          <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </div>
                      )}
                      {imgLoading && (
                        <div style={{ borderRadius: 10, aspectRatio: "16/9", background: "rgba(46,204,113,0.04)", border: "1.5px dashed rgba(46,204,113,0.2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                          <div style={{ fontSize: 32, animation: "glowPulse 1.6s ease-in-out infinite" }}>✨</div>
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Generating your ad creative…</div>
                        </div>
                      )}
                    </div>

                    {/* Video section */}
                    <div style={{ padding: "18px 22px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: vidUrl ? 14 : 0 }}>
                        <div>
                          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>🎬 Short Video</div>
                          {!vidUrl && !vidProcessing && !vidPlanLimit && (
                            <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 12 }}>
                              {imgUrl ? "Cinematic motion from your image · ~30–60s" : "Generate an image first to unlock"}
                            </div>
                          )}
                        </div>
                        {!vidProcessing && !vidUrl && !vidPlanLimit && (
                          <button
                            onClick={() => generateVideo(i)}
                            disabled={!imgUrl}
                            style={{
                              background: imgUrl ? "rgba(99,179,237,0.12)" : "rgba(255,255,255,0.03)",
                              color: imgUrl ? "#93C5FD" : "rgba(255,255,255,0.2)",
                              border: `1px solid ${imgUrl ? "rgba(99,179,237,0.35)" : "rgba(255,255,255,0.07)"}`,
                              borderRadius: 9, padding: "10px 18px", fontWeight: 700, fontSize: 13,
                              cursor: imgUrl ? "pointer" : "not-allowed", fontFamily: "inherit", flexShrink: 0,
                            }}>
                            🎬 Generate
                          </button>
                        )}
                        {vidProcessing && (
                          <div style={{ color: "#93C5FD", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                            {vidStatus === "submitting" ? "Submitting" : "Processing"}<Dots />
                          </div>
                        )}
                        {vidUrl && !vidProcessing && (
                          <button
                            onClick={() => generateVideo(i)}
                            style={{ background: "transparent", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 13px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                            ↻ Regenerate
                          </button>
                        )}
                        {vidStatus === "failed" && (
                          <span style={{ color: "#FCA5A5", fontSize: 12 }}>Failed — try again</span>
                        )}
                      </div>
                      {vidPlanLimit && (
                        <div style={{ borderRadius: 10, padding: "18px 20px", background: "rgba(77,255,143,0.04)", border: "1.5px solid rgba(77,255,143,0.2)", display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                          <div style={{ fontSize: 26, flexShrink: 0 }}>🔒</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "#4DFF8F", fontWeight: 700, fontSize: 13, marginBottom: 3 }}>Pro Feature</div>
                            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12.5, lineHeight: 1.55 }}>AI video generation is available on Pro and Agency plans.</div>
                          </div>
                          <button
                            onClick={() => setScreen("billing")}
                            style={{ background: "linear-gradient(135deg, #1A8A3C, #2ECC71)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 16px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap" }}>
                            Upgrade →
                          </button>
                        </div>
                      )}
                      {vidProcessing && (
                        <div style={{ borderRadius: 10, aspectRatio: "16/9", background: "rgba(99,179,237,0.04)", border: "1.5px dashed rgba(99,179,237,0.2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                          <div style={{ fontSize: 32, animation: "glowPulse 1.6s ease-in-out infinite" }}>🎬</div>
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Generating cinematic video…</div>
                          <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 11 }}>This takes 30–60 seconds</div>
                        </div>
                      )}
                      {vidUrl && (
                        <div style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "16/9", background: "#000" }}>
                          <video src={vidUrl} autoPlay loop muted playsInline controls style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA row */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button style={S.btn} onClick={() => setScreen("schedule")}>
                Set Schedule →
              </button>
              <button style={{ ...S.ghost, textAlign: "center", fontSize: 13 }} onClick={() => setScreen("review")}>
                ← Back to Review
              </button>
            </div>
          </div>
        )}

        {/* ══════════ SCHEDULE ══════════ */}
        {screen === "schedule" && (
          <div className="anim">
            <div style={S.h1}>Set Your<br /><span style={{ color: "#2ECC71" }}>Posting Schedule.</span></div>
            <div style={S.sub}>
              Mercavex will publish your {approvedCount} approved ad{approvedCount > 1 ? "s" : ""} to {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? "s" : ""} via Ayrshare.
            </div>

            {/* Post Now — full-width featured option */}
            {(() => {
              const sc = SCHEDULES[0]; // immediately
              const sel = schedule === sc.id;
              return (
                <button key={sc.id} onClick={() => setSchedule(sc.id)} style={{
                  display: "block", width: "100%", marginBottom: 11,
                  background: sel ? "rgba(46,204,113,0.09)" : "rgba(255,255,255,0.02)",
                  border: `1.5px solid ${sel ? "#2ECC71" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 12, padding: "16px 20px", textAlign: "left",
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <span style={{ fontSize: 24 }}>{sc.icon}</span>
                  <span>
                    <div style={{ color: sel ? "#2ECC71" : "#fff", fontWeight: 700, fontSize: 14 }}>{sc.label}</div>
                    <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 12, marginTop: 2 }}>{sc.desc}</div>
                  </span>
                </button>
              );
            })()}

            {/* Cadence options — 2×2 grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 24 }}>
              {SCHEDULES.slice(1).map(sc => {
                const sel = schedule === sc.id;
                return (
                  <button key={sc.id} onClick={() => setSchedule(sc.id)} style={{
                    background: sel ? "rgba(46,204,113,0.09)" : "rgba(255,255,255,0.02)",
                    border: `1.5px solid ${sel ? "#2ECC71" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 12, padding: "18px 16px", textAlign: "left",
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 7 }}>{sc.icon}</div>
                    <div style={{ color: sel ? "#2ECC71" : "#fff", fontWeight: 700, fontSize: 14 }}>{sc.label}</div>
                    <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 12, marginTop: 3 }}>{sc.desc}</div>
                  </button>
                );
              })}
            </div>

            {schedule !== "immediately" && (
            <div style={{ marginBottom: 22 }}>
              <label style={S.lbl}>Preferred Posting Time</label>
              <input type="time" value={postTime} onChange={e => setPostTime(e.target.value)}
                style={{ ...S.inp, width: "auto", colorScheme: "dark" }} />
            </div>
            )}

            <div style={{ marginBottom: 26 }}>
              <label style={S.lbl}>Publishing to</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {selectedPlatforms.map(p => (
                  <span key={p} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(46,204,113,0.15)", borderRadius: 8, padding: "6px 13px", color: "rgba(255,255,255,0.6)", fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
                    {PLATFORM_META[p]?.icon || "📱"} {PLATFORM_META[p]?.name || p}
                  </span>
                ))}
              </div>
            </div>

            {schedule && (
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 18px", marginBottom: 22, fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                {schedule === "immediately" ? (
                  <>🚀 <strong style={{ color: "rgba(255,255,255,0.7)" }}>Preview:</strong> All {approvedCount} post{approvedCount > 1 ? "s" : ""} will be published <strong style={{ color: "#2ECC71" }}>immediately</strong> as soon as you activate.</>
                ) : (
                  <>📅 <strong style={{ color: "rgba(255,255,255,0.7)" }}>Preview:</strong> First post goes out{" "}
                  <strong style={{ color: "#fff" }}>{new Date(getScheduledDates(schedule, postTime, 1)[0]).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} at {postTime}</strong>.
                  Subsequent posts follow the {SCHEDULES.find(s => s.id === schedule)?.label.toLowerCase()} cadence.</>
                )}
              </div>
            )}

            <button style={S.btn} onClick={publishCampaign} disabled={!schedule}>
              🚀 Activate Campaign via Ayrshare
            </button>
            <button
              style={{ ...S.ghost, textAlign: "center", fontSize: 13, marginTop: 12 }}
              onClick={() => setScreen("visuals")}
            >
              ← Back to Visuals
            </button>
          </div>
        )}

        {/* ══════════ PUBLISHING ══════════ */}
        {screen === "publishing" && (
          <div className="anim" style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, display: "inline-block", animation: "spin 2s linear infinite" }}>⚙️</div>
            <div style={{ ...S.h1, textAlign: "center", marginTop: 18 }}>Scheduling<br /><span style={{ color: "#2ECC71" }}>Your Posts…</span></div>
            <div style={{ color: "rgba(255,255,255,0.38)", marginTop: 14 }}>{loadingMsg}<Dots /></div>
          </div>
        )}

        {/* ══════════ DONE ══════════ */}
        {screen === "done" && (
          <div className="anim">
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
            <div style={S.h1}>Campaign<br /><span style={{ color: "#2ECC71" }}>Activated!</span></div>
            <div style={S.sub}>Posts are scheduled via Ayrshare and will publish automatically on your chosen cadence.</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 26 }}>
              {publishLog.map((entry, i) => {
                const isOk      = entry.status === "scheduled";
                const isPartial = entry.status === "partial";
                const bg     = isOk ? "rgba(34,197,94,0.06)"  : isPartial ? "rgba(255,181,0,0.06)"  : "rgba(255,59,48,0.06)";
                const border = isOk ? "rgba(34,197,94,0.2)"   : isPartial ? "rgba(255,181,0,0.25)"  : "rgba(255,59,48,0.2)";
                const colour = isOk ? "#86EFAC"                : isPartial ? "#FCD34D"               : "#FCA5A5";
                const label  = isOk ? "✓ Queued"              : isPartial ? "⚠ Partial"             : "✕ Error";
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 13,
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: 10, padding: "13px 16px",
                    animation: `up 0.4s ${i * 0.06}s ease both`, opacity: 0,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#fff", fontWeight: 600, fontSize: 13.5, marginBottom: 3 }}>{entry.adTitle}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {(entry.platforms || []).map(p => (
                          <span key={p} style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                            {PLATFORM_META[p]?.icon || "📱"} {PLATFORM_META[p]?.name || p}
                          </span>
                        ))}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 3 }}>
                        {entry.scheduleDate ? new Date(entry.scheduleDate).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Immediate"}
                      </div>
                      {isPartial && (
                        <div style={{ color: "#FCD34D", fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>{entry.message}</div>
                      )}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: colour, flexShrink: 0 }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <Notice type="success">
              View and manage all scheduled posts in your <strong>Ayrshare dashboard</strong> at app.ayrshare.com.
            </Notice>

            <button style={S.btn} onClick={() => {
              setScreen("input"); setAds([]); setApprovedAds([]);
              setSchedule(null); setAdGoal("");
              setUploadedImages([]); setPublishLog([]); setAdVisuals({});
            }}>+ New Campaign</button>
          </div>
        )}

        {/* ══════════ CAMPAIGN DASHBOARD ══════════ */}
        {screen === "dashboard" && (
          <div className="anim">
            {/* Page header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={S.h1}>Campaign<br /><span style={{ color: "#2ECC71" }}>History.</span></div>
                <div style={S.sub}>
                  {campaigns.length === 0
                    ? "Your published campaigns will appear here."
                    : `${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""} on record.`}
                </div>
              </div>
              <button style={S.btn} onClick={() => setScreen(ayrshareKey ? "input" : "connect")}>
                + New Campaign
              </button>
            </div>

            {/* Loading */}
            {campaignsLoading && (
              <div style={{ textAlign: "center", padding: "70px 0", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                Loading campaigns<Dots />
              </div>
            )}

            {/* Empty state */}
            {!campaignsLoading && campaigns.length === 0 && (
              <div style={{ textAlign: "center", padding: "70px 30px", border: "1.5px dashed rgba(46,204,113,0.13)", borderRadius: 20, background: "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: 46, marginBottom: 16 }}>📋</div>
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No campaigns yet</div>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13.5, lineHeight: 1.65, marginBottom: 26 }}>
                  Once you activate a campaign, it will be saved here<br />so you can track, duplicate, or remove it.
                </div>
                <button style={S.btn} onClick={() => setScreen(ayrshareKey ? "input" : "connect")}>
                  Create Your First Campaign →
                </button>
              </div>
            )}

            {/* Campaign cards */}
            {!campaignsLoading && campaigns.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {campaigns.map((campaign, i) => {
                  const log = campaign.publish_log || [];

                  // Resolve live status for each post entry
                  const resolveStatus = (post) => {
                    if (!post.ayrshareId || !liveStatuses[post.ayrshareId]) return post.status;
                    const live = liveStatuses[post.ayrshareId].status;
                    if (live === "success")   return "success";
                    if (live === "partial")   return "partial";
                    if (live === "error")     return "error";
                    // Ayrshare uses "queued" for immediate posts in-flight
                    if (live === "queued")    return "scheduled";
                    // If Ayrshare still says "scheduled" but the post date has passed → treat as published
                    if (live === "scheduled" && post.scheduleDate && new Date(post.scheduleDate) < new Date()) return "success";
                    return post.status; // fallback to stored
                  };

                  const resolvedStatuses = log.map(resolveStatus);
                  const publishedCount = resolvedStatuses.filter(s => s === "success").length;
                  const queuedCount    = resolvedStatuses.filter(s => s === "scheduled").length;
                  const partialCount   = resolvedStatuses.filter(s => s === "partial").length;
                  const errorCount     = resolvedStatuses.filter(s => s === "error").length;
                  const schedInfo      = SCHEDULES.find(s => s.id === campaign.schedule_id);
                  const isPending      = deleteConfirm === campaign.id;

                  return (
                    <div key={campaign.id} style={{
                      background:    "rgba(255,255,255,0.025)",
                      border:        `1.5px solid ${isPending ? "rgba(255,59,48,0.35)" : "rgba(46,204,113,0.1)"}`,
                      borderRadius:  16,
                      padding:       "22px 24px",
                      animation:     `up 0.4s ${i * 0.07}s ease both`,
                      opacity:       0,
                      transition:    "border-color 0.25s",
                    }}>

                      {/* ── Card top row ── */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 13, gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.35, marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {(campaign.business_desc || "Untitled Campaign").substring(0, 68)}
                            {(campaign.business_desc || "").length > 68 ? "…" : ""}
                          </div>
                          {campaign.ad_goal && (
                            <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              🎯 {campaign.ad_goal}
                            </div>
                          )}
                        </div>
                        <div style={{ flexShrink: 0, textAlign: "right" }}>
                          <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 11.5, fontWeight: 600 }}>
                            {new Date(campaign.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.16)", fontSize: 10.5, marginTop: 2 }}>
                            {new Date(campaign.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>

                      {/* ── Platform + schedule chips ── */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 15 }}>
                        {(campaign.platforms || []).map(p => (
                          <span key={p} style={{ background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.2)", color: "#2ECC71", padding: "3px 11px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                            {PLATFORM_META[p]?.icon} {PLATFORM_META[p]?.name || p}
                          </span>
                        ))}
                        {schedInfo && (
                          <span style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.32)", padding: "3px 11px", borderRadius: 20, fontSize: 11.5 }}>
                            {schedInfo.icon} {schedInfo.label}
                          </span>
                        )}
                      </div>

                      {/* ── Post status rows ── */}
                      {log.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 16 }}>
                          {log.map((post, j) => {
                            const rs = resolvedStatuses[j] || post.status;
                            const isPublished = rs === "success";
                            const isQueued    = rs === "scheduled";
                            const isPartial   = rs === "partial";
                            const dotColor    = isPublished ? "#2ECC71" : isQueued ? "#60A5FA" : isPartial ? "#FCD34D" : "#FF3B30";
                            const dotShadow   = isPublished ? "0 0 5px rgba(46,204,113,0.5)" : isQueued ? "0 0 5px rgba(96,165,250,0.4)" : isPartial ? "0 0 5px rgba(255,181,0,0.4)" : "none";
                            const labelColor  = isPublished ? "#86EFAC" : isQueued ? "#93C5FD" : isPartial ? "#FCD34D" : "#FCA5A5";
                            const labelText   = isPublished ? "✓ Published" : isQueued ? "◦ Queued" : isPartial ? "⚠ Partial" : "✕ Failed";

                            return (
                            <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "8px 12px" }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: dotColor, boxShadow: dotShadow }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {post.adTitle || "Post"}
                                </div>
                                {post.scheduleDate && (
                                  <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 11, marginTop: 1 }}>
                                    {new Date(post.scheduleDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                    {" · "}
                                    {new Date(post.scheduleDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                )}
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, color: labelColor }}>
                                {labelText}
                              </span>
                            </div>
                            );
                          })}
                        </div>
                      )}

                      {/* ── Footer: stats + actions ── */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                          {publishedCount > 0 && (
                            <span style={{ color: "#86EFAC", fontSize: 12, fontWeight: 700 }}>✓ {publishedCount} published</span>
                          )}
                          {queuedCount > 0 && (
                            <span style={{ color: "#93C5FD", fontSize: 12, fontWeight: 700 }}>◦ {queuedCount} queued</span>
                          )}
                          {publishedCount === 0 && queuedCount === 0 && errorCount === 0 && partialCount === 0 && (
                            <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 12, fontWeight: 700 }}>No posts</span>
                          )}
                          {partialCount > 0 && (
                            <span style={{ color: "#FCD34D", fontSize: 12, fontWeight: 700 }}>⚠ {partialCount} partial</span>
                          )}
                          {errorCount > 0 && (
                            <span style={{ color: "#FCA5A5", fontSize: 12, fontWeight: 700 }}>✕ {errorCount} failed</span>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {!isPending ? (
                            <>
                              <button
                                onClick={() => duplicateCampaign(campaign)}
                                style={{ background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.25)", color: "#2ECC71", borderRadius: 8, padding: "7px 15px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                                ⟳ Duplicate
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(campaign.id)}
                                style={{ background: "rgba(255,59,48,0.07)", border: "1px solid rgba(255,59,48,0.18)", color: "#FF6B6B", borderRadius: 8, padding: "7px 15px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                Delete
                              </button>
                            </>
                          ) : (
                            <>
                              <span style={{ color: "rgba(255,255,255,0.42)", fontSize: 12.5, fontStyle: "italic" }}>Delete this campaign?</span>
                              <button
                                onClick={() => deleteCampaign(campaign.id)}
                                style={{ background: "rgba(255,59,48,0.18)", border: "1px solid rgba(255,59,48,0.38)", color: "#FF6B6B", borderRadius: 8, padding: "7px 15px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                Yes, Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", borderRadius: 8, padding: "7px 15px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════ ANALYTICS ══════════ */}
        {screen === "analytics" && (() => {
          const posts            = analytics?.posts || [];
          const isBasic          = analytics?.isBasic ?? (userPlan === "free");
          const totalImpressions = posts.reduce((s, p) => s + p.impressions, 0);
          const totalEngagements = posts.reduce((s, p) => s + p.engagements, 0);
          const totalClicks      = posts.reduce((s, p) => s + (p.clicks || 0), 0);
          const avgEngRate       = totalImpressions > 0
            ? ((totalEngagements / totalImpressions) * 100).toFixed(1)
            : null;
          const platformEntries  = Object.entries(analytics?.platforms || {});
          const trend            = analytics?.trend || [];
          const maxTrendVal      = Math.max(...trend.map(t => t.engagements), 1);
          const topPost          = analytics?.topPost;

          const StatCard = ({ label, value, sub, accent, locked }) => (
            <div style={{ background: locked ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.025)", border: `1px solid ${locked ? "rgba(255,255,255,0.05)" : "rgba(46,204,113,0.1)"}`, borderRadius: 14, padding: "20px 22px", flex: 1, minWidth: 130, opacity: locked ? 0.5 : 1, position: "relative" }}>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 800, letterSpacing: 2.2, textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
              {locked
                ? <div style={{ fontSize: 22 }}>🔒</div>
                : <div style={{ color: accent || "#fff", fontSize: 28, fontWeight: 800, letterSpacing: -1, lineHeight: 1, marginBottom: 5 }}>{value}</div>
              }
              {sub && !locked && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11.5 }}>{sub}</div>}
            </div>
          );

          // Agency white-label HTML report export
          const exportReport = () => {
            const generated = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
            const platRows  = platformEntries
              .sort(([,a],[,b]) => b.impressions - a.impressions)
              .map(([p, m]) => {
                const er = m.impressions > 0 ? ((m.engagements / m.impressions) * 100).toFixed(1) : "0.0";
                return `<tr><td><strong>${p.charAt(0).toUpperCase() + p.slice(1)}</strong></td><td>${m.posts}</td><td>${m.impressions.toLocaleString()}</td><td>${m.engagements.toLocaleString()}</td><td>${er}%</td><td>${(m.clicks||0).toLocaleString()}</td></tr>`;
              }).join("");
            const postRows = [...posts].sort((a,b) => b.engagements - a.engagements).map(p => `
              <tr>
                <td><strong>${p.adTitle || "Post"}</strong></td>
                <td>${p.scheduleDate ? new Date(p.scheduleDate).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—"}</td>
                <td>${p.impressions.toLocaleString()}</td>
                <td>${p.engagements.toLocaleString()}</td>
                <td>${p.engagementRate}%</td>
                <td>${(p.clicks||0).toLocaleString()}</td>
              </tr>`).join("");

            const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/>
<title>Campaign Performance Report — ${generated}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'DM Sans','Segoe UI',Arial,sans-serif;background:#fff;color:#111;padding:48px 56px;max-width:920px;margin:0 auto}
  .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #2ECC71;padding-bottom:20px;margin-bottom:32px}
  .logo{font-size:22px;font-weight:800;letter-spacing:-0.5px}.logo span{color:#2ECC71}
  .meta{text-align:right;font-size:12px;color:#888;line-height:1.6}
  h2{font-size:11px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#2ECC71;margin:28px 0 12px}
  .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:8px}
  .stat{background:#f7fdf9;border:1px solid #d3f5e0;border-radius:10px;padding:16px 18px}
  .stat .val{font-size:26px;font-weight:800;color:#111;letter-spacing:-1px}
  .stat .lbl{font-size:10px;color:#888;margin-top:4px;text-transform:uppercase;letter-spacing:1px}
  table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px}
  th{background:#f0fdf4;color:#16a34a;font-weight:800;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;padding:10px 14px;text-align:left;border-bottom:2px solid #d3f5e0}
  td{padding:11px 14px;border-bottom:1px solid #f5f5f5;vertical-align:middle}
  tr:last-child td{border-bottom:none}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#ccc;display:flex;justify-content:space-between}
  @media print{body{padding:32px}}
</style></head>
<body>
  <div class="header">
    <div class="logo">Mercavex <span>Analytics</span></div>
    <div class="meta">Generated: ${generated}<br/>Powered by OphidianAI Agency</div>
  </div>
  <h2>Overview</h2>
  <div class="stat-grid">
    <div class="stat"><div class="val">${analytics.totalPosts}</div><div class="lbl">Posts Tracked</div></div>
    <div class="stat"><div class="val">${totalImpressions.toLocaleString()}</div><div class="lbl">Total Impressions</div></div>
    <div class="stat"><div class="val">${totalEngagements.toLocaleString()}</div><div class="lbl">Engagements</div></div>
    <div class="stat"><div class="val">${totalClicks.toLocaleString()}</div><div class="lbl">Clicks</div></div>
  </div>
  <div class="stat-grid" style="grid-template-columns:repeat(2,1fr);max-width:300px">
    <div class="stat"><div class="val">${avgEngRate ? avgEngRate + "%" : "—"}</div><div class="lbl">Avg Eng. Rate</div></div>
    <div class="stat"><div class="val">${platformEntries.length}</div><div class="lbl">Platforms</div></div>
  </div>
  ${topPost ? `<h2>Top Performing Post</h2>
  <table><tr><th>Post</th><th>Impressions</th><th>Engagements</th><th>Eng. Rate</th><th>Clicks</th></tr>
  <tr><td><strong>${topPost.adTitle || "Post"}</strong></td><td>${topPost.impressions.toLocaleString()}</td><td>${topPost.engagements.toLocaleString()}</td><td>${topPost.engagementRate}%</td><td>${(topPost.clicks||0).toLocaleString()}</td></tr>
  </table>` : ""}
  <h2>Platform Breakdown</h2>
  <table><tr><th>Platform</th><th>Posts</th><th>Impressions</th><th>Engagements</th><th>Eng. Rate</th><th>Clicks</th></tr>${platRows}</table>
  <h2>All Posts</h2>
  <table><tr><th>Post</th><th>Date</th><th>Impressions</th><th>Engagements</th><th>Rate</th><th>Clicks</th></tr>${postRows}</table>
  <div class="footer"><span>Mercavex by OphidianAI — Confidential Client Report</span><span>${generated}</span></div>
</body></html>`;

            const blob = new Blob([html], { type: "text/html" });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href     = url;
            a.download = `mercavex-report-${new Date().toISOString().split("T")[0]}.html`;
            a.click();
            URL.revokeObjectURL(url);
          };

          return (
            <div className="anim">
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={S.h1}>Performance<br /><span style={{ color: "#2ECC71" }}>Analytics.</span></div>
                  <div style={S.sub}>
                    {analyticsLoading
                      ? "Fetching data\u2026"
                      : !analytics || analytics.totalPosts === 0
                      ? "Analytics appear once your scheduled posts go live."
                      : `Tracking ${analytics.totalPosts} post${analytics.totalPosts !== 1 ? "s" : ""} across ${platformEntries.length} platform${platformEntries.length !== 1 ? "s" : ""}.`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {planWhitelabelEnabled && analytics && analytics.totalPosts > 0 && (
                    <button onClick={exportReport} style={{ ...S.ghost, fontSize: 12.5, padding: "10px 18px", color: "#4DFF8F", borderColor: "rgba(77,255,143,0.3)", display: "flex", alignItems: "center", gap: 7 }}>
                      ⬇ Export Report <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, background: "rgba(77,255,143,0.12)", padding: "2px 6px", borderRadius: 4 }}>WHITE-LABEL</span>
                    </button>
                  )}
                  <button style={{ ...S.ghost, fontSize: 12.5, padding: "10px 18px" }} onClick={loadAnalytics} disabled={analyticsLoading}>
                    {analyticsLoading ? "Refreshing\u2026" : "\u21bb Refresh"}
                  </button>
                </div>
              </div>

              {/* Free plan notice */}
              {isBasic && analytics && analytics.totalPosts > 0 && (
                <div style={{ background: "rgba(46,204,113,0.04)", border: "1px solid rgba(46,204,113,0.18)", borderRadius: 12, padding: "14px 18px", marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.5 }}>
                    <strong style={{ color: "#2ECC71" }}>Basic Analytics</strong> — showing your last 30 days, up to 5 posts. Clicks, trend charts, and full history require Pro.
                  </div>
                  <button onClick={() => setScreen("billing")} style={{ background: "linear-gradient(135deg,#1A8A3C,#2ECC71)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                    Upgrade →
                  </button>
                </div>
              )}

              {/* Loading */}
              {analyticsLoading && (
                <div style={{ textAlign: "center", padding: "70px 0", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                  Fetching analytics<Dots />
                </div>
              )}

              {/* Empty state */}
              {!analyticsLoading && (!analytics || analytics.totalPosts === 0) && (
                <div style={{ textAlign: "center", padding: "70px 30px", border: "1.5px dashed rgba(46,204,113,0.13)", borderRadius: 20, background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ fontSize: 46, marginBottom: 16 }}>&#128202;</div>
                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No analytics yet</div>
                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13.5, lineHeight: 1.7, marginBottom: 26 }}>
                    Metrics appear once your scheduled posts go live.<br />
                    Posts need to be published before Ayrshare can report data.
                  </div>
                  <button style={S.btn} onClick={() => setScreen(ayrshareKey ? "input" : "connect")}>
                    Create a Campaign →
                  </button>
                </div>
              )}

              {/* Data */}
              {!analyticsLoading && analytics && analytics.totalPosts > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

                  {/* Stat cards row */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <StatCard label="Impressions"   value={totalImpressions.toLocaleString()} sub="across all posts"        accent="#fff"    />
                    <StatCard label="Engagements"   value={totalEngagements.toLocaleString()} sub="likes, comments, shares" accent="#2ECC71" />
                    <StatCard label="Avg Eng. Rate" value={avgEngRate ? `${avgEngRate}%` : "\u2014"}  sub="engagements / impressions" accent="#86EFAC" />
                    <StatCard label="Clicks"        value={totalClicks.toLocaleString()}      sub="link clicks"              accent="#93C5FD" locked={isBasic} />
                  </div>

                  {/* Top performer */}
                  {topPost && (
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12 }}>Top Performer</div>
                      <div style={{ background: "rgba(46,204,113,0.04)", border: "1px solid rgba(46,204,113,0.15)", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 30 }}>🏆</div>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{topPost.adTitle || "Post"}</div>
                          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 2 }}>
                            {topPost.engagements.toLocaleString()} engagements · {topPost.engagementRate}% rate
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Platform breakdown */}
                  {platformEntries.length > 0 && (
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 }}>Platform Breakdown</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {platformEntries.sort(([,a],[,b]) => b.impressions - a.impressions).map(([platform, metrics]) => {
                            const engRate = metrics.impressions > 0
                              ? ((metrics.engagements / metrics.impressions) * 100).toFixed(1)
                              : "0.0";
                            return (
                              <div key={platform} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(46,204,113,0.08)", borderRadius: 12, padding: "16px 18px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 18 }}>{PLATFORM_META[platform]?.icon || "📱"}</span>
                                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{PLATFORM_META[platform]?.name || platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                                  </div>
                                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{metrics.posts} post{metrics.posts !== 1 ? "s" : ""}</div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: isBasic ? "repeat(3,1fr)" : "repeat(4,1fr)", gap: 10 }}>
                                  {[
                                    { label: "Impressions", val: metrics.impressions.toLocaleString(), color: "#fff"    },
                                    { label: "Engagements", val: metrics.engagements.toLocaleString(), color: "#2ECC71" },
                                    { label: "Eng. Rate",   val: `${engRate}%`,                        color: "#86EFAC" },
                                    ...(!isBasic ? [{ label: "Clicks", val: (metrics.clicks || 0).toLocaleString(), color: "#93C5FD" }] : []),
                                  ].map(({ label, val, color }) => (
                                    <div key={label} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "10px 12px" }}>
                                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
                                      <div style={{ color, fontSize: 17, fontWeight: 800 }}>{val}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Engagement trend — Pro/Agency only */}
                  {!isBasic && trend.length > 1 && (
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 }}>Engagement Trend</div>
                      <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(46,204,113,0.1)", borderRadius: 14, padding: "22px 18px" }}>
                        <div style={{ overflowX: "auto" }}>
                          <svg width={Math.max(trend.length * 60, 320)} height={150} style={{ display: "block", overflow: "visible" }}>
                            <defs>
                              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%"   stopColor="#2ECC71" stopOpacity="1"   />
                                <stop offset="100%" stopColor="#1A8A3C" stopOpacity="0.55" />
                              </linearGradient>
                            </defs>
                            {trend.map((t, i) => {
                              const barH  = Math.max(Math.round((t.engagements / maxTrendVal) * 96), 3);
                              const x     = i * 60 + 14;
                              const y     = 106 - barH;
                              const lbl   = new Date(t.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
                              return (
                                <g key={t.date}>
                                  <rect x={x} y={y} width={36} height={barH} rx={5} fill="url(#barGrad)" opacity={0.9} />
                                  <text x={x + 18} y={122} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9} fontFamily="DM Sans,sans-serif">{lbl}</text>
                                  {t.engagements > 0 && (
                                    <text x={x + 18} y={y - 5} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={9.5} fontFamily="DM Sans,sans-serif">
                                      {t.engagements.toLocaleString()}
                                    </text>
                                  )}
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 4, textAlign: "right" }}>Weekly engagements</div>
                      </div>
                    </div>
                  )}

                  {/* Trend upgrade prompt for Free */}
                  {isBasic && (
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1.5px dashed rgba(46,204,113,0.2)", borderRadius: 14, padding: "28px 24px", textAlign: "center" }}>
                      <div style={{ fontSize: 28, marginBottom: 10 }}>📈</div>
                      <div style={{ color: "rgba(255,255,255,0.55)", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Engagement Trend — Pro Feature</div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginBottom: 18 }}>See weekly engagement trends, full historical data, and click tracking.</div>
                      <button onClick={() => setScreen("billing")} style={{ background: "linear-gradient(135deg,#1A8A3C,#2ECC71)", color: "#fff", border: "none", borderRadius: 9, padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                        Upgrade to Pro →
                      </button>
                    </div>
                  )}

                  {/* All posts table */}
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 }}>
                      All Posts {isBasic && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, letterSpacing: 1, fontWeight: 600 }}>(last 30 days · 5 max)</span>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[...posts].sort((a, b) => b.engagements - a.engagements).map((post, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "13px 16px", flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: 160 }}>
                            <div style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.adTitle || "Post"}</div>
                            {post.scheduleDate && (
                              <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 11, marginTop: 2 }}>
                                {new Date(post.scheduleDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
                            {[
                              { label: "Impr.",  val: post.impressions.toLocaleString(), color: "#fff"    },
                              { label: "Eng.",   val: post.engagements.toLocaleString(), color: "#2ECC71" },
                              { label: "Rate",   val: `${post.engagementRate}%`,         color: "#86EFAC" },
                              ...(!isBasic ? [{ label: "Clicks", val: (post.clicks || 0).toLocaleString(), color: "#93C5FD" }] : []),
                            ].map(({ label, val, color }) => (
                              <div key={label} style={{ textAlign: "right" }}>
                                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>{label}</div>
                                <div style={{ color, fontSize: 14, fontWeight: 700 }}>{val}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })()}

        {/* ══════════ ACCOUNT ══════════ */}
        {screen === "account" && (
          <AccountScreen user={user} session={session} userPlan={userPlan} onProfileUpdate={(name) => {
            // Optionally refresh user display
          }} />
        )}

        {/* ══════════ BILLING ══════════ */}
        {screen === "billing" && (
          <BillingScreen user={user} session={session} userPlan={userPlan} planPeriodEnd={planPeriodEnd} hasStripeCustomer={hasStripeCustomer} campaignsUsed={campaignsThisMonth} />
        )}

        {/* ══════════ AGENCY ══════════ */}
        {screen === "agency" && (
          <AgencyScreen session={session} user={user} userPlan={userPlan} campaigns={campaigns} />
        )}

      </div>

      {/* ══════════ HELPER CHATBOT ══════════ */}
      <HelperChat session={session} />

    </div>
  );
}
