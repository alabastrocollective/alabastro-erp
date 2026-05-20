import { getAppName } from "~/lib/erpBranding";
import ClientesPage from "~/dashboard/clientes/Page";

export function meta() {
  return [{ title: `Clientes · ${getAppName()}` }];
}

export default ClientesPage;
