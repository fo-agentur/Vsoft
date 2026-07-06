import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata = { title: "Anmelden – Vsoft" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ weiter?: string }>;
}) {
  const { weiter } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8 flex items-center gap-3">
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
      </Link>
      <Suspense>
        <LoginForm weiter={weiter} />
      </Suspense>
    </div>
  );
}
