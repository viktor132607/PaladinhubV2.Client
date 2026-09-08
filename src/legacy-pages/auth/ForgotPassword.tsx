import UnsupportedBackendFeature from "@/components/backend/UnsupportedBackendFeature";

const ForgotPassword = () => (
  <UnsupportedBackendFeature
    title="Forgot password"
    description="The current backend does not expose a forgot-password action or API endpoint. The old template request has been removed."
  />
);

export default ForgotPassword;
