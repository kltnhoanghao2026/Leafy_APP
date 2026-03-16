import { LoginScreenView, useLoginScreen } from "@/src/features/auth";

export default function LoginScreen() {
  const screenProps = useLoginScreen();

  return <LoginScreenView {...screenProps} />;
}
