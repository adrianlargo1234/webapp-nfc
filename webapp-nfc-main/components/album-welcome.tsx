"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const STORAGE_PREFIX = "album-welcome:";
const SHOW_MS = 2300;
const PARTICLE_COLORS = ["#d96b4b", "#5e7764", "#f9f6f1", "#2d2926"];

type AlbumWelcomeProps = {
  slug: string;
  name: string;
  emoji: string;
};

type Particle = {
  id: number;
  left: string;
  delay: number;
  duration: number;
  size: number;
  color: string;
  rotate: number;
};

function storageKey(slug: string) {
  return `${STORAGE_PREFIX}${slug}`;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function shouldShowWelcome(slug: string): boolean {
  try {
    if (localStorage.getItem(storageKey(slug))) return false;
  } catch {
    return false;
  }
  if (prefersReducedMotion()) {
    try {
      localStorage.setItem(storageKey(slug), "1");
    } catch {
      /* ignore */
    }
    return false;
  }
  return true;
}

export function AlbumWelcome({ slug, name, emoji }: AlbumWelcomeProps) {
  // null = aún no hidratado / comprobado (evita flash y mismatch SSR)
  const [visible, setVisible] = useState<boolean | null>(null);

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 28 }, (_, id) => ({
        id,
        left: `${4 + ((id * 17) % 92)}%`,
        delay: (id % 8) * 0.08,
        duration: 1.6 + (id % 5) * 0.18,
        size: 6 + (id % 5) * 3,
        color: PARTICLE_COLORS[id % PARTICLE_COLORS.length],
        rotate: (id * 37) % 360,
      })),
    [],
  );

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(storageKey(slug), "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, [slug]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setVisible(shouldShowWelcome(slug));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [slug]);

  useEffect(() => {
    if (!visible) return;

    const timer = window.setTimeout(dismiss, SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [visible, dismiss]);

  if (visible === null) return null;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          aria-label={`Bienvenida al álbum ${name}. Toca para continuar.`}
          className="fixed inset-0 z-[60] flex cursor-pointer flex-col items-center justify-center overflow-hidden border-0 bg-arena px-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={dismiss}
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {particles.map((p) => (
              <motion.span
                key={p.id}
                className="absolute top-[-12%] rounded-sm"
                style={{
                  left: p.left,
                  width: p.size,
                  height: p.size * 1.4,
                  backgroundColor: p.color,
                  opacity: 0.85,
                }}
                initial={{ y: 0, opacity: 0, rotate: p.rotate }}
                animate={{
                  y: "120vh",
                  opacity: [0, 0.9, 0.9, 0],
                  rotate: p.rotate + 180,
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: "easeIn",
                }}
              />
            ))}
          </div>

          <motion.div
            className="relative z-10 flex max-w-lg flex-col items-center gap-4"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-6xl sm:text-7xl" aria-hidden>
              {emoji}
            </span>
            <h2 className="text-[clamp(2.25rem,9vw,3.75rem)] font-bold leading-none tracking-tight text-piedra">
              {name}
            </h2>
            <p className="text-sm font-medium text-muted-foreground sm:text-base">
              Tus recuerdos, a un toque.
            </p>
          </motion.div>

          <p className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-10 text-xs text-muted-foreground">
            Toca para continuar
          </p>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
