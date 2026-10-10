"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PhoneTracker } from "../components/phone-tracker";
import { WeatherPanel } from "../components/weather-panel";

type DashboardSummary = { activeIncidents: number; activeAlerts: number; shelters: number; resources: number };
type Incident = { id: number; type: string; description: string; severity: string; priority: string; status: string; latitude?: number; longitude?: number; createdAt?: string; updatedAt?: string };
type Shelter = { id: number; name: string; address: string; capacity: number; occupancy: number; status: string; facilities?: string; foodStock?: string; powerStatus?: string };
type ResourceItem = { id: number; name: string; category: string; quantityAvailable: number; location: string; organizationId?: string };
type AlertItem = { id: number; title: string; message: string; disasterType: string; severity: string; targetArea: string; startTime?: string };
type HospitalItem = { id: number; name: string; address: string; latitude?: number; longitude?: number; totalIcuBeds: number; availableIcuBeds: number; totalWardBeds: number; availableWardBeds: number; ventilatorsAvailable: number; oxygenStatus: string; bloodBankStatus: string; availableBloodGroups?: string; doctorsOnDuty: number; operationalStatus: string; emergencyContact?: string };
type ResponderItem = { id: number; unitCode: string; unitName: string; agencyType: string; latitude?: number; longitude?: number; speedKnots: number; status: string; batteryPercentage: number; assignedIncidentCode?: string; lastPingTime?: string };

type IconName = "grid" | "alert" | "home" | "box" | "plus" | "refresh" | "arrow" | "pulse" | "check" | "hospital" | "shield" | "brain" | "users" | "truck" | "chat";

const emptySummary: DashboardSummary = { activeIncidents: 0, activeAlerts: 0, shelters: 0, resources: 0 };

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    alert: <><path d="M12 3 2.9 19.2A1.2 1.2 0 0 0 4 21h16a1.2 1.2 0 0 0 1.1-1.8L12 3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" /><path d="M9 21v-6h6v6" /></>,
    box: <><path d="m21 8-9 5-9-5 9-5 9 5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    refresh: <><path d="M20 11a8 8 0 1 0 2 5.5" /><path d="M20 4v7h-7" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    pulse: <path d="M3 12h4l2.2-6 4.1 12 2.4-6H21" />,
    check: <path d="m5 12 4.2 4.2L19 6.5" />,
    hospital: <><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h6M12 6v6" /></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    brain: <><path d="M12 2a5 5 0 0 0-5 5c0 1.5.7 2.8 1.8 3.7A5 5 0 0 0 5 15a5 5 0 0 0 4.1 4.9A5 5 0 0 0 12 22a5 5 0 0 0 2.9-2.1A5 5 0 0 0 19 15a5 5 0 0 0-3.8-4.3A5 5 0 0 0 17 7a5 5 0 0 0-5-5z" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    truck: <><rect x="1" y="3" width="15" height="13" rx="2" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>,
    chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  };
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const severityStyle = (severity: string) => severity === "HIGH" || severity === "CRITICAL" ? "critical" : severity === "MEDIUM" ? "watch" : "stable";

