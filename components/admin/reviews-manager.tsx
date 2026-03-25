"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import { useToast } from "@/components/providers/toast-provider";

type ReviewItem = {
  _id: string;
  name: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
};

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export function ReviewsManager() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const { pushToast } = useToast();

  useEffect(() => {
    async function loadReviews() {
      try {
        const response = await fetch("/api/admin/reviews", {
          credentials: "include",
          headers: { Accept: "application/json" }
        });
        const raw = await response.text();
        const data = raw ? JSON.parse(raw) : {};
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      } catch (error) {
        console.error("[ReviewsManager] load failed", error);
        pushToast("Could not load reviews.", "error");
      } finally {
        setLoading(false);
      }
    }

    void loadReviews();
  }, [pushToast]);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImageUrl(await fileToDataUrl(file));
      event.target.value = "";
    } catch (error) {
      console.error("[ReviewsManager] image failed", error);
      pushToast("Could not load review image.", "error");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, text, imageUrl })
      });
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        pushToast(data.error ?? "Could not save review.", "error");
        return;
      }

      setReviews((current) => [data.review, ...current]);
      setName("");
      setText("");
      setImageUrl("");
      pushToast("Review added successfully.", "success");
    } catch (error) {
      console.error("[ReviewsManager] save failed", error);
      pushToast("Could not save review.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteReview(id: string) {
    try {
      setDeletingId(id);
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        pushToast(data.error ?? "Could not delete review.", "error");
        return;
      }

      setReviews((current) => current.filter((review) => review._id !== id));
      pushToast("Review deleted successfully.", "success");
    } catch (error) {
      console.error("[ReviewsManager] delete failed", error);
      pushToast("Could not delete review.", "error");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <section className="glass-panel rounded-[2rem] border border-white/70 p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Manage reviews</p>
      <h2 className="mt-2 font-serif text-3xl text-cocoa">Customer Love section</h2>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-cocoa">Reviewer name</label>
            <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-cocoa">Upload image (optional)</label>
            <input type="file" accept="image/*" onChange={(event) => void handleImageChange(event)} className="block w-full text-sm text-rosewood/75" />
            {imageUrl ? <img src={imageUrl} alt="Review preview" className="mt-4 h-28 w-full rounded-[1.25rem] object-cover" /> : null}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-cocoa">Review text</label>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-h-32 w-full rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3 text-sm outline-none"
            />
          </div>
          <button type="submit" disabled={saving} className="button-primary">
            {saving ? "Adding review..." : "Add Review"}
          </button>
        </div>
      </form>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {loading ? <p className="text-sm text-rosewood/70">Loading reviews...</p> : null}
        {!loading && !reviews.length ? <p className="text-sm text-rosewood/70">No reviews added yet.</p> : null}
        {reviews.map((review) => (
          <div key={review._id} className="rounded-[1.75rem] bg-white/85 p-4 shadow-sm">
            {review.imageUrl ? <img src={review.imageUrl} alt={review.name} className="h-40 w-full rounded-[1.25rem] object-cover" /> : null}
            <p className="mt-4 font-semibold text-cocoa">{review.name}</p>
            <p className="mt-3 text-sm leading-7 text-rosewood/80">{review.text}</p>
            <button
              type="button"
              onClick={() => void deleteReview(review._id)}
              disabled={deletingId === review._id}
              className="button-secondary mt-4 !py-2 text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
              {deletingId === review._id ? "Deleting..." : "Delete Review"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
