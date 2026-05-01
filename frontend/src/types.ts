export type UserSession = {
  token: string;
  userId: number;
  name: string;
  email: string;
};

export type Project = {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  blueprint?: Blueprint | null;
};

export type Blueprint = {
  id: number;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
};

export type Room = {
  id: number;
  name: string;
  type: string;
  length: number;
  width: number;
  mapX?: number | null;
  mapY?: number | null;
  mapWidth?: number | null;
  mapHeight?: number | null;
  furniture: FurnitureItem[];
};

export type FurnitureItem = {
  id: number;
  type: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  rotationAngle: number;
};

export type FurniturePayload = {
  type: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  rotationAngle?: number;
};

export type RoomPayload = {
  name: string;
  type: string;
  length: number;
  width: number;
  mapX?: number | null;
  mapY?: number | null;
  mapWidth?: number | null;
  mapHeight?: number | null;
};

export type Preference = {
  id: number;
  style: string;
  budget: string;
  colorPalette?: string;
};

export type ProjectDetail = {
  project: Project;
  rooms: Room[];
  preference: Preference | null;
};

export type DesignSuggestion = {
  roomId: number;
  roomName: string;
  roomType: string;
  style: string;
  items: string[];
  note: string;
};

export type SafetyRecommendation = {
  category: string;
  recommendation: string;
  required: boolean;
  priority?: 'High' | 'Medium' | 'Low';
  explanation?: string;
};

export type LayoutSuggestion = {
  message: string;
  type: 'improve' | 'warning' | 'suggestion';
  furnitureIds: number[];
};

export type RoomLayoutScore = {
  roomId: number;
  overallScore: number;
  breakdown: {
    space: number;
    spacing: number;
    alignment: number;
    safety: number;
  };
  unusedSpacePercent: number;
  suggestions: LayoutSuggestion[];
};
