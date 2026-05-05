"use client";

import { useEffect, useRef } from "react";

const CSS = `
.ent-root { font-family: 'Inter', sans-serif; color: #181714; -webkit-font-smoothing: antialiased; }
.ent-root .ent-container { max-width: 860px; margin: 0 auto; padding: 0 40px; }
.ent-root .ent-hr { border: none; border-top: 0.5px solid #ddd7cb; margin: 56px 0; }
.ent-root .ent-hero { padding: 88px 0 0; margin-bottom: 80px; }
.ent-root .ent-label { font-family: 'JetBrains Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #8a7f72; margin-bottom: 28px; }
.ent-root .ent-hero h1 { font-family: 'Fraunces', serif; font-size: clamp(40px,6vw,56px); font-weight: 300; line-height: 1.05; letter-spacing: -0.035em; margin-bottom: 10px; }
.ent-root .ent-hero-sub { font-family: 'Fraunces', serif; font-size: clamp(18px,2.5vw,22px); font-weight: 300; font-style: italic; line-height: 1.3; letter-spacing: -0.02em; color: #8a7f72; }
.ent-root .ent-stat-n { font-family: 'Fraunces', serif; font-size: clamp(80px,14vw,120px); font-weight: 300; line-height: 0.9; letter-spacing: -0.05em; margin-bottom: 16px; }
.ent-root .ent-stat-n span { font-size: 0.48em; color: #8a7f72; }
.ent-root .ent-stat-copy { font-size: 15px; line-height: 1.65; color: #8a7f72; max-width: 480px; margin-bottom: 14px; }
.ent-root .ent-source-link { display: inline-flex; align-items: center; gap: 5px; font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #8a7f72; text-decoration: none; border-bottom: 0.5px solid #ddd7cb; padding-bottom: 1px; transition: color 0.15s, border-color 0.15s; }
.ent-root .ent-source-link:hover { color: #7a1a2e; border-bottom-color: #7a1a2e; }
.ent-root .ent-stat-visual { display: flex; align-items: center; gap: 48px; margin-top: 36px; flex-wrap: wrap; }
.ent-root .ent-donut-wrap { position: relative; width: 130px; height: 130px; flex-shrink: 0; }
.ent-root .ent-donut-wrap svg { transform: rotate(-90deg); }
.ent-root .ent-donut-track { fill: none; stroke: #e8e3da; stroke-width: 14; }
.ent-root .ent-donut-fill { fill: none; stroke: #7a1a2e; stroke-width: 14; stroke-linecap: round; stroke-dasharray: 0 408; transition: stroke-dasharray 2s cubic-bezier(0.22,1,0.36,1); }
.ent-root .ent-donut-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ent-root .ent-donut-pct { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 300; color: #7a1a2e; letter-spacing: -0.04em; line-height: 1; }
.ent-root .ent-donut-sub { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.14em; color: #8a7f72; margin-top: 3px; }
.ent-root .ent-stat-right { flex: 1; min-width: 200px; }
.ent-root .ent-counter-item { margin-bottom: 20px; }
.ent-root .ent-counter-val { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 300; letter-spacing: -0.03em; line-height: 1; margin-bottom: 6px; }
.ent-root .ent-counter-val.ent-win { color: #7a1a2e; }
.ent-root .ent-counter-bar-track { height: 3px; background: #ddd7cb; border-radius: 2px; margin-bottom: 6px; overflow: hidden; }
.ent-root .ent-counter-bar-fill { height: 100%; border-radius: 2px; width: 0; transition: width 2s cubic-bezier(0.22,1,0.36,1); }
.ent-root .ent-counter-bar-fill.ent-fail { background: #c8c2b8; }
.ent-root .ent-counter-bar-fill.ent-win { background: #7a1a2e; }
.ent-root .ent-counter-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #8a7f72; }
.ent-root .ent-five-callout { display: inline-flex; align-items: center; gap: 10px; margin-top: 24px; padding: 10px 16px; border: 1px solid #7a1a2e; border-radius: 100px; animation: ent-breathe 3s ease-in-out infinite; }
@keyframes ent-breathe { 0%,100%{border-color:#7a1a2e}50%{border-color:rgba(122,26,46,0.2)} }
.ent-root .ent-five-callout-dot { width: 10px; height: 10px; background: #7a1a2e; border-radius: 50%; animation: ent-pop 3s ease-in-out infinite; flex-shrink: 0; }
@keyframes ent-pop { 0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:0.6} }
.ent-root .ent-five-callout-pct { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 500; color: #7a1a2e; letter-spacing: -0.02em; }
.ent-root .ent-five-callout-text { font-family: 'Fraunces', serif; font-size: 14px; font-style: italic; color: #7a1a2e; letter-spacing: -0.01em; }
.ent-root .ent-h2 { font-family: 'Fraunces', serif; font-size: clamp(26px,3.5vw,36px); font-weight: 400; line-height: 1.15; letter-spacing: -0.025em; margin-bottom: 18px; }
.ent-root .ent-h2 em { font-style: italic; color: #8a7f72; }
.ent-root .ent-body { font-size: 15px; line-height: 1.65; color: #8a7f72; margin-bottom: 12px; }
.ent-root .ent-body strong { color: #181714; font-weight: 500; }
.ent-root .ent-bridge { text-align: center; padding: 12px 0; }
.ent-root .ent-bridge-pre { font-family: 'JetBrains Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.22em; color: #8a7f72; margin-bottom: 18px; }
.ent-root .ent-bridge-h { font-family: 'Fraunces', serif; font-size: 38px; font-weight: 300; line-height: 1.05; letter-spacing: -0.03em; }
.ent-root .ent-bridge-h em { font-style: italic; color: #7a1a2e; }
.ent-root .ent-idea-block { background: #f2ede3; border-radius: 12px; padding: 32px; margin: 24px 0; }
.ent-root .ent-idea-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.ent-root .ent-idea-tag { font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: #8a7f72; }
.ent-root .ent-idea-block h3 { font-family: 'Fraunces', serif; font-size: clamp(20px,2.8vw,26px); font-weight: 400; line-height: 1.2; letter-spacing: -0.02em; margin-bottom: 12px; }
.ent-root .ent-idea-block p { font-size: 14px; line-height: 1.65; color: #8a7f72; }
.ent-root .ent-idea-block p strong { color: #181714; font-weight: 500; }
.ent-root .ent-pillars { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin: 24px 0; }
.ent-root .ent-pillar { background: #faf8f3; border: 0.5px solid #ddd7cb; border-radius: 8px; padding: 20px 16px; }
.ent-root .ent-pillar-ico { font-size: 16px; color: #7a1a2e; margin-bottom: 14px; line-height: 1; }
.ent-root .ent-pillar h4 { font-family: 'Fraunces', serif; font-size: 15px; font-weight: 500; line-height: 1.2; letter-spacing: -0.01em; margin-bottom: 6px; }
.ent-root .ent-pillar p { font-size: 12px; line-height: 1.55; color: #8a7f72; }
.ent-root .ent-ai-expert { border: 0.5px solid #7a1a2e; border-radius: 12px; padding: 32px; margin: 28px 0; }
.ent-root .ent-ai-expert-tag { display: inline-flex; align-items: center; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: #7a1a2e; margin-bottom: 20px; }
.ent-root .ent-ai-pulse { width: 8px; height: 8px; background: #7a1a2e; border-radius: 50%; animation: ent-pulse 2s infinite; }
@keyframes ent-pulse { 0%,100%{opacity:1}50%{opacity:0.3} }
.ent-root .ent-ai-expert h3 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 400; line-height: 1.2; letter-spacing: -0.02em; margin-bottom: 12px; }
.ent-root .ent-ai-expert p { font-size: 14px; line-height: 1.65; color: #8a7f72; }
.ent-root .ent-ai-expert p strong { color: #181714; font-weight: 500; }
.ent-root .ent-steps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 28px; }
.ent-root .ent-step { background: #f2ede3; border-radius: 8px; padding: 24px; }
.ent-root .ent-step-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.ent-root .ent-step-n { font-family: 'Fraunces', serif; font-size: 13px; font-weight: 300; color: #7a1a2e; letter-spacing: 0.02em; }
.ent-root .ent-step-icon { width: 32px; height: 32px; border-radius: 50%; border: 0.5px solid #ddd7cb; display: flex; align-items: center; justify-content: center; background: #faf8f3; }
.ent-root .ent-step-title { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 500; line-height: 1.2; letter-spacing: -0.015em; margin-bottom: 8px; }
.ent-root .ent-step-desc { font-size: 12px; line-height: 1.6; color: #8a7f72; }
.ent-root .ent-step-badge { display: inline-block; margin-top: 12px; font-family: 'JetBrains Mono', monospace; font-size: 8px; text-transform: uppercase; letter-spacing: 0.14em; color: #7a1a2e; border: 0.5px solid #7a1a2e; padding: 2px 7px; border-radius: 100px; }
.ent-root .ent-commitment { display: grid; grid-template-columns: auto 1fr; gap: 48px; align-items: center; }
.ent-root .ent-seal { width: 180px; height: 180px; border-radius: 50%; border: 1px solid #181714; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px; position: relative; flex-shrink: 0; }
.ent-root .ent-seal::before { content: ''; position: absolute; inset: 10px; border: 0.5px dashed #ddd7cb; border-radius: 50%; }
.ent-root .ent-seal-label { font-family: 'JetBrains Mono', monospace; font-size: 8px; text-transform: uppercase; letter-spacing: 0.18em; color: #8a7f72; margin-bottom: 10px; line-height: 1.4; }
.ent-root .ent-seal h3 { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 400; line-height: 1.05; letter-spacing: -0.02em; margin-bottom: 4px; }
.ent-root .ent-seal h3 span { font-style: italic; color: #7a1a2e; }
.ent-root .ent-seal-sub { font-family: 'Fraunces', serif; font-size: 11px; font-style: italic; color: #8a7f72; margin-bottom: 10px; }
.ent-root .ent-seal-footer { font-family: 'JetBrains Mono', monospace; font-size: 7px; letter-spacing: 0.16em; text-transform: uppercase; color: #8a7f72; }
.ent-root .ent-commitment-text h2 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.2; margin-bottom: 14px; }
.ent-root .ent-commitment-text p { font-size: 13px; line-height: 1.65; color: #8a7f72; margin-bottom: 10px; }
.ent-root .ent-commitment-text p strong { color: #181714; font-weight: 500; }
.ent-root .ent-price-badge { display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; background: #7a1a2e; color: #faf8f3; padding: 4px 12px; margin-bottom: 20px; }
.ent-root .ent-price-name { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 500; letter-spacing: -0.015em; margin-bottom: 4px; }
.ent-root .ent-price-desc { font-size: 13px; color: #8a7f72; margin-bottom: 28px; }
.ent-root .ent-price-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 0.5px solid #ddd7cb; }
.ent-root .ent-price-currency { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 300; color: #8a7f72; }
.ent-root .ent-price-number { font-family: 'Fraunces', serif; font-size: 72px; font-weight: 300; line-height: 1; letter-spacing: -0.04em; }
.ent-root .ent-price-unit { font-size: 13px; color: #8a7f72; margin-left: 4px; }
.ent-root .ent-price-features { list-style: none; margin-bottom: 28px; padding: 0; }
.ent-root .ent-price-features li { padding: 11px 0; border-bottom: 0.5px solid #ddd7cb; display: flex; align-items: flex-start; gap: 12px; font-size: 13px; line-height: 1.5; color: #8a7f72; }
.ent-root .ent-price-features li:last-child { border-bottom: none; }
.ent-root .ent-pf-dot { color: #7a1a2e; font-size: 16px; flex-shrink: 0; line-height: 1.3; }
.ent-root .ent-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 26px; background: #181714; color: #faf8f3; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; text-decoration: none; border-radius: 2px; transition: background 0.2s; }
.ent-root .ent-btn:hover { background: #7a1a2e; }
.ent-root .ent-final { text-align: center; padding: 20px 0 0; }
.ent-root .ent-final h2 { font-family: 'Fraunces', serif; font-size: clamp(28px,4vw,44px); font-weight: 300; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 36px; }
.ent-root .ent-final h2 em { font-style: italic; color: #7a1a2e; }
.ent-root .ent-footer { margin-top: 40px; padding: 24px 0; border-top: 0.5px solid #ddd7cb; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.ent-root .ent-footer span { font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #8a7f72; }
.ent-root .ent-manifesto { background: #181714; border-radius: 16px; padding: 56px 48px; margin: 0 auto; text-align: center; }
.ent-root .ent-manifesto-pre { font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.22em; color: #8a7f72; margin-bottom: 32px; }
.ent-root .ent-manifesto p { font-family: 'Fraunces', serif; font-size: clamp(22px,3.5vw,34px); font-weight: 300; line-height: 1.35; letter-spacing: -0.02em; color: #f2ede3; }
.ent-root .ent-manifesto p mark { background: none; color: #c9a87a; font-style: italic; }
@media (max-width: 700px) { .ent-root .ent-manifesto { padding: 40px 28px; } }
@media (max-width: 700px) {
  .ent-root .ent-container { padding: 0 24px; }
  .ent-root .ent-hero { padding-top: 60px; }
  .ent-root .ent-pillars { grid-template-columns: 1fr; }
  .ent-root .ent-steps-grid { grid-template-columns: 1fr; }
  .ent-root .ent-commitment { grid-template-columns: 1fr; gap: 36px; }
  .ent-root .ent-seal { margin: 0 auto; }
  .ent-root .ent-stat-visual { flex-direction: column; gap: 28px; }
  .ent-root .ent-btn { width: 100%; justify-content: center; }
}
`;

