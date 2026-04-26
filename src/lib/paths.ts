import {
  collection,
  doc,
  CollectionReference,
  DocumentReference,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Item, Storage, Location } from "./types";

export const itemsCol = (uid: string) =>
  collection(db, "users", uid, "items") as CollectionReference<
    Omit<Item, "id">
  >;

export const itemDoc = (uid: string, id: string) =>
  doc(db, "users", uid, "items", id) as DocumentReference<Omit<Item, "id">>;

export const storagesCol = (uid: string) =>
  collection(db, "users", uid, "storages") as CollectionReference<
    Omit<Storage, "id">
  >;

export const storageDoc = (uid: string, id: string) =>
  doc(db, "users", uid, "storages", id) as DocumentReference<
    Omit<Storage, "id">
  >;

export const locationsCol = (uid: string) =>
  collection(db, "users", uid, "locations") as CollectionReference<
    Omit<Location, "id">
  >;

export const locationDoc = (uid: string, id: string) =>
  doc(db, "users", uid, "locations", id) as DocumentReference<
    Omit<Location, "id">
  >;
