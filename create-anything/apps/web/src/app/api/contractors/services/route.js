import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contractorId, serviceIds } = body;

    if (!contractorId || !serviceIds || !Array.isArray(serviceIds)) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    // Verify ownership and Pro status
    const contractors = await sql`
      SELECT id, user_id, subscription_status
      FROM contractors
      WHERE id = ${parseInt(contractorId)}
      LIMIT 1
    `;

    if (contractors.length === 0) {
      return Response.json({ error: "Contractor not found" }, { status: 404 });
    }

    if (contractors[0].user_id !== session.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (contractors[0].subscription_status !== "pro") {
      return Response.json(
        { error: "Pro subscription required" },
        { status: 403 },
      );
    }

    // Add services (ignore duplicates)
    for (const serviceId of serviceIds) {
      await sql`
        INSERT INTO contractor_services (contractor_id, service_id)
        VALUES (${parseInt(contractorId)}, ${parseInt(serviceId)})
        ON CONFLICT (contractor_id, service_id) DO NOTHING
      `;
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Add services error:", error);
    return Response.json({ error: "Failed to add services" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contractorId, serviceId } = body;

    if (!contractorId || !serviceId) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    // Verify ownership
    const contractors = await sql`
      SELECT id, user_id
      FROM contractors
      WHERE id = ${parseInt(contractorId)}
      LIMIT 1
    `;

    if (
      contractors.length === 0 ||
      contractors[0].user_id !== session.user.id
    ) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Don't allow removing the primary service
    const service = await sql`
      SELECT is_primary
      FROM contractor_services
      WHERE contractor_id = ${parseInt(contractorId)}
      AND service_id = ${parseInt(serviceId)}
      LIMIT 1
    `;

    if (service.length > 0 && service[0].is_primary) {
      return Response.json(
        { error: "Cannot remove primary service" },
        { status: 400 },
      );
    }

    await sql`
      DELETE FROM contractor_services
      WHERE contractor_id = ${parseInt(contractorId)}
      AND service_id = ${parseInt(serviceId)}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Remove service error:", error);
    return Response.json(
      { error: "Failed to remove service" },
      { status: 500 },
    );
  }
}
