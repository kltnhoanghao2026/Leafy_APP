import { useSignupScreen } from "../hooks/useSignupScreen";
import { SignupScreenView } from "./SignupScreenView";

export default function SignupScreen() {
  const screenProps = useSignupScreen();

  return <SignupScreenView {...screenProps} />;
}
