import { useAuth } from '../contexts/AuthContext';
import { User, KeyRound, ShieldCheck } from 'lucide-react';

function maskToken(t: string | null): string {
  if (!t) return '—';
  if (t.length <= 14) return '••••••••';
  return `${t.slice(0, 8)}…${t.slice(-4)}`;
}

export default function UserModule() {
  const { username, token } = useAuth();

  return (
    <div className="space-y-6 max-w-lg">
      <p className="text-sm text-slate-600">
        Informations liées à la session AMS en cours. Le mot de passe n’est jamais affiché.
      </p>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <User className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Identifiant</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900 truncate">
              {username || '—'}
            </p>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <KeyRound className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Jeton (aperçu)</p>
            <p className="mt-0.5 font-mono text-sm text-slate-800 break-all">{maskToken(token)}</p>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 ring-1 ring-emerald-200/80">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} />
          <span className="font-medium">Session active</span>
        </div>
      </div>
    </div>
  );
}
