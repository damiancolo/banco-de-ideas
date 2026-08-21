/**
 * Los dos sonidos del banco.
 *
 *   playSwitch()  el clac de un interruptor de lamparita antigua. Suena al pasar
 *                 el mouse por la bombilla de arriba, que es literalmente
 *                 encenderla. Corto y bajo: se dispara muy seguido.
 *
 *   playSaved()   la recompensa de guardar una idea. Un arpegio de Mi mayor
 *                 ascendente con timbre de campana, en la familia del sonido de
 *                 juntar una moneda pero más cálido, para no desentonar con el
 *                 beige del sitio.
 *
 * Los dos se sintetizan en el momento con Web Audio API: sin archivos, sin peso,
 * y se afinan cambiando los números de acá abajo.
 *
 * SOBRE EL AudioContext: los navegadores no dejan sonar nada hasta que el usuario
 * interactúa, y pasar el mouse NO cuenta como interacción. Por eso unlockAudio()
 * se engancha al primer clic o tecla de la página. Antes de ese primer gesto el
 * hover es mudo, y no hay forma de evitarlo.
 */

let contexto: AudioContext | null = null;
let enganchado = false;

/** Crea o reanuda el contexto compartido. Devuelve null si el audio no está disponible. */
function obtenerContexto(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
        if (!contexto) {
            const Ctor = window.AudioContext
                || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!Ctor) return null;
            contexto = new Ctor();
        }
        if (contexto.state === "suspended") void contexto.resume();
        return contexto.state === "closed" ? null : contexto;
    } catch {
        return null;
    }
}

/**
 * Habilita el audio. Llamar DENTRO de un gesto del usuario (un clic, una tecla),
 * aunque el sonido suene después. Además deja enganchado un oyente global para
 * que el primer clic en cualquier parte de la página desbloquee el hover.
 */
export function unlockAudio(): void {
    obtenerContexto();

    if (enganchado || typeof window === "undefined") return;
    enganchado = true;
    const abrir = () => { obtenerContexto(); };
    window.addEventListener("pointerdown", abrir, { once: true, passive: true });
    window.addEventListener("keydown", abrir, { once: true });
}

/** El buffer de ruido del clac se genera una vez y se reutiliza. */
let ruidoCache: AudioBuffer | null = null;
function ruido(ctx: AudioContext): AudioBuffer {
    if (ruidoCache && ruidoCache.sampleRate === ctx.sampleRate) return ruidoCache;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.05), ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
    ruidoCache = buffer;
    return buffer;
}

// ──────────────────────────────────────────────────────────────────────
// El interruptor
// ──────────────────────────────────────────────────────────────────────

/** No se repite más rápido que esto: pasar el mouse por encima es muy fácil. */
const ESPERA_SWITCH_MS = 350;
let ultimoSwitch = 0;

export function playSwitch(): void {
    const ahora = typeof performance !== "undefined" ? performance.now() : 0;
    if (ahora - ultimoSwitch < ESPERA_SWITCH_MS) return;
    ultimoSwitch = ahora;

    const ctx = obtenerContexto();
    if (!ctx) return;

    try {
        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.value = 0.16;
        master.connect(ctx.destination);

        // El contacto: ruido muy corto por un pasabanda agudo. Ataque instantáneo
        // y caída exponencial, que es como suena un golpe y no un fundido.
        const fuente = ctx.createBufferSource();
        fuente.buffer = ruido(ctx);
        const filtro = ctx.createBiquadFilter();
        filtro.type = "bandpass";
        filtro.frequency.value = 2600;
        filtro.Q.value = 1.4;
        const gClac = ctx.createGain();
        gClac.gain.setValueAtTime(0.9, t);
        gClac.gain.exponentialRampToValueAtTime(0.0001, t + 0.011);
        fuente.connect(filtro).connect(gClac).connect(master);
        fuente.start(t);
        fuente.stop(t + 0.03);

        // El filamento que salta: un pulso grave que sube apenas de tono.
        const filamento = ctx.createOscillator();
        filamento.type = "triangle";
        filamento.frequency.setValueAtTime(95, t);
        filamento.frequency.linearRampToValueAtTime(128, t + 0.07);
        const calidez = ctx.createBiquadFilter();
        calidez.type = "lowpass";
        calidez.frequency.value = 850;
        const gFil = ctx.createGain();
        gFil.gain.setValueAtTime(0.0001, t + 0.006);
        gFil.gain.exponentialRampToValueAtTime(0.14, t + 0.022);
        gFil.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
        filamento.connect(calidez).connect(gFil).connect(master);
        filamento.start(t + 0.006);
        filamento.stop(t + 0.15);
    } catch {
        // Un sonido que falla no puede romper nada de lo que hay alrededor.
    }
}

// ──────────────────────────────────────────────────────────────────────
// La recompensa
// ──────────────────────────────────────────────────────────────────────

/** Mi mayor ascendente: E5, G#5, B5, E6. Cierra una octava arriba de donde abre. */
const ARPEGIO = [659.25, 830.61, 987.77, 1318.51];
const PASO = 0.052;

/** Una campana: fundamental en triangular más el armónico de octava en seno. */
function campana(
    ctx: AudioContext,
    destino: AudioNode,
    frecuencia: number,
    inicio: number,
    dur: number,
    nivel: number,
): void {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, inicio);
    g.gain.exponentialRampToValueAtTime(nivel, inicio + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
    g.connect(destino);

    const fundamental = ctx.createOscillator();
    fundamental.type = "triangle";
    fundamental.frequency.value = frecuencia;
    fundamental.connect(g);
    fundamental.start(inicio);
    fundamental.stop(inicio + dur + 0.02);

    // La octava por encima, floja, es lo que le da el brillo de campana.
    const brillo = ctx.createOscillator();
    brillo.type = "sine";
    brillo.frequency.value = frecuencia * 2;
    const gBrillo = ctx.createGain();
    gBrillo.gain.value = 0.32;
    brillo.connect(gBrillo).connect(g);
    brillo.start(inicio);
    brillo.stop(inicio + dur + 0.02);
}

export function playSaved(): void {
    const ctx = obtenerContexto();
    if (!ctx) return;

    try {
        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.value = 0.26;
        master.connect(ctx.destination);

        ARPEGIO.forEach((f, i) => {
            const ultima = i === ARPEGIO.length - 1;
            // La última nota se queda sonando: es la cola que da la sensación de
            // que algo se completó, en vez de cortarse en seco.
            campana(ctx, master, f, t + i * PASO, ultima ? 0.95 : 0.34, ultima ? 0.34 : 0.26);
        });

        // Un destello agudo sobre la última nota, muy por debajo del resto.
        const cierre = t + (ARPEGIO.length - 1) * PASO;
        const chispa = ctx.createOscillator();
        chispa.type = "sine";
        chispa.frequency.value = ARPEGIO[ARPEGIO.length - 1] * 3;
        const gChispa = ctx.createGain();
        gChispa.gain.setValueAtTime(0.0001, cierre);
        gChispa.gain.exponentialRampToValueAtTime(0.05, cierre + 0.01);
        gChispa.gain.exponentialRampToValueAtTime(0.0001, cierre + 0.5);
        chispa.connect(gChispa).connect(master);
        chispa.start(cierre);
        chispa.stop(cierre + 0.52);
    } catch {
        // Idem: el guardado ya ocurrió, el sonido es sólo la confirmación.
    }
}

/** Cuánto dura el arpegio completo, en ms. La lamparita lo usa para sincronizar. */
export const DURACION_GUARDADO_MS = 600;
