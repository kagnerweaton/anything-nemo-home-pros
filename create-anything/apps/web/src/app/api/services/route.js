import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    const services = await sql`
      SELECT id, name, parent_category
      FROM services
      ORDER BY parent_category, name
    `;

    // Group by parent category
    const grouped = {};
    services.forEach((service) => {
      const category = service.parent_category || "Other";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(service);
    });

    return Response.json({ services, grouped });
  } catch (error) {
    console.error("Get services error:", error);
    return Response.json({ error: "Failed to get services" }, { status: 500 });
  }
}
