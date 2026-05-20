import { getAppName } from "~/lib/erpBranding";
import ObjetivoDetailPage from "~/dashboard/objetivos/DetailPage";

export function meta() {
  return [{ title: `Objetivo · ${getAppName()}` }];
}

export default ObjetivoDetailPage;
