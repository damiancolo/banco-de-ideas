/**
 * El sonido de una lamparita antigua encendiéndose.
 *
 * Sintetizado en el momento con Web Audio API: sin archivos, sin peso, y se
 * afina cambiando los números de acá abajo. Son tres capas que juntas duran
 * poco menos de medio segundo:
 *
 *   1. El clac del interruptor — un ruido cortísimo y agudo, más el rebote
 *      mecánico 25 ms después. Es el 80 % del carácter "antiguo".
 *   2. El filamento — una onda triangular grave que sube un poco de tono
 *      mientras se calienta. Es la sensación de que algo se encendió.
 *   3. El zumbido de red — 100 Hz muy por debajo, el armónico del
 *      transformador, que entra después del clac y se apaga solo.
 *
 * IMPORTANTE (iOS): el AudioContext se recibe por parámetro a propósito. Tiene
 * que haberse creado o reanudado dentro de un gesto del usuario, y el sonido
 * suena después, cuando el servidor confirma el guardado. Quien llama es
 * responsable de eso; acá solo se toca. ChatEngine ya mantiene ese contexto
 * vivo para el TTS y es el que hay que reutilizar.
 */

/** Volumen general. Bajo a propósito: es una confirmación, no un aviso. */
const VOLUMEN = 0.25;

/** El buffer de ruido del clac se genera una vez por contexto y se reutiliza. */
const bufferDeRuido = new WeakMap<BaseAudioContext, AudioBuffer>();

function ruido(ctx: BaseAudioContext): AudioBuffer {
    const cacheado = bufferDeRuido.get(ctx);
    if (cacheado) return cacheado;

    // 100 ms alcanzan de sobra: los clacs duran 12 ms y 8 ms.
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.1), ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < datos.length; i++) {
        datos[i] = Math.random() * 2 - 1;
    }
    bufferDeRuido.set(ctx, buffer);
    return buffer;
}

/**
 * Un golpe seco de ruido filtrado: el contacto del interruptor.
 *
 * @param inicio  cuándo suena, en tiempo del contexto
 * @param dur     cuánto dura el decaimiento, en segundos
 * @param nivel   pico de volumen, relativo al máster
 * @param corte   frecuencia central del filtro; más alto = más "seco"
 */
function clac(
    ctx: AudioContext,
    destino: AudioNode,
    inicio: number,
    dur: number,
    nivel: number,
    corte: number,
): void {
    const fuente = ctx.createBufferSource();
    fuente.buffer = ruido(ctx);

    const filtro = ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.value = corte;
    filtro.Q.value = 1.2;

    const ganancia = ctx.createGain();
    // Ataque instantáneo y caída exponencial: así suena un golpe, no un fundido.
    ganancia.gain.setValueAtTime(nivel, inicio);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);

    fuente.connect(filtro).connect(ganancia).connect(destino);
    fuente.start(inicio);
    fuente.stop(inicio + dur + 0.01);
}

/**
 * Toca el encendido. Silencioso y seguro si el navegador no coopera: si el
 * contexto está cerrado o el audio no está disponible, no hace nada y no
 * rompe el guardado, que es lo que de verdad importaba.
 */
export function playLightbulbOn(ctx: AudioContext | null | undefined): void {
    if (!ctx || ctx.state === 'closed') return;

    try {
        // Si quedó suspendido, se intenta reanudar sin esperar: puede que
        // llegue tarde para este toque, pero deja el contexto listo.
        if (ctx.state === 'suspended') void ctx.resume();

        const t = ctx.currentTime;

        const master = ctx.createGain();
        master.gain.value = VOLUMEN;
        master.connect(ctx.destination);

        // ── 1. El interruptor ──────────────────────────────────────────
        clac(ctx, master, t, 0.012, 0.9, 2500);         // el contacto
        clac(ctx, master, t + 0.025, 0.008, 0.35, 1800); // el rebote del resorte

        // ── 2. El filamento calentándose ───────────────────────────────
        const filamento = ctx.createOscillator();
        filamento.type = 'triangle';
        filamento.frequency.setValueAtTime(90, t);
        filamento.frequency.linearRampToValueAtTime(130, t + 0.12);

        // Un pasabajos suave le saca el borde metálico a la triangular.
        const calidez = ctx.createBiquadFilter();
        calidez.type = 'lowpass';
        calidez.frequency.value = 900;

        const gFilamento = ctx.createGain();
        gFilamento.gain.setValueAtTime(0.0001, t + 0.01);
        gFilamento.gain.exponentialRampToValueAtTime(0.18, t + 0.03);
        gFilamento.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

        filamento.connect(calidez).connect(gFilamento).connect(master);
        filamento.start(t + 0.01);
        filamento.stop(t + 0.24);

        // ── 3. El zumbido de red ───────────────────────────────────────
        const zumbido = ctx.createOscillator();
        zumbido.type = 'sine';
        zumbido.frequency.value = 100;

        const gZumbido = ctx.createGain();
        gZumbido.gain.setValueAtTime(0.0001, t + 0.03);
        gZumbido.gain.exponentialRampToValueAtTime(0.06, t + 0.09);
        gZumbido.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);

        zumbido.connect(gZumbido).connect(master);
        zumbido.start(t + 0.03);
        zumbido.stop(t + 0.44);
    } catch {
        // Un sonido que falla no puede tumbar el guardado de una idea.
    }
}

/** Cuánto dura el sonido completo, en ms. La lamparita lo usa para sincronizar. */
export const DURACION_ENCENDIDO_MS = 450;
