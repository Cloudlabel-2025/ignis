import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ArrowLeft, ChevronDown, KeyRound, Users, UserPlus } from "lucide-react";
import { RiverBrandMark } from "../../../components/river-brand-mark";
import type { Identity } from "../../../lib/jaguar";
import MemberList, { RoleOptions, SaveButton, type Member } from "./member-list";
import OwnerPasswordForm from "./owner-password-form";
import styles from "./users.module.css";

type Props = { actor: Identity; users: Member[]; save: (form: FormData) => Promise<void>; error?: boolean; saved?: boolean };

export default function AccessView({ actor, users, save, error, saved }: Props) {
  return <div className={styles.shell}><Image className={styles.heroArt} src="/ignis-expedition-access.webp" alt="" width={1774} height={887} priority unoptimized /><main className={styles.page}>
    <div className={styles.masthead}><Link href="/overview" className={styles.brand} aria-label="IGNIS Caldera Map"><RiverBrandMark /><span><strong>IGNIS</strong><small>Volcano escape expedition</small></span></Link><Link className={styles.back} href="/control"><ArrowLeft size={16} /> Back to Survival Command</Link></div>
    <header className={styles.header}><div><span className={styles.eyebrow}><ShieldCheck size={18} /> IGNIS / EXPEDITION ACCESS</span><h1>Build the crew.<br />Guard the expedition.</h1><p>Approve the crew. Assign their roles.<br />Control who enters the expedition.</p></div><span className={styles.ownerBadge}><ShieldCheck size={18} /><span>Project Lead<small>Owner controls</small></span></span></header>
    {error && <p className={styles.error} role="alert">Could not save. Check the name, email and temporary password (8–128 characters). You cannot disable or demote your own owner account.</p>}
    {saved && <p className={styles.success} role="status">Crew access updated.</p>}
    <section className={styles.stats} aria-label="Current crew access"><div><strong>{users.length}</strong><span>Expedition roster</span><small>Total approved members</small></div><div><strong>{users.filter(user => user.active).length}</strong><span>Active access</span><small>Members allowed to sign in</small></div><div><strong>{users.filter(user => user.active && user.mustChangePassword).length}</strong><span>Awaiting setup</span><small>First password change required</small></div></section>
    <div className={styles.layout}>
      <section className={styles.panel} aria-labelledby="access-manifest-title"><div className={styles.panelHeading}><span className={styles.sectionMark}><Users size={24} /></span><div><span className={styles.sectionLabel}>EXPEDITION ROSTER</span><h2 id="access-manifest-title">Your expedition crew</h2><p>Search the crew, then open a member to manage their role and access.</p></div></div><MemberList actorEmail={actor.email} save={save} users={users} /></section>
      <aside className={styles.sidePanels}>
        <section className={`${styles.panel} ${styles.invitePanel}`} aria-labelledby="access-invite-title"><div className={styles.panelHeading}><span className={styles.sectionMark}><UserPlus size={24} /></span><div><span className={styles.sectionLabel}>AUTHORIZE ENTRY</span><h2 id="access-invite-title">Clear a crew member</h2><p>Choose their role before they join the expedition.</p></div></div><form action={save} className={styles.form}>
          <label>Name<input name="name" placeholder="Full name" required maxLength={100} autoComplete="name" /></label>
          <label>Email<input name="email" type="email" placeholder="name@example.com" required maxLength={254} autoComplete="email" /></label>
          <label>Role<select name="role"><RoleOptions /></select></label><input type="hidden" name="active" value="true" />
          <label>Temporary password<input name="temporaryPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} /><small>Use 8–128 characters.</small></label>
          <p className={styles.hint}>Share their email, temporary password and website link directly. They will set a new password on first login.</p><SaveButton>Approve access</SaveButton>
        </form></section>
        <details className={`${styles.panel} ${styles.passwordPanel}`}><summary><KeyRound size={22} /><span><strong>Your password</strong><small>Keep your owner account secure</small></span><ChevronDown size={18} /></summary><div className={styles.passwordContent}><p>Update the password for <strong>{actor.email}</strong>.</p><OwnerPasswordForm /></div></details>
      </aside>
    </div>
    <footer className={styles.pageFooter}><span>IGNIS · Expedition Access</span><span>Roles, access and first sign-in</span></footer>
  </main></div>;
}
