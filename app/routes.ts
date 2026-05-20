import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/auth.tsx"),
  route("/", "routes/dashboard.tsx", [
    index("routes/home.tsx"),
    route("finanzas", "routes/finanzas.tsx"),
    route("proyectos", "routes/proyectos.tsx"),
    route("proyectos/tareas", "routes/proyectos.tareas.tsx"),
    route("proyectos/:projectId", "routes/proyectos.$projectId.tsx"),
    route("clientes", "routes/clientes.tsx"),
    route("personal", "routes/personal.tsx"),
    route("objetivos", "routes/objetivos.tsx"),
    route("objetivos/:objectiveId", "routes/objetivos.$objectiveId.tsx"),
    route("reportes", "routes/reportes.tsx"),
    route("configuracion", "routes/configuracion.tsx"),
  ]),
] satisfies RouteConfig;
