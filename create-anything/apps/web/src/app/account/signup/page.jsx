import { useState } from "react";
import useAuth from "@/utils/useAuth";

export default function SignUpPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signUpWithCredentials } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      await signUpWithCredentials({
        email,
        password,
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      setError("This email may already be registered. Try signing in instead.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#000000] p-4">
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl"
      >
        <div className="mb-6 text-center">
          <svg
            className="mx-auto mb-4 h-16 w-16"
            viewBox="0 0 100 100"
            fill="none"
          >
            <rect
              x="10"
              y="40"
              width="80"
              height="50"
              fill="#FFD700"
              stroke="#000"
              strokeWidth="2"
            />
            <path
              d="M10 40 L50 10 L90 40"
              fill="#FFD700"
              stroke="#000"
              strokeWidth="2"
            />
            <rect x="40" y="60" width="20" height="30" fill="#000" />
          </svg>
          <h1 className="text-2xl font-bold text-[#000000]">Create Account</h1>
          <p className="mt-2 text-sm text-gray-600">Join NEMO Home Pros</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              required
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded border border-gray-300 px-4 py-2 focus:border-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              required
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-4 py-2 focus:border-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
              placeholder="Create a password (min 6 characters)"
            />
          </div>

          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-[#FFD700] px-4 py-3 font-semibold text-[#000000] transition-colors hover:bg-[#FFC700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a
              href={`/account/signin${typeof window !== "undefined" ? window.location.search : ""}`}
              className="font-medium text-[#000000] hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
