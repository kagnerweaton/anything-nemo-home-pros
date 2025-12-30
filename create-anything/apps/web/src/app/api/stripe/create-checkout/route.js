import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import Stripe from "stripe";

export async function POST(request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await auth();

    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contractorId, redirectURL } = body;

    if (!contractorId) {
      return Response.json(
        { error: "Contractor ID required" },
        { status: 400 },
      );
    }

    // Verify ownership
    const contractors = await sql`
      SELECT id, user_id, stripe_customer_id
      FROM contractors
      WHERE id = ${parseInt(contractorId)}
      AND user_id = ${session.user.id}
      LIMIT 1
    `;

    if (contractors.length === 0) {
      return Response.json(
        { error: "Contractor not found or unauthorized" },
        { status: 404 },
      );
    }

    const contractor = contractors[0];
    let stripeCustomerId = contractor.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          contractor_id: contractorId,
          user_id: session.user.id,
        },
      });
      stripeCustomerId = customer.id;

      await sql`
        UPDATE contractors
        SET stripe_customer_id = ${stripeCustomerId}
        WHERE id = ${parseInt(contractorId)}
      `;
    }

    // Create checkout session for $10/month Pro plan
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "NEMO Home Pros - Pro Plan",
              description:
                "Add photos and multiple service categories to your listing",
            },
            recurring: {
              interval: "month",
            },
            unit_amount: 1000, // $10.00
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${redirectURL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: redirectURL,
      metadata: {
        contractor_id: contractorId,
      },
    });

    return Response.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Create checkout error:", error);
    return Response.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
