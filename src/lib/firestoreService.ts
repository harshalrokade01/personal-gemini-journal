import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Reflection, UserProfile } from '../types';

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Recursively removes any keys with undefined values before Firestore writes.
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined) as unknown as T;
  }
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value !== undefined) {
      clean[key] = stripUndefined(value);
    }
  }
  return clean as T;
}

/**
 * Update or initialize the user's root profile document
 */
export async function syncUserProfile(profile: UserProfile): Promise<void> {
  if (!profile.uid) return;
  const userRef = doc(db, 'users', profile.uid);
  const now = new Date().toISOString();

  const payload = stripUndefined({
    uid: profile.uid,
    displayName: profile.displayName || 'Anonymous User',
    email: profile.email || '',
    photoURL: profile.photoURL || '',
    lastLoginAt: now,
    createdAt: profile.createdAt || now,
  });

  await setDoc(userRef, payload, { merge: true });
}

/**
 * Save a new reflection to the user's isolated subcollection:
 * /users/{userId}/reflections/{reflectionId}
 */
export async function saveReflection(
  userId: string,
  reflection: Omit<Reflection, 'id'>,
  customId?: string
): Promise<string> {
  if (!userId) throw new Error('User ID is required to save reflection');

  const reflectionsCollection = collection(db, 'users', userId, 'reflections');
  const docRef = customId ? doc(reflectionsCollection, customId) : doc(reflectionsCollection);
  const reflectionId = docRef.id;

  const now = new Date().toISOString();
  const payload: Reflection = {
    ...reflection,
    id: reflectionId,
    userId,
    createdAt: reflection.createdAt || now,
    updatedAt: now,
  };

  await setDoc(docRef, stripUndefined(payload));
  return reflectionId;
}

/**
 * Update an existing reflection in /users/{userId}/reflections/{reflectionId}
 */
export async function updateReflection(
  userId: string,
  reflectionId: string,
  updates: Partial<Omit<Reflection, 'id' | 'userId'>>
): Promise<void> {
  if (!userId || !reflectionId) {
    throw new Error('User ID and Reflection ID are required to update reflection');
  }

  const docRef = doc(db, 'users', userId, 'reflections', reflectionId);
  const payload = stripUndefined({
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  await updateDoc(docRef, payload);
}

/**
 * Delete a reflection document
 */
export async function deleteReflection(userId: string, reflectionId: string): Promise<void> {
  if (!userId || !reflectionId) {
    throw new Error('User ID and Reflection ID are required to delete reflection');
  }

  const docRef = doc(db, 'users', userId, 'reflections', reflectionId);
  await deleteDoc(docRef);
}

/**
 * Retrieve all reflections for a specific user ordered by newest first
 */
export async function getUserReflections(userId: string): Promise<Reflection[]> {
  if (!userId) return [];

  const reflectionsRef = collection(db, 'users', userId, 'reflections');
  const q = query(reflectionsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Reflection, 'id'>),
  }));
}

/**
 * Real-time listener for user reflections
 */
export function subscribeToUserReflections(
  userId: string,
  onUpdate: (reflections: Reflection[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const reflectionsRef = collection(db, 'users', userId, 'reflections');
  const q = query(reflectionsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const reflections: Reflection[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Reflection, 'id'>),
      }));
      onUpdate(reflections);
    },
    (error) => {
      console.error('Firestore snapshot listener error:', error);
      if (onError) onError(error);
    }
  );
}