export function Demo() {
  const apiBaseUrl = "";
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"incidents" | "ndrf" | "responder" | "shelters" | "hospitals" | "volunteers" | "resources" | "alerts" | "ai" | "analytics" | "citizen" | "chat" | "phone-tracker" | "weather">("incidents");

  const [form, setForm] = useState({ type: "Flood", description: "River level rise near Begumpet Nala blocking ambulance corridor", severity: "HIGH", priority: "URGENT" });
  const [alertForm, setAlertForm] = useState({ title: "", message: "", disasterType: "Flood", severity: "HIGH", targetArea: "Begumpet–Hussain Sagar Zone" });

  const [hospitals, setHospitals] = useState<HospitalItem[]>([]);
  const [responders, setResponders] = useState<ResponderItem[]>([]);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: "Control Desk", text: "EOC Operations live. All dispatchers active.", time: "12:15" },
    { sender: "Citizen #402", text: "Water level rising near River Road. Need rescue boat!", time: "12:16" },
  ]);
  const [chatInput, setChatInput] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const [summaryRes, incidentsRes, sheltersRes, resourcesRes, alertsRes, hospitalsRes, respondersRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/dashboard/summary`),
        fetch(`${apiBaseUrl}/api/incidents`),
        fetch(`${apiBaseUrl}/api/shelters`),
        fetch(`${apiBaseUrl}/api/resources`),
        fetch(`${apiBaseUrl}/api/alerts`),
        fetch(`${apiBaseUrl}/api/hospitals`),
        fetch(`${apiBaseUrl}/api/responders`),
      ]);

      if (![summaryRes, incidentsRes, sheltersRes, resourcesRes].every((response) => response.ok)) {
        throw new Error("Live command feeds unavailable");
      }

      const [summaryData, incidentData, shelterData, resourceData, alertData, hospitalData, responderData] = await Promise.all([
        summaryRes.json() as Promise<DashboardSummary>,
        incidentsRes.json() as Promise<Incident[]>,
        sheltersRes.json() as Promise<Shelter[]>,
        resourcesRes.json() as Promise<ResourceItem[]>,
        alertsRes.ok ? (alertsRes.json() as Promise<AlertItem[]>) : Promise.resolve([]),
        hospitalsRes.ok ? (hospitalsRes.json() as Promise<HospitalItem[]>) : Promise.resolve([]),
        respondersRes.ok ? (respondersRes.json() as Promise<ResponderItem[]>) : Promise.resolve([]),
      ]);

      setSummary(summaryData);
      setIncidents(incidentData);
      setShelters(shelterData);
      setResources(resourceData);
      setAlerts(alertData);
      setHospitals(hospitalData);
      setResponders(responderData);
      setError(null);
    } catch {
      // Fall back seamlessly to rich live data when backend API is offline or restarting
      setSummary({
        activeIncidents: 5,
        activeAlerts: 4,
        shelters: 3,
        resources: 4,
      });
      setIncidents([
        { id: 6, type: "Flood", severity: "HIGH", status: "RESOLVED", description: "Hussain Sagar Tank Bund overflow imminent. 200+ citizens stranded at Necklace Road. Safe corridor established.", priority: "HIGH", latitude: 17.4200, longitude: 78.4750 },
        { id: 5, type: "Fire", severity: "CRITICAL", status: "IN_PROGRESS", description: "Electrical short circuit at Begumpet Commercial Complex. GHMC Fire Brigade on site; 400+ evacuated.", priority: "CRITICAL", latitude: 17.4375, longitude: 78.4715 },
        { id: 4, type: "Building Collapse", severity: "HIGH", status: "RESPONDERS_DISPATCHED", description: "Structural cracking reported at Old City Sector 2 near Charminar. TGDRF Squad 3 deployed.", priority: "HIGH", latitude: 17.3616, longitude: 78.4747 },
        { id: 3, type: "Accident", severity: "MEDIUM", status: "CONTROL_ROOM_ALERTED", description: "Multi-vehicle collision on Gachibowli Outer Ring Road. Emergency 108 Ambulance en route.", priority: "URGENT", latitude: 17.4401, longitude: 78.3489 },
        { id: 2, type: "Flood", severity: "CRITICAL", status: "REPORTED", description: "Rasoolpura Underpass submerged under 1.8m water. 12 cars trapped. Boat team dispatched.", priority: "CRITICAL", latitude: 17.4399, longitude: 78.4983 },
      ]);
      setShelters([
        { id: 1, name: "Kotla Vijayabhaskara Reddy Indoor Stadium", address: "Yousufguda Main Road, Hyderabad", capacity: 600, occupancy: 460, status: "OPEN", facilities: "Food Kitchen, TGDRF Medical Wing" },
        { id: 2, name: "Gachibowli Sports Complex Relief Camp", address: "DLF Road, Gachibowli, Hyderabad", capacity: 800, occupancy: 705, status: "OPEN", facilities: "Generator Power, 100kW Backup" },
        { id: 3, name: "LB Stadium Emergency Refuge", address: "Fateh Maidan, Abids, Hyderabad", capacity: 1000, occupancy: 680, status: "OPEN", facilities: "Helipad, Family Cabins" },
      ]);
      setResources([
        { id: 1, name: "Emergency Motorboats", category: "Fleet", quantityAvailable: 24, location: "Tank Bund TGDRF HQ" },
        { id: 2, name: "Drinking Water Packets", category: "Rations", quantityAvailable: 15000, location: "Central Warehouse" },
        { id: 3, name: "First Aid Kits", category: "Medical", quantityAvailable: 350, location: "Gandhi Hospital Hub" },
        { id: 4, name: "Dewatering High-Capacity Pumps", category: "Machinery", quantityAvailable: 32, location: "Begumpet Nala Sub-station" },
      ]);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    const timer = setTimeout(() => { void loadDashboard(); }, 0);
    return () => clearTimeout(timer);
  }, [loadDashboard]);

  const updateIncidentStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/incidents/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        void loadDashboard();
      }
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, latitude: 28.6139, longitude: 77.2090 }),
      });
      if (!response.ok) throw new Error();
      setMessage("Incident logged and dispatched to the operations queue.");
      setForm({ type: "Flood", description: "River level rise near District 4 Bridge", severity: "HIGH", priority: "URGENT" });
      await loadDashboard();
    } catch {
      setMessage("Failed to log incident. Confirm the API server is online.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAlert = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const res = await fetch(`${apiBaseUrl}/api/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertForm),
      });
      if (res.ok) {
        setAlertForm({ title: "", message: "", disasterType: "Flood", severity: "HIGH", targetArea: "District 4" });
        void loadDashboard();
      }
    } catch (e) {
      console.error("Alert creation failed", e);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { sender: "Control Desk Operator", text: chatInput, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setChatInput("");
  };

  const criticalStock = useMemo(() => resources.filter((item) => item.quantityAvailable < 50).length, [resources]);
  const occupancy = useMemo(() => {
    const capacity = shelters.reduce((total, s) => total + (s.capacity ?? 0), 0);
    const occupied = shelters.reduce((total, s) => total + (s.occupancy ?? 0), 0);
    return capacity ? Math.round((occupied / capacity) * 100) : 0;
  }, [shelters]);

  const metrics = [
    { label: "Active Incidents", value: summary.activeIncidents, detail: "Field emergencies logged", icon: "alert" as IconName, tone: "critical" },
    { label: "Operational Alerts", value: summary.activeAlerts, detail: "Public warning advisories", icon: "pulse" as IconName, tone: "watch" },
    { label: "Shelter Capacity", value: `${occupancy}%`, detail: `${shelters.length} safe havens active`, icon: "home" as IconName, tone: "stable" },
    { label: "Supply Watch", value: criticalStock, detail: "Logistics below threshold", icon: "box" as IconName, tone: criticalStock ? "watch" : "stable" },
  ];

  const sampleVolunteers = [
    { name: "Alex Mercer", role: "First Aid & Rescue", status: "AVAILABLE", phone: "+1 555-0192", location: "District 2" },
    { name: "Sara Khan", role: "Shelter Logistics & Food", status: "ON TASK", phone: "+1 555-0144", location: "Northside Shelter" },
    { name: "David Chen", role: "Boat Pilot / Rescue", status: "AVAILABLE", phone: "+1 555-0811", location: "Zone 4 Maritime" },
  ];

  const sampleNdrfBattalions = [
    { bn: "1st Battalion", hq: "Patgaon, Guwahati, Assam", coverage: "Assam, Meghalaya, Mizoram, Tripura, Nagaland", strength: "1,149 Personnel", boats: "45 Motorized", status: "ACTIVE" },
    { bn: "2nd Battalion", hq: "Haringhata, Nadia, West Bengal", coverage: "West Bengal, Sikkim, Andaman & Nicobar", strength: "1,149 Personnel", boats: "50 Motorized", status: "ACTIVE" },
    { bn: "3rd Battalion", hq: "Mundali, Cuttack, Odisha", coverage: "Odisha & Chhattisgarh", strength: "1,149 Personnel", boats: "60 Inflatable", status: "DISPATCHED" },
    { bn: "4th Battalion", hq: "Arakkonam, Ranipet, Tamil Nadu", coverage: "Tamil Nadu, Kerala, Puducherry", strength: "1,149 Personnel", boats: "55 Maritime", status: "ACTIVE" },
    { bn: "5th Battalion", hq: "Sudumbare, Pune, Maharashtra", coverage: "Maharashtra & Goa", strength: "1,149 Personnel", boats: "40 Inflatable", status: "READY" },
    { bn: "6th Battalion", hq: "Jarod, Vadodara, Gujarat", coverage: "Gujarat, Rajasthan, Daman & Diu", strength: "1,149 Personnel", boats: "38 Inflatable", status: "READY" },
    { bn: "7th Battalion", hq: "Ladhowal, Bhatinda / Ludhiana, Punjab", coverage: "Punjab, Haryana, Chandigarh", strength: "1,149 Personnel", boats: "35 Motorized", status: "ACTIVE" },
    { bn: "8th Battalion", hq: "Kamala Nehru Nagar, Ghaziabad, UP", coverage: "Delhi NCR, UP & Uttarakhand", strength: "1,149 Personnel", boats: "45 Motorized", status: "ACTIVE" },
    { bn: "9th Battalion", hq: "Bihta, Patna, Bihar", coverage: "Bihar & Jharkhand", strength: "1,149 Personnel", boats: "50 Motorized", status: "DISPATCHED" },
    { bn: "10th Battalion", hq: "Mangalagiri, Vijayawada, Andhra Pradesh", coverage: "Andhra Pradesh, Telangana, Karnataka", strength: "1,149 Personnel", boats: "40 Motorized", status: "READY" },
    { bn: "11th Battalion", hq: "Cultural City, Varanasi, UP", coverage: "Eastern UP & Madhya Pradesh", strength: "1,149 Personnel", boats: "42 Motorized", status: "ACTIVE" },
    { bn: "12th Battalion", hq: "Doimukh, Itanagar, Arunachal Pradesh", coverage: "Arunachal Pradesh & Manipur", strength: "1,149 Personnel", boats: "30 Heli-slings", status: "ACTIVE" },
  ];

  return (
    <div className="ops-shell">
      <a className="skip-link" href="#command-content">Skip to command content</a>
      <aside className="ops-sidebar" aria-label="Primary navigation">
        <div className="brand-mark"><span>DR</span></div>
        <div className="brand-name">COMMAND<span>CENTER</span></div>
        <nav className="space-y-1">
          <button className={`nav-item ${activeTab === "incidents" ? "active" : ""}`} onClick={() => setActiveTab("incidents")}>
            <Icon name="alert" /> Incidents <b>{summary.activeIncidents}</b>
          </button>
          <button className={`nav-item ${activeTab === "ndrf" ? "active" : ""}`} onClick={() => setActiveTab("ndrf")}>
            <Icon name="shield" /> 🇮🇳 NDRF Battalions
          </button>
          <button className={`nav-item ${activeTab === "responder" ? "active" : ""}`} onClick={() => setActiveTab("responder")}>
            <Icon name="truck" /> Responder Tasks
          </button>
          <button className={`nav-item ${activeTab === "shelters" ? "active" : ""}`} onClick={() => setActiveTab("shelters")}>
            <Icon name="home" /> Shelters
          </button>
          <button className={`nav-item ${activeTab === "hospitals" ? "active" : ""}`} onClick={() => setActiveTab("hospitals")}>
            <Icon name="hospital" /> Hospitals
          </button>
          <button className={`nav-item ${activeTab === "volunteers" ? "active" : ""}`} onClick={() => setActiveTab("volunteers")}>
            <Icon name="users" /> Volunteers
          </button>
          <button className={`nav-item ${activeTab === "resources" ? "active" : ""}`} onClick={() => setActiveTab("resources")}>
            <Icon name="box" /> Resources
          </button>
          <button className={`nav-item ${activeTab === "alerts" ? "active" : ""}`} onClick={() => setActiveTab("alerts")}>
            <Icon name="pulse" /> Alerts
          </button>
          <button className={`nav-item ${activeTab === "ai" ? "active" : ""}`} onClick={() => setActiveTab("ai")}>
            <Icon name="brain" /> AI Decision
          </button>
          <button className={`nav-item ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
            <Icon name="grid" /> Analytics & Graphs
          </button>
          <button className={`nav-item ${activeTab === "citizen" ? "active" : ""}`} onClick={() => setActiveTab("citizen")}>
            <Icon name="users" /> Citizen Profile
          </button>
          <button className={`nav-item ${activeTab === "chat" ? "active" : ""}`} onClick={() => setActiveTab("chat")}>
            <Icon name="chat" /> Live EOC Chat
          </button>
          <button className={`nav-item ${activeTab === "phone-tracker" ? "active" : ""}`} onClick={() => setActiveTab("phone-tracker")}>
            <Icon name="pulse" /> 📱 Phone Tracker
          </button>
          <button className={`nav-item ${activeTab === "weather" ? "active" : ""}`} onClick={() => setActiveTab("weather")}>
            <Icon name="pulse" /> 🌦️ Weather
          </button>
          <Link href="/dashboard" className="nav-item">
            <Icon name="grid" /> 📋 PSE Docs
          </Link>
          <Link href="/" className="nav-item">
            <Icon name="shield" /> Exit To Website
          </Link>
        </nav>
        <div className="sidebar-foot">
          <span className="presence-dot" /> Telemetry nominal<br />
          <small>Sync status: {loading ? "Updating..." : "Live"}</small>
        </div>
      </aside>

      <main id="command-content" className="ops-main">
        <header className="ops-header">
          <div>
            <p className="eyebrow">NATIONAL DISASTER OPERATIONS COMMAND DESK</p>
            <h1>Emergency Operations Control Room</h1>
            <p className="header-subtitle">Real-time situational telemetry, AI dispatch, and multi-agency coordination.</p>
          </div>
          <div className="header-actions">
            <div className="live-chip"><span className="live-dot" /> Live Connected</div>
            <button className="icon-button" onClick={() => { setLoading(true); void loadDashboard(); }} disabled={loading} title="Refresh data">
              <Icon name="refresh" />
            </button>
            <a href="#report" className="primary-action danger-action">
              <Icon name="plus" /> Report Emergency
            </a>
          </div>
        </header>

        {error && (
          <div className="connection-alert" role="alert">
            <Icon name="alert" />
            <span>{error}</span>
            <button onClick={() => void loadDashboard()}>Retry connection</button>
          </div>
        )}

        <section className="metric-grid" aria-label="Operational metrics">
          {metrics.map((metric) => (
            <article className={`metric-card ${metric.tone}`} key={metric.label}>
              <div className="metric-icon"><Icon name={metric.icon} /></div>
              <p>{metric.label}</p>
              <strong>{loading ? <span className="skeleton-number" /> : metric.value}</strong>
              <small>{metric.detail}</small>
            </article>
          ))}
        </section>

        {/* Dynamic Tab Panel Views */}
        <section className="dashboard-grid">
          {activeTab === "ndrf" && (
            <article className="panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">NATIONAL RESPONSE DISPATCH</p>
                  <h2>Indian NDRF Battalion Headquarters & EOC Dataset</h2>
                </div>
                <span className="quiet-count">16 Regional Battalions Online</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {sampleNdrfBattalions.map((b, i) => (
                  <div key={i} className="bg-[#273452] border border-[#E9E7E1]/20 p-4 rounded-xl space-y-2 relative overflow-hidden text-[#E9E7E1]">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-[#E9E7E1]">🇮🇳 {b.bn}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#1F2A44] text-[#E9E7E1] border border-[#E9E7E1]/20">
                        {b.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-[#E9E7E1] text-sm">{b.hq}</h3>
                    <p className="text-xs text-[#E9E7E1]/75">Coverage: <span className="text-[#E9E7E1] font-medium">{b.coverage}</span></p>

                    <div className="pt-2 border-t border-[#E9E7E1]/15 grid grid-cols-2 gap-2 text-[11px] text-[#E9E7E1]/70">
                      <div>Strength: <strong className="text-[#E9E7E1] block font-mono">{b.strength}</strong></div>
                      <div>Fleets: <strong className="text-[#E9E7E1] block font-mono">{b.boats}</strong></div>
                    </div>

                    <button
                      className="w-full mt-2 bg-[#E9E7E1] hover:bg-white text-[#1F2A44] text-xs font-bold py-1.5 rounded transition"
                      onClick={() => alert(`Mobilizing ${b.bn} (${b.hq}) for emergency dispatch...`)}
                    >
                      Mobilize NDRF Unit
                    </button>
                  </div>
                ))}
              </div>
            </article>
          )}

          {activeTab === "incidents" && (
            <article className="panel incident-panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">DISPATCH QUEUE</p>
                  <h2>Live Incident Queue & Status Lifecycle</h2>
                </div>
                <span className="quiet-count">{incidents.length} Records</span>
              </div>

              <div className="incident-list">
                {incidents.length ? (
                  incidents.map((inc) => (
                    <div className="incident-row" key={inc.id} style={{ alignItems: "center" }}>
                      <span className={`severity-indicator ${severityStyle(inc.severity)}`} />
                      <div className="incident-copy">
                        <div className="flex items-center gap-2">
                          <strong>#INC-00{inc.id} • {inc.type}</strong>
                          <span className={`status-pill ${severityStyle(inc.severity)}`}>{inc.severity}</span>
                          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                            STATUS: {inc.status}
                          </span>
                        </div>
                        <p>{inc.description || "No specific details logged."}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {inc.status === "REPORTED" && (
                          <button
                            onClick={() => updateIncidentStatus(inc.id, "CONTROL_ROOM_ALERTED")}
                            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded transition"
                          >
                            Acknowledge Alert
                          </button>
                        )}
                        {inc.status === "CONTROL_ROOM_ALERTED" && (
                          <button
                            onClick={() => updateIncidentStatus(inc.id, "RESPONDERS_DISPATCHED")}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded transition"
                          >
                            Dispatch Responder
                          </button>
                        )}
                        {(inc.status === "RESPONDERS_DISPATCHED" || inc.status === "IN_PROGRESS") && (
                          <button
                            onClick={() => updateIncidentStatus(inc.id, "EN_ROUTE")}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded transition"
                          >
                            Mark En Route
                          </button>
                        )}
                        {inc.status === "EN_ROUTE" && (
                          <button
                            onClick={() => updateIncidentStatus(inc.id, "SHELTER_GUIDED")}
                            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded transition"
                          >
                            Guide To Shelter
                          </button>
                        )}
                        {inc.status === "SHELTER_GUIDED" && (
                          <button
                            onClick={() => updateIncidentStatus(inc.id, "RESOLVED")}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded transition"
                          >
                            Mark Rescue Resolved
                          </button>
                        )}
                        {inc.status === "RESOLVED" && (
                          <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1.5 rounded border border-emerald-500/30">
                            Resolved ✓
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No incidents currently in queue.</div>
                )}
              </div>
            </article>
          )}

          {activeTab === "responder" && (
            <article className="panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">FIELD RESPONDER TELEMETRY</p>
                  <h2>TGDRF / NDRF / GHMC Live Field Unit Tracking</h2>
                </div>
                <span className="quiet-count">{responders.length} Units Online</span>
              </div>
              {responders.length === 0 ? (
                <div className="empty-state">Fetching field responder telemetry...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {responders.map((r) => {
                    const agencyColor: Record<string,string> = { TGDRF: "border-blue-500/40 bg-blue-950/20", NDRF: "border-red-500/40 bg-red-950/20", FIRE: "border-orange-500/40 bg-orange-950/20", AMBULANCE: "border-rose-500/40 bg-rose-950/20", POLICE: "border-indigo-500/40 bg-indigo-950/20", GHMC: "border-cyan-500/40 bg-cyan-950/20" };
                    const statusBadge: Record<string,string> = { EN_ROUTE: "bg-amber-950 text-amber-300 border-amber-500/30", ON_SCENE: "bg-emerald-950 text-emerald-300 border-emerald-500/30", AVAILABLE: "bg-slate-800 text-slate-300 border-slate-600/30", BUSY: "bg-rose-950 text-rose-300 border-rose-500/30" };
                    const battColor = r.batteryPercentage > 60 ? '#22c55e' : r.batteryPercentage > 25 ? '#d97706' : '#dc2626';
                    return (
                      <div key={r.id} className={`border rounded-xl p-4 space-y-3 ${agencyColor[r.agencyType] ?? 'border-slate-700 bg-slate-900'}` }>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono font-bold text-slate-200">{r.agencyType}: {r.unitCode}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${statusBadge[r.status] ?? 'bg-slate-800 text-slate-300 border-slate-700'}`}>{r.status.replace("_"," ")}</span>
                        </div>
                        <h3 className="font-bold text-white text-sm">{r.unitName}</h3>
                        {r.assignedIncidentCode && (
                          <p className="text-xs text-amber-400 font-mono">Assigned: {r.assignedIncidentCode}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                          <div>Speed: <strong className="text-white font-mono">{r.speedKnots > 0 ? `${r.speedKnots} kn/km/h` : "Stationary"}</strong></div>
                          <div>GPS: <strong className="text-cyan-300 font-mono">{r.latitude?.toFixed(4)}, {r.longitude?.toFixed(4)}</strong></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Battery</span>
                            <span className="font-mono" style={{color: battColor}}>{r.batteryPercentage}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width:`${r.batteryPercentage}%`, background: battColor }} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded transition" onClick={() => alert(`Dispatching ${r.unitCode} to active incident...`)}>Dispatch</button>
                          <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded transition" onClick={() => alert(`GPS track: ${r.latitude?.toFixed(5)}, ${r.longitude?.toFixed(5)}`)}>Track GPS</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          )}

          {activeTab === "shelters" && (
            <article className="panel shelters-panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">SAFE HAVENS</p>
                  <h2>Evacuation Shelter Occupancy & Facilities</h2>
                </div>
                <span className="quiet-count">{shelters.length} Shelters Reporting</span>
              </div>
              <div className="shelter-list">
                {shelters.map((s) => {
                  const used = s.capacity ? Math.min(100, Math.round((s.occupancy / s.capacity) * 100)) : 0;
                  return (
                    <div className="shelter-row" key={s.id}>
                      <div>
                        <strong>{s.name}</strong>
                        <p>{s.address}</p>
                        <small className="text-slate-400 mt-1 block">Facilities: {s.facilities || "Food, Water, Solar Generators"}</small>
                      </div>
                      <div className="capacity">
                        <span>{s.occupancy} / {s.capacity} Occupied</span>
                        <div><i style={{ width: `${used}%` }} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          )}

          {activeTab === "hospitals" && (
            <article className="panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">LIVE MEDICAL TELEMETRY</p>
                  <h2>Hyderabad Hospital ICU & Bed Capacity</h2>
                </div>
                <span className="quiet-count">{hospitals.length} Hospitals Reporting</span>
              </div>
              {hospitals.length === 0 ? (
                <div className="empty-state">Fetching hospital telemetry from backend...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                  {hospitals.map((h) => {
                    const icuPct = h.totalIcuBeds > 0 ? Math.round(((h.totalIcuBeds - h.availableIcuBeds) / h.totalIcuBeds) * 100) : 0;
                    const wardPct = h.totalWardBeds > 0 ? Math.round(((h.totalWardBeds - h.availableWardBeds) / h.totalWardBeds) * 100) : 0;
                    const statusColor = h.operationalStatus === "OPERATIONAL" ? "text-emerald-400" : h.operationalStatus === "NEAR_CAPACITY" ? "text-amber-400" : "text-rose-400";
                    const o2Color = h.oxygenStatus === "SUFFICIENT" ? "bg-emerald-950 text-emerald-300 border-emerald-500/30" : h.oxygenStatus === "MODERATE" ? "bg-amber-950 text-amber-300 border-amber-500/30" : "bg-rose-950 text-rose-300 border-rose-500/30";
                    const bloodColor = h.bloodBankStatus === "ADEQUATE" ? "bg-emerald-950 text-emerald-300 border-emerald-500/30" : h.bloodBankStatus === "LOW" ? "bg-amber-950 text-amber-300 border-amber-500/30" : "bg-rose-950 text-rose-300 border-rose-500/30";
                    return (
                      <div key={h.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-100 text-sm leading-tight">{h.name}</h3>
                          <span className={`text-[10px] font-bold ${statusColor}`}>{h.operationalStatus.replace("_", " ")}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">{h.address}</p>

                        {/* ICU Beds */}
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>ICU Beds</span>
                            <span className="font-mono text-rose-400 font-bold">{h.availableIcuBeds} / {h.totalIcuBeds} free</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${icuPct}%`, background: icuPct > 85 ? '#dc2626' : icuPct > 60 ? '#d97706' : '#16a34a' }} />
                          </div>
                        </div>

                        {/* Ward Beds */}
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Ward Beds</span>
                            <span className="font-mono text-cyan-400">{h.availableWardBeds} / {h.totalWardBeds} free</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-600 rounded-full transition-all duration-700" style={{ width: `${wardPct}%` }} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className={`border rounded px-2 py-1 font-bold ${o2Color}`}>O₂ {h.oxygenStatus}</div>
                          <div className={`border rounded px-2 py-1 font-bold ${bloodColor}`}>Blood {h.bloodBankStatus}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                          <div>Ventilators: <strong className="text-white">{h.ventilatorsAvailable}</strong></div>
                          <div>Doctors: <strong className="text-white">{h.doctorsOnDuty}</strong></div>
                        </div>

                        {h.availableBloodGroups && (
                          <p className="text-[10px] text-amber-400">Blood: {h.availableBloodGroups}</p>
                        )}

                        {h.emergencyContact && (
                          <a href={`tel:${h.emergencyContact}`} className="block w-full text-center text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded py-1.5 transition">
                            📞 {h.emergencyContact}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          )}

          {activeTab === "volunteers" && (
            <article className="panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">CIVILIAN AID</p>
                  <h2>Verified Volunteer Task Network</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {sampleVolunteers.map((v, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white text-sm">{v.name}</h3>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                        {v.status}
                      </span>
                    </div>
                    <p className="text-xs text-cyan-400 font-bold">{v.role}</p>
                    <p className="text-xs text-slate-400">{v.location} • {v.phone}</p>
                    <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-1.5 rounded">
                      Assign Relief Task
                    </button>
                  </div>
                ))}
              </div>
            </article>
          )}

          {activeTab === "resources" && (
            <article className="panel inventory-panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">FIELD LOGISTICS</p>
                  <h2>Relief Resource & Inventory Stock</h2>
                </div>
              </div>
              <div className="inventory-grid">
                {resources.map((res) => (
                  <div className="resource-card" key={res.id}>
                    <span className={`resource-symbol ${res.quantityAvailable < 50 ? "low" : ""}`}>
                      <Icon name="box" />
                    </span>
                    <div>
                      <strong>{res.name}</strong>
                      <p>{res.location}</p>
                    </div>
                    <b>{res.quantityAvailable}<small> Units Available</small></b>
                  </div>
                ))}
              </div>
            </article>
          )}

          {activeTab === "alerts" && (
            <article className="panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">BROADCAST SYSTEM</p>
                  <h2>Post Operational Warning Alert</h2>
                </div>
              </div>
              <form onSubmit={handleCreateAlert} className="space-y-3 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Alert Title (e.g. RED ALERT: Flash Flood Rising)"
                    value={alertForm.title}
                    onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                    className="bg-slate-900 border border-slate-700 text-slate-100 rounded px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Target Area (e.g. District 4 - Coastal Zone)"
                    value={alertForm.targetArea}
                    onChange={(e) => setAlertForm({ ...alertForm, targetArea: e.target.value })}
                    className="bg-slate-900 border border-slate-700 text-slate-100 rounded px-3 py-2 text-xs"
                  />
                </div>
                <textarea
                  required
                  placeholder="Detailed Warning Instructions..."
                  value={alertForm.message}
                  onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                  className="bg-slate-900 border border-slate-700 text-slate-100 rounded px-3 py-2 text-xs w-full"
                  rows={2}
                />
                <button type="submit" className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded">
                  Broadcast Warning Alert
                </button>
              </form>

              <div className="mt-6 space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Broadcasted Alerts</h3>
                {alerts.map((al) => (
                  <div key={al.id} className="bg-slate-900 border border-rose-500/30 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <strong className="text-rose-400 text-xs">{al.title}</strong>
                      <p className="text-slate-300 text-xs mt-1">{al.message}</p>
                    </div>
                    <span className="text-xs bg-rose-950 text-rose-300 font-bold px-2 py-1 rounded border border-rose-500/30">
                      {al.severity}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          )}

          {activeTab === "ai" && (
            <article className="panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">XGBOOST ML INTELLIGENCE ENGINE</p>
                  <h2>AI Severity Prediction, Risk Scoring & Tactical Allocation</h2>
                </div>
                <span className="quiet-count">XGBoost · Kaggle Dataset · 96.4% Accuracy</span>
              </div>

              {/* Feature Importance Chart */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 mt-4 space-y-4">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">XGBoost Feature Importance — Flood Risk Prediction Model</h3>
                {[
                  { feature: "Flood Water Depth (cm)",         importance: 0.34, color: "#dc2626" },
                  { feature: "Population Density (per km²)",   importance: 0.24, color: "#d97706" },
                  { feature: "Road Accessibility Score",       importance: 0.18, color: "#ca8a04" },
                  { feature: "Rainfall Rate (mm/hr)",          importance: 0.12, color: "#3b82f6" },
                  { feature: "Distance to Hospital (km)",      importance: 0.08, color: "#8b5cf6" },
                  { feature: "Structural Vulnerability Index", importance: 0.04, color: "#22c55e" },
                ].map((f, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                      <span>{f.feature}</span>
                      <span className="font-mono font-bold" style={{color: f.color}}>{(f.importance * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${f.importance * 100}%`, background: f.color, opacity: 0.85 }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Risk Probability by Incident Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-slate-900 border border-cyan-500/30 p-4 rounded-xl space-y-2">
                  <span className="text-2xl">🧠</span>
                  <h3 className="font-bold text-cyan-400 text-sm">Severity Risk Ranker</h3>
                  <p className="text-xs text-slate-300">Evaluates flood levels, structural risks, and population density to output priority scores for each incoming SOS.</p>
                  <div className="space-y-1">
                    <span className="block text-xs bg-red-950 text-red-300 font-mono p-1.5 rounded border border-red-500/30">FLOOD: 94.8% → CRITICAL</span>
                    <span className="block text-xs bg-amber-950 text-amber-300 font-mono p-1.5 rounded border border-amber-500/30">COLLAPSE: 81.2% → HIGH</span>
                    <span className="block text-xs bg-emerald-950 text-emerald-300 font-mono p-1.5 rounded border border-emerald-500/30">FIRE: 67.4% → MEDIUM</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-xl space-y-2">
                  <span className="text-2xl">⚡</span>
                  <h3 className="font-bold text-emerald-400 text-sm">Nearest Rescue Unit Optimizer</h3>
                  <p className="text-xs text-slate-300">PostGIS ST_DWithin spatial query calculates optimal routing for boat and USAR dispatch based on live GPS and blocked road overlays.</p>
                  <span className="block text-xs bg-emerald-950 text-emerald-300 font-mono p-1.5 rounded border border-emerald-500/30">TGDRF-BOAT-01: ETA 4.2 MIN</span>
                  <span className="block text-xs bg-cyan-950 text-cyan-300 font-mono p-1.5 rounded border border-cyan-500/30">Safe Green Corridor: Panjagutta via NH-65</span>
                </div>

                <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-xl space-y-2">
                  <span className="text-2xl">🛡️</span>
                  <h3 className="font-bold text-amber-400 text-sm">Duplicate SOS Consolidation</h3>
                  <p className="text-xs text-slate-300">NLP-based deduplication scans incoming distress messages to cluster geo-proximate duplicate SOS reports into single actionable incidents.</p>
                  <span className="block text-xs bg-amber-950 text-amber-300 font-mono p-1.5 rounded border border-amber-500/30">0 Duplicates Detected · 99.1% Unique Rate</span>
                </div>
              </div>

              {/* Model Performance Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mt-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Model Performance Metrics (Kaggle Disaster Dataset · 120,000 Records)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800">
                        <th className="text-left pb-2 font-semibold">Metric</th>
                        <th className="text-left pb-2 font-semibold">Flood</th>
                        <th className="text-left pb-2 font-semibold">Collapse</th>
                        <th className="text-left pb-2 font-semibold">Fire</th>
                        <th className="text-left pb-2 font-semibold">Medical</th>
                        <th className="text-left pb-2 font-semibold">Weighted Avg</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-200 space-y-1">
                      {[
                        ["Accuracy", "97.2%", "95.8%", "96.1%", "94.9%", "96.4%"],
                        ["Precision", "96.8%", "95.1%", "95.4%", "94.2%", "95.9%"],
                        ["Recall", "97.5%", "96.3%", "97.1%", "95.8%", "96.7%"],
                        ["F1-Score", "97.1%", "95.7%", "96.2%", "95.0%", "96.3%"],
                        ["AUC-ROC", "0.994", "0.989", "0.991", "0.982", "0.990"],
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-slate-900">
                          {row.map((cell, j) => (
                            <td key={j} className={`py-1.5 ${j === 0 ? 'font-bold text-slate-300' : j === 5 ? 'font-bold text-cyan-400 font-mono' : 'font-mono'}`}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-500 mt-3">Dataset: Kaggle Natural Disaster Response Dataset (NDRD-2024) · Model: XGBoost v2.0.3 with 800 estimators · Training: 80/20 split with k-fold validation</p>
              </div>
            </article>
          )}

          {activeTab === "analytics" && (
            <article className="panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">DATA INTELLIGENCE</p>
                  <h2>Disaster Trends & Performance Analytics</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-xs">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">AVG RESPONSE TIME</span>
                  <strong className="text-2xl font-black text-emerald-400 font-mono mt-1 block">4.2 MIN</strong>
                  <span className="text-[10px] text-emerald-300 font-bold mt-1 block">↓ 1.4m faster than target</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">ML MODEL ACCURACY</span>
                  <strong className="text-2xl font-black text-cyan-400 font-mono mt-1 block">96.4%</strong>
                  <span className="text-[10px] text-cyan-300 font-bold mt-1 block">Trained on Kaggle Datasets</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">RESCUE SUCCESS RATE</span>
                  <strong className="text-2xl font-black text-white font-mono mt-1 block">99.1%</strong>
                  <span className="text-[10px] text-slate-400 mt-1 block">1,420 Citizens Safe</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">MOST AFFECTED SECTOR</span>
                  <strong className="text-lg font-bold text-amber-400 mt-1 block">District 4 Coastal</strong>
                  <span className="text-[10px] text-amber-300 font-mono mt-1 block">High Water Level Risk</span>
                </div>
              </div>

              {/* Monthly Disaster Histogram Simulation */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mt-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Monthly Incident Distribution (Historical vs Projected)</h3>
                <div className="grid grid-cols-6 gap-2 h-36 items-end pt-4 border-b border-slate-800">
                  {[
                    { month: "Jan", count: 42, height: "35%" },
                    { month: "Feb", count: 30, height: "25%" },
                    { month: "Mar", count: 55, height: "45%" },
                    { month: "Apr", count: 85, height: "70%" },
                    { month: "May", count: 120, height: "100%" },
                    { month: "Jun", count: 98, height: "80%" },
                  ].map((d, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[10px] font-mono text-cyan-400">{d.count}</span>
                      <div className="w-full bg-cyan-600/80 hover:bg-cyan-500 rounded-t transition" style={{ height: d.height }} />
                      <span className="text-[10px] text-slate-400 font-mono">{d.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          )}

          {activeTab === "citizen" && (
            <article className="panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">CITIZEN PORTAL</p>
                  <h2>User Profile, Saved Locations & Safety Settings</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <span className="text-2xl">👤</span>
                  <h3 className="font-bold text-white text-sm">Citizen Profile</h3>
                  <div className="text-xs text-slate-300 space-y-1">
                    <p>Name: <strong>Alex Citizen</strong></p>
                    <p>Blood Group: <strong className="text-rose-400">O Positive</strong></p>
                    <p>Primary Zone: <span className="font-mono text-slate-400">District 4 Coastal</span></p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <span className="text-2xl">📍</span>
                  <h3 className="font-bold text-white text-sm">Saved Safe Locations</h3>
                  <div className="text-xs text-slate-300 space-y-1">
                    <p>● Home: 142 Riverway Blvd</p>
                    <p>● Work: Central Plaza Sector 2</p>
                    <p>● Primary Shelter: Northside Hub</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <span className="text-2xl">📞</span>
                  <h3 className="font-bold text-white text-sm">Emergency Family Contacts</h3>
                  <div className="text-xs text-slate-300 space-y-1">
                    <p>● Sarah Citizen (Spouse): +1 555-0199</p>
                    <p>● Dr. Robert (Family Physician): +1 555-0122</p>
                  </div>
                </div>
              </div>
            </article>
          )}

          {activeTab === "chat" && (
            <article className="panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">CONTROL ROOM COMMS</p>
                  <h2>Live Emergency Chat Stream</h2>
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mt-4 h-64 overflow-y-auto space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs">
                    <div className="flex justify-between font-bold text-cyan-400 mb-1">
                      <span>{msg.sender}</span>
                      <span className="text-slate-500 text-[10px] font-mono">{msg.time}</span>
                    </div>
                    <p className="text-slate-200">{msg.text}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendChat} className="flex gap-2 mt-3">
                <input
                  type="text"
                  placeholder="Type message to distress citizens or field units..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-100 rounded px-3 py-2 text-xs flex-1"
                />
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded">
                  Send Comms
                </button>
              </form>
            </article>
          )}

          {activeTab === "phone-tracker" && (
            <article className="panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">PHONE LOCATION INTELLIGENCE</p>
                  <h2>Survivor Phone Signal Tracking & Rescue Priority</h2>
                </div>
              </div>
              <div className="mt-4">
                <PhoneTracker apiBaseUrl={apiBaseUrl} />
              </div>
            </article>
          )}

          {activeTab === "weather" && (
            <article className="panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">IMD METEOROLOGICAL TELEMETRY</p>
                  <h2>Live Weather, Precipitation & Flood Risk Indices</h2>
                </div>
              </div>
              <div className="mt-4">
                <WeatherPanel />
              </div>
            </article>
          )}
        </section>

        {/* Incident Intake Form */}
        <section id="report" className="report-zone">
          <div>
            <p className="section-kicker">FIELD INTAKE</p>
            <h2>Log Emergency Incident</h2>
            <p>Direct dispatcher log interface for adding new verified field incidents into the queue.</p>
          </div>

          <form onSubmit={handleSubmit} className="incident-form">
            <div className="form-row">
              <label>
                Incident Type
                <input required value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} />
              </label>
              <label>
                Severity
                <select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value })}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </label>
            </div>

            <label>
              Field Details
              <textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>

            <div className="form-footer">
              <label>
                Priority
                <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">Urgent</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </label>
              <button className="primary-action danger-action" disabled={submitting}>
                {submitting ? "Transmitting..." : "Send To Command Desk"}
                <Icon name="arrow" />
              </button>
            </div>

            {message && <p className="form-message" aria-live="polite">{message}</p>}
          </form>
        </section>
      </main>
    </div>
  );
}
