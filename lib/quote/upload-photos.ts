import { createClient } from "@/lib/supabase/client";
import { allPhotoEntries } from "@/components/quote/photo-store";

/**
 * Uploads pending photos to quote-photos/{userId}/{draftId}/ and returns
 * question id -> storage paths.
 *
 * Requires an authenticated session — storage RLS scopes uploads to the user's
 * own folder. The review step verifies before it calls submit, so by the time
 * this runs there is always a session.
 */
export async function uploadPendingPhotos(
  draftId: string
): Promise<Record<string, string[]>> {
  const entries = allPhotoEntries();
  if (entries.length === 0) return {};

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const result: Record<string, string[]> = {};
  for (const [questionId, photos] of entries) {
    result[questionId] = [];
    for (let i = 0; i < photos.length; i++) {
      const path = `${user.id}/${draftId}/${questionId}-${i}.jpg`;
      const { error } = await supabase.storage
        .from("quote-photos")
        .upload(path, photos[i].blob, {
          contentType: "image/jpeg",
          upsert: true,
        });
      if (error) throw error;
      result[questionId].push(path);
    }
  }
  return result;
}
