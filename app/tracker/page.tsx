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
    humanCount: number;
    botCount: number;
    countryCount: number;
    dailyData: { date: string; human: number; bot: number }[];
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
const GOLD = "#C5A47E";
const GOLD_LIGHT = "#D4B896";
const BEIGE = "#F8F5F0";
const DARK = "#333";
const PIE_COLORS = ["#C5A47E", "#8B7355", "#D4B896", "#A0522D", "#DEB887", "#CD853F"];

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
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-[#C5A47E]/10">
            <h3 className="text-sm font-semibold text-[#333] mb-4 tracking-wide uppercase">{title}</h3>
            {children}
        </div>
    );
}

// ─── Custom tooltip ───
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
    if (!active || !payload) return null;
    return (
        <div className="bg-white rounded-lg shadow-lg border border-[#C5A47E]/20 p-3 text-xs">
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
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F5F0" }}><div className="w-8 h-8 border-2 border-[#C5A47E] border-t-transparent rounded-full animate-spin" /></div>}>
            <TrackerContent />
        </Suspense>
    );
}

function TrackerContent() {
    const searchParams = useSearchParams();
    const site = searchParams.get("site") || "estudioprompt";
    const [data, setData] = useState<TrackerData | null>(null);
    const [range, setRange] = useState("7d");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch(`/api/tracker?range=${range}&site=${site}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            setData(json);
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

    // Donut data for human vs bot
    const donutData = data ? [
        { name: "Humanos", value: data.humanCount },
        { name: "Bots", value: data.botCount },
    ] : [];

    return (
        <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${BEIGE} 0%, #EDE8E0 50%, ${BEIGE} 100%)` }}>
            {/* Header */}
            <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-[#333]/60 hover:text-[#C5A47E] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                        </Link>
                        <h1 className="text-2xl font-bold text-[#333] tracking-tight">Analytics</h1>
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Auto-refresh: 60s" />
                    </div>
                    {/* Range selector */}
                    <div className="flex gap-1 bg-white/60 rounded-xl p-1 shadow-sm border border-[#C5A47E]/10">
                        {ranges.map((r) => (
                            <button
                                key={r.key}
                                onClick={() => setRange(r.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    range === r.key
                                        ? "bg-[#C5A47E] text-white shadow-sm"
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
                        <div className="w-8 h-8 border-2 border-[#C5A47E] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {error && !data && (
                    <div className="text-center py-20 text-[#333]/60">{error}</div>
                )}

                {data && (
                    <>
                        {/* ─── Stat cards ─── */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            {[
                                { label: "Total Visitas", value: data.totalVisits, icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
                                { label: "Humanos", value: data.humanCount, icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                                { label: "Bots IA", value: data.botCount, icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                                { label: "Paises", value: data.countryCount, icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#C5A47E]/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={stat.icon}/></svg>
                                        <span className="text-[10px] uppercase tracking-wider text-[#333]/50 font-medium">{stat.label}</span>
                                    </div>
                                    <div className="text-2xl font-bold text-[#333]">
                                        <AnimatedCounter value={stat.value} />
                                    </div>
                                </div>
                            ))}
                        </div>

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
                                        <Area type="monotone" dataKey="human" name="Humanos" stroke={GOLD} fill="url(#goldGradient)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="bot" name="Bots" stroke={DARK} fill="url(#darkGradient)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center text-[#333]/40 py-10 text-sm">Sin datos para este periodo</p>
                            )}
                        </ChartCard>

                        {/* ─── Two-column grid ─── */}
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                            {/* Donut: humans vs bots */}
                            <ChartCard title="Humanos vs Bots">
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
                                                <Cell fill={GOLD} />
                                                <Cell fill={DARK} />
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-[#333]/40 py-10 text-sm">Sin datos</p>
                                )}
                            </ChartCard>

                            {/* Bar: top bots */}
                            <ChartCard title="Top Bots de IA">
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
                                            <div key={visit._id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#F8F5F0]/60 transition-colors text-xs">
                                                {/* Pulse indicator */}
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                    visit.visitorType === 'bot' ? 'bg-[#333]' : 'bg-[#C5A47E]'
                                                } ${visit === data.recentVisits[0] ? 'animate-pulse' : ''}`} />
                                                {/* Time */}
                                                <span className="text-[#333]/40 w-14 flex-shrink-0">
                                                    {new Date(visit.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {/* Type badge */}
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                                                    visit.visitorType === 'bot'
                                                        ? 'bg-[#333]/10 text-[#333]'
                                                        : 'bg-[#C5A47E]/15 text-[#8B7355]'
                                                }`}>
                                                    {visit.visitorType === 'bot' ? visit.botName || 'Bot' : 'Humano'}
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
