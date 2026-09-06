import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oi — Página inicial" },
      { name: "description", content: "Uma página simples com uma saudação: oi." },
      { property: "og:title", content: "Oi — Página inicial" },
      { property: "og:description", content: "Uma página simples com uma saudação: oi." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <h1 className="text-6xl font-bold text-foreground">oi</h1>
    </main>
  );
}
