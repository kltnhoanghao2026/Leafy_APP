import { useSignupVerifyOtpScreen } from "../hooks/useSignupVerifyOtpScreen";
import { SignupVerifyOtpScreenView } from "./SignupVerifyOtpScreenView";

export default function SignupVerifyOtpScreen() {
  const screenProps = useSignupVerifyOtpScreen();

  return <SignupVerifyOtpScreenView {...screenProps} />;
}
