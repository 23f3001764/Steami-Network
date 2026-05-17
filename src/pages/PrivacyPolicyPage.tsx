import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/* ─── Data ─────────────────────────────────────────────────────────────────── */

const SECTIONS = [
  {
    id: "introduction",
    label: "Introduction",
    heading: "Our commitment to your privacy",
    body: `STEMONEF ENTERPRISES is committed to protecting the privacy and personal data of all individuals who interact with our platforms, programs, and services. This policy explains what data we collect, how we use it, and the rights you hold over your personal information.`,
  },
  {
    id: "collect",
    label: "Data We Collect",
    heading: "What we collect",
    items: [
      {
        title: "Account Data",
        desc: "Name, email address, and authentication credentials when you create an account.",
      },
      {
        title: "Program Data",
        desc: "Application information, participation records, and program outputs for enrolled participants.",
      },
      {
        title: "Interaction Data",
        desc: "Pages visited, features used, and engagement patterns to improve platform functionality.",
      },
      {
        title: "Communications Data",
        desc: "Messages sent through contact forms, program enquiries, and institutional communications.",
      },
      {
        title: "Research Data",
        desc: "De-identified participation data used for program evaluation and institutional research.",
      },
    ],
  },
  {
    id: "use",
    label: "How We Use It",
    heading: "How we use your data",
    items: [
      { title: "Account management", desc: "Authentication and profile personalisation." },
      { title: "Program delivery", desc: "Mentorship matching, cohort management, and program operations." },
      { title: "Feed personalisation", desc: "Intelligence feed curation and saved signal management." },
      { title: "Institutional communications", desc: "Updates, briefings, and program announcements." },
      { title: "Anonymous research", desc: "Improving STEMONEF programs and measuring institutional impact." },
      { title: "Legal compliance", desc: "Safety obligations and regulatory requirements." },
    ],
  },
  {
    id: "sharing",
    label: "Data Sharing",
    heading: "How we share data",
    body: `STEMONEF does not sell personal data to third parties. Data may be shared with partner institutions for program delivery purposes, with your consent. De-identified, aggregated data may be used in public research and accountability reporting. Legal obligations may require disclosure to regulatory authorities in specific circumstances.`,
  },
  {
    id: "rights",
    label: "Your Rights",
    heading: "Rights you hold",
    items: [
      { title: "Right of Access", desc: "Request a copy of all personal data held about you." },
      { title: "Right of Rectification", desc: "Correct inaccurate or incomplete data at any time." },
      { title: "Right of Erasure", desc: "Request deletion of your data, subject to legal retention obligations." },
      { title: "Right to Object", desc: "Object to certain processing activities." },
      { title: "Right to Data Portability", desc: "Receive your data in a machine-readable format." },
      { title: "Right to Withdraw Consent", desc: "Withdraw consent for optional data processing at any time." },
    ],
  },
  {
    id: "retention",
    label: "Retention",
    heading: "How long we keep data",
    body: `Account data is retained for the duration of your relationship with STEMONEF and for 3 years thereafter, in accordance with legal obligations. Program participation records are retained for 7 years for accountability reporting purposes. You may request earlier deletion subject to applicable law.`,
  },
  {
    id: "security",
    label: "Security",
    heading: "How we protect your data",
    body: `STEMONEF applies institutional-grade security practices including encryption at rest and in transit, access controls, and regular security review. Our platform is built on the Internet Computer Protocol — a decentralised architecture that provides structural resistance to centralised data breaches.`,
  },
  {
    id: "contact",
    label: "Contact",
    heading: "Get in touch",
    body: `For privacy enquiries, data subject requests, or to exercise your rights, contact the STEMONEF Data Governance Office. We respond to all requests within 30 days in accordance with applicable data protection law.`,
    cta: true,
  },
];

/* ─── Sub-components ────────────────────────────────────────────────────────── */

