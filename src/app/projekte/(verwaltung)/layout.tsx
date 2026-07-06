import Link from "next/link";
import { abmelden } from "@/app/login/actions";

export default function ProjekteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <nav className="flex items-center gap-4 border-b border-foreground/10 bg-background px-5 py-3">
        <Link href="/projekte" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-7 grid-cols-2 gap-[2px] rounded-[5px] bg-foreground p-[5px]"
          >
            <span className="rounded-[1px] bg-background" />
            <span className="rounded-[1px] bg-background/60" />
            <span className="rounded-[1px] bg-background/60" />
            <span className="rounded-[1px] bg-background" />
          </span>
          <span className="font-semibold tracking-tight">Vsoft</span>
        </Link>
        <span className="text-sm opacity-40">Projekte</span>
        <form action={abmelden} className="ml-auto">
          <button
            type="submit"
            className="rounded-md border border-foreground/15 px-2.5 py-1.5 text-xs font-medium hover:bg-foreground/5"
          >
            Abmelden
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}
