import {
  SignupVerifyOtpScreenView,
  useSignupVerifyOtpScreen,
} from "@/src/features/auth";

export default function VerifyOtpScreen() {
  const screenProps = useSignupVerifyOtpScreen();

  return <SignupVerifyOtpScreenView {...screenProps} />;
}
