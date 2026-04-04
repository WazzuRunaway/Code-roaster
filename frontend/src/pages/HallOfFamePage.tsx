export default function HallOfFamePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-2">🏆 Hall of Fame</h1>
      <p className="text-gray-400 text-center mb-8">Coming soon...</p>

      <div className="max-w-md mx-auto text-center mt-16">
        <div className="bg-gray-800 rounded-lg p-8 space-y-4">
          <div className="text-6xl">🚧</div>
          <h2 className="text-2xl font-bold text-gray-300">Under Construction</h2>
          <p className="text-gray-500">
            The Hall of Fame will feature ranked roasts, community voting, and legendary worst code.
          </p>
          <p className="text-gray-600 text-sm">Check back later!</p>
        </div>
      </div>
    </div>
  );
}
