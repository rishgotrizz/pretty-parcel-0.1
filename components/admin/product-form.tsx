"use client";

import { ImagePlus, IndianRupee, Info, UploadCloud } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import { cn } from "@/lib/utils";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  flashSalePrice: string;
  flashSaleEndsAt: string;
  tags: string;
  specifications: string;
  customisationNotes: string;
  isFeatured: boolean;
  isSpecial: boolean;
  isActive: boolean;
  images: string[];
};

export type ProductFormFieldErrors = Partial<Record<keyof ProductFormValues | "images", string>>;

type ProductFormProps = {
  product: ProductFormValues;
  fieldErrors: ProductFormFieldErrors;
  saving: boolean;
  resetSignal: number;
  onCancelEdit?: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void>;
};

const productCategories = [
  "Bouquets",
  "Portraits",
  "Keychains",
  "Gift Hampers",
  "Scrapbooks",
  "Custom Frames"
];

function FieldLabel({
  label,
  hint
}: {
  label: string;
  hint?: string;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label className="text-sm font-semibold text-cocoa">{label}</label>
      {hint ? <span className="text-xs text-rosewood/60">{hint}</span> : null}
    </div>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 flex items-center gap-2 text-xs leading-5 text-rosewood/65">
      <Info className="h-3.5 w-3.5" />
      {children}
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-xs font-medium text-rose-600">{message}</p>;
}

function FieldShell({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("rounded-[1.5rem] bg-white/80 p-4 shadow-sm", className)}>{children}</div>;
}

function PriceInput({
  value,
  onChange,
  error,
  placeholder,
  name
}: {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder: string;
  name: string;
}) {
  return (
    <div className={cn("flex items-center rounded-[1rem] border bg-white px-4 py-3", error ? "border-rose-300 ring-4 ring-rose-100" : "border-pink-100")}>
      <IndianRupee className="h-4 w-4 text-rosewood/60" />
      <input
        name={name}
        type="number"
        min="0"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

function buildDraft(product: ProductFormValues): ProductFormValues {
  return {
    ...product,
    images: product.images ?? []
  };
}

export function ProductForm({
  product,
  fieldErrors,
  saving,
  resetSignal,
  onCancelEdit,
  onSubmit
}: ProductFormProps) {
  const [draft, setDraft] = useState<ProductFormValues>(buildDraft(product));
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setDraft(buildDraft(product));
  }, [product.id, resetSignal]);

  function updateField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    try {
      setUploading(true);
      const nextImages = await Promise.all(
        files.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result ?? ""));
              reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
              reader.readAsDataURL(file);
            })
        )
      );

      setDraft((current) => ({
        ...current,
        images: [...current.images, ...nextImages.filter(Boolean)]
      }));
      event.target.value = "";
    } catch (error) {
      console.error("[ProductForm] image selection failed", error);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(draft);
  }

  const isEditing = Boolean(draft.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood/70">
            {isEditing ? "Edit product" : "Add product"}
          </p>
          <h2 className="mt-2 font-serif text-3xl text-cocoa">Product management</h2>
        </div>
        {isEditing && onCancelEdit ? (
          <button type="button" onClick={onCancelEdit} className="button-secondary !py-2">
            Clear form
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FieldShell>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rosewood/60">Basic info</p>
          <div className="mt-4 grid gap-4">
            <div>
              <FieldLabel label="Product name" hint="Min 3 characters" />
              <input
                value={draft.name}
                onChange={(event) => updateField("name", event.target.value)}
                className={cn(
                  "w-full rounded-[1rem] border bg-white px-4 py-3 text-sm outline-none",
                  fieldErrors.name ? "border-rose-300 ring-4 ring-rose-100" : "border-pink-100"
                )}
              />
              <FieldHint>Use the exact product name customers should see on the storefront.</FieldHint>
              <FieldError message={fieldErrors.name} />
            </div>

            <div>
              <FieldLabel label="Slug" hint="Min 3 characters" />
              <input
                value={draft.slug}
                onChange={(event) => updateField("slug", event.target.value)}
                className={cn(
                  "w-full rounded-[1rem] border bg-white px-4 py-3 text-sm outline-none",
                  fieldErrors.slug ? "border-rose-300 ring-4 ring-rose-100" : "border-pink-100"
                )}
              />
              <FieldHint>Leave it blank to auto-generate from the product name.</FieldHint>
              <FieldError message={fieldErrors.slug} />
            </div>

            <div>
              <FieldLabel label="Category" />
              <select
                value={draft.category}
                onChange={(event) => updateField("category", event.target.value)}
                className={cn(
                  "w-full rounded-[1rem] border bg-white px-4 py-3 text-sm outline-none",
                  fieldErrors.category ? "border-rose-300 ring-4 ring-rose-100" : "border-pink-100"
                )}
              >
                <option value="">Select a category</option>
                {productCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <FieldError message={fieldErrors.category} />
            </div>

            <div>
              <FieldLabel label="Stock quantity" />
              <input
                type="number"
                min="0"
                value={draft.stock}
                onChange={(event) => updateField("stock", event.target.value)}
                className={cn(
                  "w-full rounded-[1rem] border bg-white px-4 py-3 text-sm outline-none",
                  fieldErrors.stock ? "border-rose-300 ring-4 ring-rose-100" : "border-pink-100"
                )}
              />
              <FieldError message={fieldErrors.stock} />
            </div>
          </div>
        </FieldShell>

        <FieldShell>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rosewood/60">Pricing</p>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel label="Selling price" />
                <PriceInput
                  name="price"
                  value={draft.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  placeholder="0"
                  error={fieldErrors.price}
                />
                <FieldError message={fieldErrors.price} />
              </div>
              <div>
                <FieldLabel label="MRP" />
                <PriceInput
                  name="compareAtPrice"
                  value={draft.compareAtPrice}
                  onChange={(event) => updateField("compareAtPrice", event.target.value)}
                  placeholder="0"
                  error={fieldErrors.compareAtPrice}
                />
                <FieldError message={fieldErrors.compareAtPrice} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel label="Flash sale price" />
                <PriceInput
                  name="flashSalePrice"
                  value={draft.flashSalePrice}
                  onChange={(event) => updateField("flashSalePrice", event.target.value)}
                  placeholder="0"
                  error={fieldErrors.flashSalePrice}
                />
                <FieldError message={fieldErrors.flashSalePrice} />
              </div>
              <div>
                <FieldLabel label="Flash sale end date" />
                <input
                  type="date"
                  value={draft.flashSaleEndsAt ? draft.flashSaleEndsAt.slice(0, 10) : ""}
                  onChange={(event) => updateField("flashSaleEndsAt", event.target.value)}
                  className={cn(
                    "w-full rounded-[1rem] border bg-white px-4 py-3 text-sm outline-none",
                    fieldErrors.flashSaleEndsAt ? "border-rose-300 ring-4 ring-rose-100" : "border-pink-100"
                  )}
                />
                <FieldError message={fieldErrors.flashSaleEndsAt} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-[1rem] border border-pink-100 bg-white px-4 py-3 text-sm text-rosewood">
                <input
                  checked={draft.isFeatured}
                  type="checkbox"
                  onChange={(event) => updateField("isFeatured", event.target.checked)}
                />
                Featured product
              </label>
              <label className="flex items-center gap-2 rounded-[1rem] border border-pink-100 bg-white px-4 py-3 text-sm text-rosewood">
                <input
                  checked={draft.isSpecial}
                  type="checkbox"
                  onChange={(event) => updateField("isSpecial", event.target.checked)}
                />
                Include in special category
              </label>
              <label className="flex items-center gap-2 rounded-[1rem] border border-pink-100 bg-white px-4 py-3 text-sm text-rosewood">
                <input
                  checked={draft.isActive}
                  type="checkbox"
                  onChange={(event) => updateField("isActive", event.target.checked)}
                />
                Visible in store
              </label>
            </div>
          </div>
        </FieldShell>

        <FieldShell className="lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rosewood/60">Descriptions</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <FieldLabel label="Short description" hint="Min 10 characters" />
              <textarea
                value={draft.shortDescription}
                onChange={(event) => updateField("shortDescription", event.target.value)}
                className={cn(
                  "min-h-28 w-full rounded-[1rem] border bg-white px-4 py-3 text-sm outline-none",
                  fieldErrors.shortDescription ? "border-rose-300 ring-4 ring-rose-100" : "border-pink-100"
                )}
              />
              <FieldHint>This appears in product cards and quick previews.</FieldHint>
              <FieldError message={fieldErrors.shortDescription} />
            </div>
            <div>
              <FieldLabel label="Full description" hint="Min 10 characters" />
              <textarea
                value={draft.description}
                onChange={(event) => updateField("description", event.target.value)}
                className={cn(
                  "min-h-28 w-full rounded-[1rem] border bg-white px-4 py-3 text-sm outline-none",
                  fieldErrors.description ? "border-rose-300 ring-4 ring-rose-100" : "border-pink-100"
                )}
              />
              <FieldHint>Describe what the customer receives and what makes it special.</FieldHint>
              <FieldError message={fieldErrors.description} />
            </div>
            <div>
              <FieldLabel label="Tags" />
              <textarea
                value={draft.tags}
                onChange={(event) => updateField("tags", event.target.value)}
                className="min-h-24 w-full rounded-[1rem] border border-pink-100 bg-white px-4 py-3 text-sm outline-none"
              />
              <FieldHint>Separate tags with commas.</FieldHint>
            </div>
            <div>
              <FieldLabel label="Specifications" />
              <textarea
                value={draft.specifications}
                onChange={(event) => updateField("specifications", event.target.value)}
                className="min-h-24 w-full rounded-[1rem] border border-pink-100 bg-white px-4 py-3 text-sm outline-none"
              />
              <FieldHint>Add one specification per line.</FieldHint>
            </div>
            <div className="lg:col-span-2">
              <FieldLabel label="Customization notes" />
              <textarea
                value={draft.customisationNotes}
                onChange={(event) => updateField("customisationNotes", event.target.value)}
                className="min-h-24 w-full rounded-[1rem] border border-pink-100 bg-white px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>
        </FieldShell>

        <FieldShell className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rosewood/60">Images</p>
              <p className="mt-2 text-sm text-rosewood/75">
                Upload multiple images, preview them, and remove any image before saving the product.
              </p>
            </div>
            <label className="button-secondary cursor-pointer !py-2">
              {uploading ? <UploadCloud className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
              {uploading ? "Preparing..." : "Upload images"}
              <input type="file" accept="image/*" multiple onChange={handleImageSelection} className="hidden" />
            </label>
          </div>

          {draft.images.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {draft.images.map((image, index) => (
                <div key={`${image.slice(0, 30)}-${index}`} className="rounded-[1.25rem] border border-white/80 bg-white/95 p-3 shadow-sm">
                  <img src={image} alt={`Product image ${index + 1}`} className="h-32 w-full rounded-[1rem] object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        images: current.images.filter((_, imageIndex) => imageIndex !== index)
                      }))
                    }
                    className="button-secondary mt-3 w-full !py-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.25rem] border border-dashed border-pink-200 bg-rosewater/70 px-4 py-6 text-center text-sm text-rosewood/70">
              Upload product photos to build the storefront gallery.
            </div>
          )}
          <FieldError message={fieldErrors.images} />
        </FieldShell>
      </div>

      <button type="submit" disabled={saving} className="button-primary w-full sm:w-auto">
        {saving ? (isEditing ? "Updating product..." : "Adding product...") : isEditing ? "Update product" : "Add product"}
      </button>
    </form>
  );
}
