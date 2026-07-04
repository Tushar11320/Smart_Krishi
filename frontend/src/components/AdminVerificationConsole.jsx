import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  Check,
  X,
  ExternalLink,
  FileText,
  Building,
  CreditCard,
  User,
  Shield,
  ShieldCheck,
  AlertCircle,
  Eye,
  RefreshCw
} from "lucide-react";

export default function AdminVerificationConsole() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Selected seller for detail modal
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("PENDING"); // ALL, PENDING, APPROVED, REJECTED
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSellers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/sellers");
      // The backend returns a Page object: response.data.data.content or response.data.content
      const content = response.data?.data?.content || response.data?.content || response.data?.data || [];
      setSellers(Array.isArray(content) ? content : []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch seller profiles. Ensure you are logged in as Admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to APPROVE this merchant?")) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/sellers/${id}/approve`);
      setSuccess("Merchant approved successfully! 🎉");
      setSelectedSeller(null);
      fetchSellers();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to approve seller.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/sellers/${id}/reject`, null, {
        params: { reason: rejectionReason }
      });
      setSuccess("Merchant application rejected.");
      setSelectedSeller(null);
      setRejectionReason("");
      setShowRejectForm(false);
      fetchSellers();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to reject seller.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredSellers = sellers.filter((seller) => {
    if (statusFilter === "ALL") return true;
    return seller.sellerStatus === statusFilter;
  });

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-green-950 flex items-center gap-3">
            <Shield className="text-green-600" size={32} />
            Seller Verification Console
          </h2>
          <p className="text-gray-500 mt-1">
            Review and approve agricultural business registration applications.
          </p>
        </div>
        <button
          onClick={fetchSellers}
          disabled={loading}
          className="self-start sm:self-center flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold transition shadow-sm"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Refresh List
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-100 pb-4">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              statusFilter === status
                ? "bg-green-600 text-white shadow-md shadow-green-200"
                : "bg-gray-50 hover:bg-gray-100 text-gray-600"
            }`}
          >
            {status === "ALL" ? "All Applications" : status}
          </button>
        ))}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl flex items-center gap-3 mb-6 font-medium animate-fadeIn">
          <ShieldCheck className="text-green-600 flex-shrink-0" size={24} />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 mb-6 font-medium animate-fadeIn">
          <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
          {error}
        </div>
      )}

      {/* Desktop/Tablet Table */}
      {loading && sellers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Fetching registered sellers...</p>
        </div>
      ) : filteredSellers.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-700">No applications found</h3>
          <p className="text-gray-500 mt-1">There are no registration profiles matching "{statusFilter}".</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm font-bold border-b border-gray-100">
                <th className="p-4 pl-6">Merchant Details</th>
                <th className="p-4">Shop / Firm</th>
                <th className="p-4">Business Type</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {filteredSellers.map((seller) => (
                <tr key={seller.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center shadow-inner">
                        {seller.profileImage ? (
                          <img src={seller.profileImage} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{seller.firstName} {seller.lastName}</div>
                        <div className="text-xs text-gray-400 font-medium">{seller.email} • {seller.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-green-900">{seller.businessName}</div>
                    <div className="text-xs text-gray-400 font-medium">{seller.businessCategory || "General"}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                      {seller.businessType || "N/A"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                        seller.sellerStatus === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : seller.sellerStatus === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : seller.sellerStatus === "SUSPENDED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-600 animate-pulse"
                      }`}
                    >
                      {seller.sellerStatus}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <button
                      onClick={() => {
                        setSelectedSeller(seller);
                        setShowRejectForm(false);
                        setRejectionReason("");
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition shadow-sm hover:shadow-md"
                    >
                      Review Application
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal Dialog */}
      {selectedSeller && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-scaleUp">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-green-50/50">
              <div>
                <h3 className="text-2xl font-black text-green-950">Review Business Profile</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Submitted by {selectedSeller.firstName} {selectedSeller.lastName} on {new Date(selectedSeller.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedSeller(null)}
                className="bg-white text-gray-500 hover:text-gray-800 p-2 rounded-full border border-gray-200 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-8">
              {/* Status Alert */}
              {selectedSeller.sellerStatus === "REJECTED" && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-800">
                  <span className="font-bold flex items-center gap-2">
                    <AlertCircle size={20} /> Rejection Reason Notes:
                  </span>
                  <p className="mt-1 text-sm font-medium">{selectedSeller.rejectionReason || "No details provided"}</p>
                </div>
              )}

              {/* Grid sections */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Business Info */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Building size={20} className="text-green-600" />
                    Business Identification
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <span className="text-gray-400 font-semibold">Shop / Firm Name:</span>
                      <p className="font-bold text-gray-800">{selectedSeller.businessName}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold">Business Type:</span>
                      <p className="font-bold text-gray-800">{selectedSeller.businessType || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold">Registration No:</span>
                      <p className="font-bold text-gray-800">{selectedSeller.businessRegistrationNumber || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold">PAN Number:</span>
                      <p className="font-bold text-gray-800">{selectedSeller.panNumber || "N/A"}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400 font-semibold">GST Number:</span>
                      <p className="font-bold text-gray-800">{selectedSeller.gstNumber || "Not Provided (Optional)"}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400 font-semibold">Shop Address:</span>
                      <p className="font-bold text-gray-800">{selectedSeller.shopAddress}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold">District / State:</span>
                      <p className="font-bold text-gray-800">{selectedSeller.district}, {selectedSeller.state}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold">Pincode:</span>
                      <p className="font-bold text-gray-800">{selectedSeller.pincode}</p>
                    </div>
                  </div>
                </div>

                {/* Settlement Info */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                    <CreditCard size={20} className="text-green-600" />
                    Settlement & Banking
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div className="col-span-2">
                      <span className="text-gray-400 font-semibold">Account Holder Name:</span>
                      <p className="font-bold text-gray-800">{selectedSeller.bankAccountHolderName || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold">Bank Name:</span>
                      <p className="font-bold text-gray-800">{selectedSeller.bankName || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold">Account Number:</span>
                      <p className="font-bold text-gray-800">{selectedSeller.accountNumber || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold">IFSC Code:</span>
                      <p className="font-bold text-gray-800">{selectedSeller.ifscCode || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold">UPI ID:</span>
                      <p className="font-bold text-green-700">{selectedSeller.upiId || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* KYC Document Uploads */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <FileText size={20} className="text-green-600" />
                  Uploaded KYC Documents
                </h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Profile Photo */}
                  <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50 flex flex-col justify-between h-40">
                    <div>
                      <span className="text-xs text-gray-400 font-bold uppercase">Profile Photo</span>
                      <h5 className="font-bold text-sm text-gray-700 mt-1">User Identity Picture</h5>
                    </div>
                    {selectedSeller.profileImage ? (
                      <a
                        href={selectedSeller.profileImage}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-green-700 font-bold hover:underline"
                      >
                        <Eye size={14} /> View File <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">No file uploaded</span>
                    )}
                  </div>

                  {/* Shop Logo */}
                  <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50 flex flex-col justify-between h-40">
                    <div>
                      <span className="text-xs text-gray-400 font-bold uppercase">Shop Logo</span>
                      <h5 className="font-bold text-sm text-gray-700 mt-1">Branding Logo</h5>
                    </div>
                    {selectedSeller.logoUrl ? (
                      <a
                        href={selectedSeller.logoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-green-700 font-bold hover:underline"
                      >
                        <Eye size={14} /> View File <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">No file uploaded</span>
                    )}
                  </div>

                  {/* Aadhaar Upload */}
                  <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50 flex flex-col justify-between h-40">
                    <div>
                      <span className="text-xs text-gray-400 font-bold uppercase">Aadhaar Card</span>
                      <h5 className="font-bold text-sm text-gray-700 mt-1">National Identity Doc</h5>
                    </div>
                    {selectedSeller.aadhaarDocumentUrl ? (
                      <a
                        href={selectedSeller.aadhaarDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-green-700 font-bold hover:underline"
                      >
                        <Eye size={14} /> View File <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium animate-pulse text-red-500 font-bold">Document Missing</span>
                    )}
                  </div>

                  {/* Business Certificate */}
                  <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50 flex flex-col justify-between h-40">
                    <div>
                      <span className="text-xs text-gray-400 font-bold uppercase">Business Certificate</span>
                      <h5 className="font-bold text-sm text-gray-700 mt-1">Firm Registration Proof</h5>
                    </div>
                    {selectedSeller.businessCertificateUrl ? (
                      <a
                        href={selectedSeller.businessCertificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-green-700 font-bold hover:underline"
                      >
                        <Eye size={14} /> View File <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium animate-pulse text-red-500 font-bold">Document Missing</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4">
                <div>
                  {selectedSeller.sellerStatus === "PENDING" && (
                    <button
                      onClick={() => setShowRejectForm(!showRejectForm)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-6 py-3.5 rounded-xl border border-red-200 transition"
                    >
                      Reject Application
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedSeller(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-3.5 rounded-xl transition"
                  >
                    Cancel
                  </button>

                  {selectedSeller.sellerStatus === "PENDING" && !showRejectForm && (
                    <button
                      onClick={() => handleApprove(selectedSeller.id)}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-green-100 flex items-center gap-2 transition"
                    >
                      <Check size={20} />
                      Approve & Verify Merchant
                    </button>
                  )}
                </div>
              </div>

              {/* Rejection Form Slider */}
              {showRejectForm && (
                <div className="bg-red-50 border border-red-200 rounded-3xl p-6 mt-6 animate-slideDown">
                  <h5 className="font-bold text-red-900 text-lg flex items-center gap-2 mb-3">
                    <AlertCircle size={20} />
                    Application Rejection Notes
                  </h5>
                  <p className="text-sm text-red-700 mb-4">
                    Describe exactly why this merchant application is rejected. The details will be visible to the user so they can correct their onboarding information.
                  </p>
                  <textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason (e.g. Aadhaar upload is blurred, IFSC code doesn't match bank...)"
                    className="w-full border border-red-200 rounded-2xl p-4 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    required
                  ></textarea>
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="bg-white hover:bg-gray-50 border border-gray-200 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 transition"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(selectedSeller.id)}
                      disabled={actionLoading}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-red-200 transition"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
