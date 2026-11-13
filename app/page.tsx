"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Heart, House, Moon } from "lucide-react";
import { siGithub, siTwitch, siX, type SimpleIcon } from "simple-icons";

type View = "home" | "projects" | "socials" | "contact";
const views: View[] = ["home", "projects", "socials", "contact"];

type DiscordStatus = "online" | "idle" | "dnd" | "offline" | "unknown";
const discordStatusLabels: Record<DiscordStatus, { text: string; cat: string }> = {
  online: { text: "I'm online! Come say hi!", cat: "₍^. .^₎⟆" },
  idle: { text: "I'm away... probably eepy.", cat: "₍- . -₎ zzz" },
  dnd: { text: "Shhh... do not disturb!", cat: "ฅ(｀ω´)ฅ" },
  offline: { text: "I'm offline for now.", cat: "₍× . ×₎⟆" },
  unknown: { text: "Hmm... where'd my status go?", cat: "ฅ(•﹏•)ฅ" },
};

function DiscordStatusIndicator({ status }: { status: DiscordStatus }) {
  return (
    <span className="discord-status" data-status={status} role="img" aria-label={`Discord status: ${discordStatusLabels[status].text}`} tabIndex={0}>
      <span className={`status-icon status-${status}`} aria-hidden="true">
        {status === "idle" && <Moon className="idle-moon" fill="currentColor" stroke="none" />}
        {status === "unknown" && <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.1 8.07" /></svg>}
      </span>
      <span className="status-tooltip" aria-hidden="true">{discordStatusLabels[status].text} {discordStatusLabels[status].cat}</span>
    </span>
  );
}

function BrandIcon({ icon }: { icon: SimpleIcon }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d={icon.path} /></svg>;
}

const socials = [
  { label: "X", detail: "posts & updates", url: "https://x.com/lunyavera", icon: <BrandIcon icon={siX} /> },
  { label: "Twitch", detail: "the occasional stream", url: "https://twitch.tv/lunyavera", icon: <BrandIcon icon={siTwitch} /> },
  { label: "Toyhou.se", detail: "characters & profiles", url: "https://toyhou.se/lunyavera", icon: <House size={19} aria-hidden="true" /> },
  { label: "GitHub", detail: "code & projects", url: "https://github.com/lunyavera", icon: <BrandIcon icon={siGithub} /> },
];

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [discordStatus, setDiscordStatus] = useState<DiscordStatus>("unknown");

  useEffect(() => {
    const syncView = () => {
      const hash = window.location.hash.slice(1) as View;
      setView(views.includes(hash) ? hash : "home");
    };
    syncView();
    window.addEventListener("hashchange", syncView);
    return () => window.removeEventListener("hashchange", syncView);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    async function updateStatus() {
      try {
        const response = await fetch("/api/discord-status", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Discord status unavailable");
        const data: unknown = await response.json();
        const status = typeof data === "object" && data !== null && "status" in data ? data.status : null;
        if (!stopped) {
          setDiscordStatus(status === "online" || status === "idle" || status === "dnd" || status === "offline" ? status : "unknown");
        }
      } catch {
        if (!stopped) setDiscordStatus("unknown");
      } finally {
        if (!stopped) timer = setTimeout(updateStatus, 30_000);
      }
    }

    void updateStatus();
    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, []);

  return (
    <main className="site-shell">
      <article className="profile-window">
        <header className="banner">
          <a href="#home" className="brand" aria-label="lunyavera"><svg className="brand-moon" aria-hidden="true" viewBox="0 0 512 512"><path fill="currentColor" d="M256 0C114.6 0 0 114.6 0 256S114.6 512 256 512c68.8 0 131.3-27.2 177.3-71.4 7.3-7 9.4-17.9 5.3-27.1s-13.7-14.9-23.8-14.1c-4.9 .4-9.8 .6-14.8 .6-101.6 0-184-82.4-184-184 0-72.1 41.5-134.6 102.1-164.8 9.1-4.5 14.3-14.3 13.1-24.4S322.6 8.5 312.7 6.3C294.4 2.2 275.4 0 256 0z" /></svg><span className="brand-name">lu<span className="brand-perch">nya<span className="brand-cat" aria-hidden="true">₍^. .^₎⟆</span></span>vera</span></a>
        </header>
        <nav className="navigation" aria-label="Main navigation">
          {([['home', 'home'], ['projects', 'projects'], ['socials', 'socials'], ['contact', 'contact me']] as const).map(([id, label]) => (
            <a key={id} href={`#${id}`} aria-current={view === id ? "page" : undefined}>{label}</a>
          ))}
        </nav>
        {view === "home" && (
          <div className="home-content">
            <section className="welcome">
              <div className="portrait-wrap"><a className="portrait" href="https://vgen.co/melumii" target="_blank" rel="noreferrer" aria-label="Profile art by melumii on VGen" title="Profile art by melumii" /><span className="portrait-status"><DiscordStatusIndicator status={discordStatus} /></span></div>
              <a className="art-credit" href="https://vgen.co/melumii" target="_blank" rel="noreferrer">profile art by melumii</a>
            </section>
            <section className="home-side">
              <div className="identity"><div className="identity-name"><h1>Luna</h1></div><p className="identity-details"><span className="pronouns">she/her</span></p></div>
              <p className="intro">I like making stuff! Usually that&apos;s web apps or Discord bots, but if an idea sounds fun, I&apos;ll probably give it a shot.</p>
              <p className="intro">I stream on Twitch every now and then, too. Anyway, this is my little spot on the internet, so poke around, check out my stuff, and feel free to say hi!</p>
              <div className="home-links"><a href="#projects">what I make <ArrowUpRight size={15} /></a><a href="#contact">say hello <ArrowUpRight size={15} /></a></div>
              <div className="social-icons" aria-label="Social links">
                {socials.map((social) => <a key={social.label} href={social.url} target="_blank" rel="noreferrer" aria-label={social.label} title={social.label}>{social.icon}</a>)}
              </div>
            </section>
          </div>
        )}
        {view === "projects" && <section className="inner-content"><h1>Making things</h1><p className="section-intro">Web apps, Discord bots, and whatever else I&apos;m curious enough to try building. You can find my code over on GitHub.</p><a className="feature-link" href="https://github.com/lunyavera" target="_blank" rel="noreferrer"><BrandIcon icon={siGithub} /><span><strong>Find my code on GitHub</strong><small>github.com/lunyavera</small></span><ArrowUpRight size={18} /></a></section>}
        {view === "socials" && <section className="inner-content"><h1>Elsewhere</h1><p className="section-intro">A few other places you can find me.</p><div className="link-list">{socials.map((social) => <a key={social.label} href={social.url} target="_blank" rel="noreferrer"><span className="social-mark">{social.icon}</span><span className="social-info"><strong>{social.label}</strong><small>{social.detail}</small></span><ArrowUpRight size={18} /></a>)}</div></section>}
        {view === "contact" && <section className="inner-content"><h1>Say hello</h1><p className="section-intro">Got something to share or just want to chat? You can reach me here.</p><div className="contact-details"><div><h2>Email</h2><a href="mailto:me@lunashere.com">me@lunashere.com <ArrowUpRight size={15} /></a></div><div><h2>Discord</h2><p className="discord-username">lunyavera <DiscordStatusIndicator status={discordStatus} /></p></div></div></section>}
        <footer className="window-footer">made with <Heart size={13} fill="currentColor" aria-label="love" /> by lunyavera</footer>
      </article>
    </main>
  );
}