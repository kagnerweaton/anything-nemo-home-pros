import sql from "@/app/api/utils/sql";

// Simple zip code centroids for major cities in Northeast Missouri
const ZIP_CENTROIDS = {
  // Chillicothe area
  64601: { lat: 39.7953, lng: -93.5527 },
  // Kirksville area
  63501: { lat: 40.1948, lng: -92.5832 },
  // Moberly area
  65270: { lat: 39.4186, lng: -92.4382 },
  // Hannibal area
  63401: { lat: 39.7084, lng: -91.3585 },
};

// Haversine formula to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceIds = searchParams.get("services"); // comma-separated service IDs
    const zip = searchParams.get("zip");
    const radius = parseInt(searchParams.get("radius") || "35");
    const cities = searchParams.get("cities"); // comma-separated city names

    if (!serviceIds && !cities) {
      return Response.json(
        { error: "Service or city filter required" },
        { status: 400 },
      );
    }

    // Get centroid for the zip code
    let userLat, userLng;
    if (zip && ZIP_CENTROIDS[zip]) {
      userLat = ZIP_CENTROIDS[zip].lat;
      userLng = ZIP_CENTROIDS[zip].lng;
    } else if (zip) {
      // For simplicity, we'll use a basic centroid calculation
      // In production, you'd use a proper geocoding service
      return Response.json(
        { error: "Zip code not found in our service area" },
        { status: 404 },
      );
    }

    // Build the query
    let query = `
      SELECT DISTINCT 
        c.id, c.name, c.phone, c.address, c.city, c.state, c.zip, 
        c.lat, c.lng, c.description, c.logo_url, c.subscription_status,
        array_agg(DISTINCT s.name) as services
      FROM contractors c
      LEFT JOIN contractor_services cs ON c.id = cs.contractor_id
      LEFT JOIN services s ON cs.service_id = s.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 0;

    // Filter by services
    if (serviceIds) {
      const serviceIdArray = serviceIds.split(",").map((id) => parseInt(id));
      paramCount++;
      query += ` AND cs.service_id = ANY($${paramCount})`;
      values.push(serviceIdArray);
    }

    // Filter by cities
    if (cities) {
      const cityArray = cities.split(",");
      paramCount++;
      query += ` AND LOWER(c.city) = ANY($${paramCount})`;
      values.push(cityArray.map((city) => city.toLowerCase()));
    }

    query += ` GROUP BY c.id ORDER BY c.name`;

    const contractors = await sql(query, values);

    // Filter by radius if zip provided
    let filteredContractors = contractors;
    if (zip && userLat && userLng) {
      filteredContractors = contractors.filter((contractor) => {
        if (!contractor.lat || !contractor.lng) return false;
        const distance = calculateDistance(
          userLat,
          userLng,
          parseFloat(contractor.lat),
          parseFloat(contractor.lng),
        );
        return distance <= radius;
      });
    }

    return Response.json({ contractors: filteredContractors });
  } catch (error) {
    console.error("Search error:", error);
    return Response.json(
      { error: "Failed to search contractors" },
      { status: 500 },
    );
  }
}
