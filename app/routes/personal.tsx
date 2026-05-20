import { getAppName } from "~/lib/erpBranding";
import PersonalPage from "~/dashboard/personal/Page";

export function meta() {
  return [{ title: `Personal · ${getAppName()}` }];
}

export default PersonalPage;
