import { SignupScreenView, useSignupScreen } from "@/src/features/auth";

export default function SignupScreen() {
  const screenProps = useSignupScreen();

  return <SignupScreenView {...screenProps} />;
}
