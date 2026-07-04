import { useEffect, useState } from "react";
import api, { formatPrice, getPrimaryImage, unwrapPage } from "../services/api";

export default function WaterSupply() {
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getData() {
      try {
        setIsLoading(true);
        const res = await api.get("/products/search", {
          params: { keyword: "water", size: 24 },
        });
        setAllProducts(unwrapPage(res));
      } catch (error) {
        console.error("Failed to load water services:", error);
      } finally {
        setIsLoading(false);
      }
    }

    getData();
  }, []);

  return (
    <div className="bg-blue-100 min-h-screen p-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-blue-800">
          Water Supply Services
        </h1>
        <p className="text-gray-600 mt-2">
          Drinking Water | Farm Irrigation | Tank Supply | Borewell Water
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center">
            <h2 className="text-2xl font-bold text-blue-800">
              Loading Water Services...
            </h2>
          </div>
        ) : allProducts.length === 0 ? (
          <p className="text-center text-gray-600 col-span-full">
            No water service listings available yet.
          </p>
        ) : (
          allProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition"
            >
              <img
                src={getPrimaryImage(p)}
                alt={p.productName || "Water service"}
                className="h-52 w-full object-cover"
              />

              <div className="p-4">
                <h3 className="font-bold text-lg">{p.productName}</h3>

                <h4 className="text-sm text-gray-500">
                  {p.categoryName || p.subcategoryName || "Water Service"}
                </h4>

                <p className="text-blue-700 font-bold text-xl mt-3">
                  {formatPrice(p.price)}
                </p>

                <div className="flex gap-3 mt-4">
                  <button className="bg-blue-700 text-white px-4 py-2 rounded-lg">
                    Book Water
                  </button>

                  <button className="border border-blue-700 text-blue-700 px-4 py-2 rounded-lg">
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
