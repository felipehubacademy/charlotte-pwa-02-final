// Legacy (tabs) routes redirected — navigation now uses the Hub & Spoke Stack
// under (app)/. This file stays to avoid 404s from any stale deep links.
import { Redirect } from 'expo-router';
export default function TabsRedirect() {
  return <Redirect href="/(app)" />;
}
