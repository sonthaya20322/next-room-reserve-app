import Link from "next/link";

const links = [
  { href: "/", label: "ภาพรวม" },
  { href: "/rooms", label: "ห้องประชุม" },
  { href: "/available", label: "ค้นหาห้องว่าง" },
  { href: "/bookings", label: "รายการจอง" },
];

export function AppShell({
  children,
  currentPath,
}: {
  children: React.ReactNode;
  currentPath: string;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
              Room Reserve
            </p>
            <h1 className="font-display mt-1 text-2xl text-accent-slate sm:text-3xl">
              ระบบจองห้องประชุม
            </h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {links.map((link) => {
              const active = currentPath === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-primary text-white"
                      : "bg-stripe text-accent-slate hover:bg-primary/10"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
