"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

// ─── Types ───
interface TrackerData {
    totalVisits: number;
    uniquePeople: number;
    humanCount: number;
    crawlerCount: number;
    otherBotCount: number;
    agentCount: number;
    v2Since: string | null;
    countryCount: number;
    dailyData: { date: string; human: number; ai_crawler: number; other_bot: number; agent: number }[];
    topAgents: { name: string; count: number }[];
    topBots: { name: string; count: number }[];
    topPages: { path: string; count: number }[];
    browsers: { name: string; count: number }[];
    devices: { type: string; count: number }[];
    countries: { code: string; count: number }[];
    recentVisits: {
        _id: string;
        timestamp: string;
        path: string;
        visitorType: string;
        botName: string | null;
        browser: string | null;
        deviceType: string;
        country: string | null;
    }[];
}

// ─── Colors ───
const GOLD = "#7a1a2e"; // acento bordó
const GOLD_LIGHT = "#b0707e";
const BEIGE = "#faf8f3"; // papel
const DARK = "#333";
const PIE_COLORS = ["#7a1a2e", "#a65566", "#c9a0a9", "#555", "#999", "#ccc"];
const FONT_SERIF = "'Fraunces', serif";
const FONT_SANS = "'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

// ─── Country flags ───
const countryFlag = (code: string): string => {
    if (!code || code.length !== 2) return "";
    const offset = 127397;
    return String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + offset));
};

// ─── Animated counter ───
function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (value === 0) { setDisplay(0); return; }
        const start = performance.now();
        const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setDisplay(Math.floor(progress * value));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [value, duration]);
    return <span>{display.toLocaleString()}</span>;
}

// ─── Chart card wrapper ───
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-[#7a1a2e]/10">
            <h3 className="text-xs font-medium text-[#333] mb-4 tracking-wider uppercase" style={{ fontFamily: FONT_MONO }}>{title}</h3>
            {children}
        </div>
    );
}

// ─── Custom tooltip ───
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
    if (!active || !payload) return null;
    return (
        <div className="bg-white rounded-lg shadow-lg border border-[#7a1a2e]/20 p-3 text-xs">
            <p className="font-semibold text-[#333] mb-1">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} style={{ color: entry.color }}>
                    {entry.name}: {entry.value}
                </p>
            ))}
        </div>
    );
}

export default function TrackerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#faf8f3" }}><div className="w-8 h-8 border-2 border-[#7a1a2e] border-t-transparent rounded-full animate-spin" /></div>}>
            <TrackerContent />
        </Suspense>
    );
}

