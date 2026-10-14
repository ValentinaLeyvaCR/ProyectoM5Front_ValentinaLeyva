import { firebaseAuth } from "../config/firebase";

interface PresignResponse {
  uploadUrl?: string;
  imageUrl?: string;
  error?: string;
}

export async function uploadProductImage(file: File): Promise<string> {
  const user = firebaseAuth?.currentUser;
  if (!user) throw new Error("Inicia sesión con una cuenta administradora para subir imágenes.");

  const response = await fetch("/api/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }),
  });
  const signed = await response.json() as PresignResponse;
  if (!response.ok || !signed.uploadUrl || !signed.imageUrl) {
    throw new Error(signed.error || "No se pudo preparar la carga de la imagen.");
  }

  const uploadResponse = await fetch(signed.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadResponse.ok) throw new Error("S3 rechazó la imagen. Revisa la configuración CORS del bucket.");
  return signed.imageUrl;
}
