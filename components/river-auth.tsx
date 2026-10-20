"use client";

import { type ReactNode } from "react";
import { Mountain, Flame } from "lucide-react";
import { RiverBrandMark } from "./river-brand-mark";
import { VolcanoEnvironment } from "./volcano-environment";
import styles from "./river-auth.module.css";

/** A shared volcanic environment for arrival, session checks and departure. */
export function RiverAuth({ children }: { children: ReactNode }) {
  return <div className={styles.scene}>
    <div className={styles.backdrop} aria-hidden="true">
      <VolcanoEnvironment controls={false} />
      <div className={styles.shade} />
    </div>
    <header className={styles.masthead}><div className={styles.brand}><RiverBrandMark /><span>IGNIS<small>THE VOLCANO EXPEDITION</small></span></div><span className={styles.headerNote}><Mountain size={14} /> Bring everyone home</span></header>
    <main className={styles.center}><div className={styles.story}><span>JAGUAR CREW / OPERATION IGNIS</span><h2>One crew.<br />One way <em>out.</em></h2><p>The mountain is awake.<br />Complete the missions. Secure the route.<br />Bring everyone home.</p><small>A volcanic escape expedition inspired by Mount Fuji.</small></div>{children}</main>
    <footer className={styles.footer}><span>One crew. One way out.</span></footer>
  </div>;
}

export function RiverAuthLoading({ title = "Preparing your expedition", detail = "Checking your session and getting your crew ready.", error = false, children }: { title?: string; detail?: string; error?: boolean; children?: ReactNode }) {
  return <RiverAuth><RiverLoadingCard title={title} detail={detail} error={error}>{children}</RiverLoadingCard></RiverAuth>;
}

export function RiverLoadingCard({ title, detail, error = false, children }: { title: string; detail: string; error?: boolean; children?: ReactNode }) {
  return <section className={styles.statusCard} role={error ? "alert" : "status"} aria-live="polite"><span className={styles.kicker}>{error ? "AT BASE CAMP" : "ENTER THE EXPEDITION"}</span><div className={`${styles.boat} ${error ? styles.still : ""}`} aria-hidden="true"><Flame size={48} strokeWidth={1.3} /><span /><span /></div><h1>{title}</h1><p>{detail}</p>{!error && <div className={styles.loadingTrack} aria-hidden="true"><span /></div>}{children}</section>;
}
