import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <div className="section-shell py-16">
      <AuthForm mode="signup" />
    </div>
  );
}
