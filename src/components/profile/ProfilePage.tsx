import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
} from "../../hooks/useProfile";
import { Skeleton, ErrorState } from "../shared";

export function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  if (isLoading) {
    return (
      <div className="section flex flex-col gap-4 max-w-xl mx-auto">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="section">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateProfile.mutateAsync({
      name: name || undefined,
      bio: bio || undefined,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    if (newPassword.length < 6) {
      setPasswordError("Nova senha deve ter no mínimo 6 caracteres");
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
    } catch {
      setPasswordError("Senha atual incorreta");
    }
  }

  return (
    <div className="section max-w-xl mx-auto">
      <div className="mb-10">
        <span className="eyebrow block mb-3">MEU PERFIL</span>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "Manrope, sans-serif", letterSpacing: "-1px" }}
        >
          {profile.name}
        </h1>
        <p className="text-xs text-gray-400 mt-1">{profile.email}</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-10">
        <img
          src={profile.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=a4c65b&color=fff`}
          alt={`Avatar de ${profile.name}`}
          className="w-16 h-16 rounded-full object-cover border-2 border-[#a4c65b]"
        />
        <div>
          <p className="text-sm font-semibold">{profile.name}</p>
          <p className="text-xs text-gray-400">{profile.bio ?? "Sem bio"}</p>
        </div>
      </div>

      {/* Edit profile */}
      <section aria-labelledby="profile-heading" className="mb-10">
        <h2 id="profile-heading" className="text-sm font-bold uppercase tracking-widest mb-5">
          Editar informações
        </h2>
        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="profile-name" className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Nome
            </label>
            <input
              id="profile-name"
              type="text"
              defaultValue={profile.name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#a4c65b]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="profile-bio" className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Bio
            </label>
            <textarea
              id="profile-bio"
              defaultValue={profile.bio ?? ""}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#a4c65b] resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={updateProfile.isPending}
            aria-live="polite"
            className="button button-light self-start disabled:opacity-60"
          >
            {updateProfile.isPending
              ? "Salvando…"
              : profileSaved
              ? "✓ Salvo!"
              : "SALVAR ALTERAÇÕES"}
          </button>
        </form>
      </section>

      {/* Change password */}
      <section aria-labelledby="password-heading">
        <h2 id="password-heading" className="text-sm font-bold uppercase tracking-widest mb-5">
          Alterar senha
        </h2>
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          {passwordError && (
            <p role="alert" className="text-xs text-red-500">
              {passwordError}
            </p>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="current-password" className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Senha atual
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#a4c65b]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="new-password" className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Nova senha
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#a4c65b]"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <button
            type="submit"
            disabled={changePassword.isPending}
            aria-live="polite"
            className="button button-light self-start disabled:opacity-60"
          >
            {changePassword.isPending
              ? "Alterando…"
              : passwordSaved
              ? "✓ Senha alterada!"
              : "ALTERAR SENHA"}
          </button>
        </form>
      </section>

      <div className="mt-10 pt-6 border-t border-gray-100">
        <Link to="/wallets" className="text-link text-xs">
          Gerenciar carteiras →
        </Link>
      </div>
    </div>
  );
}
