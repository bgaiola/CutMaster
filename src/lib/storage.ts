import { Material, EdgeBand, OptimizationConfig } from '@/types';

/** Minimal project metadata shown in project lists. */
export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  updatedAt: string; // ISO date
  pieceCount: number;
  materialCount: number;
}

/** Full project data blob persisted to storage. */
export interface ProjectData {
  id: string;
  name: string;
  description: string;
  pieces: unknown[]; // Piece[]
  materials: Material[];
  edgeBands: EdgeBand[];
  config: OptimizationConfig;
  locale: string;
  currency: string;
  costEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Storage adapter interface — implemented by IndexedDB and Supabase adapters. */
export interface StorageAdapter {
  // Projects
  listProjects(): Promise<ProjectSummary[]>;
  loadProject(id: string): Promise<ProjectData | null>;
  saveProject(project: ProjectData): Promise<string>; // returns id
  deleteProject(id: string): Promise<void>;

  // Materials Library (user's personal material templates)
  loadMaterialsLibrary(): Promise<Material[]>;
  saveMaterialsLibrary(materials: Material[]): Promise<void>;

  // Edge Bands Library
  loadEdgeBandsLibrary(): Promise<EdgeBand[]>;
  saveEdgeBandsLibrary(bands: EdgeBand[]): Promise<void>;
}
