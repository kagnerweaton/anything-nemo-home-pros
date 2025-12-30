import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request) {
  try {
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

    // Check if contractor exists and is not already claimed
    const contractors = await sql`
      SELECT id, claimed, user_id
      FROM contractors
      WHERE id = ${parseInt(contractorId)}
      LIMIT 1
    `;

    if (contractors.length === 0) {
      return Response.json({ error: "Contractor not found" }, { status: 404 });
    }

    if (contractors[0].claimed) {
      return Response.json(
        { error: "Contractor already claimed" },
        { status: 400 },
      );
    }

    // Claim the contractor
    await sql`
      UPDATE contractors
      SET claimed = true, user_id = ${session.user.id}, updated_at = NOW()
      WHERE id = ${parseInt(contractorId)}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Claim contractor error:", error);
    return Response.json(
      { error: "Failed to claim contractor" },
      { status: 500 },
    );
  }
}
