import { Link } from "react-router";
import { cn } from "~/lib/utils";

export function ProyectosSubNav({ active }: { active: "list" | "tasks" | "board" }) {
  const tabs = [
    { id: "list" as const, label: "Proyectos", href: "/proyectos" },
    { id: "tasks" as const, label: "Tareas", href: "/proyectos/tareas" },
  ];

  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-border/80 bg-muted/30 p-1 w-fit">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          to={tab.href}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            active === tab.id
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-card/60"
          )}
        >
          {tab.label}
        </Link>
      ))}
      {active === "board" && (
        <span className="rounded-lg px-4 py-2 text-sm font-medium text-accent-blue bg-accent-blue/10">
          Tablero
        </span>
      )}
    </nav>
  );
}
