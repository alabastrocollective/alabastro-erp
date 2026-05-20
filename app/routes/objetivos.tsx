import { getAppName } from "~/lib/erpBranding";
import ObjetivosPage from "~/dashboard/objetivos/Page";

export function meta() {
  return [{ title: `Objetivos · ${getAppName()}` }];
}

export default ObjetivosPage;
