import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { usePiecesStore } from '@/stores/piecesStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useEdgeBandsStore } from '@/stores/edgeBandsStore';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/i18n';
import { StorageAdapter, ProjectData, ProjectSummary } from '@/lib/storage';
import { LocalStorageAdapter } from '@/lib/localStorageAdapter';
import { SupabaseStorageAdapter } from '@/lib/supabaseStorageAdapter';
import { Piece } from '@/types';
import {
  FolderOpen, Save, Plus, Trash2, X, Loader2, Cloud, HardDrive,
} from 'lucide-react';

function getAdapter(userId: string | null): StorageAdapter {
  if (userId) return new SupabaseStorageAdapter(userId);
  return new LocalStorageAdapter();
}

interface ProjectManagerProps {
  onClose: () => void;
}

export function ProjectManager({ onClose }: ProjectManagerProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const adapter = getAdapter(user?.id ?? null);

  const projectName = useAppStore((s) => s.projectName);
  const setProjectName = useAppStore((s) => s.setProjectName);
  const projectId = useAppStore((s) => s.projectId);
  const setProjectId = useAppStore((s) => s.setProjectId);
  const setIsDirty = useAppStore((s) => s.setIsDirty);
  const config = useAppStore((s) => s.config);
  const locale = useAppStore((s) => s.locale);
  const currency = useAppStore((s) => s.currency);
  const costEnabled = useAppStore((s) => s.costEnabled);
  const setResult = useAppStore((s) => s.setResult);
  const addNotification = useAppStore((s) => s.addNotification);

  const pieces = usePiecesStore((s) => s.pieces);
  const setPieces = usePiecesStore((s) => s.setPieces);
  const materials = useMaterialsStore((s) => s.materials);
  const setMaterials = useMaterialsStore((s) => s.setMaterials);
  const edgeBands = useEdgeBandsStore((s) => s.edgeBands);
  const setEdgeBands = useEdgeBandsStore((s) => s.setEdgeBands);

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adapter.listProjects();
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, [adapter]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const data: ProjectData = {
        id: projectId || crypto.randomUUID(),
        name: projectName,
        description: '',
        pieces: pieces as unknown as unknown[],
        materials,
        edgeBands,
        config,
        locale,
        currency,
        costEnabled,
        createdAt: now,
        updatedAt: now,
      };
      const id = await adapter.saveProject(data);
      setProjectId(id);
      setIsDirty(false);
      addNotification({ type: 'success', title: t.projects.saved });
      loadList();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      addNotification({ type: 'error', title: t.projects.saveError, message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = async (id: string) => {
    setLoading(true);
    try {
      const data = await adapter.loadProject(id);
      if (!data) return;
      setProjectId(data.id);
      setProjectName(data.name);
      setPieces(data.pieces as Piece[]);
      setMaterials(data.materials);
      setEdgeBands(data.edgeBands);
      useAppStore.getState().updateConfig(data.config);
      if (data.locale) useAppStore.getState().setLocale(data.locale as 'es');
      if (data.currency) useAppStore.getState().setCurrency(data.currency as 'EUR');
      useAppStore.getState().setCostEnabled(data.costEnabled ?? false);
      setResult(null);
      setIsDirty(false);
      addNotification({ type: 'success', title: t.projects.loaded });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Load failed';
      addNotification({ type: 'error', title: t.projects.loadError, message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.projects.confirmDelete)) return;
    try {
      await adapter.deleteProject(id);
      if (projectId === id) {
        setProjectId(null);
      }
      loadList();
      addNotification({ type: 'info', title: t.projects.deleted });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      addNotification({ type: 'error', title: msg });
    }
  };

  const handleNew = () => {
    setProjectId(null);
    setProjectName(t.projects.newProjectName);
    setPieces([]);
    setMaterials([]);
    setEdgeBands([]);
    setResult(null);
    setIsDirty(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-surface-800">{t.projects.title}</h2>
            {user ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <Cloud className="w-3 h-3" /> Cloud
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-surface-500 bg-surface-100 px-2 py-0.5 rounded-full">
                <HardDrive className="w-3 h-3" /> Local
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-surface-100">
          <button onClick={handleNew} className="btn-ghost btn-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> {t.projects.newProject}
          </button>
          <button
            onClick={handleSave}
            className="btn-primary btn-sm flex items-center gap-1.5"
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t.projects.save}
          </button>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-surface-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{t.projects.empty}</p>
              <p className="text-sm mt-1">{t.projects.emptyHint}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors cursor-pointer hover:bg-surface-50 ${
                    projectId === p.id ? 'border-brand-300 bg-brand-50' : 'border-surface-200'
                  }`}
                  onClick={() => handleLoad(p.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-surface-800 truncate">{p.name}</div>
                    <div className="text-xs text-surface-400 mt-0.5">
                      {p.pieceCount} {t.common.pieces} &middot; {p.materialCount} {t.common.materials}
                      &middot; {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                    className="text-surface-300 hover:text-red-500 transition-colors"
                    title={t.common.remove}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
