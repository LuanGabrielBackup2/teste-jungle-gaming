import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useLogin } from "../../hooks/useSession";
import { Route } from "../../routes/login/index";

export function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const redirect = search.redirect ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const login = useLogin();

  function validate() {
    const errors: Record<string, string> = {};
    if (!email) errors.email = "E-mail obrigatório";
    if (!password) errors.password = "Senha obrigatória";
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      await login.mutateAsync({ email, password });
      navigate({ to: redirect as "/" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "E-mail ou senha incorretos";
      setFieldErrors({ form: msg });
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <span className="eyebrow block mb-3">BEM-VINDO DE VOLTA</span>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "Manrope, sans-serif", letterSpacing: "-1px" }}
          >
            Entrar na sua conta
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Novo por aqui?{" "}
            <Link to="/register" className="text-[#a4c65b] font-semibold">
              Criar conta
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {fieldErrors.form && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3"
            >
              {fieldErrors.form}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#a4c65b] aria-[invalid=true]:border-red-400"
              placeholder="seu@email.com"
            />
            {fieldErrors.email && (
              <span id="email-error" role="alert" className="text-xs text-red-500">
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#a4c65b] aria-[invalid=true]:border-red-400"
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <span id="password-error" role="alert" className="text-xs text-red-500">
                {fieldErrors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={login.isPending}
            className="button button-light w-full justify-center mt-2 disabled:opacity-60"
          >
            {login.isPending ? "Entrando…" : "ENTRAR ↗"}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-6 text-center">
          Credenciais de teste: <strong>alice@kurio.dev</strong> / <strong>alice123</strong>
        </p>
      </div>
    </div>
  );
}
