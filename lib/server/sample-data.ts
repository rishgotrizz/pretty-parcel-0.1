import type { CouponSummary, ProductType } from "@/types";

export const sampleProducts: ProductType[] = [
  {
    name: "Blush Bloom Bouquet",
    slug: "blush-bloom-bouquet",
    shortDescription: "Handmade bouquet with preserved florals and satin wraps.",
    description:
      "A soft pink bouquet arranged with preserved roses, baby's breath, dried textures, and satin ribbons. Ideal for birthdays, anniversaries, and bridal gifting.",
    price: 1899,
    compareAtPrice: 2199,
    category: "Bouquets",
    tags: ["handmade", "flowers", "best seller"],
    stock: 18,
    popularity: 94,
    isFeatured: true,
    isActive: true,
    images: ["/bouquet.svg", "/hero-pretty-parcel.svg"],
    specifications: ["Preserved floral arrangement", "Approx. 12 inch height", "Ready-to-gift wrapping"],
    customisationNotes: "Choose note card text and ribbon color at checkout.",
    reviews: [
      { name: "Riya", rating: 5, comment: "Looks even prettier in person.", date: "2026-02-08" },
      { name: "Aanya", rating: 4, comment: "Lovely packaging and fragrance.", date: "2026-02-19" }
    ],
    seo: {
      title: "Blush Bloom Bouquet | The Pretty Parcel",
      description: "Handmade preserved flower bouquet with satin wrapping."
    },
    flashSale: {
      isActive: true,
      price: 1649,
      endsAt: "2026-03-30T18:30:00.000Z"
    }
  },
  {
    name: "Watercolor Portrait Frame",
    slug: "watercolor-portrait-frame",
    shortDescription: "Custom illustrated portrait in an elegant keepsake frame.",
    description:
      "Send your favorite photo and we turn it into a delicate watercolor-style portrait housed in a handcrafted blush-toned frame.",
    price: 2499,
    compareAtPrice: 2899,
    category: "Portraits",
    tags: ["custom", "portrait", "gift"],
    stock: 12,
    popularity: 90,
    isFeatured: true,
    isActive: true,
    images: ["/portrait.svg", "/hero-pretty-parcel.svg"],
    specifications: ["A4 portrait print", "Wooden handcrafted frame", "Preview shared before dispatch"],
    customisationNotes: "Upload one portrait photo after placing your order.",
    reviews: [
      { name: "Ishita", rating: 5, comment: "Beautiful artwork and so emotional.", date: "2026-01-20" }
    ],
    flashSale: {
      isActive: false,
      price: 2499,
      endsAt: "2026-03-25T00:00:00.000Z"
    }
  },
  {
    name: "Pressed Flower Keychain",
    slug: "pressed-flower-keychain",
    shortDescription: "Resin keychain with preserved petals and gold flakes.",
    description:
      "A compact handmade resin keychain featuring preserved petals, initials, and a luxe gold clasp. Perfect for return gifts and everyday keepsakes.",
    price: 699,
    compareAtPrice: 899,
    category: "Keychains",
    tags: ["keychain", "custom initials", "resin"],
    stock: 45,
    popularity: 88,
    isFeatured: false,
    isActive: true,
    images: ["/keychain.svg", "/hero-pretty-parcel.svg"],
    specifications: ["Custom initials", "Gold-tone hardware", "Gift-ready mini box"],
    customisationNotes: "Choose initials and petal color.",
    reviews: [
      { name: "Mitali", rating: 5, comment: "Cute and premium.", date: "2026-03-01" }
    ],
    flashSale: {
      isActive: true,
      price: 549,
      endsAt: "2026-03-28T18:30:00.000Z"
    }
  },
  {
    name: "Pretty Parcel Celebration Hamper",
    slug: "pretty-parcel-celebration-hamper",
    shortDescription: "Curated hamper with flowers, candle, chocolate, and note card.",
    description:
      "A layered gift hamper curated for festive moments, containing a mini bouquet, hand-poured candle, artisanal chocolate, and a handwritten note card.",
    price: 3199,
    compareAtPrice: 3599,
    category: "Gift Hampers",
    tags: ["hamper", "birthday", "celebration"],
    stock: 16,
    popularity: 97,
    isFeatured: true,
    isActive: true,
    images: ["/hamper.svg", "/hero-pretty-parcel.svg"],
    specifications: ["4 curated items", "Premium rigid box", "Same-day dispatch for prepaid orders"],
    reviews: [
      { name: "Sneha", rating: 5, comment: "The unboxing felt luxurious.", date: "2026-02-14" }
    ],
    flashSale: {
      isActive: false,
      price: 3199,
      endsAt: "2026-03-25T00:00:00.000Z"
    }
  },
  {
    name: "Love Story Scrapbook",
    slug: "love-story-scrapbook",
    shortDescription: "Memory scrapbook with handcrafted inserts and captions.",
    description:
      "A handcrafted scrapbook designed for milestones and memories, with layered inserts, floral textures, and space for photos, letters, and captions.",
    price: 1699,
    compareAtPrice: 1999,
    category: "Scrapbooks",
    tags: ["scrapbook", "memory", "couple gift"],
    stock: 20,
    popularity: 82,
    isFeatured: false,
    isActive: true,
    images: ["/scrapbook.svg", "/hero-pretty-parcel.svg"],
    specifications: ["20 decorated pages", "Photo corners included", "Ribbon tie closure"],
    reviews: [
      { name: "Pihu", rating: 4, comment: "Very pretty finish and pages.", date: "2026-01-11" }
    ],
    flashSale: {
      isActive: false,
      price: 1699,
      endsAt: "2026-03-25T00:00:00.000Z"
    }
  },
  {
    name: "Pet Portrait Mini Frame",
    slug: "pet-portrait-mini-frame",
    shortDescription: "Custom illustrated pet portrait with floral accents.",
    description:
      "Celebrate your furry companion with a delicate pet portrait in a mini floral frame, hand-finished with soft textures and pastel accents.",
    price: 1499,
    category: "Custom Frames",
    tags: ["pet portrait", "custom", "frame"],
    stock: 10,
    popularity: 79,
    isFeatured: false,
    isActive: true,
    images: ["/frame.svg", "/hero-pretty-parcel.svg"],
    specifications: ["5x7 handcrafted frame", "Digital preview included", "Soft matte print"],
    reviews: [
      { name: "Diya", rating: 5, comment: "Captured my dog's vibe perfectly.", date: "2026-02-23" }
    ],
    flashSale: {
      isActive: true,
      price: 1299,
      endsAt: "2026-03-29T18:30:00.000Z"
    }
  }
];

export const sampleCoupons: CouponSummary[] = [
  { code: "PRETTY10", type: "percentage", value: 10, autoApply: false },
  { code: "PINK200", type: "fixed", value: 200, autoApply: false },
  { code: "GIFTGLOW", type: "percentage", value: 12, autoApply: true }
];

export const sampleCategories = [
  "Bouquets",
  "Portraits",
  "Keychains",
  "Gift Hampers",
  "Scrapbooks",
  "Custom Frames"
];
