"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { useToast } from "@/components/providers/toast-provider";

type CategoryItem = {
  _id: string;
  name: string;
  createdAt: string;
};

type CategoryManagementProps = {
  categories: CategoryItem[];
  onCategoriesChange: (categories: CategoryItem[]) => void;
};

export function CategoryManagement({ categories, onCategoriesChange }: CategoryManagementProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<CategoryItem | null>(null);
  const { pushToast } = useToast();

  const hasCategories = categories.length > 0;
  const sortedCategories = useMemo(
    () =>
      [...categories].sort(
        (left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime()
      ),
    [categories]
  );

  async function addCategory() {
    if (!name.trim() || saving) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/categories", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: name.trim() })
      });
      const raw = await response.text();
      const result = raw ? JSON.parse(raw) : {};
      const category = result?.data?.category ?? result?.category;

      if (!response.ok || result?.success === false) {
        pushToast(result?.error ?? "Could not create category.", "error");
        return;
      }

      if (category?._id && category?.name) {
        onCategoriesChange([category, ...categories]);
      }
      setName("");
      pushToast("Category added successfully.", "success");
    } catch (error) {
      console.error("[CategoryManagement] add failed", error);
      pushToast("Could not create category.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category: CategoryItem) {
    try {
      setDeletingId(category._id);
      const response = await fetch(`/api/categories/${category._id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      const raw = await response.text();
      const result = raw ? JSON.parse(raw) : {};

      if (!response.ok || result?.success === false) {
        pushToast(result?.error ?? "Could not delete category.", "error");
        return;
      }

      onCategoriesChange(categories.filter((item) => item._id !== category._id));
      setConfirmDelete(null);
      pushToast("Category deleted successfully.", "success");
    } catch (error) {
      console.error("[CategoryManagement] delete failed", error);
      pushToast("Could not delete category.", "error");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <section className="glass-panel rounded-[2rem] border border-white/70 p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">Category management</p>
      <h2 className="mt-2 font-serif text-3xl text-cocoa">Organize your product catalog</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-rosewood/75">
        Add categories once and reuse them across product creation. Duplicate names are blocked automatically.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <label className="mb-2 block text-sm font-semibold text-cocoa">Category name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter category name"
            className="w-full rounded-[1rem] border border-pink-100 bg-white/90 px-4 py-3 text-sm outline-none"
          />
        </div>
        <button type="button" onClick={() => void addCategory()} disabled={!name.trim() || saving} className="button-primary w-full lg:w-auto">
          {saving ? "Adding category..." : "Add Category"}
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-pink-100/80 bg-white/80">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-rosewater/90 text-rosewood/70">
              <tr>
                <th className="px-4 py-3 font-semibold">Category Name</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {!hasCategories ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-rosewood/70">
                    No categories added yet.
                  </td>
                </tr>
              ) : (
                sortedCategories.map((category) => (
                  <tr key={category._id} className="border-t border-pink-100/70">
                    <td className="px-4 py-4 font-medium text-cocoa">{category.name}</td>
                    <td className="px-4 py-4 text-rosewood/70">
                      {new Date(category.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(category)}
                        disabled={deletingId === category._id}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingId === category._id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/40 px-4 py-6">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rosewood/65">Confirm delete</p>
            <h3 className="mt-3 font-serif text-3xl text-cocoa">Delete this category?</h3>
            <p className="mt-3 text-sm leading-7 text-rosewood/80">
              Are you sure you want to delete <span className="font-semibold text-cocoa">{confirmDelete.name}</span>?
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmDelete(null)} className="button-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deleteCategory(confirmDelete)}
                disabled={deletingId === confirmDelete._id}
                className="button-primary bg-rose-500 text-white hover:bg-rose-600"
              >
                {deletingId === confirmDelete._id ? "Deleting..." : "Delete category"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
