import {
  PHOTOS_BUCKET,
  PHOTOS_BUCKET_HIJABI,
  VIDEOS_BUCKET,
  VIDEOS_BUCKET_HIJABI,
} from "@/lib/constants/steps";

export function photosBucketForHijabi(hijabi: boolean): string {
  return hijabi ? PHOTOS_BUCKET_HIJABI : PHOTOS_BUCKET;
}

export function videosBucketForHijabi(hijabi: boolean): string {
  return hijabi ? VIDEOS_BUCKET_HIJABI : VIDEOS_BUCKET;
}
