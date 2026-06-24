const CONSTRAINT_ATTEMPTS: MediaStreamConstraints[] = [
  {
    video: {
      facingMode: "user",
      width: { ideal: 960 },
      height: { ideal: 540 },
    },
    audio: true,
  },
  {
    video: { facingMode: "user" },
    audio: true,
  },
  {
    video: true,
    audio: true,
  },
];

export type CameraAccessErrorCode =
  | "NO_CAMERA_API"
  | "INSECURE_CONTEXT"
  | "NOT_ALLOWED"
  | "NOT_FOUND"
  | "UNKNOWN";

export class CameraAccessError extends Error {
  readonly code: CameraAccessErrorCode;

  constructor(code: CameraAccessErrorCode, message?: string) {
    super(message ?? code);
    this.name = "CameraAccessError";
    this.code = code;
  }
}

function mapGetUserMediaError(error: unknown): CameraAccessError {
  if (error instanceof CameraAccessError) return error;

  const name =
    error && typeof error === "object" && "name" in error
      ? String((error as { name: string }).name)
      : "";

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return new CameraAccessError("NOT_ALLOWED");
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return new CameraAccessError("NOT_FOUND");
  }

  return new CameraAccessError("UNKNOWN");
}

/** Request front-camera stream with progressively simpler constraints. */
export async function getCameraStream(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new CameraAccessError("NO_CAMERA_API");
  }

  if (typeof window !== "undefined" && !window.isSecureContext) {
    throw new CameraAccessError("INSECURE_CONTEXT");
  }

  let lastError: unknown;

  for (const constraints of CONSTRAINT_ATTEMPTS) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
    }
  }

  throw mapGetUserMediaError(lastError);
}
