import { getAppName } from "~/lib/erpBranding";
import ReportesPage from "~/dashboard/reportes/Page";

export function meta() {
  return [{ title: `Reportes · ${getAppName()}` }];
}

export default ReportesPage;
