export type MapTileset = {
  name: string;
  key: string;
  imagePath: string;
};

export type MapConfig = {
  id: string;
  label: string;
  mapKey: string;
  mapPath: string;
  tilesets: MapTileset[];
  zoom?: number;
  collisionLayerNames?: string[];
};

const defaultLayers = ["Walls", "Walls2", "Objects"];

const MAPS: MapConfig[] = [
  {
    id: "map2",
    label: "Hospital (Map2)",
    mapKey: "map2",
    mapPath: "assets/maps/Map2.tmj",
    tilesets: [
      { name: "Interior-Hospital Walls", key: "TileA4_PHC_Interior-Hospital.png", imagePath: "assets/tilesets/TileA4_PHC_Interior-Hospital.png" },
      { name: "Interior-Hospital Floor", key: "TileA5_PHC_Interior-Hospital.png", imagePath: "assets/tilesets/TileA5_PHC_Interior-Hospital.png" },
      { name: "Interior-Hospital Objects", key: "TileB_PHC_Interior-Hospital.png", imagePath: "assets/tilesets/TileB_PHC_Interior-Hospital.png" },
      { name: "Interior-Hospital-Alt Objects", key: "TileC_PHC_Interior-Hospital-Alt.png", imagePath: "assets/tilesets/TileC_PHC_Interior-Hospital-Alt.png" }
    ],
    zoom: 1.15,
    collisionLayerNames: defaultLayers,
  },
  {
    id: "map3",
    label: "Map 3",
    mapKey: "map3",
    mapPath: "assets/maps/Map3.tmj",
    tilesets: [
      { name: "Interior-Hospital Walls", key: "TileA4_PHC_Interior-Hospital.png", imagePath: "assets/tilesets/TileA4_PHC_Interior-Hospital.png" },
      { name: "Interior-Hospital Floor", key: "TileA5_PHC_Interior-Hospital.png", imagePath: "assets/tilesets/TileA5_PHC_Interior-Hospital.png" },
      { name: "Interior-Hospital Objects", key: "TileB_PHC_Interior-Hospital.png", imagePath: "assets/tilesets/TileB_PHC_Interior-Hospital.png" },
      { name: "Interior-Hospital-Alt Objects", key: "TileC_PHC_Interior-Hospital-Alt.png", imagePath: "assets/tilesets/TileC_PHC_Interior-Hospital-Alt.png" }
    ],
    zoom: 1.15,
    collisionLayerNames: defaultLayers,
  }
];

const STORAGE_KEY = "sg_selected_map";
let selectedMapId: string = loadInitialMapId();
let serverMapId: string | null = null; // last authoritative map confirmed by server

function loadInitialMapId(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && MAPS.some((m) => m.id === raw)) return raw;
  } catch (_) {}
  return MAPS[0].id;
}

export function setSelectedMapId(id: string) {
  if (!MAPS.some((m) => m.id === id)) return;
  selectedMapId = id;
  try { localStorage.setItem(STORAGE_KEY, id); } catch (_) {}
}

export function getSelectedMapId(): string {
  return selectedMapId;
}

export function setServerMapId(id: string) {
  if (!MAPS.some((m) => m.id === id)) return;
  serverMapId = id;
  // also mirror into selection so UI reflects the authoritative map
  setSelectedMapId(id);
}

export function getServerMapId(): string {
  return serverMapId || selectedMapId;
}

export function getAvailableMaps(): MapConfig[] {
  return MAPS;
}

export function getSelectedMapConfig(): MapConfig {
  const found = MAPS.find((m) => m.id === selectedMapId);
  return found || MAPS[0];
}
