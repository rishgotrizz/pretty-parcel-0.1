import { z } from "zod";

const chatbotSchema = z.object({
  message: z.string().min(1)
});

export async function POST(request: Request) {
  const parsed = chatbotSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ reply: "Ask me about products, coupons, order tracking, or delivery." });
  }

  const message = parsed.data.message.toLowerCase();

  const reply = (() => {
    if (message.includes("track") || message.includes("order")) {
      return "You can track every purchase from the Orders page after login. Each order page includes live status updates and invoice details.";
    }
    if (message.includes("bouquet") || message.includes("flowers")) {
      return "Our bouquet collection includes preserved floral designs with satin wraps. The Blush Bloom Bouquet is a favorite for birthdays and anniversaries.";
    }
    if (message.includes("coupon") || message.includes("discount") || message.includes("offer")) {
      return "Try promo codes like PRETTY10 or PINK200. The checkout flow also auto-applies the best eligible discount for you.";
    }
    if (message.includes("shipping") || message.includes("delivery")) {
      return "Prepaid orders are prioritized, and many hampers and bouquets can be dispatched quickly. You will see estimated delivery and tracking once payment is confirmed.";
    }
    if (message.includes("keychain") || message.includes("portrait")) {
      return "Custom keychains and portraits are popular keepsakes. If you tell me the occasion, I can suggest the best fit.";
    }
    return "I can help with gift suggestions, coupon questions, shipping info, order tracking, and product recommendations.";
  })();

  return Response.json({ reply });
}
