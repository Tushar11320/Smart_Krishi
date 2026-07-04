import React, { useState, useEffect } from "react";
import api, { formatPrice } from "../../services/api";
import { Calendar, CreditCard, AlertCircle } from "lucide-react";

export default function MachineryRentals() {
  const [user, setUser] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchBuyerRentals(parsed.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchBuyerRentals = async (userId) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get(`/machinery/bookings/buyer/${userId}`);
      const list = response.data?.data || response.data || [];
      setRentals(list);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to fetch rental history.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-150 shadow">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Loading your rental bookings...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-green-100 shadow-lg space-y-6 animate-fadeIn">
      <div>
        <h3 className="text-2xl font-black text-green-950 flex items-center gap-2">
          <Calendar className="text-green-600" size={24} />
          My Machinery Rentals
        </h3>
        <p className="text-xs text-gray-400 font-bold mt-1">Track your machinery hire reservations, check-in schedules, and return status.</p>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3 font-medium text-sm">
          <AlertCircle className="text-red-600" size={20} />
          {errorMessage}
        </div>
      )}

      {rentals.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <h4 className="text-lg font-bold text-gray-700">No rental bookings yet</h4>
          <p className="text-sm text-gray-400 mt-1">Need farm equipment or machinery? Head to our machinery page to book a rental slot.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {rentals.map((rental) => {
            const start = new Date(rental.startDate);
            const end = new Date(rental.endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            return (
              <div key={rental.id} className="border border-gray-150 rounded-3xl p-6 bg-gray-50/30 hover:border-green-200 transition-all duration-300 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Rental Booking ID: #{rental.id}</span>
                    <div className="font-extrabold text-green-950 text-base flex items-center gap-2">
                      {rental.machineryName}
                      <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        rental.bookingStatus === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        rental.bookingStatus === "ACCEPTED" || rental.bookingStatus === "CONFIRMED" ? "bg-green-100 text-green-800" :
                        rental.bookingStatus === "CANCELLED" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {rental.bookingStatus}
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Value (excl. Deposit)</span>
                    <div className="font-extrabold text-green-850 text-base">{formatPrice(rental.totalPrice)}</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-xs font-semibold text-gray-600">
                  <div className="space-y-2 bg-white rounded-2xl p-4 border border-gray-100">
                    <h4 className="font-bold text-green-950 flex items-center gap-1.5 mb-2">
                      <Calendar size={14} className="text-green-600" /> Booking Slot Information
                    </h4>
                    <div><strong className="text-gray-800">Start Date:</strong> {start.toLocaleDateString()}</div>
                    <div><strong className="text-gray-800">End Date:</strong> {end.toLocaleDateString()}</div>
                    <div><strong className="text-gray-800">Duration:</strong> {diffDays} {diffDays === 1 ? "Day" : "Days"}</div>
                  </div>

                  <div className="space-y-2 bg-white rounded-2xl p-4 border border-gray-100">
                    <h4 className="font-bold text-green-950 flex items-center gap-1.5 mb-2">
                      <CreditCard size={14} className="text-green-600" /> Deposit & Charges Breakdown
                    </h4>
                    <div><strong className="text-gray-800">Security Deposit:</strong> {formatPrice(rental.securityDeposit)}</div>
                    <div><strong className="text-gray-800">Payment Status:</strong> <span className="text-green-700 font-bold">Paid via Escrow</span></div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-2">
                  <div className="text-[11px] text-gray-400 font-bold">
                    Booked on: {new Date(rental.createdAt).toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs text-gray-500 font-bold bg-gray-100 px-3 py-1.5 rounded-xl">
                      Seller: {rental.sellerBusinessName || "Verified Merchant"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
