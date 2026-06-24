import { z } from "zod";
import { handle, currentUser, unauthorized, ApiError } from "@/lib/api";
import { runCommand } from "@/lib/commands";
import {
  produce,
  listForSale,
  buyNow,
  makeOffer,
  respondOffer,
  cancelProduction,
  investUpgrade,
  closeListing,
} from "@/lib/market-service";
import { createWholesaleOffer, respondWholesale } from "@/lib/wholesale-service";
import { applyPolicy } from "@/lib/policy-service";
import {
  produceSchema,
  cancelProductionSchema,
  investSchema,
  closeListingSchema,
  listSchema,
  buySchema,
  offerSchema,
  respondOfferSchema,
  wholesaleCreateSchema,
  respondWholesaleSchema,
  applyPolicySchema,
} from "@/lib/validation";

const actionSchema = z.object({
  action: z.enum([
    "produce",
    "cancelProduction",
    "invest",
    "list",
    "closeListing",
    "buy",
    "offer",
    "respondOffer",
    "wholesale",
    "respondWholesale",
    "applyPolicy",
  ]),
});

function cmd<T extends { clientActionId: string; expectedStateVersion?: number }>(
  userId: string,
  sessionId: string,
  p: T,
  eventType: string,
  handler: Parameters<typeof runCommand>[0]["handler"],
) {
  return runCommand({
    userId,
    sessionId,
    clientActionId: p.clientActionId,
    expectedStateVersion: p.expectedStateVersion,
    payload: p,
    eventType,
    handler,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  return handle(async () => {
    const body = await request.json();
    const { action } = actionSchema.parse(body);

    if (action === "produce") {
      const p = produceSchema.parse(body);
      return cmd(user.id, id, p, "producer:produced", (tx, ctx) => produce(tx, ctx, p.quantity));
    }
    if (action === "cancelProduction") {
      const p = cancelProductionSchema.parse(body);
      return cmd(user.id, id, p, "producer:cancelled", (tx, ctx) => cancelProduction(tx, ctx));
    }
    if (action === "invest") {
      const p = investSchema.parse(body);
      return cmd(user.id, id, p, "producer:invested", (tx, ctx) => investUpgrade(tx, ctx));
    }
    if (action === "list") {
      const p = listSchema.parse(body);
      return cmd(user.id, id, p, "market:listed", (tx, ctx) =>
        listForSale(tx, ctx, {
          inventoryLotId: p.inventoryLotId,
          quantity: p.quantity,
          askPriceVnd: p.askPriceVnd,
        }),
      );
    }
    if (action === "closeListing") {
      const p = closeListingSchema.parse(body);
      return cmd(user.id, id, p, "market:listing_closed", (tx, ctx) =>
        closeListing(tx, ctx, p.listingId),
      );
    }
    if (action === "buy") {
      const p = buySchema.parse(body);
      return cmd(user.id, id, p, "market:trade_completed", (tx, ctx) =>
        buyNow(tx, ctx, { listingId: p.listingId, quantity: p.quantity }),
      );
    }
    if (action === "offer") {
      const p = offerSchema.parse(body);
      return cmd(user.id, id, p, "market:offer_made", (tx, ctx) => makeOffer(tx, ctx, p));
    }
    if (action === "respondOffer") {
      const p = respondOfferSchema.parse(body);
      return cmd(user.id, id, p, "market:offer_responded", (tx, ctx) =>
        respondOffer(tx, ctx, {
          offerId: p.offerId,
          decision: p.decision,
          counterPriceVnd: p.counterPriceVnd,
        }),
      );
    }
    if (action === "wholesale") {
      const p = wholesaleCreateSchema.parse(body);
      return cmd(user.id, id, p, "wholesale:offered", (tx, ctx) => createWholesaleOffer(tx, ctx, p));
    }
    if (action === "respondWholesale") {
      const p = respondWholesaleSchema.parse(body);
      return cmd(user.id, id, p, "wholesale:responded", (tx, ctx) =>
        respondWholesale(tx, ctx, {
          offerId: p.offerId,
          decision: p.decision,
          counterPriceVnd: p.counterPriceVnd,
        }),
      );
    }
    if (action === "applyPolicy") {
      const p = applyPolicySchema.parse(body);
      return cmd(user.id, id, p, "policy:applied", (tx, ctx) => applyPolicy(tx, ctx, p));
    }
    throw new ApiError("UNKNOWN_ACTION", 400);
  });
}
