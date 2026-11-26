import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useRegister } from "../../hooks/useSession";
import { Route } from "../../routes/register/index";

export function RegisterPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const redirect = search.redirect ?? "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const register = useRegister();

  function validate() {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Nome obrigatório";
    if (!email) errors.email = "E-mail obrigatório";
    if (!password || password.length < 6)
      errors.password = "Senha deve ter no mínimo 6 caracteres";
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
      await register.mutateAsync({ name, email, password });
      navigate({ to: redirect as "/" });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Erro ao criar conta";
      if (status === 409) {
        setFieldErrors({ email: "Este e-mail já está cadastrado" });
      } else {
        setFieldErrors({ form: msg });
      }
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <span className="eyebrow block mb-3">CRIE SUA CONTA</span>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "Manrope, sans-serif", letterSpacing: "-1px" }}
          >
            Comece a colecionar
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Já tem conta?{" "}
            <Link to="/login" className="text-[#a4c65b] font-semibold">
              Entrar
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {fieldErrors.form && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {fieldErrors.form}
            </div>
          )}

          {(["name", "email", "password"] as const).map((field) => (
            <div key={field} className="flex flex-col gap-1">
              <label
                htmlFor={field}
                className="text-xs font-semibold uppercase tracking-widest text-gray-500"
              >
                {field === "name" ? "Nome" : field === "email" ? "E-mail" : "Senha"}
              </label>
              <input
                id={field}
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                autoComplete={
                  field === "name"
                    ? "name"
                    : field === "email"
                    ? "email"
                    : "new-password"
                }
                value={field === "name" ? name : field === "email" ? email : password}
                onChange={(e) => {
                  if (field === "name") setName(e.target.value);
                  else if (field === "email") setEmail(e.target.value);
                  else setPassword(e.target.value);
                }}
                aria-invalid={!!fieldErrors[field]}
                aria-describedby={fieldErrors[field] ? `${field}-error` : undefined}
                className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#a4c65b] aria-[invalid=true]:border-red-400"
                placeholder={
                  field === "name"
                    ? "Seu nome"
                    : field === "email"
                    ? "seu@email.com"
                    : "Mínimo 6 caracteres"
                }
              />
              {fieldErrors[field] && (
                <span id={`${field}-error`} role="alert" className="text-xs text-red-500">
                  {fieldErrors[field]}
                </span>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={register.isPending}
            className="button button-light w-full justify-center mt-2 disabled:opacity-60"
          >
            {register.isPending ? "Criando conta…" : "CRIAR CONTA ↗"}
          </button>
        </form>
      </div>
    </div>
  );
}
