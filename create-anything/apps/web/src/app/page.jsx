import { useState, useEffect } from "react";

export default function HomePage() {
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [services, setServices] = useState({});
  const [allServicesList, setAllServicesList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [zipCode, setZipCode] = useState("");
  const [error, setError] = useState("");

  // Results state
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(35);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const cities = ["Chillicothe", "Kirksville", "Moberly", "Hannibal"];

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        setServices(data.grouped || {});
        setAllServicesList(data.services || []);
      })
      .catch((err) => console.error("Failed to load services:", err));
  }, []);

  // Auto-search when filters change
  useEffect(() => {
    if (!hasSearched) return;
    if (selectedServices.length === 0 && selectedCities.length === 0) {
      setContractors([]);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    if (selectedServices.length > 0)
      params.set("services", selectedServices.join(","));
    if (zipCode && zipCode.length === 5) params.set("zip", zipCode);
    if (selectedCities.length > 0)
      params.set("cities", selectedCities.join(","));
    params.set("radius", radius);

    fetch(`/api/contractors/search?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setContractors(data.contractors || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedServices, selectedCities, radius, zipCode, hasSearched]);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setShowServiceModal(false);
    setError("");
    setSelectedServices([String(service.id)]);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setError("");

    if (!selectedService) {
      setError("Please select a service");
      return;
    }

    if (!zipCode || zipCode.length !== 5) {
      setError("Please enter a valid 5-digit zip code");
      return;
    }

    setSelectedServices([String(selectedService.id)]);
    setHasSearched(true);
  };

  const handleTextSearch = () => {
    if (!searchText.trim()) return;

    const match = allServicesList.find((s) =>
      s.name.toLowerCase().includes(searchText.toLowerCase()),
    );

    if (match) {
      handleServiceSelect(match);
      setSearchText("");
    } else {
      setError(`Sorry, "${searchText}" is not available on nemohomepros.com`);
    }
  };

  const toggleService = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  const toggleCity = (city) => {
    setSelectedCities((prev) =>
      prev.includes(city.toLowerCase())
        ? prev.filter((c) => c !== city.toLowerCase())
        : [...prev, city.toLowerCase()],
    );
  };

  const resetSearch = () => {
    setSelectedService(null);
    setZipCode("");
    setSelectedServices([]);
    setSelectedCities([]);
    setHasSearched(false);
    setContractors([]);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Header */}
      <header className="border-b border-[#FFD700] bg-[#000000] py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="h-12 w-12" viewBox="0 0 100 100" fill="none">
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
              <h1 className="text-2xl font-bold text-[#FFD700]">
                NEMO Home Pros
              </h1>
            </div>
            <a
              href="/account/signin"
              className="rounded bg-[#FFD700] px-4 py-2 font-semibold text-[#000000] hover:bg-[#FFC700]"
            >
              Contractor Sign In
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left Sidebar - Search & Filters */}
          <aside className="w-full lg:w-80">
            {/* Search Section */}
            <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Find Contractors
              </h2>

              <form onSubmit={handleSearch} className="space-y-4">
                {/* Service Selection */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    What service do you need?
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowServiceModal(true)}
                    className="w-full rounded border-2 border-gray-300 bg-white px-4 py-3 text-left hover:border-[#FFD700] focus:border-[#FFD700] focus:outline-none"
                  >
                    {selectedService ? (
                      <span className="font-medium text-gray-900">
                        {selectedService.name}
                      </span>
                    ) : (
                      <span className="text-gray-500">Select a service...</span>
                    )}
                  </button>

                  <div className="mt-2 text-sm text-gray-600">
                    Or type to search:
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), handleTextSearch())
                        }
                        placeholder="e.g., plumber..."
                        className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-[#FFD700] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleTextSearch}
                        className="rounded bg-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-300"
                      >
                        Go
                      </button>
                    </div>
                  </div>
                </div>

                {/* Zip Code */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Enter your zip code
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) =>
                      setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))
                    }
                    placeholder="5-digit zip code"
                    className="w-full rounded border-2 border-gray-300 px-4 py-3 focus:border-[#FFD700] focus:outline-none"
                    maxLength={5}
                  />
                </div>

                {error && (
                  <div className="rounded bg-red-100 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded bg-[#FFD700] px-6 py-3 font-bold text-[#000000] hover:bg-[#FFC700] focus:outline-none focus:ring-4 focus:ring-[#FFD700]"
                >
                  Search
                </button>

                {hasSearched && (
                  <button
                    type="button"
                    onClick={resetSearch}
                    className="w-full rounded border-2 border-gray-300 px-6 py-2 font-medium text-gray-700 hover:bg-gray-50"
                  >
                    New Search
                  </button>
                )}
              </form>
            </div>

            {/* Filters - Only show after initial search */}
            {hasSearched && (
              <div className="rounded-lg bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-bold text-gray-900">
                  Refine Results
                </h3>

                {/* Radius Filter */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Search Radius: {radius} miles
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>10 mi</span>
                    <span>100 mi</span>
                  </div>
                </div>

                {/* City Filters */}
                <div className="mb-6">
                  <h4 className="mb-2 text-sm font-semibold text-gray-700">
                    Location
                  </h4>
                  {cities.map((city) => (
                    <label key={city} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={selectedCities.includes(city.toLowerCase())}
                        onChange={() => toggleCity(city)}
                        className="h-4 w-4 rounded border-gray-300 text-[#FFD700] focus:ring-[#FFD700]"
                      />
                      <span className="text-sm text-gray-700">{city}</span>
                    </label>
                  ))}
                </div>

                {/* Service Filters */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-gray-700">
                    Services
                  </h4>
                  <div className="max-h-96 overflow-y-auto">
                    {Object.entries(services).map(
                      ([category, categoryServices]) => (
                        <div key={category} className="mb-3">
                          <p className="mb-1 text-xs font-medium text-gray-500">
                            {category}
                          </p>
                          {categoryServices.map((service) => (
                            <label
                              key={service.id}
                              className="flex items-center gap-2 py-1"
                            >
                              <input
                                type="checkbox"
                                checked={selectedServices.includes(
                                  String(service.id),
                                )}
                                onChange={() =>
                                  toggleService(String(service.id))
                                }
                                className="h-4 w-4 rounded border-gray-300 text-[#FFD700] focus:ring-[#FFD700]"
                              />
                              <span className="text-sm text-gray-700">
                                {service.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Right Side - Results or Welcome */}
          <div className="flex-1">
            {!hasSearched ? (
              /* Welcome Message */
              <div className="text-center py-16">
                <h2 className="mb-4 text-4xl font-bold text-[#FFD700] md:text-5xl">
                  Find Trusted Contractors in Northeast Missouri
                </h2>
                <p className="mb-8 text-lg text-gray-300">
                  Connect with local home service professionals in your area
                </p>
                <div className="mx-auto max-w-2xl rounded-lg bg-white/10 p-8">
                  <p className="text-gray-300">
                    Select a service and enter your zip code to get started.
                    We'll show you contractors within 35 miles of your location.
                    You can then refine your search by adjusting the radius,
                    selecting specific cities, or choosing multiple services.
                  </p>
                </div>
              </div>
            ) : (
              /* Results Section */
              <div className="rounded-lg bg-gray-50 p-6">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">
                  {loading
                    ? "Searching..."
                    : `${contractors.length} Contractor${contractors.length !== 1 ? "s" : ""} Found`}
                </h2>

                {loading ? (
                  <div className="text-center py-12 text-gray-500">
                    Loading...
                  </div>
                ) : contractors.length === 0 ? (
                  <div className="rounded-lg bg-white p-8 text-center shadow">
                    <p className="text-gray-600">
                      No contractors found. Try adjusting your filters or search
                      radius.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {contractors.map((contractor) => (
                      <a
                        key={contractor.id}
                        href={`/contractor/${contractor.id}`}
                        className="block rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
                      >
                        <div className="flex items-start gap-4">
                          {contractor.logo_url ? (
                            <img
                              src={contractor.logo_url}
                              alt={contractor.name}
                              className="h-16 w-16 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded bg-[#FFD700]">
                              <svg
                                className="h-10 w-10"
                                viewBox="0 0 100 100"
                                fill="none"
                              >
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
                            <h3 className="mb-1 text-lg font-bold text-gray-900">
                              {contractor.name}
                            </h3>
                            {contractor.phone && (
                              <p className="mb-2 text-sm text-gray-600">
                                {contractor.phone}
                              </p>
                            )}
                            {contractor.address && (
                              <p className="mb-2 text-sm text-gray-500">
                                {contractor.address}, {contractor.city},{" "}
                                {contractor.state} {contractor.zip}
                              </p>
                            )}
                            {contractor.services &&
                              contractor.services.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {contractor.services
                                    .slice(0, 3)
                                    .map((service, idx) => (
                                      <span
                                        key={idx}
                                        className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
                                      >
                                        {service}
                                      </span>
                                    ))}
                                </div>
                              )}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Service Selection Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Select a Service
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {Object.entries(services).map(([category, categoryServices]) => (
                <div key={category}>
                  <h4 className="mb-2 font-semibold text-gray-700">
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {categoryServices.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleServiceSelect(service)}
                        className="rounded border border-gray-200 px-4 py-2 text-left hover:border-[#FFD700] hover:bg-[#FFFBEA]"
                      >
                        {service.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
