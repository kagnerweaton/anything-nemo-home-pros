import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const contractors = await sql`
      SELECT 
        c.id, c.name, c.phone, c.address, c.city, c.state, c.zip,
        c.description, c.logo_url, c.claimed, c.subscription_status,
        c.user_id
      FROM contractors c
      WHERE c.id = ${parseInt(id)}
      LIMIT 1
    `;

    if (contractors.length === 0) {
      return Response.json({ error: "Contractor not found" }, { status: 404 });
    }

    const contractor = contractors[0];

    // Get services
    const services = await sql`
      SELECT s.id, s.name, cs.is_primary
      FROM services s
      JOIN contractor_services cs ON s.id = cs.service_id
      WHERE cs.contractor_id = ${parseInt(id)}
      ORDER BY cs.is_primary DESC, s.name
    `;

    // Get photos (only if Pro)
    let photos = [];
    if (contractor.subscription_status === "pro") {
      photos = await sql`
        SELECT id, photo_url
        FROM contractor_photos
        WHERE contractor_id = ${parseInt(id)}
        ORDER BY created_at DESC
      `;
    }

    return Response.json({
      contractor: {
        ...contractor,
        services,
        photos,
      },
    });
  } catch (error) {
    console.error("Get contractor error:", error);
    return Response.json(
      { error: "Failed to get contractor" },
      { status: 500 },
    );
  }
}
