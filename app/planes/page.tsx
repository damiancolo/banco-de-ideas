"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import EnterpriseSection from "./EnterpriseSection";

const CHECK_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#7a1a2e", flexShrink: 0, marginTop: "2px" }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function PlanesPage() {
  const [selectedPlan, setSelectedPlan] = useState<"gratis" | "pro" | "org">("gratis");
  const [orgName, setOrgName] = useState("");
  const [orgContext, setOrgContext] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [prizes, setPrizes] = useState<string[]>(["", "", ""]);
  const [emails, setEmails] = useState<string[]>(Array(10).fill(""));
  const [showCodeField, setShowCodeField] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showJustificacion, setShowJustificacion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ filename: string; content: string }>>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = "planes-google-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;1,300;1,400&family=JetBrains+Mono:wght@400&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = '';

    setUploadingFile(true);
    setError(null);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/extract-text', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(`${file.name}: ${data.error || 'Error al procesar'}`);
        setUploadedFiles(prev => [...prev, { filename: data.filename, content: data.content }]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleActivateCode = async () => {
    if (!orgName || !inviteCode) {
      setError("Por favor rellena el nombre y el código.");
      return;
    }
    if (!organizerEmail || !organizerEmail.includes('@')) {
      setError("Introduce un email válido como organizador.");
      return;
    }
    if (!orgContext.trim() && uploadedFiles.length === 0) {
      setError("Añade al menos un documento o texto en la sección DATA.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convertir logo a base64 si existe
      let logoBase64: string | undefined;
      if (logoFile) {
        logoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(logoFile);
        });
      }

      const res = await fetch("/api/organizations/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          context: orgContext,
          files: uploadedFiles,
          logoBase64,
          organizerEmail,
          prizes,
          emails,
          inviteCode
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear la organización");
      }

      // Pass joinToken so OrgEnvironment can show the invite banner immediately
      window.location.href = `/org/${data.slug}${data.joinToken ? `?nuevo=1` : ''}`;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAF8] flex flex-col items-center px-4 py-12 relative">
      {/* Back */}
      <Link
        href="/"
        className="fixed top-6 left-6 p-2 rounded-full bg-white/60 hover:bg-white/90 backdrop-blur-sm shadow-sm transition-all text-[#666] hover:text-[#333]"
        aria-label="Volver al inicio"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </Link>

      {/* Header */}
      <div className="mb-10 text-center">
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "#8a7f72", marginBottom: "12px" }}>unbancodeideas</p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 300, color: "#181714", letterSpacing: "-0.03em", lineHeight: 1.05 }}>Programas</h1>
      </div>

      {/* Plan Cards */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {/* Gratis */}
        <button
          id="plan-gratis"
          onClick={() => setSelectedPlan("gratis")}
          className="text-left rounded-2xl p-6 border transition-all duration-300"
          style={{
            borderColor: selectedPlan === "gratis" ? "#7a1a2e" : "#ddd7cb",
            background: selectedPlan === "gratis" ? "#fff" : "rgba(250,248,243,0.6)",
            boxShadow: selectedPlan === "gratis" ? "0 4px 20px rgba(122,26,46,0.08)" : "none",
          }}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#8a7f72" }}>Gratis</span>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "22px", fontWeight: 300, color: "#181714", letterSpacing: "-0.025em", lineHeight: 1.1, margin: "6px 0 14px" }}>Entorno privado</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2" style={{ fontSize: "13px", color: "#8a7f72" }}>{CHECK_ICON}<span>Banco de ideas personal</span></li>
            <li className="flex items-start gap-2" style={{ fontSize: "13px", color: "#8a7f72" }}>{CHECK_ICON}<span>IA DeepSeek como gestor</span></li>
            <li className="flex items-start gap-2" style={{ fontSize: "13px", color: "#8a7f72" }}>{CHECK_ICON}<span>Bisociaciones y análisis</span></li>
          </ul>
        </button>

        {/* Pro */}
        <button
          id="plan-pro"
          onClick={() => setSelectedPlan("pro")}
          className="text-left rounded-2xl p-6 border transition-all duration-300"
          style={{
            borderColor: selectedPlan === "pro" ? "#7a1a2e" : "#ddd7cb",
            background: selectedPlan === "pro" ? "#fff" : "rgba(250,248,243,0.6)",
            boxShadow: selectedPlan === "pro" ? "0 4px 20px rgba(122,26,46,0.08)" : "none",
          }}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#7a1a2e" }}>Pro</span>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "22px", fontWeight: 300, color: "#181714", letterSpacing: "-0.025em", lineHeight: 1.1, margin: "6px 0 14px" }}>Entorno avanzado</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2" style={{ fontSize: "13px", color: "#8a7f72" }}>{CHECK_ICON}<span>Todo lo del plan Gratis</span></li>
            <li className="flex items-start gap-2" style={{ fontSize: "13px", color: "#8a7f72" }}>{CHECK_ICON}<span>Elige el modelo de IA (Claude, GPT, DeepSeek…)</span></li>
            <li className="flex items-start gap-2" style={{ fontSize: "13px", color: "#8a7f72" }}>{CHECK_ICON}<span>Gestor con mayor contexto</span></li>
          </ul>
          <p style={{ marginTop: "16px", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#7a1a2e" }}>Consultar →</p>
        </button>

        {/* Organización */}
        <button
          id="plan-org"
          onClick={() => setSelectedPlan("org")}
          className="text-left rounded-2xl p-6 border transition-all duration-300"
          style={{
            borderColor: selectedPlan === "org" ? "#7a1a2e" : "#ddd7cb",
            background: selectedPlan === "org" ? "#fff" : "rgba(250,248,243,0.6)",
            boxShadow: selectedPlan === "org" ? "0 4px 20px rgba(122,26,46,0.08)" : "none",
          }}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#8a7f72" }}>Organización</span>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "22px", fontWeight: 300, color: "#181714", letterSpacing: "-0.025em", lineHeight: 1.1, margin: "6px 0 14px" }}>Entorno empresa</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2" style={{ fontSize: "13px", color: "#8a7f72" }}>{CHECK_ICON}<span>Espacio privado corporativo</span></li>
            <li className="flex items-start gap-2" style={{ fontSize: "13px", color: "#8a7f72" }}>{CHECK_ICON}<span>IA especializada en tu empresa</span></li>
            <li className="flex items-start gap-2" style={{ fontSize: "13px", color: "#8a7f72" }}>{CHECK_ICON}<span>Hasta 10 participantes</span></li>
          </ul>
          <p style={{ marginTop: "16px", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#7a1a2e" }}>Consultar →</p>
        </button>
      </div>

      {/* Org Form — visible only when org is selected */}
      {selectedPlan === "org" && (
        <div className="w-full max-w-2xl bg-white rounded-2xl border border-[#E8E5E0] p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 400, color: "#181714", letterSpacing: "-0.02em" }}>Configura tu organización</h3>

          {error && (
            <p className="text-xs text-[#7a1a2e] bg-[#fdf5f5] border border-[#f0d8d8] rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {/* Org Name + Logo */}
          <div>
            <label htmlFor="org-name" className="block text-xs uppercase tracking-widest text-[#999] mb-2">Nombre de la organización</label>
            <div className="flex items-center gap-3">
              {/* Logo upload */}
              <button
                type="button"
                disabled={loading}
                onClick={() => logoInputRef.current?.click()}
                className="flex-shrink-0 w-12 h-12 rounded-xl border border-[#E8E5E0] bg-[#FAFAF8] flex items-center justify-center hover:border-[#C5A47E] transition-colors disabled:opacity-50 overflow-hidden"
                title="Subir logo"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C5A47E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                )}
              </button>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
              <input
                id="org-name"
                type="text"
                disabled={loading}
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="Ej: Acme Corp"
                className="flex-1 border border-[#E8E5E0] rounded-xl px-4 py-3 text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#C5A47E] transition-colors bg-[#FAFAF8] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Data Upload / Context */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-widest text-[#999]">DATA</label>
              <div className="flex items-center gap-2">
                {uploadingFile && (
                  <span className="text-[10px] text-[#C5A47E] animate-pulse">Procesando...</span>
                )}
                <button
                  type="button"
                  disabled={loading || uploadingFile}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#C5A47E] text-[#C5A47E] text-xs font-medium hover:bg-[#C5A47E] hover:text-white transition-colors disabled:opacity-40"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Añadir archivos
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </div>

            <p className="text-xs text-[#aaa] mb-3">
              Material para especializar la IA: procesos, contexto de la empresa, documentación interna, página web del proyecto.
            </p>

            {/* Chips de archivos subidos */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uploadedFiles.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 bg-[#F0EBE3] text-[#7a6248] text-xs px-3 py-1.5 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    {f.filename}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      disabled={loading}
                      className="ml-0.5 text-[#C5A47E] hover:text-[#b8956e] disabled:opacity-40"
                      aria-label="Eliminar archivo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            <textarea
              id="org-context"
              disabled={loading}
              value={orgContext}
              onChange={e => setOrgContext(e.target.value)}
              placeholder="O pega texto directamente: descripciones, procesos, contexto..."
              rows={4}
              className="w-full border border-[#E8E5E0] rounded-xl px-4 py-3 text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#C5A47E] transition-colors bg-[#FAFAF8] resize-none disabled:opacity-50"
            />
            <p className="text-[10px] text-[#bbb] mt-2 italic">
              * No subir información sensible o confidencial.
            </p>
          </div>

          {/* Organizador */}
          <div>
            <label htmlFor="organizer-email" className="block text-xs uppercase tracking-widest text-[#999] mb-1">Organizador del programa</label>
            <p className="text-xs text-[#aaa] mb-2">Tu email — con él accederás al entorno una vez que inicies sesión con Google.</p>
            <div className="relative">
              <input
                id="organizer-email"
                type="email"
                disabled={loading}
                value={organizerEmail}
                onChange={e => setOrganizerEmail(e.target.value)}
                placeholder="tu@empresa.com"
                className="w-full border-2 border-[#7a1a2e]/30 rounded-xl px-4 py-3 text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#7a1a2e] transition-colors bg-white disabled:opacity-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium tracking-widest uppercase text-[#7a1a2e]/60">Admin</span>
            </div>
          </div>

          {/* Premios */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#999] mb-1">Premios del programa</label>
            <p className="text-xs text-[#aaa] mb-3">Define qué recibirán las tres mejores ideas. Una cena, días libres, un bono — tú decides.</p>
            <div className="space-y-2">
              {prizes.map((prize, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium"
                    style={{ background: i === 0 ? '#c9a87a' : i === 1 ? '#b8b0a4' : '#a8856a', color: '#fff' }}>
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    disabled={loading}
                    value={prize}
                    onChange={e => { const next = [...prizes]; next[i] = e.target.value; setPrizes(next); }}
                    placeholder={i === 0 ? 'Ej: Cena para dos personas' : i === 1 ? 'Ej: Día libre extra' : 'Ej: Un kilo de helado'}
                    className="flex-1 border border-[#E8E5E0] rounded-xl px-4 py-2.5 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#C5A47E] transition-colors bg-[#FAFAF8] disabled:opacity-50"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Participantes */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#999] mb-1">Participantes</label>
            <p className="text-xs text-[#aaa] mb-3">Emails de las personas que recibirán el link de acceso (hasta 10).</p>
            <div className="space-y-2">
              {emails.map((email, i) => (
                <input
                  key={i}
                  type="email"
                  disabled={loading}
                  value={email}
                  onChange={e => { const next = [...emails]; next[i] = e.target.value; setEmails(next); }}
                  placeholder={`participante${i + 1}@empresa.com`}
                  className="w-full border border-[#E8E5E0] rounded-xl px-4 py-2.5 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#C5A47E] transition-colors bg-[#FAFAF8] disabled:opacity-50"
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            {!showCodeField ? (
              <>
                <div className="flex gap-3">
                  <a
                    href="mailto:damianlafferranderie@gmail.com?subject=Consulta Programa Organización"
                    className="flex-1 text-center block rounded-xl transition-all"
                    style={{ background: "#181714", color: "#fff", padding: "16px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em" }}
                  >
                    Consultar
                  </a>
                  <button
                    onClick={() => setShowJustificacion(true)}
                    className="flex-1 text-center rounded-xl transition-all border"
                    style={{ background: "#181714", color: "#fff", borderColor: "#181714", padding: "16px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer" }}
                  >
                    Justificación del programa para empresas
                  </button>
                </div>
                <button
                  id="btn-codigo"
                  disabled={loading}
                  onClick={() => setShowCodeField(true)}
                  className="w-full text-sm text-[#999] hover:text-[#555] transition-colors py-1 disabled:opacity-50"
                >
                  Tengo un código de invitación →
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <input
                  id="invite-code"
                  type="text"
                  disabled={loading}
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  placeholder="Introduce tu código"
                  className="w-full border border-[#C5A47E] rounded-xl px-4 py-3 text-sm text-[#333] placeholder-[#bbb] focus:outline-none transition-colors bg-white text-center tracking-widest uppercase disabled:opacity-50"
                />
                <button
                  id="btn-activar-codigo"
                  disabled={loading}
                  onClick={handleActivateCode}
                  className="w-full bg-[#C5A47E] hover:bg-[#b8956e] text-white text-sm font-medium py-3.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {loading ? "Creando..." : "Activar código"}
                </button>
                <button
                  disabled={loading}
                  onClick={() => setShowCodeField(false)}
                  className="w-full text-sm text-[#bbb] hover:text-[#888] transition-colors py-1 disabled:opacity-50"
                >
                  ← Volver
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* For non-org plans, simple CTA */}
      {selectedPlan !== "org" && (
        <div className="w-full max-w-2xl text-center mt-4">
          <a
            href="mailto:damianlafferranderie@gmail.com?subject=Consulta Plan Personal"
            className="inline-block rounded-xl transition-all"
            style={{ background: "#181714", color: "#fff", padding: "16px 48px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.18em" }}
          >
            Consultar
          </a>
        </div>
      )}

      {/* Enterprise landing section */}
      <div className="w-full mt-16">
        <EnterpriseSection />
      </div>

      {/* Modal: Justificación del programa para empresas */}
      {showJustificacion && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
          style={{ background: "rgba(24,23,20,0.72)", backdropFilter: "blur(4px)", padding: "32px 16px" }}
          onClick={e => { if (e.target === e.currentTarget) setShowJustificacion(false); }}
        >
          <div className="bg-[#FAFAF8] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Close */}
            <button
              onClick={() => setShowJustificacion(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow-sm"
              aria-label="Cerrar"
              style={{ color: "#666" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Imagen / ilustración */}
            <div style={{ background: "#181714", padding: "56px 48px 48px", position: "relative", overflow: "hidden" }}>
              {/* Fondo decorativo */}
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06 }} viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice">
                <circle cx="520" cy="60" r="180" fill="#fff" />
                <circle cx="80" cy="240" r="120" fill="#fff" />
              </svg>

              {/* Visual 95/5 */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: "32px", position: "relative", zIndex: 1 }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(72px,14vw,108px)", fontWeight: 300, lineHeight: 0.9, letterSpacing: "-0.05em", color: "#3a3632" }}>95<span style={{ fontSize: "0.45em", color: "#4a4440" }}>%</span></div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#6a6460", marginTop: "12px" }}>fracasan</div>
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(36px,7vw,56px)", fontWeight: 400, lineHeight: 0.9, letterSpacing: "-0.04em", color: "#c9a87a" }}>5<span style={{ fontSize: "0.5em" }}>%</span></div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#c9a87a", marginTop: "12px" }}>lo logran</div>
                </div>
              </div>

              <div style={{ marginTop: "28px", position: "relative", zIndex: 1 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(18px,3vw,24px)", fontWeight: 300, fontStyle: "italic", color: "#8a8480", lineHeight: 1.3, letterSpacing: "-0.02em" }}>
                  Lo que el director de una empresa necesita saber sobre la IA<br />antes de tomar la próxima decisión.
                </div>
              </div>
              <div style={{ marginTop: "16px", fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.22em", color: "#5a5654", position: "relative", zIndex: 1 }}>
                Justificación científica · Banco de Ideas para Empresas
              </div>
            </div>

            {/* Contenido del artículo */}
            <div style={{ padding: "48px 44px 56px", fontFamily: "'Fraunces', serif" }}>

              {/* El dato */}
              <section style={{ marginBottom: "40px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "#8a7f72", marginBottom: "20px" }}>El dato</div>
                <p style={{ fontSize: "clamp(15px,2vw,17px)", lineHeight: 1.7, color: "#181714", marginBottom: "16px" }}>
                  <strong>95 de cada 100 proyectos de IA en empresas fracasan.</strong> Sin valor medible. Sin retorno. Sin impacto en la cuenta de resultados.
                </p>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#8a7f72", marginBottom: "16px" }}>
                  No es una opinión. Es la conclusión de un estudio del MIT publicado en 2025 sobre 300 despliegues reales en empresas de todos los tamaños.
                </p>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#8a7f72" }}>
                  Solo 5 de cada 100 lo consiguen. La pregunta evidente es <strong style={{ color: "#181714" }}>qué hace ese 5%</strong>.
                </p>
              </section>

              <hr style={{ border: "none", borderTop: "0.5px solid #ddd7cb", margin: "0 0 40px" }} />

              {/* Lo que distingue al 5% */}
              <section style={{ marginBottom: "40px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "#8a7f72", marginBottom: "20px" }}>Lo que distingue al 5%</div>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#8a7f72", marginBottom: "20px" }}>
                  No es el modelo de IA que usan. Todas las empresas tienen acceso a las mismas herramientas. No es el presupuesto: empresas que invierten millones fracasan, y empresas que invierten poco extraen valor real.
                </p>
                <div style={{ background: "#f2ede3", borderRadius: "12px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  {[
                    ["Las ideas vienen de los empleados, no de la dirección.", "Los proyectos exitosos son los que propusieron las personas que ejecutan el trabajo. Las que saben dónde duele. La dirección ve ineficiencias en agregado; los empleados las viven en detalle."],
                    ["Atacan procesos invisibles, no campañas vistosas.", "El mayor retorno está en lo aburrido: facturación, conciliaciones, gestión documental, comunicación interna. La IA que se luce en marketing rinde menos que la IA que ordena el back-office."],
                    ["Ejecutan rápido o no ejecutan.", "Las empresas medianas pasan de prueba a uso real en 90 días. Las grandes tardan 9 meses y la mayoría muere por el camino."],
                    ["Sus empleados se sienten seguros.", "Nadie propone cómo automatizar su propio trabajo si teme que ese trabajo se use contra él. Sin garantía explícita de empleo, lo que se recoge son ideas decorativas."],
                  ].map(([title, body], i) => (
                    <div key={i}>
                      <p style={{ fontSize: "14px", fontWeight: 500, color: "#181714", marginBottom: "6px", lineHeight: 1.4 }}>{title}</p>
                      <p style={{ fontSize: "13px", lineHeight: 1.65, color: "#8a7f72" }}>{body}</p>
                    </div>
                  ))}
                </div>
              </section>

              <hr style={{ border: "none", borderTop: "0.5px solid #ddd7cb", margin: "0 0 40px" }} />

              {/* La consecuencia incómoda */}
              <section style={{ marginBottom: "40px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "#8a7f72", marginBottom: "20px" }}>La consecuencia incómoda</div>
                <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#181714", marginBottom: "16px" }}>
                  Si lo anterior es cierto, <strong>el problema no es comprar la IA correcta. Es construir las condiciones para que las personas correctas la usen</strong>.
                </p>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#8a7f72", marginBottom: "16px" }}>
                  Y esas condiciones no aparecen solas. La mayoría de las organizaciones tiene buzones de sugerencias que nadie revisa, reuniones donde solo habla quien siempre habla, y procesos de innovación opacos. La inteligencia colectiva existe en cada empresa. Pero rara vez encuentra dónde manifestarse.
                </p>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#8a7f72" }}>
                  Por eso el 95% fracasa. No por falta de tecnología. Por falta de un lugar donde las personas que conocen el trabajo puedan proponer cómo mejorarlo, y al hacerlo no se sientan expuestas.
                </p>
              </section>

              <hr style={{ border: "none", borderTop: "0.5px solid #ddd7cb", margin: "0 0 40px" }} />

              {/* La propuesta */}
              <section style={{ marginBottom: "40px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "#8a7f72", marginBottom: "20px" }}>La propuesta</div>
                <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#181714", marginBottom: "20px" }}>
                  <strong>Banco de Ideas Organizaciones</strong> es un programa diseñado para construir ese lugar de forma deliberada. No depende de que la cultura de la empresa lo genere espontáneamente.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    "30 días. Un ciclo corto, acotado, con principio y fin claros.",
                    "Hasta 10 participantes. Empleados de distintos niveles, incluidos mandos intermedios.",
                    "IA entrenada con la documentación de su empresa. No una IA genérica. Una que conoce sus procesos, su lenguaje, sus áreas de mejora.",
                    "Premios visibles desde el inicio. Definidos por la dirección.",
                    "Compromiso firmado de cero despidos por IA. Si una función se automatiza, la organización reasigna o amplía el rol. Es la condición de entrada al programa.",
                    "Reporte ejecutivo final. Con todas las propuestas, las tres ganadoras y recomendaciones de implementación.",
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <span style={{ color: "#7a1a2e", fontSize: "16px", lineHeight: "1.5", flexShrink: 0 }}>✦</span>
                      <p style={{ fontSize: "13px", lineHeight: 1.65, color: "#8a7f72" }}>{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              <hr style={{ border: "none", borderTop: "0.5px solid #ddd7cb", margin: "0 0 40px" }} />

              {/* Lo que un director gana */}
              <section style={{ marginBottom: "40px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "#8a7f72", marginBottom: "20px" }}>Lo que un director gana en 30 días</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {[
                    ["Un inventario priorizado de oportunidades reales de IA en su empresa.", "No genéricas. Identificadas por las personas que conocen los procesos."],
                    ["Un equipo con experiencia práctica.", "Los participantes salen del ciclo sabiendo usar IA en el contexto real de su trabajo. Ese aprendizaje queda en la organización."],
                    ["Una señal interna potente.", "El compromiso firmado de no despido por IA cambia la conversación dentro de la empresa. Reduce el miedo. Aumenta la propuesta. Transforma a la IA, en el imaginario del equipo, de amenaza a herramienta."],
                  ].map(([title, body], i) => (
                    <div key={i} style={{ paddingLeft: "16px", borderLeft: "2px solid #ddd7cb" }}>
                      <p style={{ fontSize: "14px", fontWeight: 500, color: "#181714", marginBottom: "6px" }}>{title}</p>
                      <p style={{ fontSize: "13px", lineHeight: 1.65, color: "#8a7f72" }}>{body}</p>
                    </div>
                  ))}
                </div>
              </section>

              <hr style={{ border: "none", borderTop: "0.5px solid #ddd7cb", margin: "0 0 40px" }} />

              {/* Nuevo capítulo: el experimento continúa */}
              <section style={{ marginBottom: "40px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "#7a1a2e", marginBottom: "20px" }}>Versión 1.0 · El experimento continúa</div>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(20px,3vw,26px)", fontWeight: 400, lineHeight: 1.15, letterSpacing: "-0.025em", color: "#181714", marginBottom: "16px" }}>
                  Lo que mediremos en las próximas versiones
                </h2>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#8a7f72", marginBottom: "16px" }}>
                  Este programa no es un producto terminado. Es una hipótesis de trabajo.
                </p>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#8a7f72", marginBottom: "24px" }}>
                  La hipótesis es esta: que en cualquier organización existe suficiente inteligencia colectiva para identificar las mejores oportunidades de aplicar IA, y que el problema no es la falta de ideas sino la falta de un entorno que las active. El diseño del programa —el ciclo de 30 días, el compromiso de no despido, los premios, la IA entrenada en contexto— es un conjunto de variables que en la versión 1.0 son fijas. En las versiones siguientes, serán ajustadas según lo que los datos de cada ciclo vayan revelando.
                </p>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#8a7f72", marginBottom: "28px" }}>
                  Para que ese ajuste sea riguroso, definimos de antemano qué mediremos.
                </p>

                {/* Variables de resultado */}
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#8a7f72", marginBottom: "16px" }}>Variables de resultado</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {[
                      ["Tasa de implementación de ideas", "¿Cuántas de las ideas ganadoras se implementan en los 90 días siguientes al ciclo? Esta es la variable de mayor peso. Un programa que genera ideas pero no movimiento no valida la hipótesis."],
                      ["Diversidad jerárquica de las propuestas", "¿De qué nivel organizacional provienen las mejores ideas? Si el 80% vienen de mandos intermedios hacia arriba, la hipótesis de que «quien conoce el trabajo propone la solución» necesita ser revisada."],
                      ["Retorno sobre la inversión de las ideas implementadas", "¿Cuánto tiempo ahorra el proceso automatizado? ¿Cuánto cuesta el ciclo vs. el valor generado? Este número, recopilado ciclo a ciclo, construirá el caso de negocio para versiones posteriores."],
                    ].map(([title, body], i) => (
                      <div key={i} style={{ background: "#f2ede3", borderRadius: "10px", padding: "18px 20px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "#181714", marginBottom: "6px", lineHeight: 1.4 }}>{title}</p>
                        <p style={{ fontSize: "12px", lineHeight: 1.65, color: "#8a7f72" }}>{body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variables de proceso */}
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#8a7f72", marginBottom: "16px" }}>Variables de proceso</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {[
                      ["Tasa de participación activa", "Porcentaje de los participantes invitados que proponen al menos una idea a lo largo del ciclo. Si queda por debajo del 60%, hay que revisar el onboarding o el encuadre del programa."],
                      ["Índice de miedo percibido", "Encuesta de 3 preguntas, antes y después del ciclo: ¿sientes que proponer automatizaciones pone en riesgo tu puesto? La reducción de este índice es un indicador de que el compromiso de «cero despidos» funciona como palanca psicológica."],
                      ["Calidad de uso de la IA", "Medida como la ratio entre preguntas genéricas y preguntas específicas de proceso («¿cómo podríamos automatizar la conciliación bancaria de fin de mes?»). Un ratio alto en favor de las genéricas indica que la IA no está siendo usada como co-piloto sino como motor de búsqueda."],
                    ].map(([title, body], i) => (
                      <div key={i} style={{ background: "#f2ede3", borderRadius: "10px", padding: "18px 20px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "#181714", marginBottom: "6px", lineHeight: 1.4 }}>{title}</p>
                        <p style={{ fontSize: "12px", lineHeight: 1.65, color: "#8a7f72" }}>{body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variables de largo plazo */}
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#8a7f72", marginBottom: "16px" }}>Variables de largo plazo · seguimiento a 6 meses</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {[
                      ["Retención del conocimiento", "¿Siguen usando IA para su trabajo los participantes 6 meses después? Esta variable determina si el programa genera aprendizaje durable o solo exposición puntual."],
                      ["Difusión interna", "¿Cuántas personas no participantes han adoptado alguna práctica de IA tras observar el ciclo? Los programas más exitosos generan efectos de segunda ola sin coste adicional."],
                    ].map(([title, body], i) => (
                      <div key={i} style={{ background: "#f2ede3", borderRadius: "10px", padding: "18px 20px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "#181714", marginBottom: "6px", lineHeight: 1.4 }}>{title}</p>
                        <p style={{ fontSize: "12px", lineHeight: 1.65, color: "#8a7f72" }}>{body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cierre del capítulo */}
                <div style={{ border: "0.5px solid #7a1a2e", borderRadius: "12px", padding: "24px 28px" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.18em", color: "#7a1a2e", marginBottom: "12px" }}>Cómo se usa esto</div>
                  <p style={{ fontSize: "13px", lineHeight: 1.7, color: "#8a7f72", marginBottom: "12px" }}>
                    Al final de cada ciclo, el reporte ejecutivo incluirá estas métricas en crudo —sin interpretar, para que la dirección las evalúe con criterio propio. Con cada nuevo ciclo, las comparaciones entre organizaciones (anonimizadas) irán construyendo un benchmark de referencia.
                  </p>
                  <p style={{ fontSize: "13px", lineHeight: 1.7, color: "#181714", fontStyle: "italic" }}>
                    El objetivo no es demostrar que el programa funciona. Es entender con precisión cuándo funciona, para quién, y bajo qué condiciones. Eso es lo que diferencia un experimento de un argumento de venta.
                  </p>
                </div>
              </section>

              {/* CTA */}
              <div style={{ textAlign: "center", paddingTop: "8px" }}>
                <a
                  href="mailto:damianlafferranderie@gmail.com?subject=Consulta Programa Organización"
                  style={{ display: "inline-block", background: "#181714", color: "#fff", padding: "16px 40px", borderRadius: "12px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.18em", textDecoration: "none" }}
                >
                  Consultar el programa →
                </a>
              </div>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}
