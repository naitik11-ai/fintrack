import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  setDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { NewTransaction, Transaction, UserProfile } from '../types';

// User Profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createOrUpdateUserProfile(profile: Partial<UserProfile> & { uid: string }): Promise<void> {
  const ref = doc(db, 'users', profile.uid);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, {
      displayName: profile.displayName || null,
      email: profile.email || null,
      photoURL: profile.photoURL || null,
      monthlyBudget: 50000,
      currency: 'INR',
      theme: 'dark',
      createdAt: Date.now(),
      ...profile,
    });
  } else {
    await updateDoc(ref, {
      displayName: profile.displayName || existing.data().displayName,
      email: profile.email || existing.data().email,
      photoURL: profile.photoURL || existing.data().photoURL,
    });
  }
}

export async function updateUserProfile(
  userId: string,
  data: Partial<Pick<UserProfile, 'monthlyBudget' | 'theme' | 'currency'>>
): Promise<void> {
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, data);
}

// Transactions
export function subscribeToTransactions(
  userId: string,
  callback: (transactions: Transaction[]) => void
): () => void {
  const q = query(
    collection(db, 'users', userId, 'transactions'),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];
    callback(transactions);
  });
}

export async function addTransaction(
  userId: string,
  transaction: NewTransaction
): Promise<string> {
  const ref = await addDoc(collection(db, 'users', userId, 'transactions'), {
    ...transaction,
    userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return ref.id;
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  data: Partial<NewTransaction>
): Promise<void> {
  const ref = doc(db, 'users', userId, 'transactions', transactionId);
  await updateDoc(ref, {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteTransaction(userId: string, transactionId: string): Promise<void> {
  const ref = doc(db, 'users', userId, 'transactions', transactionId);
  await deleteDoc(ref);
}
