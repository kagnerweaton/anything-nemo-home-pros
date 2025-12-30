import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contractorId, description, logoUrl, primaryServiceId } = body;

    if (!contractorId) {
      return Response.json(
        { error: "Contractor ID required" },
        { status: 400 },
      );
    }

    // Verify ownership
    const contractors = await sql`
      SELECT id, user_id
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

    // Build update query
    const setClauses = [];
    const values = [];
    let paramCount = 0;

    if (description !== undefined) {
      paramCount++;
      setClauses.push(`description = $${paramCount}`);
      values.push(description);
    }

    if (logoUrl !== undefined) {
      paramCount++;
      setClauses.push(`logo_url = $${paramCount}`);
      values.push(logoUrl);
    }

    if (setClauses.length > 0) {
      paramCount++;
      setClauses.push(`updated_at = NOW()`);
      const updateQuery = `
        UPDATE contractors
        SET ${setClauses.join(", ")}
        WHERE id = $${paramCount}
      `;
      values.push(parseInt(contractorId));
      await sql(updateQuery, values);
    }

    // Update primary service if provided
    if (primaryServiceId) {
      // Remove all primary flags
      await sql`
        UPDATE contractor_services
        SET is_primary = false
        WHERE contractor_id = ${parseInt(contractorId)}
      `;

      // Set new primary
      await sql`
        UPDATE contractor_services
        SET is_primary = true
        WHERE contractor_id = ${parseInt(contractorId)}
        AND service_id = ${parseInt(primaryServiceId)}
      `;
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Update contractor error:", error);
    return Response.json(
      { error: "Failed to update contractor" },
      { status: 500 },
    );
  }
}
