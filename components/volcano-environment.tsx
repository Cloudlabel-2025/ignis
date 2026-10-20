"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

type Props = { stage?: number; controls?: boolean; className?: string; mapHeight?: number };

export function VolcanoEnvironment({ stage = 0, controls = true, className = "", mapHeight }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [allowMotion, setAllowMotion] = useState(false);
  const effectivePaused = paused || (reduced && !allowMotion);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(preference.matches);
    change(); preference.addEventListener("change", change);
    return () => preference.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    const element = canvas.current, context = element?.getContext("2d");
    if (!element || !context) return;
    let frame = 0, last = 0, elapsed = 0, visible = true;
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    const particles = Array.from({ length: mobile ? 26 : 65 }, (_, i) => ({
      x: ((i * 73 + 19) % 101) / 100, y: ((i * 37 + 11) % 103) / 100,
      size: .6 + (i % 4) * .35, speed: .008 + (i % 5) * .004,
    }));
    let width = 1, height = 1;
    const resize = () => {
      const bounds = element.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      element.width = Math.round(width * ratio); element.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw(elapsed);
    };
    function draw(time: number) {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      // Localized molten pool: convection, cooling plates and bursting rings.
      context.save(); context.translate(width * (mapHeight ? .267 : .17), height * (mapHeight ? 630 / mapHeight : .87)); context.scale(width / 1000, mapHeight ? height / mapHeight : height / 600);
      const pool = context.createRadialGradient(0, 0, 5, 0, 0, 150);
      pool.addColorStop(0, "rgba(255,171,55,.38)"); pool.addColorStop(.45, "rgba(255,66,12,.27)"); pool.addColorStop(1, "rgba(255,40,0,0)");
      context.fillStyle = pool; context.beginPath(); context.ellipse(0, 0, 190, 54, -.1, 0, Math.PI * 2); context.fill();
      for (let i = 0; i < 13; i++) {
        const cycle = (time * .32 + i * .179) % 1;
        const x = Math.sin(i * 12.989) * 125, y = Math.cos(i * 7.31) * 22;
        context.strokeStyle = `rgba(255,${150 + i % 3 * 30},70,${(1 - cycle) * .65})`;
        context.lineWidth = 1.4; context.beginPath();
        context.ellipse(x, y - Math.sin(cycle * Math.PI) * 4, 2 + cycle * 16, 1 + Math.sin(cycle * Math.PI) * 5, -.1, 0, Math.PI * 2); context.stroke();
      }
      context.restore();
      // Smoke wisps originate at the crater and dissipate upward.
      for (let i = 0; i < 7; i++) {
        const cycle = (time * .025 + i / 7) % 1;
        const x = width * ((mapHeight ? .234 : .48) + cycle * .09 + Math.sin(time * .2 + i) * .006);
        const y = height * ((mapHeight ? 225 / mapHeight : .29) - cycle * .38), radius = width * (.018 + cycle * .07);
        const smoke = context.createRadialGradient(x, y, 0, x, y, radius);
        smoke.addColorStop(0, `rgba(157,146,139,${.08 * (1 - cycle)})`); smoke.addColorStop(1, "rgba(90,85,80,0)");
        context.fillStyle = smoke; context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
      for (const [index, particle] of particles.entries()) {
        const y = ((particle.y - time * particle.speed * (1 + stage * .15)) % 1 + 1) % 1;
        const x = ((particle.x + Math.sin(time * .15 + index) * .025 + time * .006) % 1) * width;
        context.fillStyle = index % 3 === 0 ? `rgba(255,145,68,${.3 + Math.sin(time + index) * .2})` : "rgba(223,212,200,.24)";
        context.beginPath(); context.arc(x, y * height, particle.size, 0, Math.PI * 2); context.fill();
      }
    }
    const animate = (timestamp: number) => {
      if (visible && !effectivePaused && timestamp - last > 40) {
        elapsed += Math.min((timestamp - (last || timestamp)) / 1000, .1); last = timestamp; draw(elapsed);
      }
      frame = requestAnimationFrame(animate);
    };
    const observer = new ResizeObserver(resize); observer.observe(element);
    const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; last = 0; }); intersection.observe(element);
    const onVisibility = () => { visible = !document.hidden; last = 0; };
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    if (!effectivePaused) frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [stage, effectivePaused, mapHeight]);

  return <div className={`volcano-environment ${className}`} data-paused={effectivePaused} data-motion={allowMotion ? "enabled" : "system"} data-stage={stage}>
    <div className="volcano-landscape" aria-hidden="true" />
    <div className="volcano-lava-light" aria-hidden="true" />
    <canvas ref={canvas} className="volcano-particles" aria-hidden="true" />
    <div className="volcano-vignette" aria-hidden="true" />
    {controls && <button className="environment-toggle" onClick={() => { if (reduced && !allowMotion) { setAllowMotion(true); setPaused(false); } else setPaused(!paused); }} aria-label={effectivePaused ? "Play environment animation" : "Pause environment animation"} aria-pressed={!effectivePaused}>{effectivePaused ? <Play size={13} /> : <Pause size={13} />}{reduced && !allowMotion ? "Enable live scene" : effectivePaused ? "Scene paused" : "Live environment"}</button>}
  </div>;
}
