export interface Area {
  name: string;
  type: 'room' | 'exterior';
  description: string;
}

export interface HousePlan {
  projectName: string;
  description: string;
  areas: Area[];
}

export interface Customizations {
  [key: string]: string | string[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Favorite extends GeneratedImage {
  areaName: string;
}
