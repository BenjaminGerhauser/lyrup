import Link from "next/link";

export const metadata = {
  title: "Sin conexión — Lyrup",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-lyrup-bg px-4 text-center">
      <span className="text-5xl" aria-hidden="true">
        📡
      </span>
      <h1 className="text-2xl font-semibold text-lyrup-text-heading">
        Sin conexión
      </h1>
      <p className="max-w-sm text-lyrup-text-secondary">
        Parece que perdiste conexión. Verificá tu internet e intentá de nuevo.
      </p>
      <Link
        href="/"
        className="rounded-md bg-lyrup-cyan px-5 py-2.5 text-sm font-medium text-lyrup-bg hover:bg-lyrup-cyan-hover transition-colors"
      >
        Reintentar
      </Link>
    </main>
  );
}
