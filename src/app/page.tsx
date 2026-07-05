const moduleGroups = [
  {
    title: "Fundament",
    modules: [
      {
        name: "Projekt-Setup",
        description: "Next.js 15, Supabase, Drizzle ORM, Tailwind",
        status: "fertig" as const,
      },
      {
        name: "Datenmodell",
        description:
          "Projekte, Räume, Wände, Öffnungen, Katalog, Platzierungen – inkl. RLS",
        status: "fertig" as const,
      },
    ],
  },
  {
    title: "Planung",
    modules: [
      {
        name: "Aufmaß & 2D-Editor",
        description:
          "Raumformen, Wände zeichnen, Türen/Fenster setzen, Live-Bemaßung",
        status: "geplant" as const,
      },
      {
        name: "3D-Ansicht",
        description: "Grundriss als begehbarer Raum, Orbit-Kamera, Materialien",
        status: "geplant" as const,
      },
    ],
  },
  {
    title: "Produkte",
    modules: [
      {
        name: "Katalog",
        description: "Fliesen & Sanitärobjekte verwalten, Texturen hochladen",
        status: "geplant" as const,
      },
      {
        name: "Platzierung",
        description:
          "Drag & Drop auf Flächen, Verlegemuster, Fugenbreite & -farbe",
        status: "geplant" as const,
      },
    ],
  },
  {
    title: "Abschluss",
    modules: [
      {
        name: "Angebot & Export",
        description: "Stückliste aus dem Projekt, PDF-Angebot für den Kunden",
        status: "geplant" as const,
      },
      {
        name: "AR-Vorschau",
        description: "Planung per Handykamera im echten Raum betrachten",
        status: "später" as const,
      },
    ],
  },
];

const statusStyles: Record<string, string> = {
  fertig:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  geplant: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  später: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-12 sm:py-20">
      <header className="mb-14">
        <div className="mb-6 flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-10 grid-cols-2 gap-[3px] rounded-md bg-foreground p-[7px]"
          >
            <span className="rounded-[2px] bg-background" />
            <span className="rounded-[2px] bg-background/60" />
            <span className="rounded-[2px] bg-background/60" />
            <span className="rounded-[2px] bg-background" />
          </span>
          <span className="text-2xl font-semibold tracking-tight">Vsoft</span>
        </div>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Raumaufmaß & Fliesenplanung für den Betrieb
        </h1>
        <p className="max-w-2xl text-base leading-relaxed opacity-70">
          Vom Aufmaß auf der Baustelle über den 2D-Grundriss und die
          3D-Visualisierung bis zum fertigen Angebot – ein Werkzeug für
          Fliesenleger, das den kompletten Planungsablauf abdeckt.
        </p>
      </header>

      <main className="flex flex-col gap-10">
        {moduleGroups.map((group) => (
          <section key={group.title}>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider opacity-50">
              {group.title}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.modules.map((mod) => (
                <div
                  key={mod.name}
                  className="rounded-lg border border-foreground/10 bg-background p-4"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <h3 className="font-medium">{mod.name}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[mod.status]}`}
                    >
                      {mod.status}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed opacity-60">
                    {mod.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="mt-16 border-t border-foreground/10 pt-6 text-sm opacity-50">
        Interner Entwicklungsstand · Version 0.1 · Dokumentation unter{" "}
        <code className="rounded bg-foreground/5 px-1 py-0.5">docs/</code>
      </footer>
    </div>
  );
}