function SectionWithItems({
  heading,
  items,
}: {
  heading: string;
  items: { title: string; desc: string }[];
}) {
  return (
    <div>
      <h2 className="pp-section-heading">{heading}</h2>
      <div className="pp-grid">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            className="pp-card"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
          >
            <span className="pp-card-index">0{i + 1}</span>
            <h3 className="pp-card-title">{item.title}</h3>
            <p className="pp-card-desc">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SectionWithBody({
  heading,
  body,
  cta,
}: {
  heading: string;
  body: string;
  cta?: boolean;
}) {
  return (
    <div>
      <h2 className="pp-section-heading">{heading}</h2>
      <p className="pp-body">{body}</p>
      {cta && (
        <a href="mailto:privacy@stemonef.org" className="pp-cta">
          Contact Data Governance Office →
        </a>
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */

export default function PrivacyPolicyPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  const barWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  /* smooth-scroll to anchor */
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    document.title = "Privacy Policy · STEMONEF";
  }, []);

  return (
    <>
      <style>{`
        /* ── Reset / base ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pp-root {
          --ink:      #0a0a0f;
          --ink-mid:  #3a3a4a;
          --ink-soft: #7a7a8a;
          --line:     #e2e2ea;
          --accent:   #1a56ff;
          --accent-2: #ff3b6b;
          --surface:  #f5f5fa;
          --white:    #ffffff;
          --mono: 'DM Mono', 'Fira Mono', monospace;
          --sans: 'Instrument Sans', 'Helvetica Neue', sans-serif;
          --display: 'Playfair Display', Georgia, serif;

          font-family: var(--sans);
          color: var(--ink);
          background: var(--white);
          min-height: 100vh;
        }

        /* ── Progress bar ── */
        .pp-progress {
          position: fixed; top: 0; left: 0; right: 0; height: 2px;
          background: var(--line); z-index: 100;
        }
        .pp-progress-fill {
          height: 100%; background: var(--accent); transform-origin: left;
        }

        /* ── Layout ── */
        .pp-layout {
          display: grid;
          grid-template-columns: 220px 1fr;
          max-width: 1160px;
          margin: 0 auto;
          padding: 0 24px;
          gap: 0 64px;
        }

        @media (max-width: 768px) {
          .pp-layout { grid-template-columns: 1fr; }
          .pp-nav { display: none; }
        }

        /* ── Header ── */
        .pp-header {
          border-bottom: 1px solid var(--line);
          padding: 64px 0 48px;
          margin-bottom: 0;
        }
        .pp-header-inner {
          max-width: 1160px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .pp-eyebrow {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 16px;
        }
        .pp-title {
          font-family: var(--display);
          font-size: clamp(36px, 6vw, 72px);
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: var(--ink);
          margin-bottom: 20px;
        }
        .pp-title em {
          font-style: italic;
          color: var(--accent);
        }
        .pp-subtitle {
          font-size: 15px;
          color: var(--ink-mid);
          max-width: 520px;
          line-height: 1.7;
        }
        .pp-meta {
          margin-top: 28px;
          display: flex; gap: 24px; flex-wrap: wrap;
          font-family: var(--mono);
          font-size: 11px;
          color: var(--ink-soft);
          letter-spacing: 0.08em;
        }
        .pp-meta span { display: flex; align-items: center; gap: 6px; }
        .pp-meta-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--accent-2);
          display: inline-block;
        }

        /* ── Side nav ── */
        .pp-nav {
          position: sticky;
          top: 48px;
          align-self: start;
          padding-top: 56px;
        }
        .pp-nav-label {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin-bottom: 16px;
        }
        .pp-nav-list { list-style: none; }
        .pp-nav-item {
          border-left: 1px solid var(--line);
          padding: 8px 16px;
          cursor: pointer;
          font-size: 13px;
          color: var(--ink-mid);
          transition: color 0.2s, border-color 0.2s;
        }
        .pp-nav-item:hover {
          color: var(--accent);
          border-color: var(--accent);
        }

        /* ── Content area ── */
        .pp-content {
          padding: 56px 0 120px;
        }
        .pp-section {
          padding-bottom: 72px;
          border-bottom: 1px solid var(--line);
          margin-bottom: 72px;
        }
        .pp-section:last-child { border-bottom: none; }

        .pp-section-heading {
          font-family: var(--display);
          font-size: clamp(22px, 3vw, 32px);
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--ink);
          margin-bottom: 32px;
        }
        .pp-body {
          font-size: 15px;
          line-height: 1.8;
          color: var(--ink-mid);
          max-width: 640px;
        }

        /* ── Cards grid ── */
        .pp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }
        .pp-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 24px;
          transition: border-color 0.2s, box-shadow 0.2s;
          cursor: default;
        }
        .pp-card:hover {
          border-color: var(--accent);
          box-shadow: 0 4px 24px rgba(26,86,255,.08);
        }
        .pp-card-index {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--accent);
          letter-spacing: 0.1em;
          display: block;
          margin-bottom: 10px;
        }
        .pp-card-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 8px;
        }
        .pp-card-desc {
          font-size: 13px;
          line-height: 1.65;
          color: var(--ink-soft);
        }

        /* ── CTA ── */
        .pp-cta {
          display: inline-block;
          margin-top: 28px;
          padding: 12px 24px;
          background: var(--accent);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.04em;
          border-radius: 6px;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }
        .pp-cta:hover { background: #0040e0; transform: translateY(-1px); }

        /* ── Footer strip ── */
        .pp-footer {
          border-top: 1px solid var(--line);
          padding: 28px 0;
          max-width: 1160px;
          margin: 0 auto;
          padding-inline: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .pp-footer-copy {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--ink-soft);
          letter-spacing: 0.06em;
        }
        .pp-footer-badge {
          font-family: var(--mono);
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 99px;
          border: 1px solid var(--line);
          color: var(--ink-soft);
          letter-spacing: 0.06em;
        }
      `}</style>

      <div className="pp-root">
        {/* Scroll progress bar */}
        <div className="pp-progress">
          <motion.div className="pp-progress-fill" style={{ width: barWidth }} />
        </div>

        {/* Header */}
        <header className="pp-header">
          <div className="pp-header-inner">
            <motion.p
              className="pp-eyebrow"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Data Governance · Legal
            </motion.p>
            <motion.h1
              className="pp-title"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
            >
              Privacy <em>Policy</em>
            </motion.h1>
            <motion.p
              className="pp-subtitle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16 }}
            >
              How STEMONEF collects, processes, and protects personal data across all platforms and services.
            </motion.p>
            <motion.div
              className="pp-meta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
            >
              <span><span className="pp-meta-dot" />Effective: 1 May 2025</span>
              <span>Last updated: 14 May 2026</span>
              <span>GDPR Compliant</span>
            </motion.div>
          </div>
        </header>

        {/* Body */}
        <div className="pp-layout">
          {/* Sticky side nav */}
          <nav className="pp-nav">
            <p className="pp-nav-label">Sections</p>
            <ul className="pp-nav-list">
              {SECTIONS.map((s) => (
                <li
                  key={s.id}
                  className="pp-nav-item"
                  onClick={() => scrollTo(s.id)}
                >
                  {s.label}
                </li>
              ))}
            </ul>
          </nav>

          {/* Main content */}
          <main className="pp-content">
            {SECTIONS.map((s) => (
              <motion.section
                key={s.id}
                id={s.id}
                className="pp-section"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5 }}
              >
                {"items" in s && s.items ? (
                  <SectionWithItems heading={s.heading} items={s.items} />
                ) : (
                  <SectionWithBody
                    heading={s.heading}
                    body={(s as any).body}
                    cta={(s as any).cta}
                  />
                )}
              </motion.section>
            ))}
          </main>
        </div>

        {/* Footer */}
        <footer className="pp-footer">
          <span className="pp-footer-copy">
            © {new Date().getFullYear()} STEMONEF ENTERPRISES. All rights reserved.
          </span>
          <span className="pp-footer-badge">ICP · Decentralised Infrastructure</span>
        </footer>
      </div>
    </>
  );
}
