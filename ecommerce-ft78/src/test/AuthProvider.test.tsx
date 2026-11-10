import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import { AuthProvider } from "../contexts/auth/AuthProvider";
import { useAuth } from "../contexts/auth/useAuth";

const mocks = vi.hoisted(() => ({
  auth: {} as unknown,
  db: {} as unknown,
  listener: null as null | ((user: unknown) => void),
  onAuthStateChanged: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  doc: vi.fn((...args) => args),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(() => "server-time"),
  setDoc: vi.fn(),
  unsubscribe: vi.fn(),
}));
vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: mocks.createUserWithEmailAndPassword,
  GoogleAuthProvider: mocks.GoogleAuthProvider,
  onAuthStateChanged: mocks.onAuthStateChanged,
  signInWithEmailAndPassword: mocks.signInWithEmailAndPassword,
  signInWithPopup: mocks.signInWithPopup,
  signOut: mocks.signOut,
}));
vi.mock("firebase/firestore", () => ({ doc: mocks.doc, getDoc: mocks.getDoc, serverTimestamp: mocks.serverTimestamp, setDoc: mocks.setDoc }));
vi.mock("../config/firebase", () => ({ get firebaseAuth() { return mocks.auth; }, get firestore() { return mocks.db; } }));

function Probe() {
  const auth = useAuth();
  return <div>
    <span data-testid="loading">{String(auth.loading)}</span>
    <span data-testid="user">{auth.user?.uid ?? "none"}</span>
    <span data-testid="role">{auth.profile?.role ?? "none"}</span>
    <button onClick={() => void auth.login("a@b.co", "secret1")}>login</button>
    <button onClick={() => void auth.register("a@b.co", "secret1")}>register</button>
    <button onClick={() => void auth.loginWithGoogle()}>google</button>
    <button onClick={() => void auth.logout()}>logout</button>
  </div>;
}

function renderProvider() { return render(<AuthProvider><Probe /></AuthProvider>); }
const customer = { uid: "u-1", email: "customer@example.com" } as User;

describe("sesión y perfil de Firebase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth = {};
    mocks.db = {};
    mocks.listener = null;
    mocks.onAuthStateChanged.mockImplementation((_auth: unknown, listener: (user: unknown) => void) => {
      mocks.listener = listener;
      return mocks.unsubscribe;
    });
    mocks.getDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
  });

  it("deja la sesión vacía cuando Firebase notifica que no hay usuario", async () => {
    renderProvider();
    expect(screen.getByTestId("loading")).toHaveTextContent("true");
    await act(async () => { mocks.listener?.(null); });
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(screen.getByTestId("role")).toHaveTextContent("none");
  });

  it("crea el perfil como customer para una cuenta nueva", async () => {
    renderProvider();
    await act(async () => { mocks.listener?.(customer); });
    expect(screen.getByTestId("role")).toHaveTextContent("customer");
    expect(mocks.setDoc).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ role: "customer", createdAt: "server-time" }));
  });

  it("conserva el rol admin de un perfil existente y normaliza roles desconocidos a customer", async () => {
    mocks.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ role: "admin", createdAt: "2026-01-01" }) });
    renderProvider();
    await act(async () => { mocks.listener?.(customer); });
    expect(screen.getByTestId("role")).toHaveTextContent("admin");
    expect(mocks.setDoc).not.toHaveBeenCalled();

    mocks.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ role: "owner", createdAt: 10 }) });
    await act(async () => { mocks.listener?.({ ...customer, uid: "u-2" }); });
    await waitFor(() => expect(screen.getByTestId("role")).toHaveTextContent("customer"));
  });

  it("expone las acciones de autenticación de Firebase", async () => {
    renderProvider();
    const user = { ...customer, getIdToken: vi.fn() };
    await act(async () => { mocks.listener?.(user); });
    fireEvent.click(screen.getByRole("button", { name: "login" }));
    fireEvent.click(screen.getByRole("button", { name: "register" }));
    fireEvent.click(screen.getByRole("button", { name: "google" }));
    fireEvent.click(screen.getByRole("button", { name: "logout" }));
    await waitFor(() => {
      expect(mocks.onAuthStateChanged).toHaveBeenCalled();
      expect(mocks.createUserWithEmailAndPassword).toHaveBeenCalledWith(mocks.auth, "a@b.co", "secret1");
      expect(mocks.signInWithEmailAndPassword).toHaveBeenCalledWith(mocks.auth, "a@b.co", "secret1");
      expect(mocks.signInWithPopup).toHaveBeenCalled();
      expect(mocks.signOut).toHaveBeenCalledWith(mocks.auth);
    });
  });

});

