import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import useUpload from "@/utils/useUpload";

export default function DashboardPage({ params }) {
  const { data: user, loading: userLoading } = useUser();
  const [upload, { loading: uploading }] = useUpload();
  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState("");
  const [primaryServiceId, setPrimaryServiceId] = useState("");
  const [allServices, setAllServices] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState("basic");
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  const contractorId = params.id;

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      window.location.href = `/account/signin?callbackUrl=/dashboard/${contractorId}`;
      return;
    }

    Promise.all([
      fetch(`/api/contractors/${contractorId}`).then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
    ])
      .then(([contractorData, servicesData]) => {
        if (contractorData.contractor.user_id !== user.id) {
          window.location.href = "/";
          return;
        }
        setContractor(contractorData.contractor);
        setDescription(contractorData.contractor.description || "");
        setPrimaryServiceId(
          contractorData.contractor.services?.find((s) => s.is_primary)?.id ||
            "",
        );
        setAllServices(servicesData.services || []);
        setSubscriptionStatus(
          contractorData.contractor.subscription_status || "basic",
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [contractorId, user, userLoading]);

  const checkSubscription = async () => {
    setCheckingSubscription(true);
    try {
      const res = await fetch("/api/stripe/subscription-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractorId }),
      });
      const data = await res.json();
      setSubscriptionStatus(data.status);
      if (data.status === "pro") {
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
    }
    setCheckingSubscription(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/contractors/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractorId,
          description,
          primaryServiceId: primaryServiceId
            ? parseInt(primaryServiceId)
            : null,
        }),
      });
      alert("Changes saved!");
    } catch (error) {
      alert("Failed to save changes");
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await upload({ reactNativeAsset: { file } });
    if (result.url) {
      await fetch("/api/contractors/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractorId, logoUrl: result.url }),
      });
      window.location.reload();
    }
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractorId,
          redirectURL: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank", "popup");
        setTimeout(() => checkSubscription(), 3000);
      }
    } catch (error) {
      alert("Failed to start upgrade process");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("session_id")) {
        checkSubscription();
      }
    }
  }, []);

  if (loading || userLoading) {
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

  const isPro = subscriptionStatus === "pro";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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
              <h1 className="text-xl font-bold text-[#000000]">
                NEMO Home Pros Dashboard
              </h1>
            </div>
            <div className="flex gap-3">
              <a
                href={`/contractor/${contractorId}`}
                className="rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                View Public Page
              </a>
              <a
                href="/account/logout"
                className="rounded bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
              >
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Subscription Status */}
          <div
            className={`mb-6 rounded-lg p-6 shadow ${isPro ? "bg-[#FFD700]" : "bg-white"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isPro ? "⭐ Pro Account" : "Basic Account"}
                </h2>
                <p className="mt-1 text-sm text-gray-700">
                  {isPro
                    ? "You have access to all features including photos and multiple service categories"
                    : "Upgrade to Pro to add photos and list multiple services"}
                </p>
              </div>
              {!isPro && (
                <button
                  onClick={handleUpgrade}
                  className="rounded bg-[#000000] px-6 py-3 font-bold text-[#FFD700] hover:bg-gray-800"
                >
                  Upgrade to Pro - $10/mo
                </button>
              )}
              {checkingSubscription && (
                <p className="text-sm text-gray-600">
                  Checking subscription...
                </p>
              )}
            </div>
          </div>

          {/* Basic Info Editor */}
          <div className="mb-6 rounded-lg bg-white p-8 shadow">
            <h3 className="mb-6 text-xl font-bold text-gray-900">
              Basic Information
            </h3>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Logo / Profile Image
                </label>
                <div className="flex items-center gap-4">
                  {contractor.logo_url ? (
                    <img
                      src={contractor.logo_url}
                      alt="Logo"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-200">
                      <span className="text-xs text-gray-500">No logo</span>
                    </div>
                  )}
                  <label className="cursor-pointer rounded bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300">
                    {uploading ? "Uploading..." : "Upload New Logo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full rounded border border-gray-300 px-4 py-2 focus:border-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  placeholder="Tell customers about your business..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Primary Service Category
                </label>
                <select
                  value={primaryServiceId}
                  onChange={(e) => setPrimaryServiceId(e.target.value)}
                  className="w-full rounded border border-gray-300 px-4 py-2 focus:border-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                >
                  <option value="">Select primary service...</option>
                  {allServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded bg-[#FFD700] px-6 py-3 font-bold text-[#000000] hover:bg-[#FFC700] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Pro Features Preview */}
          {!isPro && (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
              <div className="text-center">
                <h3 className="mb-2 text-xl font-bold text-gray-900">
                  🔒 Pro Features
                </h3>
                <p className="mb-6 text-gray-600">
                  Upgrade to Pro for $10/month to unlock these features:
                </p>
                <div className="mb-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <h4 className="mb-2 font-semibold text-gray-900">
                      📸 Photo Gallery
                    </h4>
                    <p className="text-sm text-gray-600">
                      Showcase your work with unlimited photos
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <h4 className="mb-2 font-semibold text-gray-900">
                      🏷️ Multiple Services
                    </h4>
                    <p className="text-sm text-gray-600">
                      Appear in searches for all the services you offer
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleUpgrade}
                  className="rounded bg-[#FFD700] px-8 py-3 font-bold text-[#000000] hover:bg-[#FFC700]"
                >
                  Upgrade Now - $10/month
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
