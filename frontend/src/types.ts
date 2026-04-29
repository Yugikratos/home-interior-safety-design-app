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
};
