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
    const { contractorId } = body;

    if (!contractorId) {
      return Response.json(
        { error: "Contractor ID required" },
        { status: 400 },
      );
    }

    // Get contractor
    const contractors = await sql`
      SELECT 
        id, user_id, subscription_status, stripe_subscription_id, 
        stripe_customer_id, subscription_end_date
      FROM contractors
      WHERE id = ${parseInt(contractorId)}
      AND user_id = ${session.user.id}
      LIMIT 1
    `;

    if (contractors.length === 0) {
      return Response.json({ error: "Contractor not found" }, { status: 404 });
    }

    const contractor = contractors[0];

    // If we have a Stripe subscription ID, check its status
    if (contractor.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          contractor.stripe_subscription_id,
        );

        const isActive =
          subscription.status === "active" ||
          subscription.status === "trialing";
        const newStatus = isActive ? "pro" : "basic";

        // Update database if status changed
        if (newStatus !== contractor.subscription_status) {
          await sql`
            UPDATE contractors
            SET 
              subscription_status = ${newStatus},
              subscription_end_date = ${subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null},
              updated_at = NOW()
            WHERE id = ${parseInt(contractorId)}
          `;

          // If downgraded, remove photos and extra services
          if (newStatus === "basic") {
            await sql`DELETE FROM contractor_photos WHERE contractor_id = ${parseInt(contractorId)}`;

            // Keep only primary service
            await sql`
              DELETE FROM contractor_services
              WHERE contractor_id = ${parseInt(contractorId)}
              AND is_primary = false
            `;
          }
        }

        return Response.json({
          status: newStatus,
          subscriptionId: contractor.stripe_subscription_id,
          endDate: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null,
        });
      } catch (error) {
        console.error("Error fetching subscription from Stripe:", error);
      }
    }

    return Response.json({
      status: contractor.subscription_status || "basic",
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    return Response.json(
      { error: "Failed to get subscription status" },
      { status: 500 },
    );
  }
}
