import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type RequestBody = { fileName?: unknown; contentType?: unknown; size?: unknown };
type ApiRequest = {
  method?: string;
  headers: { origin?: string | string[]; authorization?: string | string[] };
  body?: RequestBody;
};
type ApiResponse = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
};
type RuntimeGlobal = typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
  crypto: { randomUUID: () => string };
};

const serverEnv = (globalThis as RuntimeGlobal).process?.env ?? {};

function respond(res: ApiResponse, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function isAdminToken(idToken: string): Promise<boolean> {
  const apiKey = serverEnv.VITE_FIREBASE_API_KEY;
  const projectId = serverEnv.VITE_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) return false;

  const identityResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!identityResponse.ok) return false;
  const identity = await identityResponse.json() as { users?: Array<{ localId?: string }> };
  const uid = identity.users?.[0]?.localId;
  if (!uid) return false;

  const profileResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!profileResponse.ok) return false;
  const profile = await profileResponse.json() as { fields?: { role?: { stringValue?: string } } };
  return profile.fields?.role?.stringValue === "admin";
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const allowedOrigins = (serverEnv.APP_ORIGIN || "http://localhost:5173")
    .split(",").map((origin) => origin.trim()).filter(Boolean);
  const rawOrigin = req.headers.origin;
  const origin = Array.isArray(rawOrigin) ? rawOrigin[0] : rawOrigin;

  if (origin && !allowedOrigins.includes(origin)) return respond(res, 403, { error: "Origen no permitido." });
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== "POST") return respond(res, 405, { error: "Método no permitido." });

  const rawAuthorization = req.headers.authorization;
  const authorization = Array.isArray(rawAuthorization) ? rawAuthorization[0] : rawAuthorization;
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || !(await isAdminToken(token))) return respond(res, 403, { error: "Solo un administrador puede subir imágenes." });

  const { contentType, size } = req.body ?? {};
  const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  if (typeof contentType !== "string" || !extensions[contentType]) {
    return respond(res, 400, { error: "Usa una imagen JPG, PNG o WEBP." });
  }
  if (typeof size !== "number" || size <= 0 || size > 5 * 1024 * 1024) {
    return respond(res, 400, { error: "La imagen debe pesar máximo 5 MB." });
  }

  const region = serverEnv.AWS_REGION;
  const bucket = serverEnv.AWS_S3_BUCKET;
  const accessKeyId = serverEnv.AWS_ACCESS_KEY_ID;
  const secretAccessKey = serverEnv.AWS_SECRET_ACCESS_KEY;
  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    return respond(res, 500, { error: "Falta configurar S3 en las variables del servidor." });
  }

  try {
    const key = `products/${(globalThis as RuntimeGlobal).crypto.randomUUID()}.${extensions[contentType]}`;
    const client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
    const uploadUrl = await getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn: 60 });
    const baseUrl = (serverEnv.AWS_S3_PUBLIC_BASE_URL || `https://${bucket}.s3.${region}.amazonaws.com`).replace(/\/$/, "");
    return respond(res, 200, { uploadUrl, imageUrl: `${baseUrl}/${key}` });
  } catch {
    return respond(res, 500, { error: "No se pudo generar la URL para la imagen." });
  }
}
