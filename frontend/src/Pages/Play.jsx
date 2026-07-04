import React from "react";
import {
  PlayCircle,
  Trophy,
  Gamepad2,
  Star,
  Timer,
  Tractor,
} from "lucide-react";

const games = [
  {
    id: 1,
    title: "Tractor Racing",
    level: "Easy",
    score: "4.9",
    image:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854",
  },

  {
    id: 2,
    title: "Crop Challenge",
    level: "Medium",
    score: "4.8",
    image:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399",
  },

  {
    id: 3,
    title: "Farm Builder",
    level: "Hard",
    score: "5.0",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  },
];

export default function Play() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50">

      {/* Hero Section */}
      <div className="relative h-[70vh] overflow-hidden">

        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854"
          alt="Gaming"
          className="absolute w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center text-white px-6">

          <div className="bg-green-500/20 backdrop-blur-lg px-6 py-3 rounded-full border border-green-300/20 mb-6 flex items-center gap-3">

            <Gamepad2 size={28} />

            <span className="font-semibold text-lg">
              Smart Farming Games
            </span>

          </div>

          <h1 className="text-6xl md:text-7xl font-black leading-tight">

            Play & Learn <br />
            Smart Farming

          </h1>

          <p className="max-w-3xl mt-6 text-lg text-gray-200 leading-8">

            Enjoy agriculture-based games, farming simulations
            and tractor challenges while learning smart farming.

          </p>

          <button className="mt-10 bg-yellow-500 hover:bg-yellow-600 text-black px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl flex items-center gap-3 transition">

            <PlayCircle size={28} />

            Start Playing

          </button>
        </div>
      </div>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-8 py-20">

        <div className="grid md:grid-cols-4 gap-8">

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center hover:-translate-y-2 transition">

            <Gamepad2
              size={50}
              className="mx-auto text-green-600"
            />

            <h2 className="text-5xl font-black mt-5">
              25+
            </h2>

            <p className="text-gray-500 mt-3 text-lg">
              Farming Games
            </p>

          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center hover:-translate-y-2 transition">

            <Trophy
              size={50}
              className="mx-auto text-yellow-500"
            />

            <h2 className="text-5xl font-black mt-5">
              10K+
            </h2>

            <p className="text-gray-500 mt-3 text-lg">
              Players
            </p>

          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center hover:-translate-y-2 transition">

            <Star
              size={50}
              className="mx-auto text-pink-500"
            />

            <h2 className="text-5xl font-black mt-5">
              4.9
            </h2>

            <p className="text-gray-500 mt-3 text-lg">
              User Rating
            </p>

          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center hover:-translate-y-2 transition">

            <Timer
              size={50}
              className="mx-auto text-blue-500"
            />

            <h2 className="text-5xl font-black mt-5">
              Daily
            </h2>

            <p className="text-gray-500 mt-3 text-lg">
              Challenges
            </p>

          </div>

        </div>
      </section>

      {/* Games */}
      <section className="max-w-7xl mx-auto px-8 pb-24">

        <div className="flex justify-between items-center mb-14">

          <div>

            <h2 className="text-5xl font-black text-green-900">
              Featured Games
            </h2>

            <p className="text-gray-600 mt-4 text-lg">
              Fun farming experiences for everyone
            </p>

          </div>

          <button className="hidden md:flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-2xl text-lg font-semibold shadow-xl transition">

            View All Games

          </button>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-10">

          {games.map((game) => (

            <div
              key={game.id}
              className="group bg-white rounded-3xl overflow-hidden shadow-2xl hover:-translate-y-3 transition duration-500"
            >

              {/* Image */}
              <div className="overflow-hidden relative">

                <img
                  src={game.image}
                  alt={game.title}
                  className="h-80 w-full object-cover group-hover:scale-110 transition duration-700"
                />

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">

                  <button className="bg-white/20 backdrop-blur-lg p-6 rounded-full border border-white/30 hover:scale-110 transition">

                    <PlayCircle
                      size={60}
                      className="text-white"
                    />

                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-7">

                <div className="flex justify-between items-center">

                  <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold">
                    {game.level}
                  </span>

                  <div className="flex items-center gap-1">

                    <Star
                      size={18}
                      className="text-yellow-500 fill-yellow-500"
                    />

                    <span className="font-bold">
                      {game.score}
                    </span>

                  </div>
                </div>

                <h3 className="text-3xl font-black mt-6">
                  {game.title}
                </h3>

                <p className="text-gray-500 mt-4 leading-7">

                  Experience smart farming simulation
                  and exciting agriculture gameplay.

                </p>

                <button className="w-full mt-8 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-2xl text-lg font-bold shadow-lg flex items-center justify-center gap-3 transition">

                  <Tractor size={24} />

                  Play Now

                </button>
              </div>
            </div>

          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-900 text-white py-24 px-8 text-center">

        <Gamepad2
          size={70}
          className="mx-auto text-yellow-400"
        />

        <h2 className="text-5xl font-black mt-8">
          Ready To Play Smart Farming Games?
        </h2>

        <p className="text-green-100 text-xl mt-6 max-w-3xl mx-auto leading-9">

          Join thousands of farmers and players
          exploring agriculture through interactive
          games and farming simulations.

        </p>

        <button className="mt-12 bg-yellow-500 hover:bg-yellow-600 text-black px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl transition">

          Start Gaming

        </button>
      </section>
    </div>
  );
}