// Spanish (Español) — Default language
const es = {
  // ─── Common ──────────────────────────
  common: {
    mm: 'mm',
    m2: 'm²',
    pieces: 'pieza(s)',
    sheets: 'chapa(s)',
    materials: 'material(es)',
    bands: 'canto(s)',
    none: 'Ninguno',
    horizontal: 'Horizontal',
    vertical: 'Vertical',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    export: 'Exportar',
    import: 'Importar',
    remove: 'Eliminar',
    duplicate: 'Duplicar',
    add: 'Agregar',
    filter: 'Filtrar',
    area: 'Área',
    material: 'Material',
    quantity: 'Cantidad',
    grain: 'Veta',
    grainDirection: 'Dirección de veta',
    grainNone: 'Sin veta',
    grainHorizontal: 'Horizontal',
    grainVertical: 'Vertical',
  },

  // ─── Toolbar ─────────────────────────
  toolbar: {
    bladeThickness: 'Esp. corte:',
    mode: 'Modo:',
    guillotine: 'Guillotina',
    freeForm: 'Forma Libre',
    levels: 'Niveles:',
    stack: 'Apilar:',
    rotation: 'Rotación',
    rotationTooltip: 'Permitir rotación de 90°',
    optimize: 'Optimizar',
    optimizing: 'Optimizando...',
    settings: 'Configuración avanzada',
    maySlow: '⚠ Puede ser lento',
    language: 'Idioma',
  },

  // ─── Tabs ────────────────────────────
  tabs: {
    pieces: 'Piezas',
    materials: 'Materiales',
    edgeBands: 'Cantos',
    results: 'Resultados',
    labels: 'Etiquetas',
    reports: 'Informes',
  },

  // ─── Pieces Tab ──────────────────────
  piecesTab: {
    newPiece: 'Nueva Pieza',
    duplicate: 'Duplicar',
    remove: 'Eliminar',
    importCSV: 'Importar CSV',
    filterPlaceholder: 'Filtrar piezas...',
    count: '{count} pieza(s)',
    emptyTitle: 'Ninguna pieza registrada',
    emptyHint: 'Haga clic en "Nueva Pieza" o importe un CSV para comenzar',
    previewTitle: 'Vista Previa de la Pieza',
    selectToPreview: 'Seleccione una pieza para visualizar',
    validDimensions: 'Seleccione una pieza con dimensiones válidas',
    // Column headers
    colId: 'ID',
    colMaterial: 'Material',
    colQuantity: 'Cant',
    colWidth: 'Ancho',
    colHeight: 'Alto',
    colGrain: 'Veta',
    colEdgeTop: 'Canto Sup',
    colEdgeBottom: 'Canto Inf',
    colEdgeLeft: 'Canto Izq',
    colEdgeRight: 'Canto Der',
    colSequence: 'Sec',
    colDescription: 'Descripción',
    colDescription2: 'Descripción 2',
  },

  // ─── Materials Tab ───────────────────
  materialsTab: {
    newMaterial: 'Nuevo Material',
    importCSV: 'Importar CSV',
    exportCSV: 'Exportar CSV',
    remove: 'Eliminar',
    count: '{count} material(es)',
    emptyTitle: 'Ningún material registrado',
    emptyHint: 'Haga clic en "Nuevo Material" o importe un CSV para comenzar',
    colCode: 'Código',
    colDescription: 'Descripción',
    colThickness: 'Espesor (mm)',
    colSheetWidth: 'Ancho Chapa (mm)',
    colSheetHeight: 'Alto Chapa (mm)',
    colGrain: 'Veta',
    colTrimTop: 'Recorte Sup',
    colTrimBottom: 'Recorte Inf',
    colTrimLeft: 'Recorte Izq',
    colTrimRight: 'Recorte Der',
    colMinScrapWidth: 'Sobra Ancho Mín',
    colMinScrapHeight: 'Sobra Alto Mín',
  },

  // ─── Edge Bands Tab ──────────────────
  edgeBandsTab: {
    newBand: 'Nuevo Canto',
    remove: 'Eliminar',
    count: '{count} canto(s)',
    emptyTitle: 'Ningún canto registrado',
    emptyHint: 'Haga clic en "Nuevo Canto" para comenzar',
    colCode: 'Código',
    colDescription: 'Descripción',
    colIncrease: 'Aumento (mm)',
    info: '💡 El "Aumento suplementario" se añade a la dimensión de la pieza en cada lado que recibe canto, antes del cálculo de corte. Ej: pieza 500mm con canto (aumento 2mm) en ambos lados = 504mm de corte.',
  },

  // ─── Results Tab ─────────────────────
  resultsTab: {
    noResult: 'Sin resultado de optimización',
    noResultHint: 'Configure piezas y materiales y haga clic en "Optimizar"',
    plans: 'Planos',
    plan: 'Plano',
    piecesCount: '{count} piezas',
    stackedSheets: '{count} chapas apiladas',
    utilization: 'Aprovechamiento:',
    piecesLabel: 'Piezas:',
    cuts: 'Cortes:',
    scraps: 'Sobras:',
    discards: 'Descartes:',
    global: 'Global:',
    labels: 'Etiquetas',
    kerf: 'Corte',
    trims: 'Recortes',
    bands: 'Cantos',
    scrapsToggle: 'Sobras',
    planPieces: 'Piezas del Plano',
    rotated: 'Rotada',
  },

  // ─── Labels Tab ──────────────────────
  labelsTab: {
    title: 'Editor de Etiquetas',
    generatePDF: 'Generar Etiquetas PDF',
    layoutTitle: 'Diseño de Etiqueta (100 × 50 mm)',
    pieceId: '[ID de Pieza]',
    materialLabel: '[Material]',
    barcode: '[Código de barras]',
    planSheet: 'Plano {plan} / Chapa {sheet}',
    editorWIP: '✏️ Editor drag-and-drop en desarrollo. Campos dinámicos disponibles: ID, Descripción, Material, Dimensiones, Cantos, Plano, Chapa, Secuencia, Fecha.',
    pieces: 'Piezas',
    optimizeFirst: 'Optimice primero para generar etiquetas',
  },

  // ─── Reports Tab ─────────────────────
  reportsTab: {
    title: 'Informes',
    generatedAt: 'Generado el {date} — {time}ms',
    exportPrint: 'Exportar / Imprimir',
    optimizeFirst: 'Optimice primero para generar informes',
    // Executive Summary
    executiveSummary: '📊 Resumen Ejecutivo',
    totalPieces: 'Total de Piezas',
    sheetsConsumed: 'Chapas Consumidas',
    stackedSheets: 'Chapas Apiladas',
    globalUtilization: 'Aprovechamiento Global',
    usableScraps: 'Sobras Aprovechables',
    totalWaste: 'Descarte Total',
    computeTime: 'Tiempo de Optimización',
    utilizationDescription: 'Porcentaje del área útil de las chapas efectivamente ocupado por piezas.',
    // Material Consumption
    materialConsumption: '📦 Consumo de Material',
    colMaterial: 'Material',
    colSheets: 'Chapas',
    colUsedArea: 'Área Usada (m²)',
    colWaste: 'Desperdicio (m²)',
    colUtilization: 'Aprovechamiento',
    // Produced Pieces
    producedPieces: '🔧 Lista de Piezas Producidas',
    colId: 'ID',
    colDescription: 'Descripción',
    colWidth: 'Ancho',
    colHeight: 'Alto',
    colPlan: 'Plano',
    colPosX: 'Posición X',
    colPosY: 'Posición Y',
    colRotation: 'Rotación',
    // Scrap Report
    scrapReport: '♻️ Informe de Sobras Aprovechables',
    noUsableScraps: 'No se generaron sobras aprovechables.',
    colScrapWidth: 'Ancho (mm)',
    colScrapHeight: 'Alto (mm)',
    colScrapArea: 'Área (m²)',
  },

  // ─── Notifications ───────────────────
  notifications: {
    noPieces: 'Sin piezas',
    noPiecesMsg: 'Agregue piezas antes de optimizar.',
    noMaterials: 'Sin materiales',
    noMaterialsMsg: 'Registre al menos un material.',
    missingMaterial: 'Material faltante',
    missingMaterialMsg: '{count} pieza(s) sin material definido.',
    optimizationDone: 'Optimización completada',
    optimizationDoneMsg: '{plans} plano(s) generado(s) — {pct}% de aprovechamiento',
    optimizationError: 'Error en la optimización',
  },

  // ─── Piece Preview ───────────────────
  piecePreview: {
    top: 'Sup',
    bottom: 'Inf',
    left: 'Izq',
    right: 'Der',
  },
} as const;

export type TranslationKeys = typeof es;
export type DeepStringify<T> = { [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : string };
export type Translations = DeepStringify<TranslationKeys>;
export default es;
