import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";

export default function ContractorPage({ params }) {
  const { data: user } = useUser();
  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");

  const contractorId = params.id;

  useEffect(() => {
    fetch(`/api/contractors/${contractorId}`)
      .then((res) => res.json())
      .then((data) => {
        setContractor(data.contractor);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [contractorId]);

  const handleClaim = async () => {
    if (!user) {
      window.location.href = `/account/signup?callbackUrl=/contractor/${contractorId}`;
      return;
    }

    setClaiming(true);
    setClaimError("");

    try {
      const res = await fetch("/api/contractors/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractorId }),
      });

      if (res.ok) {
        window.location.href = `/dashboard/${contractorId}`;
      } else {
        const data = await res.json();
        setClaimError(data.error || "Failed to claim page");
        setClaiming(false);
      }
    } catch (error) {
      setClaimError("Failed to claim page");
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Contractor not found</p>
      </div>
    );
  }

  const isOwner = user && contractor.user_id === user.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <a href="/" className="flex items-center gap-3">
            <svg className="h-10 w-10" viewBox="0 0 100 100" fill="none">
              <rect
                x="10"
                y="40"
                width="80"
                height="50"
                fill="#FFD700"
                stroke="#FFD700"
                strokeWidth="2"
              />
              <path
                d="M10 40 L50 10 L90 40"
                fill="#FFD700"
                stroke="#FFD700"
                strokeWidth="2"
              />
              <rect x="40" y="60" width="20" height="30" fill="#000" />
            </svg>
            <h1 className="text-xl font-bold text-[#000000]">NEMO Home Pros</h1>
          </a>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header Section */}
          <div className="mb-6 rounded-lg bg-white p-8 shadow">
            <div className="flex items-start gap-6">
              {contractor.logo_url ? (
                <img
                  src={contractor.logo_url}
                  alt={contractor.name}
                  className="h-24 w-24 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-[#FFD700]">
                  <svg className="h-16 w-16" viewBox="0 0 100 100" fill="none">
                    <rect
                      x="10"
                      y="40"
                      width="80"
                      height="50"
                      fill="#000"
                      stroke="#000"
                      strokeWidth="2"
                    />
                    <path
                      d="M10 40 L50 10 L90 40"
                      fill="#000"
                      stroke="#000"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <h1 className="mb-2 text-3xl font-bold text-gray-900">
                  {contractor.name}
                </h1>
                {contractor.phone && (
                  <p className="mb-1 text-lg text-gray-700">
                    <span className="font-semibold">Phone:</span>{" "}
                    {contractor.phone}
                  </p>
                )}
                {contractor.address && (
                  <p className="text-gray-600">
                    {contractor.address}, {contractor.city}, {contractor.state}{" "}
                    {contractor.zip}
                  </p>
                )}
              </div>
            </div>

            {/* Claim Button */}
            {!contractor.claimed && !isOwner && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="rounded-lg bg-[#FFFBEA] p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">
                    Is this your business?
                  </h3>
                  <p className="mb-4 text-sm text-gray-700">
                    Claim this page to add a description, update your logo, and
                    more!
                  </p>
                  <button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="rounded bg-[#FFD700] px-6 py-2 font-semibold text-[#000000] hover:bg-[#FFC700] disabled:opacity-50"
                  >
                    {claiming ? "Claiming..." : "Claim This Page"}
                  </button>
                  {claimError && (
                    <p className="mt-2 text-sm text-red-600">{claimError}</p>
                  )}
                </div>
              </div>
            )}

            {/* Edit Button for Owner */}
            {isOwner && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <a
                  href={`/dashboard/${contractorId}`}
                  className="inline-block rounded bg-[#FFD700] px-6 py-2 font-semibold text-[#000000] hover:bg-[#FFC700]"
                >
                  Edit Your Page
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          {contractor.description && (
            <div className="mb-6 rounded-lg bg-white p-8 shadow">
              <h2 className="mb-4 text-xl font-bold text-gray-900">About</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {contractor.description}
              </p>
            </div>
          )}

          {/* Services */}
          {contractor.services && contractor.services.length > 0 && (
            <div className="mb-6 rounded-lg bg-white p-8 shadow">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Services</h2>
              <div className="flex flex-wrap gap-2">
                {contractor.services.map((service) => (
                  <span
                    key={service.id}
                    className={`rounded px-3 py-1 text-sm font-medium ${
                      service.is_primary
                        ? "bg-[#FFD700] text-[#000000]"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {service.name}
                    {service.is_primary && " (Primary)"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {contractor.photos && contractor.photos.length > 0 && (
            <div className="mb-6 rounded-lg bg-white p-8 shadow">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Photos</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {contractor.photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.photo_url}
                    alt="Work sample"
                    className="h-48 w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
