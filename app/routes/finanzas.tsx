import { getAppName } from "~/lib/erpBranding";
import FinanzasPage from "~/dashboard/finanzas/Page";

export function meta() {
  return [{ title: `Finanzas · ${getAppName()}` }];
}

export default FinanzasPage;
