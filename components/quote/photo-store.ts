/**
 * In-memory store for compressed photos awaiting upload.
 *
 * Photos are captured at step 3 but can only be uploaded once the customer
 * is signed in (storage RLS scopes uploads to the user's folder), so blobs
 * are held here and uploaded during submit. They intentionally do NOT
 * survive a page refresh — the photos step shows a notice when previously
 * selected photos are gone.
 */
export type PendingPhoto = {
  blob: Blob;
  previewUrl: string;
  originalName: string;
};

const store = new Map<string, PendingPhoto[]>();

export function getPhotos(questionId: string): PendingPhoto[] {
  return store.get(questionId) ?? [];
}

export function addPhoto(questionId: string, photo: PendingPhoto): void {
  store.set(questionId, [...getPhotos(questionId), photo]);
}

export function removePhoto(questionId: string, index: number): void {
  const photos = getPhotos(questionId);
  const removed = photos[index];
  if (removed) URL.revokeObjectURL(removed.previewUrl);
  store.set(
    questionId,
    photos.filter((_, i) => i !== index)
  );
}

export function allPhotoEntries(): [string, PendingPhoto[]][] {
  return [...store.entries()];
}

export function clearPhotos(): void {
  for (const photos of store.values()) {
    for (const p of photos) URL.revokeObjectURL(p.previewUrl);
  }
  store.clear();
}