function TrackerContent() {
    const searchParams = useSearchParams();
    const site = searchParams.get("site") || "unbancodeideas";
    const [data, setData] = useState<TrackerData | null>(null);
    const [range, setRange] = useState("7d");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [excluido, setExcluido] = useState(false);

    useEffect(() => {
        if (!document.getElementById("tracker-fonts")) {
            const link = document.createElement("link");
            link.id = "tracker-fonts";
            link.rel = "stylesheet";
            link.href = "https://fonts.googleapis.com/css2?family=Fraunces:wght@300;400;500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap";
            document.head.appendChild(link);
        }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch(`/api/tracker?range=${range}&site=${site}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            setData(json);
            setExcluido(document.cookie.split("; ").includes("bdi_no_track=1"));
        } catch {
            setError("Error cargando datos");
        } finally {
            setLoading(false);
        }
    }, [range, site]);

    useEffect(() => {
        setLoading(true);
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const ranges = [
        { key: "today", label: "Hoy" },
        { key: "7d", label: "7 dias" },
        { key: "30d", label: "30 dias" },
        { key: "all", label: "Todo" },
    ];

    const donutData = data ? [
        { name: "Personas", value: data.humanCount },
        { name: "Rastreadores de IA", value: data.crawlerCount },
        { name: "Otros bots", value: data.otherBotCount },
        { name: "Agentes", value: data.agentCount },
    ] : [];
    const DONUT_COLORS = [GOLD, DARK, "#999", "#c9a0a9"];

    return (
        <div className="min-h-screen" style={{ background: BEIGE, fontFamily: FONT_SANS }}>
            {/* Header */}
            <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-[#333]/60 hover:text-[#7a1a2e] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                        </Link>
                        <h1 className="text-3xl text-[#181714] tracking-tight" style={{ fontFamily: FONT_SERIF, fontWeight: 300 }}>Analytics</h1>
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Auto-refresh: 60s" />
                    </div>
                    {/* Range selector */}
                    <div className="flex gap-1 bg-white/60 rounded-xl p-1 shadow-sm border border-[#7a1a2e]/10">
                        {ranges.map((r) => (
                            <button
                                key={r.key}
                                onClick={() => setRange(r.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    range === r.key
                                        ? "bg-[#7a1a2e] text-white shadow-sm"
                                        : "text-[#333]/60 hover:text-[#333] hover:bg-white/80"
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading && !data && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-[#7a1a2e] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {error && !data && (
                    <div className="text-center py-20 text-[#333]/60">{error}</div>
                )}

                {data && (
                    <>
                        {/* ─── Stat cards ─── */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                            {[
                                { label: "Personas únicas", value: data.uniquePeople, hint: "por día, sin cookies" },
                                { label: "Páginas vistas por personas", value: data.humanCount, hint: "incluye datos viejos inflados" },
                                { label: "Rastreadores de IA", value: data.crawlerCount, hint: "GPTBot, ClaudeBot…" },
                                { label: "Otros bots", value: data.otherBotCount, hint: "buscadores, curl, previews" },
                                { label: "Llamadas de agentes (API/MCP)", value: data.agentCount, hint: "acciones en /api/agent" },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-white/80 rounded-2xl p-4 shadow-sm border border-[#7a1a2e]/10">
                                    <span className="block text-[10px] uppercase tracking-wider text-[#333]/60 min-h-[28px]" style={{ fontFamily: FONT_MONO }}>{stat.label}</span>
                                    <div className="text-3xl text-[#181714] mt-1" style={{ fontFamily: FONT_SERIF, fontWeight: 300 }}>
                                        <AnimatedCounter value={stat.value} />
                                    </div>
                                    <span className="text-[10px] text-[#333]/40">{stat.hint}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-[#333]/50 mb-6">
                            {data.v2Since
                                ? `Datos anteriores al ${new Date(data.v2Since).toLocaleDateString("es", { timeZone: "Europe/Madrid", day: "numeric", month: "long", year: "numeric" })} usan la clasificación vieja y están inflados.`
                                : "Los datos anteriores al nuevo contador usan la clasificación vieja y están inflados."}
                            {" "}Personas únicas: con rangos largos es la suma de personas distintas de cada día.
                            {excluido && <span className="ml-2" style={{ color: GOLD }}>· Tus visitas no se cuentan en este navegador (<code>?no-contarme=0</code> para volver a contarlas).</span>}
                        </p>

                        {/* ─── Area chart: visits over time ─── */}
                        <ChartCard title="Visitas por dia">
                            {data.dailyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={data.dailyData}>
                                        <defs>
                                            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="darkGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={DARK} stopOpacity={0.15} />
                                                <stop offset="95%" stopColor={DARK} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#999" }} tickFormatter={(v) => v.slice(5)} />
                                        <YAxis tick={{ fontSize: 10, fill: "#999" }} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Area type="monotone" dataKey="human" name="Personas" stroke={GOLD} fill="url(#goldGradient)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="ai_crawler" name="Rastreadores de IA" stroke={DARK} fill="url(#darkGradient)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="other_bot" name="Otros bots" stroke="#999" fill="none" strokeWidth={1.5} />
                                        <Area type="monotone" dataKey="agent" name="Agentes" stroke="#c9a0a9" fill="none" strokeWidth={1.5} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center text-[#333]/40 py-10 text-sm">Sin datos para este periodo</p>
                            )}
                        </ChartCard>

                        {/* ─── Two-column grid ─── */}
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                            {/* Donut: humans vs bots */}
                            <ChartCard title="Quién visita">
                                {data.totalVisits > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={donutData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                                                labelLine={false}
                                                style={{ fontSize: 11 }}
                                            >
                                                {donutData.map((_, i) => (
                                                    <Cell key={i} fill={DONUT_COLORS[i]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-[#333]/40 py-10 text-sm">Sin datos</p>
                                )}
                            </ChartCard>

                            {/* Bar: top bots */}
                            <ChartCard title="Rastreadores de IA (top)">
                                {data.topBots.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={data.topBots} layout="vertical" margin={{ left: 80 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                            <XAxis type="number" tick={{ fontSize: 10, fill: "#999" }} allowDecimals={false} />
                                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#666" }} width={75} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill={DARK} radius={[0, 4, 4, 0]} barSize={16} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-[#333]/40 py-10 text-sm">Sin bots detectados</p>
                                )}
                            </ChartCard>

                            {/* Bar: agentes */}
                            <ChartCard title="Llamadas por agente">
                                {data.topAgents.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={data.topAgents} layout="vertical" margin={{ left: 80 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                            <XAxis type="number" tick={{ fontSize: 10, fill: "#999" }} allowDecimals={false} />
                                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#666" }} width={75} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill={GOLD} radius={[0, 4, 4, 0]} barSize={16} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-[#333]/40 py-10 text-sm">Sin llamadas de agentes</p>
                                )}
                            </ChartCard>

                            {/* Pie: browsers */}
                            <ChartCard title="Navegadores">
                                {data.browsers.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={data.browsers}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={75}
                                                dataKey="count"
                                                nameKey="name"
                                                label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                                                labelLine={false}
                                                style={{ fontSize: 10 }}
                                            >
                                                {data.browsers.map((_, i) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-[#333]/40 py-10 text-sm">Sin datos</p>
                                )}
                            </ChartCard>

                            {/* Pie: devices */}
                            <ChartCard title="Dispositivos">
                                {data.devices.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={data.devices}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={75}
                                                dataKey="count"
                                                nameKey="type"
                                                label={({ percent, type }: { percent?: number; type?: string }) => `${type || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                                                labelLine={false}
                                                style={{ fontSize: 10 }}
                                            >
                                                {data.devices.map((_, i) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-[#333]/40 py-10 text-sm">Sin datos</p>
                                )}
                            </ChartCard>

                            {/* Bar: countries */}
                            <ChartCard title="Paises">
                                {data.countries.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={data.countries.map(c => ({ ...c, label: `${countryFlag(c.code)} ${c.code}` }))} layout="vertical" margin={{ left: 50 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                            <XAxis type="number" tick={{ fontSize: 10, fill: "#999" }} allowDecimals={false} />
                                            <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={45} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill={GOLD} radius={[0, 4, 4, 0]} barSize={16} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-[#333]/40 py-10 text-sm">Sin datos</p>
                                )}
                            </ChartCard>

                            {/* Bar: top pages */}
                            <ChartCard title="Paginas mas visitadas">
                                {data.topPages.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={data.topPages} layout="vertical" margin={{ left: 70 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                            <XAxis type="number" tick={{ fontSize: 10, fill: "#999" }} allowDecimals={false} />
                                            <YAxis type="category" dataKey="path" tick={{ fontSize: 10, fill: "#666" }} width={65} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill={GOLD_LIGHT} radius={[0, 4, 4, 0]} barSize={16} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-[#333]/40 py-10 text-sm">Sin datos</p>
                                )}
                            </ChartCard>
                        </div>

                        {/* ─── Activity feed ─── */}
                        <div className="mt-4 mb-8">
                            <ChartCard title="Actividad reciente">
                                {data.recentVisits.length > 0 ? (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {data.recentVisits.map((visit) => (
                                            <div key={visit._id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#faf8f3]/60 transition-colors text-xs">
                                                {/* Pulse indicator */}
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                    visit.visitorType === 'human' ? 'bg-[#7a1a2e]' : 'bg-[#333]'
                                                } ${visit === data.recentVisits[0] ? 'animate-pulse' : ''}`} />
                                                {/* Time */}
                                                <span className="text-[#333]/40 w-14 flex-shrink-0">
                                                    {new Date(visit.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {/* Type badge */}
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                                                    visit.visitorType === 'human'
                                                        ? 'bg-[#7a1a2e]/15 text-[#7a1a2e]'
                                                        : 'bg-[#333]/10 text-[#333]'
                                                }`}>
                                                    {visit.visitorType === 'human' ? 'Persona'
                                                        : visit.visitorType === 'other_bot' ? 'Otro bot'
                                                        : visit.visitorType === 'agent' ? `Agente · ${visit.botName || '?'}`
                                                        : visit.botName || 'Rastreador IA'}
                                                </span>
                                                {/* Path */}
                                                <span className="text-[#333]/70 truncate">{visit.path}</span>
                                                {/* Country */}
                                                {visit.country && (
                                                    <span className="ml-auto flex-shrink-0">{countryFlag(visit.country)}</span>
                                                )}
                                                {/* Device/browser */}
                                                <span className="text-[#333]/30 flex-shrink-0">
                                                    {visit.browser || visit.deviceType}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-[#333]/40 py-10 text-sm">Sin actividad reciente</p>
                                )}
                            </ChartCard>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
