"use client";

import { useState } from "react";
import Link from "next/link";

const CHECK_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#C5A47E] flex-shrink-0 mt-0.5">
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

  const handleEmail = (index: number, value: string) => {
    const next = [...emails];
    next[index] = value;
    setEmails(next);
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
        <p className="text-xs tracking-[0.25em] uppercase text-[#999] mb-2">unbancodeideas</p>
        <h1 className="text-2xl font-light text-[#2a2a2a] tracking-tight">Programas</h1>
      </div>

      {/* Plan Cards */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {/* Gratis */}
        <button
          id="plan-gratis"
          onClick={() => setSelectedPlan("gratis")}
          className={`text-left rounded-2xl p-6 border transition-all duration-300 ${
            selectedPlan === "gratis"
              ? "border-[#C5A47E] bg-white shadow-md"
              : "border-[#E8E5E0] bg-white/50 hover:bg-white hover:shadow-sm"
          }`}
        >
          <span className="text-[10px] uppercase tracking-widest text-[#aaa] font-medium">Gratis</span>
          <h2 className="text-lg font-medium text-[#2a2a2a] mt-1 mb-3">Entorno privado</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-[#555]">{CHECK_ICON}<span>Banco de ideas personal</span></li>
            <li className="flex items-start gap-2 text-sm text-[#555]">{CHECK_ICON}<span>IA DeepSeek como gestor</span></li>
            <li className="flex items-start gap-2 text-sm text-[#555]">{CHECK_ICON}<span>Bisociaciones y análisis</span></li>
          </ul>
          <p className="mt-4 text-[#C5A47E] font-medium text-sm">€0 / mes</p>
        </button>

        {/* Pro */}
        <button
          id="plan-pro"
          onClick={() => setSelectedPlan("pro")}
          className={`text-left rounded-2xl p-6 border transition-all duration-300 ${
            selectedPlan === "pro"
              ? "border-[#C5A47E] bg-white shadow-md"
              : "border-[#E8E5E0] bg-white/50 hover:bg-white hover:shadow-sm"
          }`}
        >
          <span className="text-[10px] uppercase tracking-widest text-[#C5A47E] font-medium">Pro</span>
          <h2 className="text-lg font-medium text-[#2a2a2a] mt-1 mb-3">Entorno avanzado</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-[#555]">{CHECK_ICON}<span>Todo lo del plan Gratis</span></li>
            <li className="flex items-start gap-2 text-sm text-[#555]">{CHECK_ICON}<span>Elige el modelo de IA (Claude, GPT-4o, DeepSeek…)</span></li>
            <li className="flex items-start gap-2 text-sm text-[#555]">{CHECK_ICON}<span>Gestor con mayor contexto</span></li>
          </ul>
          <p className="mt-4 text-[#C5A47E] font-medium text-sm">€9 / mes</p>
        </button>

        {/* Organización */}
        <button
          id="plan-org"
          onClick={() => setSelectedPlan("org")}
          className={`text-left rounded-2xl p-6 border transition-all duration-300 ${
            selectedPlan === "org"
              ? "border-[#C5A47E] bg-white shadow-md"
              : "border-[#E8E5E0] bg-white/50 hover:bg-white hover:shadow-sm"
          }`}
        >
          <span className="text-[10px] uppercase tracking-widest text-[#888] font-medium">Organización</span>
          <h2 className="text-lg font-medium text-[#2a2a2a] mt-1 mb-3">Entorno empresa</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-[#555]">{CHECK_ICON}<span>Espacio privado corporativo</span></li>
            <li className="flex items-start gap-2 text-sm text-[#555]">{CHECK_ICON}<span>IA especializada en tu empresa</span></li>
            <li className="flex items-start gap-2 text-sm text-[#555]">{CHECK_ICON}<span>Hasta 10 participantes</span></li>
          </ul>
          <p className="mt-4 text-[#C5A47E] font-medium text-sm">Consultar precio</p>
        </button>
      </div>

      {/* Org Form — visible only when org is selected */}
      {selectedPlan === "org" && (
        <div className="w-full max-w-2xl bg-white rounded-2xl border border-[#E8E5E0] p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h3 className="text-base font-medium text-[#2a2a2a] tracking-tight">Configura tu organización</h3>

          {/* Org Name */}
          <div>
            <label htmlFor="org-name" className="block text-xs uppercase tracking-widest text-[#999] mb-2">Nombre de la organización</label>
            <input
              id="org-name"
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="Ej: Acme Corp"
              className="w-full border border-[#E8E5E0] rounded-xl px-4 py-3 text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#C5A47E] transition-colors bg-[#FAFAF8]"
            />
          </div>

          {/* Context */}
          <div>
            <label htmlFor="org-context" className="block text-xs uppercase tracking-widest text-[#999] mb-2">Datos de tu empresa</label>
            <p className="text-xs text-[#aaa] mb-2">Este texto especializa a la IA en el contexto de tu organización.</p>
            <textarea
              id="org-context"
              value={orgContext}
              onChange={e => setOrgContext(e.target.value)}
              placeholder="Ej: Somos una startup de logística fundada en 2020. Nuestros principales retos son la optimización de rutas y la reducción de costes operativos…"
              rows={5}
              className="w-full border border-[#E8E5E0] rounded-xl px-4 py-3 text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#C5A47E] transition-colors bg-[#FAFAF8] resize-none"
            />
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
                  value={email}
                  onChange={e => handleEmail(i, e.target.value)}
                  placeholder={`correo${i + 1}@empresa.com`}
                  className="w-full border border-[#E8E5E0] rounded-xl px-4 py-2.5 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#C5A47E] transition-colors bg-[#FAFAF8]"
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            {!showCodeField ? (
              <>
                <button
                  id="btn-pagar"
                  className="w-full bg-[#2a2a2a] hover:bg-[#111] text-white text-sm font-medium py-3.5 rounded-xl transition-colors"
                >
                  Contratar programa
                </button>
                <button
                  id="btn-codigo"
                  onClick={() => setShowCodeField(true)}
                  className="w-full text-sm text-[#999] hover:text-[#555] transition-colors py-1"
                >
                  Tengo un código de invitación →
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <input
                  id="invite-code"
                  type="text"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  placeholder="Introduce tu código"
                  className="w-full border border-[#C5A47E] rounded-xl px-4 py-3 text-sm text-[#333] placeholder-[#bbb] focus:outline-none transition-colors bg-white text-center tracking-widest uppercase"
                />
                <button
                  id="btn-activar-codigo"
                  className="w-full bg-[#C5A47E] hover:bg-[#b8956e] text-white text-sm font-medium py-3.5 rounded-xl transition-colors"
                >
                  Activar código
                </button>
                <button
                  onClick={() => setShowCodeField(false)}
                  className="w-full text-sm text-[#bbb] hover:text-[#888] transition-colors py-1"
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
        <div className="w-full max-w-2xl text-center">
          <button
            id="btn-plan-cta"
            className="bg-[#2a2a2a] hover:bg-[#111] text-white text-sm font-medium px-8 py-3.5 rounded-xl transition-colors"
          >
            {selectedPlan === "gratis" ? "Empezar gratis" : "Contratar plan Pro"}
          </button>
          {selectedPlan === "gratis" && (
            <p className="text-xs text-[#bbb] mt-3">Sin tarjeta de crédito. Ya tienes acceso al plan gratuito si te registras.</p>
          )}
        </div>
      )}
    </main>
  );
}
