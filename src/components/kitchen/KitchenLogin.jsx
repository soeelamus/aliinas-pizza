import PinLogin from "../PinLogin";

export default function KitchenLogin() {
  return (
    <PinLogin
      title="🍕 Aliina’s Kitchen"
      apiEndpoint="/api/kitchen-login"
      storageKey="kitchenAuth"
      redirectTo="/kitchen/dashboard"
    />
  );
}