"use client";
import { useState } from "react";
import Link from "next/link";
import { useTabId } from "../../components/tab-session";
import { tabFetch, TAB_STORAGE } from "../../lib/tab-client";
import styles from "../signin/signin.module.css";
import { RiverAuth, RiverLoadingCard } from "../../components/river-auth";
import { Flame, ArrowLeft, LogOut } from "lucide-react";
export default function SignOut() {
  const tabId = useTabId();
  const [pending, setPending] = useState(false), [error, setError] = useState("");
  async function logout(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setError("");
    try {
      const response = await tabFetch("/api/session", { method: "DELETE" });
      if (!response.ok) throw new Error();
      sessionStorage.removeItem(TAB_STORAGE);
      window.location.replace("/signin?reason=signedout");
    } catch { setError("Could not sign out. Check your connection and try again."); setPending(false); }
  }
  return <RiverAuth centered videoBackground>{pending ? <RiverLoadingCard title="Closing your expedition" detail="Signing out of this tab. Your other sessions will stay open." /> : <section className={`${styles.card} ${styles.departure}`}><span className={styles.departureIcon}><Flame size={31} strokeWidth={1.5} /></span><p className={styles.eyebrow}>END THIS RUN</p><h1>Leave the caldera?</h1><p>Step away from the expedition.<br />Return whenever you’re ready to continue.</p><div className={styles.tabNotice}><LogOut size={16} /><span>Only this tab signs out. Your other runs stay open.</span></div>
    <form onSubmit={logout}><button className={styles.button} disabled={!tabId}>End This Run<LogOut size={17} /></button></form>
    {error && <p role="alert" className={styles.notice}>{error}</p>}<Link className={styles.returnLink} href="/overview"><ArrowLeft size={15} /> Continue the Run</Link>
  </section>}</RiverAuth>;
}
