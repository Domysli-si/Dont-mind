import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";

export default function LoginPage() {
  const { t } = useTranslation();
  const { user, signIn, register, demoLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = isRegister
      ? await register(email, password)
      : await signIn(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-dark p-4">
      <div className="w-full max-w-md animate-scale-in">
        <Card className="border-white/10 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-teal text-white font-bold text-xl shadow-lg">
              dw
            </div>
            <CardTitle className="text-2xl lg:text-3xl">{t("login.title")}</CardTitle>
            <CardDescription className="text-base">
              {t("login.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold">
                    {t("login.email")}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("login.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold">
                    {t("login.password")}
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("login.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={4}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive animate-fade-in">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {t("login.submitting")}
                    </span>
                  ) : isRegister ? (
                    t("login.registerButton")
                  ) : (
                    t("login.loginButton")
                  )}
                </Button>
              </form>

              <button
                type="button"
                className="w-full text-sm text-brand-teal hover:underline"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
                }}
              >
                {isRegister ? t("login.switchToLogin") : t("login.switchToRegister")}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">
                    {t("login.or")}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                onClick={demoLogin}
              >
                {t("login.demo")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
