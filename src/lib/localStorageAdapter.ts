import { openDB, IDBPDatabase } from 'idb';
import { StorageAdapter, ProjectData, ProjectSummary } from './storage';
import { Material, EdgeBand } from '@/types';

const DB_NAME = 'nestbrain';
const DB_VERSION = 1;

function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('library')) {
        db.createObjectStore('library');
      }
    },
  });
}

export class LocalStorageAdapter implements StorageAdapter {
  async listProjects(): Promise<ProjectSummary[]> {
    const db = await getDb();
    const all: ProjectData[] = await db.getAll('projects');
    return all
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        updatedAt: p.updatedAt,
        pieceCount: p.pieces.length,
        materialCount: p.materials.length,
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async loadProject(id: string): Promise<ProjectData | null> {
    const db = await getDb();
    return (await db.get('projects', id)) ?? null;
  }

  async saveProject(project: ProjectData): Promise<string> {
    const db = await getDb();
    await db.put('projects', project);
    return project.id;
  }

  async deleteProject(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('projects', id);
  }

  async loadMaterialsLibrary(): Promise<Material[]> {
    const db = await getDb();
    return (await db.get('library', 'materials')) ?? [];
  }

  async saveMaterialsLibrary(materials: Material[]): Promise<void> {
    const db = await getDb();
    await db.put('library', materials, 'materials');
  }

  async loadEdgeBandsLibrary(): Promise<EdgeBand[]> {
    const db = await getDb();
    return (await db.get('library', 'edgeBands')) ?? [];
  }

  async saveEdgeBandsLibrary(bands: EdgeBand[]): Promise<void> {
    const db = await getDb();
    await db.put('library', bands, 'edgeBands');
  }
}
