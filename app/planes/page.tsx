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
  const [emails, setEmails] = useState<string[]>(Array(10).fill(""));
  const [showCodeField, setShowCodeField] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleEmail = (index: number, value: string) => {
    const next = [...emails];
    next[index] = value;
    setEmails(next);
  };

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

          {/* Emails */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#999] mb-2">Participantes (hasta 10)</label>
            <div className="space-y-2">
              {emails.map((email, i) => (
                <input
                  key={i}
                  id={`email-${i + 1}`}
                  type="email"
                  disabled={loading}
                  value={email}
                  onChange={e => handleEmail(i, e.target.value)}
                  placeholder={`correo${i + 1}@empresa.com`}
                  className="w-full border border-[#E8E5E0] rounded-xl px-4 py-2.5 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#C5A47E] transition-colors bg-[#FAFAF8] disabled:opacity-50"
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            {!showCodeField ? (
              <>
                <a
                  href="mailto:damianlafferranderie@gmail.com?subject=Consulta Programa Organización"
                  className="w-full text-center block rounded-xl transition-all"
                  style={{ background: "#181714", color: "#fff", padding: "16px 24px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.18em" }}
                >
                  Consultar
                </a>
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
    </main>
  );
}