export default function EnterpriseSection() {
  const statVisualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Google Fonts
    if (!document.querySelector('link[data-ent-fonts]')) {
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = 'https://fonts.googleapis.com';
      document.head.appendChild(preconnect);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0..1,300..500&family=JetBrains+Mono:wght@400&display=swap';
      link.setAttribute('data-ent-fonts', '');
      document.head.appendChild(link);
    }

    const animateCounter = (el: HTMLElement, target: number, suffix: string, duration: number) => {
      let start = 0;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(e * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const triggerAll = () => {
      const donutFill = document.getElementById('ent-donutFill') as SVGCircleElement | null;
      const failBar = document.getElementById('ent-failBar') as HTMLElement | null;
      const winBar = document.getElementById('ent-winBar') as HTMLElement | null;
      const failVal = document.getElementById('ent-failVal') as HTMLElement | null;
      const winVal = document.getElementById('ent-winVal') as HTMLElement | null;
      if (!donutFill || !failBar || !winBar || !failVal || !winVal) return;
      const circumference = 2 * Math.PI * 50;
      donutFill.style.strokeDasharray = `${circumference * 0.05} ${circumference}`;
      failBar.style.width = '95%';
      winBar.style.width = '5%';
      animateCounter(failVal, 95, '%', 2000);
      animateCounter(winVal, 5, '%', 2000);
    };

    const el = statVisualRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { setTimeout(triggerAll, 200); obs.disconnect(); } });
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="ent-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ent-container">

        <section className="ent-hero">
          <div className="ent-label">Programa de inyección de IA para organizaciones</div>
          <h1>Un banco de ideas.</h1>
          <div className="ent-hero-sub">Pensando futuros inteligentes.</div>
        </section>

        <hr className="ent-hr" />

        <section>
          <div className="ent-label">El punto de partida</div>
          <div className="ent-stat-n">95<span>%</span></div>
          <p className="ent-stat-copy">de los proyectos de IA en empresas fracasan sin generar valor medible. El MIT analizó 300 despliegues reales y el diagnóstico es claro.</p>
          <a href="https://fortune.com/2025/08/18/mit-report-95-percent-generative-ai-pilots-at-companies-failing-cfo/" target="_blank" rel="noopener" className="ent-source-link">MIT NANDA — Fortune, agosto 2025 ↗</a>

          <div className="ent-stat-visual" ref={statVisualRef}>
            <div className="ent-donut-wrap">
              <svg width="130" height="130" viewBox="0 0 130 130">
                <circle className="ent-donut-track" cx="65" cy="65" r="50" />
                <circle className="ent-donut-fill" id="ent-donutFill" cx="65" cy="65" r="50" />
              </svg>
              <div className="ent-donut-label">
                <div className="ent-donut-pct">5%</div>
                <div className="ent-donut-sub">éxito</div>
              </div>
            </div>
            <div className="ent-stat-right">
              <div className="ent-counter-item">
                <div className="ent-counter-val" id="ent-failVal">0%</div>
                <div className="ent-counter-bar-track"><div className="ent-counter-bar-fill ent-fail" id="ent-failBar" /></div>
                <div className="ent-counter-label">Sin retorno medible</div>
              </div>
              <div className="ent-counter-item">
                <div className="ent-counter-val ent-win" id="ent-winVal">0%</div>
                <div className="ent-counter-bar-track"><div className="ent-counter-bar-fill ent-win" id="ent-winBar" /></div>
                <div className="ent-counter-label">Generan impacto real</div>
              </div>
              <div className="ent-five-callout">
                <div className="ent-five-callout-dot" />
                <div className="ent-five-callout-pct">5%</div>
                <div className="ent-five-callout-text">Solo 5 de cada 100 lo logran</div>
              </div>
            </div>
          </div>
        </section>

        <hr className="ent-hr" />

        <section>
          <div className="ent-label">El patrón del 5%</div>
          <h2 className="ent-h2">Dentro de ese 5%, hay una <em>coincidencia</em>.</h2>
          <p className="ent-body">Los proyectos exitosos tienen algo en común: <strong>los empleados propusieron las soluciones</strong>. No bajaron de la dirección. Surgieron de quienes conocen los procesos, detectan las fricciones y saben dónde una IA bien aplicada cambia algo de verdad.</p>
          <p className="ent-body">La investigación en innovación organizacional lo confirma: las ideas que emergen desde dentro son las que perduran.</p>
          <a href="https://www.london.edu/think/employee-led-innovation" target="_blank" rel="noopener" className="ent-source-link">London Business School — Employee-led innovation ↗</a>
        </section>

        <hr className="ent-hr" />

        <section className="ent-bridge">
          <div className="ent-bridge-pre">Para este problema tenemos una</div>
          <div className="ent-bridge-h"><em>idea.</em></div>
        </section>

        <div className="ent-manifesto">
          <div className="ent-manifesto-pre">El programa · Organizaciones</div>
          <p>Una iniciativa de <mark>microconcursos</mark> para que los integrantes de la organización sean los <mark>protagonistas de los cambios</mark>, se motiven en repensar los procesos y acompañen a la organización a una <mark>transformación inteligente.</mark></p>
        </div>

        <hr className="ent-hr" />

        <div className="ent-idea-block">
          <div className="ent-idea-header">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M14 7C11.239 7 9 9.239 9 12c0 1.8.95 3.37 2.375 4.25V18h5v-1.75C17.05 15.37 18 13.8 18 12c0-2.761-2.239-5-4-5z" stroke="#8a7f72" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
              <line x1="11.5" y1="20" x2="16.5" y2="20" stroke="#8a7f72" strokeWidth="1.2" />
              <line x1="12" y1="22" x2="16" y2="22" stroke="#8a7f72" strokeWidth="1.2" />
            </svg>
            <span className="ent-idea-tag">Nuestra idea</span>
          </div>
          <h3>Crear el entorno propicio para que esto pase.</h3>
          <p>Un espacio diseñado para propiciar la creatividad colectiva mientras eleva el compromiso organizacional. De ahí nace <strong>unbancodeideas.com</strong> para empresas.</p>
        </div>

        <div className="ent-pillars">
          <div className="ent-pillar">
            <div className="ent-pillar-ico">○</div>
            <h4>Cero despidos por IA</h4>
            <p>El pacto que desbloquea la confianza. Nadie propone automatizar su trabajo si teme perderlo.</p>
          </div>
          <div className="ent-pillar">
            <div className="ent-pillar-ico">◇</div>
            <h4>Premios y reconocimiento</h4>
            <p>Refuerzo positivo que motiva la participación y premia la mejor idea del ciclo.</p>
          </div>
          <div className="ent-pillar">
            <div className="ent-pillar-ico">△</div>
            <h4>Inteligencia colectiva</h4>
            <p>Un espacio donde el grupo piensa junto, asistido por IA con contexto de la organización.</p>
          </div>
        </div>

        <hr className="ent-hr" />

        <div className="ent-ai-expert">
          <div className="ent-ai-expert-tag">
            <span className="ent-ai-pulse" />
            IA entrenada en tu empresa
          </div>
          <h3>Al cargar el material, estás creando una IA experta en tu organización.</h3>
          <p>Cada documento que sube la dirección — descripciones de procesos, objetivos, áreas de mejora — construye una <strong>base de conocimiento privada y exclusiva</strong> para tu empresa. La IA que acompaña a los empleados no es genérica: conoce tu negocio, tu lenguaje, tus fricciones. Es la diferencia entre un asistente cualquiera y un <strong>co-piloto especialista en tu organización</strong>.</p>
        </div>

        <hr className="ent-hr" />

        <section>
          <div className="ent-label">El programa, paso a paso</div>
          <div className="ent-steps-grid">
            <div className="ent-step">
              <div className="ent-step-header">
                <div className="ent-step-n">01</div>
                <div className="ent-step-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 12h6M9 16h6M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2M9 4a2 2 0 002 2h2a2 2 0 002-2M9 4a2 2 0 012-2h2a2 2 0 012 2" stroke="#8a7f72" strokeWidth="1.2" strokeLinecap="round" /></svg>
                </div>
              </div>
              <div className="ent-step-title">Carga el material</div>
              <div className="ent-step-desc">Sube descripciones de procesos, objetivos y áreas clave. Con eso la IA aprende cómo funciona tu empresa.</div>
              <div className="ent-step-badge">Entrena tu IA</div>
            </div>
            <div className="ent-step">
              <div className="ent-step-header">
                <div className="ent-step-n">02</div>
                <div className="ent-step-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 8v4l3 3M12 3a9 9 0 100 18A9 9 0 0012 3z" stroke="#8a7f72" strokeWidth="1.2" strokeLinecap="round" /></svg>
                </div>
              </div>
              <div className="ent-step-title">Describe los premios</div>
              <div className="ent-step-desc">Define qué recibirán las tres mejores ideas. Una cena, un bono, días libres — tú decides qué motiva a tu equipo.</div>
            </div>
            <div className="ent-step">
              <div className="ent-step-header">
                <div className="ent-step-n">03</div>
                <div className="ent-step-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3" stroke="#8a7f72" strokeWidth="1.2" /><circle cx="16" cy="10" r="2" stroke="#8a7f72" strokeWidth="1.2" /><path d="M3 20c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="#8a7f72" strokeWidth="1.2" strokeLinecap="round" /><path d="M16 15c1.657 0 3 1 3 3" stroke="#8a7f72" strokeWidth="1.2" strokeLinecap="round" /></svg>
                </div>
              </div>
              <div className="ent-step-title">Indica los participantes</div>
              <div className="ent-step-desc">Añade hasta 10 correos. Cada persona recibirá su invitación con el compromiso firmado por la dirección.</div>
            </div>
            <div className="ent-step">
              <div className="ent-step-header">
                <div className="ent-step-n">04</div>
                <div className="ent-step-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="#8a7f72" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              </div>
              <div className="ent-step-title">Espera los resultados</div>
              <div className="ent-step-desc">En 30 días recibirás un reporte con todas las ideas, las tres ganadoras y recomendaciones listas para implementar.</div>
            </div>
          </div>
        </section>

        <hr className="ent-hr" />

        <section className="ent-commitment">
          <div className="ent-seal">
            <div className="ent-seal-label">Compromiso · Sello del programa</div>
            <h3>Cero <span>despidos</span></h3>
            <div className="ent-seal-sub">por causa de la IA</div>
            <div className="ent-seal-footer">Banco de Ideas Organizaciones</div>
          </div>
          <div className="ent-commitment-text">
            <div className="ent-label">El compromiso que cambia todo</div>
            <h2>Si la IA va a transformar la empresa, el equipo tiene que querer transformarla.</h2>
            <p>Para que las personas propongan cómo automatizar su propio trabajo, antes tienen que saber que ese trabajo no se va a usar contra ellas.</p>
            <p>Las empresas que entran al programa firman el compromiso de <strong>cero despidos por IA</strong>: si una función se automatiza, la organización se compromete a reasignar al trabajador o ampliar su rol.</p>
            <p>Este pacto es el motor real del programa. Activa el compromiso organizacional. Construye confianza. Y desbloquea ideas que de otra forma nadie compartiría.</p>
          </div>
        </section>

        <hr className="ent-hr" />

        <section>
          <div className="ent-label">Programa de IA para empresas · unbancodeideas.com</div>
          <div style={{ border: '0.5px solid #ddd7cb', borderRadius: 12, padding: 40, marginTop: 28 }}>
            <div className="ent-price-badge">Programa Piloto</div>
            <div className="ent-price-name">Banco de Ideas Organizaciones</div>
            <div className="ent-price-desc">30 días · 10 participantes · Hasta 3 premios</div>
            <ul className="ent-price-features">
              <li><span className="ent-pf-dot">✦</span> IA entrenada y experta en los procesos de tu empresa</li>
              <li><span className="ent-pf-dot">✦</span> Workspace privado con 10 participantes y 3 premios configurables</li>
              <li><span className="ent-pf-dot">✦</span> Sistema de propuesta, debate y voto de ideas</li>
              <li><span className="ent-pf-dot">✦</span> Reporte ejecutivo final + sello "Cero despidos por IA"</li>
            </ul>
            <a href="mailto:hola@unbancodeideas.com?subject=Quiero%20contratar%20el%20piloto%20Organizaciones" className="ent-btn" style={{ width: '100%', justifyContent: 'center' }}>Empezar el piloto →</a>
          </div>
        </section>

        <hr className="ent-hr" />

        <section className="ent-final">
          <h2>Programa de IA para organizaciones<br /><em>Un Banco de Ideas.</em></h2>
          <a href="mailto:hola@unbancodeideas.com?subject=Quiero%20contratar%20el%20piloto%20Organizaciones" className="ent-btn" style={{ margin: '0 auto' }}>Contratar el piloto →</a>
        </section>

        <footer className="ent-footer">
          <span>© Banco de Ideas · unbancodeideas.com</span>
          <span>Inteligencia colectiva · Asistida por IA</span>
        </footer>

      </div>
    </div>
  );
}
