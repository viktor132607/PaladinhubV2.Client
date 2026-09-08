import UnsupportedBackendFeature from "@/components/backend/UnsupportedBackendFeature";

const ResetPassword = () => (
  <UnsupportedBackendFeature
    title="Reset password"
    description="The current backend does not expose a reset-password action or API endpoint. The old template request has been removed."
  />
);

export default ResetPassword;
