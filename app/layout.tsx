import type { Metadata } from "next";
import { TabProvider } from "../components/tab-session";
import "./globals.css";
import "./personal-settings.css";
import "./project.css";
import "./navigation.css";
import "./expedition.css";
import "./river-world.css";
import "./departure-camp.css";
import "./mission-briefing.css";
import "./paddle-plan.css";
import "./crew-huddles.css";
import "./crew-community.css";
import "./journey-evidence.css";
import "./currents-rocks.css";
import "./crew-control.css";
import "./ignis.css";
import "./ignis-game.css";
import "./ignis-full-map.css";
import "./ignis-survival-kit.css";
import "./ignis-escape-protocol.css";
import "./ignis-trail-challenges.css";
import "./ignis-signal-relay.css";
import "./ignis-ember-circle.css";
import "./ignis-checkpoint-logs.css";
import "./ignis-eruption-watch.css";
import "./ignis-survival-command.css";
import "./ignis-ember-guide.css";
import "./vintage-forms.css";

export const metadata: Metadata = {
  title: "IGNIS · Jaguar Crew",
  description: "A volcanic escape expedition. Complete project missions, verify reports and bring Jaguar Crew to safety.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><TabProvider>{children}</TabProvider></body>
    </html>
  );
}
