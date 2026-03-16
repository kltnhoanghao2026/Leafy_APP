import { useLoginScreen } from "../hooks/useLoginScreen";
import { LoginScreenView } from "./LoginScreenView";

export default function LoginScreen() {
  const screenProps = useLoginScreen();

  return <LoginScreenView {...screenProps} />;
}
