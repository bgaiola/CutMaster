import { supabase } from './supabase';
import { StorageAdapter, ProjectData, ProjectSummary } from './storage';
import { Material, EdgeBand } from '@/types';

export class SupabaseStorageAdapter implements StorageAdapter {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async listProjects(): Promise<ProjectSummary[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, updated_at, data')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      updatedAt: row.updated_at,
      pieceCount: row.data?.pieces?.length ?? 0,
      materialCount: row.data?.materials?.length ?? 0,
    }));
  }

  async loadProject(id: string): Promise<ProjectData | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .single();

    if (error || !data) return null;
    return {
      ...(data.data as Omit<ProjectData, 'id' | 'name' | 'description' | 'createdAt' | 'updatedAt'>),
      id: data.id,
      name: data.name,
      description: data.description ?? '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async saveProject(project: ProjectData): Promise<string> {
    if (!supabase) throw new Error('Supabase not configured');
    const { pieces, materials, edgeBands, config, locale, currency, costEnabled } = project;
    const payload = {
      id: project.id,
      user_id: this.userId,
      name: project.name,
      description: project.description,
      data: { pieces, materials, edgeBands, config, locale, currency, costEnabled },
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('projects')
      .upsert(payload, { onConflict: 'id' });
    if (error) throw new Error(error.message);
    return project.id;
  }

  async deleteProject(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId);
    if (error) throw new Error(error.message);
  }

  async loadMaterialsLibrary(): Promise<Material[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('materials_library')
      .select('data')
      .eq('user_id', this.userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => row.data as Material);
  }

  async saveMaterialsLibrary(materials: Material[]): Promise<void> {
    if (!supabase) return;
    // Delete existing and re-insert (simple approach for library sync)
    await supabase.from('materials_library').delete().eq('user_id', this.userId);
    if (materials.length === 0) return;
    const rows = materials.map((m) => ({
      user_id: this.userId,
      code: m.code,
      data: m,
    }));
    const { error } = await supabase.from('materials_library').insert(rows);
    if (error) throw new Error(error.message);
  }

  async loadEdgeBandsLibrary(): Promise<EdgeBand[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('edge_bands_library')
      .select('data')
      .eq('user_id', this.userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => row.data as EdgeBand);
  }

  async saveEdgeBandsLibrary(bands: EdgeBand[]): Promise<void> {
    if (!supabase) return;
    await supabase.from('edge_bands_library').delete().eq('user_id', this.userId);
    if (bands.length === 0) return;
    const rows = bands.map((eb) => ({
      user_id: this.userId,
      code: eb.code,
      data: eb,
    }));
    const { error } = await supabase.from('edge_bands_library').insert(rows);
    if (error) throw new Error(error.message);
  }
}
