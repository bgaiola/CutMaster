import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/i18n';
import { supabase } from '@/lib/supabase';
import {
  Key, Plus, Trash2, Copy, Check, Loader2, X, Shield, Clock,
} from 'lucide-react';

interface ApiKeyInfo {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export function ApiKeysPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);
    const { data } = await supabase
      .from('api_keys')
      .select('id, name, created_at, last_used_at, revoked_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setKeys(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async () => {
    if (!supabase || !user) return;
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-keys`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ name: newKeyName || 'Default' }),
        },
      );
      const result = await res.json();
      if (result.key) {
        setShowNewKey(result.key);
        setNewKeyName('');
        fetchKeys();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!supabase || !user) return;
    if (!confirm(t.apiKeys.confirmRevoke)) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-keys?id=${id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      },
    );
    fetchKeys();
  };

  const handleCopy = () => {
    if (showNewKey) {
      navigator.clipboard.writeText(showNewKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeKeys = keys.filter((k) => !k.revoked_at);
  const revokedKeys = keys.filter((k) => k.revoked_at);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-surface-800">{t.apiKeys.title}</h2>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* New key alert */}
          {showNewKey && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4">
              <div className="flex items-center gap-2 text-emerald-800 font-medium mb-2">
                <Shield className="w-4 h-4" />
                {t.apiKeys.newKeyCreated}
              </div>
              <p className="text-sm text-emerald-700 mb-3">{t.apiKeys.newKeyWarning}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border border-emerald-200 text-sm font-mono break-all">
                  {showNewKey}
                </code>
                <button onClick={handleCopy} className="btn-ghost btn-sm flex items-center gap-1">
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <button
                className="mt-3 text-sm text-emerald-600 hover:text-emerald-800"
                onClick={() => setShowNewKey(null)}
              >
                {t.apiKeys.dismiss}
              </button>
            </div>
          )}

          {/* Create new key */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="label">{t.apiKeys.keyName}</label>
              <input
                type="text"
                className="input w-full"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder={t.apiKeys.keyNamePlaceholder}
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="btn-primary flex items-center gap-1.5 px-4 py-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t.apiKeys.create}
            </button>
          </div>

          {/* Active keys */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : activeKeys.length === 0 ? (
            <div className="text-center py-8 text-surface-400">
              <Key className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t.apiKeys.empty}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-surface-600">{t.apiKeys.activeKeys} ({activeKeys.length})</h3>
              {activeKeys.map((key) => (
                <div key={key.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-surface-200">
                  <Key className="w-4 h-4 text-surface-400" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-surface-800 text-sm">{key.name}</div>
                    <div className="flex items-center gap-3 text-xs text-surface-400 mt-0.5">
                      <span>{t.apiKeys.created}: {new Date(key.created_at).toLocaleDateString()}</span>
                      {key.last_used_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t.apiKeys.lastUsed}: {new Date(key.last_used_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(key.id)}
                    className="text-surface-300 hover:text-red-500 transition-colors"
                    title={t.apiKeys.revoke}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Revoked keys */}
          {revokedKeys.length > 0 && (
            <div className="space-y-2 opacity-60">
              <h3 className="text-sm font-medium text-surface-500">{t.apiKeys.revokedKeys} ({revokedKeys.length})</h3>
              {revokedKeys.map((key) => (
                <div key={key.id} className="flex items-center gap-3 px-4 py-2 rounded-lg border border-surface-100 bg-surface-50">
                  <Key className="w-4 h-4 text-surface-300 line-through" />
                  <span className="text-sm text-surface-400 line-through">{key.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* API Usage example */}
          <div className="bg-surface-50 rounded-lg p-4 border border-surface-200">
            <h3 className="text-sm font-semibold text-surface-700 mb-2">{t.apiKeys.usageTitle}</h3>
            <pre className="text-xs text-surface-600 bg-white rounded p-3 overflow-x-auto border border-surface-200">{`curl -X POST \\
  \${SUPABASE_URL}/functions/v1/optimize \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "pieces": [
      {"material":"MDF-15","width":500,"height":300,"quantity":4,"grainDirection":"none",
       "edgeBandTop":"","edgeBandBottom":"","edgeBandLeft":"","edgeBandRight":""}
    ],
    "materials": [
      {"code":"MDF-15","thickness":15,"sheetWidth":2750,"sheetHeight":1830,
       "grainDirection":"none","trimTop":10,"trimBottom":10,"trimLeft":10,"trimRight":10,
       "minScrapWidth":300,"minScrapHeight":300,"pricePerM2":25,"wasteCostPerM2":5,
       "cutCostPerLinearM":2}
    ],
    "config": {
      "bladeThickness":4,"mode":"guillotine","guillotineMaxLevels":4,
      "maxStackThickness":0,"allowRotation":true,"advancedMode":false
    },
    "costEnabled": true,
    "saveProject": true,
    "projectName": "My Project"
  }'`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
