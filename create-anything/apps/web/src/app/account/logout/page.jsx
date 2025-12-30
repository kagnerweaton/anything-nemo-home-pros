import useAuth from "@/utils/useAuth";

export default function LogoutPage() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#000000] p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl text-center">
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
        <h1 className="mb-6 text-2xl font-bold text-[#000000]">Sign Out</h1>

        <button
          onClick={handleSignOut}
          className="w-full rounded bg-[#FFD700] px-4 py-3 font-semibold text-[#000000] transition-colors hover:bg-[#FFC700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:ring-offset-2"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
