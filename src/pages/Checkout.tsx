import BackendRoutePage from "@/components/backend/BackendRoutePage";
import { backendEndpoints } from "@/config/api";

export default function Checkout() {
  return (
    <BackendRoutePage
      title="Checkout"
      path={backendEndpoints.checkout.start}
    />
  );
}