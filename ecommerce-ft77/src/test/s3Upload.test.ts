import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ user: null as null | { getIdToken: () => Promise<string> } }));
vi.mock("../config/firebase", () => ({ firebaseAuth: { get currentUser() { return state.user; } } }));

import { uploadProductImage } from "../services/s3Upload";

const image = new File(["image-bytes"], "mouse.webp", { type: "image/webp" });

describe("carga de imágenes en S3", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.user = { getIdToken: vi.fn().mockResolvedValue("firebase-token") };
    vi.stubGlobal("fetch", vi.fn());
  });

  it("exige una sesión antes de solicitar la URL firmada", async () => {
    state.user = null;
    await expect(uploadProductImage(image)).rejects.toThrow("Inicia sesión con una cuenta administradora");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("propaga el error de la API de firmado", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: "No autorizado" }), { status: 403 }));
    await expect(uploadProductImage(image)).rejects.toThrow("No autorizado");
    expect(fetch).toHaveBeenCalledWith("/api/presign", expect.objectContaining({ method: "POST" }));
  });

  it("rechaza respuestas exitosas incompletas", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ uploadUrl: "https://s3/upload" }), { status: 200 }));
    await expect(uploadProductImage(image)).rejects.toThrow("No se pudo preparar la carga de la imagen.");
  });

  it("sube el archivo con PUT y devuelve su URL pública", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ uploadUrl: "https://s3/upload", imageUrl: "https://cdn/mouse.webp" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    await expect(uploadProductImage(image)).resolves.toBe("https://cdn/mouse.webp");
    expect(fetch).toHaveBeenNthCalledWith(1, "/api/presign", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer firebase-token" }),
      body: JSON.stringify({ fileName: "mouse.webp", contentType: "image/webp", size: image.size }),
    }));
    expect(fetch).toHaveBeenNthCalledWith(2, "https://s3/upload", expect.objectContaining({ method: "PUT", body: image }));
  });

  it("muestra una indicación CORS si S3 rechaza la carga", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ uploadUrl: "https://s3/upload", imageUrl: "https://cdn/mouse.webp" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 403 }));
    await expect(uploadProductImage(image)).rejects.toThrow("S3 rechazó la imagen. Revisa la configuración CORS del bucket.");
  });
});
