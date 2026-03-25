import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="section-shell py-16">
      <AuthForm mode="login" />
    </div>
  );
}
