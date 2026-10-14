import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState, type ReactNode } from "react";
import { firebaseAuth, firestore } from "../../config/firebase";
import type { UserProfile } from "../../types/auth.types";
import { AuthContext } from "./AuthContext";

function requireFirebase() {
  if (!firebaseAuth || !firestore) {
    throw new Error("Firebase aún no está configurado. Completa las variables VITE_FIREBASE_* en .env.local.");
  }
  return { auth: firebaseAuth, db: firestore };
}

async function getOrCreateProfile(user: User): Promise<UserProfile> {
  const { db } = requireFirebase();
  const profileRef = doc(db, "users", user.uid);
  const profileSnapshot = await getDoc(profileRef);

  if (!profileSnapshot.exists()) {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email,
      role: "customer",
      createdAt: new Date().toISOString(),
    };
    await setDoc(profileRef, { ...profile, createdAt: serverTimestamp() });
    return profile;
  }

  const data = profileSnapshot.data();
  return {
    uid: user.uid,
    email: user.email,
    role: data.role === "admin" ? "admin" : "customer",
    createdAt: typeof data.createdAt === "string" ? data.createdAt : "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(firebaseAuth));

  useEffect(() => {
    if (!firebaseAuth) {
      return;
    }

    return onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setProfile(await getOrCreateProfile(currentUser));
      } catch (error) {
        console.error("No se pudo cargar el perfil de Firebase.", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function login(email: string, password: string) {
    const { auth } = requireFirebase();
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email: string, password: string) {
    const { auth } = requireFirebase();
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const { auth } = requireFirebase();
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  async function logout() {
    const { auth } = requireFirebase();
    await signOut(auth);
  }

  return <AuthContext.Provider value={{ user, profile, loading, login, register, loginWithGoogle, logout }}>{children}</AuthContext.Provider>;
}
