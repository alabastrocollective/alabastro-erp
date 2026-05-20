import type { ServicePackageRow } from "~/types/alabastro";

export interface DefaultMusicTaskTemplate {
  title: string;
  description: string;
}

const INSTRUMENTAL_TASKS: DefaultMusicTaskTemplate[] = [
  {
    title: "Maqueta",
    description: "Realizar estructura de la canción y armonía principal",
  },
  {
    title: "Syntetizadores y Pads",
    description: "Arreglo de Syntetizadores, Pads, teclados secundarios u otros",
  },
  {
    title: "Guitarras",
    description: "Arreglo de Guitarras Acústicas y/o Électricas",
  },
  {
    title: "Baterías",
    description: "Arreglo de Baterías",
  },
  {
    title: "Bajo",
    description: "Arreglo de Bajo",
  },
  {
    title: "Mezcla y Mastering",
    description: "Realizar Mezcla completa del tema y masterización final",
  },
];

const STANDARD_EXTRA_TASKS: DefaultMusicTaskTemplate[] = [
  {
    title: "Grabación de Voces",
    description: "Realizar Grabación de voces pertinentes al tema",
  },
  {
    title: "Mezcla y Edición de Voces",
    description: "Realizar la edición y mezcla de las voces pregrabadas.",
  },
];

const PREMIUM_EXTRA_TASKS: DefaultMusicTaskTemplate[] = [
  {
    title: "Composición",
    description:
      "Componer idea principal del tema (letra, melodia y armonia) y los aprtes y correcciones del mismo",
  },
];

function normalizePackageName(name: string): string {
  return name.trim().toLowerCase();
}

/** Plantillas de tareas iniciales según paquete de música (video → vacío). */
export function getDefaultTasksForMusicPackage(
  pkg: Pick<ServicePackageRow, "category" | "name"> | null | undefined
): DefaultMusicTaskTemplate[] {
  if (!pkg || pkg.category !== "musica") return [];

  const key = normalizePackageName(pkg.name);
  if (key === "instrumental") return [...INSTRUMENTAL_TASKS];
  if (key === "standard") return [...INSTRUMENTAL_TASKS, ...STANDARD_EXTRA_TASKS];
  if (key === "premium") return [...INSTRUMENTAL_TASKS, ...STANDARD_EXTRA_TASKS, ...PREMIUM_EXTRA_TASKS];
  return [];
}
