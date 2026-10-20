import { SessionGate } from "../../../components/tab-session";
import AccessLoader from "./access-loader";
export const metadata = { title: "Expedition Access · IGNIS" };
export default function Users() {
  return <SessionGate><AccessLoader /></SessionGate>;
}
