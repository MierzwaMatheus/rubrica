import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Home, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/hooks/useTranslation";

const GLITCH_CHARS = "!<>-_\\/[]{}—=+*^?#$@%&";

function useGlitch(text: string, active: boolean) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (!active) { setDisplay(text); return; }
    let frame = 0;
    const total = 12;
    const id = setInterval(() => {
      frame++;
      setDisplay(
        text
          .split("")
          .map((ch, i) =>
            frame < total - i
              ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
              : ch
          )
          .join("")
      );
      if (frame >= total + text.length) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [active, text]);

  return display;
}

const LINE_COLORS = ["text-red-400", "text-gray-500", "text-gray-600", "text-yellow-500/70"];
const LINE_DELAYS = [0.4, 0.9, 1.4, 1.9];

export default function NotFound() {
  const [, setLocation] = useLocation();
  const [hovered, setHovered] = useState(false);
  const { t, tValue } = useTranslation();
  const label = useGlitch("404", hovered);

  const lines = (Array.isArray(tValue("notFound.lines")) ? (tValue("notFound.lines") as string[]) : []).map((text, i) => ({
    text,
    delay: LINE_DELAYS[i],
    color: LINE_COLORS[i],
  }));

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden select-none">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.8) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-neon-purple/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl px-6">
        {/* Top label */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-center gap-2"
        >
          <Terminal className="h-3.5 w-3.5 text-neon-purple" />
          <span className="font-mono text-xs text-neon-purple tracking-widest uppercase">
            {t("notFound.label")}
          </span>
          <span className="ml-auto font-mono text-[10px] text-gray-700">
            {t("notFound.errorCode")}
          </span>
        </motion.div>

        {/* 404 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative mb-4 cursor-default"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <span
            className="font-mono text-[9rem] font-black leading-none tracking-tighter text-white/5 select-none"
            aria-hidden
            style={{ WebkitTextStroke: "1px rgba(168,85,247,0.15)" }}
          >
            {label}
          </span>
          <span
            className="absolute inset-0 font-mono text-[9rem] font-black leading-none tracking-tighter"
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #a3e635 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              opacity: 0.15,
            }}
          >
            {label}
          </span>
          <span
            className="absolute inset-0 font-mono text-[9rem] font-black leading-none tracking-tighter text-white/90"
            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.06)" }}
          >
            {label}
          </span>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="mb-6 h-px origin-left bg-gradient-to-r from-neon-purple/60 via-neon-purple/20 to-transparent"
        />

        {/* Terminal lines */}
        <div className="mb-8 space-y-1.5">
          {lines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: line.delay }}
              className={`font-mono text-xs ${line.color}`}
            >
              {line.text}
              {i === lines.length - 1 && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 2.4 }}
                  className="ml-1 inline-block text-neon-purple"
                >
                  ▋
                </motion.span>
              )}
            </motion.p>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2.2 }}
        >
          <Button
            onClick={() => setLocation("/")}
            className="group relative overflow-hidden border border-neon-purple/40 bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 hover:border-neon-purple/70 transition-all duration-300 font-mono text-xs uppercase tracking-widest px-6 h-10"
          >
            <motion.span
              className="absolute inset-0 bg-neon-purple/10"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.4 }}
            />
            <Home className="mr-2 h-3.5 w-3.5" />
            {t("notFound.cta")}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
