import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contractorId, photoUrl } = body;

    if (!contractorId || !photoUrl) {
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

    // Add photo
    const result = await sql`
      INSERT INTO contractor_photos (contractor_id, photo_url)
      VALUES (${parseInt(contractorId)}, ${photoUrl})
      RETURNING id, photo_url
    `;

    return Response.json({ photo: result[0] });
  } catch (error) {
    console.error("Add photo error:", error);
    return Response.json({ error: "Failed to add photo" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { photoId, contractorId } = body;

    if (!photoId || !contractorId) {
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

    await sql`
      DELETE FROM contractor_photos
      WHERE id = ${parseInt(photoId)}
      AND contractor_id = ${parseInt(contractorId)}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete photo error:", error);
    return Response.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
