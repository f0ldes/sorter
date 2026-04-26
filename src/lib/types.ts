import { Timestamp } from "firebase/firestore";

export type Item = {
  id: string;
  name: string;
  tags: string[];
  notes: string;
  photoUrl: string;
  photoPath: string;
  storageId: string | null;
  locationId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Storage = {
  id: string;
  name: string;
  locationId: string | null;
  parentId: string | null;
  photoUrl: string | null;
  photoPath: string | null;
  createdAt: Timestamp;
};

export type Location = {
  id: string;
  name: string;
  parentId: string | null;
  photoUrl: string | null;
  photoPath: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: Timestamp;
};
