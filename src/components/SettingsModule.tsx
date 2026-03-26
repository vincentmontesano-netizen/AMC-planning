import { useState, useEffect } from 'react';
import { AMS_SERVER_DB, getApiSettings, saveApiSettings } from '../utils/api';
import { Save, Server, Info } from 'lucide-react';

export default function SettingsModule() {
  const [url, setUrl] = useState('');
  const [version, setVersion] = useState('');
  const [apiVer, setApiVer] = useState('');
  const [serverdb, setServerdb] = useState('');
  const [serverdbpass, setServerdbpass] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = getApiSettings();
    if (!s) return;
    setUrl(s.url);
    setVersion(s.version);
    setApiVer(s.apiVer);
    setServerdb(s.serverdb ?? '');
    setServerdbpass(s.serverdbpass ?? '');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prev = getApiSettings();
    if (!prev) return;
    saveApiSettings({
      ...prev,
      url: url.trim(),
      version: version.trim(),
      apiVer: apiVer.trim(),
      serverdbpass,
      serverdb: serverdb.trim() || AMS_SERVER_DB,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2800);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
        <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
        <p>
          Ces valeurs sont enregistrées localement (navigateur). En production, l’URL d’appel peut
          passer par le proxy <code className="rounded bg-blue-100/80 px-1">/api</code>. Un changement
          de version ou de serveur peut exiger une nouvelle connexion.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-slate-800">
          <Server className="h-5 w-5 text-slate-500" />
          <h3 className="text-base font-semibold">Paramètres API AMS</h3>
        </div>

        <div>
          <label htmlFor="settings-url" className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5">
            URL du serveur (hôte)
          </label>
          <input
            id="settings-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            placeholder="ex. 46.105.115.223:8181"
            autoComplete="off"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="settings-version" className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5">
              En-tête version (login)
            </label>
            <input
              id="settings-version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            />
          </div>
          <div>
            <label htmlFor="settings-apiVer" className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5">
              Version API (réglage)
            </label>
            <input
              id="settings-apiVer"
              value={apiVer}
              onChange={(e) => setApiVer(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            />
          </div>
        </div>

        <div>
          <label htmlFor="settings-serverdb" className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5">
            Base de données
          </label>
          <input
            id="settings-serverdb"
            value={serverdb}
            onChange={(e) => setServerdb(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            placeholder={AMS_SERVER_DB}
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-slate-500">
            Laisser vide pour utiliser la valeur par défaut applicative ({AMS_SERVER_DB}).
          </p>
        </div>

        <div>
          <label htmlFor="settings-dbpass" className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5">
            Mot de passe DB (optionnel)
          </label>
          <input
            id="settings-dbpass"
            type="password"
            value={serverdbpass}
            onChange={(e) => setServerdbpass(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            placeholder="Laisser vide si non utilisé"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </button>
          {saved && <span className="text-sm font-medium text-emerald-600">Enregistré.</span>}
        </div>
      </form>
    </div>
  );
}
