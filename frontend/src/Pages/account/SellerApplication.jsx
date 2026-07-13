import React, { useState, useEffect } from "react";
import api from "../../services/api";
import MerchantDashboard from "../../components/MerchantDashboard";
import {
  Building,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Upload,
  Eye,
  CreditCard,
  MapPin
} from "lucide-react";

export default function SellerApplication() {
  const [user, setUser] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Onboarding Form Wizard State
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    businessName: "",
    businessType: "Individual Farmer",
    gstNumber: "",
    panNumber: "",
    businessRegistrationNumber: "",
    shopAddress: "",
    state: "",
    district: "",
    pincode: "",
    bankAccountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    aadhaarDocumentUrl: "",
    businessCertificateUrl: "",
    profileImage: "",
    logoUrl: ""
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchSellerProfile(parsed.id);
    } else {
      setLoadingProfile(false);
    }
  }, []);

  const fetchSellerProfile = async (userId) => {
    setLoadingProfile(true);
    try {
      const response = await api.get(`/sellers/user/${userId}`);
      const profile = response.data?.data || response.data;
      setSellerProfile(profile);
      
      // Prefill onboarding fields if details exist
      if (profile) {
        setOnboardingData({
          businessName: profile.businessName || "",
          businessType: profile.businessType || "Individual Farmer",
          gstNumber: profile.gstNumber || "",
          panNumber: profile.panNumber || "",
          businessRegistrationNumber: profile.businessRegistrationNumber || "",
          shopAddress: profile.shopAddress || "",
          state: profile.state || "",
          district: profile.district || "",
          pincode: profile.pincode || "",
          bankAccountHolderName: profile.bankAccountHolderName || "",
          bankName: profile.bankName || "",
          accountNumber: profile.accountNumber || "",
          ifscCode: profile.ifscCode || "",
          upiId: profile.upiId || "",
          aadhaarDocumentUrl: profile.aadhaarDocumentUrl || "",
          businessCertificateUrl: profile.businessCertificateUrl || "",
          profileImage: profile.profileImage || "",
          logoUrl: profile.logoUrl || ""
        });
      }
    } catch (err) {
      console.log("No seller profile details exist yet.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleOnboardingFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setErrorMessage("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const fileUrl = response.data?.data || response.data;
      setOnboardingData((prev) => ({
        ...prev,
        [field]: fileUrl
      }));
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to upload document file.");
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const response = await api.put("/sellers/onboarding", onboardingData);
      setSuccessMessage("Onboarding submitted successfully! Under Review 🚜");
      setSellerProfile(response.data?.data || response.data);
      setOnboardingStep(1);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Failed to submit onboarding application.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-150 shadow">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Fetching merchant profile details...</p>
      </div>
    );
  }

  const hasCompletedOnboarding = sellerProfile && sellerProfile.panNumber && sellerProfile.shopAddress;

  if (!hasCompletedOnboarding) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-green-100 shadow-xl animate-fadeIn">
        <div className="mb-8">
          <span className="text-green-600 font-black uppercase text-xs tracking-wider">Step {onboardingStep} of 4</span>
          <h2 className="text-3xl font-black text-green-950 mt-1">Complete Merchant Registration</h2>
          <p className="text-gray-400 mt-1">Provide business information to start selling items on Smart Krishi.</p>
          
          <div className="w-full bg-gray-100 h-2 rounded-full mt-6 overflow-hidden">
            <div
              className="bg-green-600 h-full transition-all duration-300"
              style={{ width: `${(onboardingStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3 mb-6 font-medium text-sm">
            <AlertCircle className="text-red-600" size={20} />
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3 mb-6 font-medium text-sm">
            <CheckCircle className="text-green-600" size={20} />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleOnboardingSubmit} className="space-y-6">
          {onboardingStep === 1 && (
            <div className="space-y-5">
              <div className="border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Building className="text-green-600" size={20} />
                  Step 1: Business Details
                </h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Shop / Firm Name *</label>
                  <input
                    type="text"
                    required
                    value={onboardingData.businessName}
                    onChange={(e) => setOnboardingData({ ...onboardingData, businessName: e.target.value })}
                    placeholder="e.g. Kishan Agro Center"
                    className="border border-gray-300 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Business Type *</label>
                  <select
                    value={onboardingData.businessType}
                    onChange={(e) => setOnboardingData({ ...onboardingData, businessType: e.target.value })}
                    className="border border-gray-300 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                  >
                    <option value="Individual Farmer">Individual Farmer</option>
                    <option value="Trader">Trader</option>
                    <option value="Retail Shop">Retail Shop</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Equipment Provider">Equipment Provider</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">PAN Number *</label>
                  <input
                    type="text"
                    required
                    pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                    title="Please enter a valid PAN (Format: ABCDE1234F)"
                    value={onboardingData.panNumber}
                    onChange={(e) => setOnboardingData({ ...onboardingData, panNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. ABCDE1234F"
                    className="border border-gray-300 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="space-y-5">
              <div className="border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <MapPin className="text-green-600" size={20} />
                  Step 2: Shop Address
                </h3>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Shop Address *</label>
                <input
                  type="text"
                  required
                  value={onboardingData.shopAddress}
                  onChange={(e) => setOnboardingData({ ...onboardingData, shopAddress: e.target.value })}
                  placeholder="Plot/Shop Number, Street, Area"
                  className="border border-gray-300 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">State *</label>
                  <input
                    type="text"
                    required
                    value={onboardingData.state}
                    onChange={(e) => setOnboardingData({ ...onboardingData, state: e.target.value })}
                    placeholder="State"
                    className="border border-gray-300 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">District *</label>
                  <input
                    type="text"
                    required
                    value={onboardingData.district}
                    onChange={(e) => setOnboardingData({ ...onboardingData, district: e.target.value })}
                    placeholder="District"
                    className="border border-gray-300 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    pattern="^[1-9][0-9]{5}$"
                    title="Please enter a valid 6-digit Indian Pincode"
                    value={onboardingData.pincode}
                    onChange={(e) => setOnboardingData({ ...onboardingData, pincode: e.target.value })}
                    placeholder="6-digit Pincode"
                    className="border border-gray-300 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="space-y-5">
              <div className="border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <CreditCard className="text-green-600" size={20} />
                  Step 3: Financial Settlement Details
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Account Holder Name *</label>
                  <input
                    type="text"
                    required
                    value={onboardingData.bankAccountHolderName}
                    onChange={(e) => setOnboardingData({ ...onboardingData, bankAccountHolderName: e.target.value })}
                    placeholder="As printed in Passbook"
                    className="border border-gray-300 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={onboardingData.bankName}
                    onChange={(e) => setOnboardingData({ ...onboardingData, bankName: e.target.value })}
                    placeholder="Bank Name"
                    className="border border-gray-300 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={onboardingData.accountNumber}
                    onChange={(e) => setOnboardingData({ ...onboardingData, accountNumber: e.target.value })}
                    placeholder="Settlement Account Number"
                    className="border border-gray-300 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-mono"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    pattern="^[A-Z]{4}0[A-Z0-9]{6}$"
                    title="Please enter a valid 11-digit IFSC code (e.g. SBIN0012345)"
                    value={onboardingData.ifscCode}
                    onChange={(e) => setOnboardingData({ ...onboardingData, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. SBIN0012345"
                    className="border border-gray-300 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-mono"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">UPI ID *</label>
                  <input
                    type="text"
                    required
                    value={onboardingData.upiId}
                    onChange={(e) => setOnboardingData({ ...onboardingData, upiId: e.target.value })}
                    placeholder="e.g. user@upi"
                    className="border border-gray-300 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {onboardingStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Building className="text-green-600" size={20} />
                  Step 4: Documents Upload
                </h3>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1.5 pl-1">Profile Photo *</label>
                  <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 text-center flex flex-col justify-center items-center h-44 relative">
                    <input
                      type="file"
                      accept="image/*"
                      required={!onboardingData.profileImage}
                      onChange={(e) => handleOnboardingFileUpload(e, "profileImage")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {onboardingData.profileImage ? (
                      <div className="space-y-2">
                        <CheckCircle className="text-green-600 mx-auto" size={32} />
                        <span className="text-xs text-green-700 font-bold">Image Uploaded</span>
                        <a href={onboardingData.profileImage} target="_blank" rel="noreferrer" className="text-xs text-gray-500 flex items-center gap-1 justify-center underline z-10">
                          View <Eye size={12} />
                        </a>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-gray-400 mb-2" size={28} />
                        <span className="text-xs text-gray-500">Upload profile image</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1.5 pl-1">Shop Logo *</label>
                  <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 text-center flex flex-col justify-center items-center h-44 relative">
                    <input
                      type="file"
                      accept="image/*"
                      required={!onboardingData.logoUrl}
                      onChange={(e) => handleOnboardingFileUpload(e, "logoUrl")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {onboardingData.logoUrl ? (
                      <div className="space-y-2">
                        <CheckCircle className="text-green-600 mx-auto" size={32} />
                        <span className="text-xs text-green-700 font-bold">Logo Uploaded</span>
                        <a href={onboardingData.logoUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-500 flex items-center gap-1 justify-center underline z-10">
                          View <Eye size={12} />
                        </a>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-gray-400 mb-2" size={28} />
                        <span className="text-xs text-gray-500">Upload shop logo</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1.5 pl-1">Aadhaar Card Upload (PDF/Image) *</label>
                  <div className="border-2 border-dashed border-green-200 hover:bg-green-50/50 rounded-2xl p-6 text-center cursor-pointer transition relative h-44 flex flex-col justify-center items-center">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      required={!onboardingData.aadhaarDocumentUrl}
                      onChange={(e) => handleOnboardingFileUpload(e, "aadhaarDocumentUrl")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {onboardingData.aadhaarDocumentUrl ? (
                      <div className="space-y-2">
                        <CheckCircle className="text-green-600 mx-auto" size={32} />
                        <span className="text-xs text-green-700 font-bold">Aadhaar Uploaded</span>
                        <a href={onboardingData.aadhaarDocumentUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-500 flex items-center gap-1 justify-center underline z-10">
                          View File <Eye size={12} />
                        </a>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-green-600 mb-2" size={32} />
                        <span className="text-xs text-gray-500 font-medium">Click to upload Aadhaar card</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100 flex justify-between">
            {onboardingStep > 1 ? (
              <button
                type="button"
                onClick={() => setOnboardingStep(onboardingStep - 1)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl transition"
              >
                <ArrowLeft size={18} />
                Previous
              </button>
            ) : (
              <div></div>
            )}

            {onboardingStep < 4 ? (
              <button
                type="button"
                onClick={() => setOnboardingStep(onboardingStep + 1)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition"
              >
                Next Step
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition flex items-center gap-2"
              >
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                Submit Application
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  if (sellerProfile.sellerStatus === "PENDING") {
    return (
      <div className="bg-white rounded-3xl p-12 border border-green-100 text-center shadow-xl max-w-2xl mx-auto animate-fadeIn">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Building size={48} className="text-green-600 animate-pulse" />
        </div>
        <h2 className="text-3xl font-black text-green-950">Application Under Review</h2>
        <p className="text-gray-500 mt-4 leading-7">
          Thank you for submitting your onboarding details! Our verification team is currently reviewing your registration certificates, Aadhaar details, and settlement accounts.
        </p>
        <div className="bg-green-50 border border-green-200 p-4 rounded-2xl max-w-md mx-auto mt-8 flex items-center gap-3 text-left">
          <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-800 font-bold">Expected verification time is usually 24-48 hours.</span>
        </div>
      </div>
    );
  }

  if (sellerProfile.sellerStatus === "REJECTED") {
    return (
      <div className="bg-white rounded-3xl p-12 border border-red-100 text-center shadow-xl max-w-2xl mx-auto animate-fadeIn">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <AlertCircle size={48} className="text-red-600" />
        </div>
        <h2 className="text-3xl font-black text-red-950">Application Rejected</h2>
        <p className="text-gray-500 mt-3">Your merchant account request was not approved.</p>
        
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl text-left mt-6 max-w-lg mx-auto font-medium">
          <h4 className="font-bold flex items-center gap-2 mb-2 text-red-900">
            <AlertCircle size={18} /> Administrative Rejection Notes:
          </h4>
          <p className="text-sm">{sellerProfile.rejectionReason || "Please verify your document details and resubmit."}</p>
        </div>

        <button
          onClick={() => {
            setSellerProfile(null);
            setOnboardingStep(1);
          }}
          className="mt-8 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition"
        >
          Re-open Onboarding Wizard
        </button>
      </div>
    );
  }

  return <MerchantDashboard sellerProfile={sellerProfile} />;
}
