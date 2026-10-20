"use client";

import { type ReactNode } from "react";
import { Mountain, Flame } from "lucide-react";
import { RiverBrandMark } from "./river-brand-mark";
import { VolcanoEnvironment } from "./volcano-environment";
import styles from "./river-auth.module.css";

/** A shared volcanic environment for arrival, session checks and departure. */
export function RiverAuth({ children, centered = false, videoBackground = false }: { children: ReactNode; centered?: boolean; videoBackground?: boolean }) {
  return <div className={`${styles.scene} ${centered ? styles.centered : ""}`}>
    <div className={styles.backdrop} aria-hidden="true">
      {videoBackground ? <video className={styles.backgroundVideo} autoPlay muted loop playsInline preload="auto" poster="/ignis-login-eruption-dusk-poster.webp" tabIndex={-1} onCanPlay={event => { void event.currentTarget.play().catch(() => {}); }}><source src="/ignis-login-eruption-dusk.mp4" type="video/mp4" /></video> : <VolcanoEnvironment controls={false} />}
      <div className={styles.shade} />
    </div>
    <header className={styles.masthead}><div className={styles.brand}><RiverBrandMark /><span>IGNIS<small>THE VOLCANO EXPEDITION</small></span></div>{!centered && <span className={styles.headerNote}><Mountain size={14} /> Bring everyone home</span>}</header>
    <main className={styles.center}>{!centered && <div className={styles.story}><span>JAGUAR CREW / OPERATION IGNIS</span><h2>One crew.<br />One way <em>out.</em></h2><p>The mountain is awake.<br />Complete the missions. Secure the route.<br />Bring everyone home.</p><small>A volcanic escape expedition inspired by Mount Fuji.</small></div>}{children}</main>
    <footer className={styles.footer}><span>One crew. One way out.</span></footer>
  </div>;
}

export function RiverAuthLoading({ title = "Preparing your expedition", detail = "Checking your session and getting your crew ready.", error = false, children }: { title?: string; detail?: string; error?: boolean; children?: ReactNode }) {
  return <RiverAuth centered videoBackground><RiverLoadingCard title={title} detail={detail} error={error}>{children}</RiverLoadingCard></RiverAuth>;
}

export function RiverLoadingCard({ title, detail, error = false, children }: { title: string; detail: string; error?: boolean; children?: ReactNode }) {
  return <section className={styles.statusCard} role={error ? "alert" : "status"} aria-live="polite"><span className={styles.kicker}>{error ? "EXPEDITION ON HOLD" : "OPERATION IGNIS"}</span><div className={`${styles.emberLoader} ${error ? styles.still : ""}`} aria-hidden="true"><Flame size={46} strokeWidth={1.4} /></div><h1>{title}</h1><p>{detail}</p>{!error && <div className={styles.loadingTrack} aria-hidden="true"><span /></div>}{children}</section>;
}
