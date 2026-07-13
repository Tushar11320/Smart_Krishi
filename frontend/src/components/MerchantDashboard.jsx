import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { formatPrice } from "../services/api";
import SellerAnalyticsDashboard from "./SellerAnalyticsDashboard";
import ImageUpload from "./ImageUpload";
import {
  Plus,
  Package,
  IndianRupee,
  Star,
  BarChart2,
  MessageSquare,
  Trash2,
  Edit,
  PlusCircle,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle,
  Eye,
  X,
  CreditCard,
  MapPin,
  Building,
  ShoppingBag,
  TrendingUp,
  Settings,
  ChevronRight,
  RefreshCw,
  Calendar
} from "lucide-react";

export default function MerchantDashboard({ sellerProfile: initialSellerProfile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [sellerProfile, setSellerProfile] = useState(initialSellerProfile);

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/seller/shop") || path.startsWith("/account/seller-application/shop")) {
      setActiveTab("SETTINGS");
    } else if (path.startsWith("/seller/add-product") || path.startsWith("/account/seller-application/add-product")) {
      setActiveTab("PRODUCTS");
      // Open modal if page triggers add
      setTimeout(() => {
        openAddModal();
      }, 100);
    } else if (path.startsWith("/seller/land-listings") || path.startsWith("/account/seller-application/land-listings")) {
      setActiveTab("LAND_LISTINGS");
    } else if (path.startsWith("/seller/listings") || path.startsWith("/account/seller-application/listings")) {
      setActiveTab("PRODUCTS");
    } else if (path.startsWith("/seller/inventory") || path.startsWith("/account/seller-application/inventory")) {
      setActiveTab("PRODUCTS");
    } else if (path.startsWith("/seller/orders") || path.startsWith("/account/seller-application/orders")) {
      setActiveTab("ORDERS");
    } else if (path.startsWith("/seller/earnings") || path.startsWith("/account/seller-application/earnings")) {
      setActiveTab("EARNINGS");
    } else if (path.startsWith("/seller/analytics") || path.startsWith("/account/seller-application/analytics")) {
      setActiveTab("ANALYTICS");
    } else if (path.startsWith("/seller/dashboard") || path.startsWith("/account/seller-application")) {
      setActiveTab("OVERVIEW");
    }
  }, [location.pathname]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  
  // Seller Listing Management Custom States
  const [sellerStats, setSellerStats] = useState({
    totalListings: 0,
    activeListings: 0,
    inactiveListings: 0,
    lowStockListings: 0,
    outOfStockListings: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [productFilter, setProductFilter] = useState("ALL");
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [editingStockId, setEditingStockId] = useState(null);
  const [tempStockValue, setTempStockValue] = useState("");

  // Lists & Loaders
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Product Edit/Create Form State
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loadingStatusId, setLoadingStatusId] = useState(null);
  
  const [productForm, setProductForm] = useState({
    id: null,
    cropId: null,
    milkId: null,
    fertilizerId: null,
    farmingEquipmentId: null,
    buildingMaterialId: null,
    productName: "",
    sku: "",
    shortDescription: "",
    productDescription: "",
    price: "",
    discountPrice: "",
    categoryId: "",
    subcategoryId: "",
    quantityAvailable: 0,
    reorderLevel: 10,
    productStatus: "ACTIVE",
    variety: "",
    unit: "kg",
    harvestDate: "",
    location: "",
    milkType: "Cow",
    fatPercentage: 3.5,
    dailyAvailability: true,
    deliveryRadius: 5,
    brand: "",
    manufacturingDate: "",
    expiryDate: "",
    model: "",
    purchaseYear: "",
    equipmentCondition: "GOOD",
    rentPerHour: "",
    rentPerDay: "",
    securityDeposit: "",
    forSale: true,
    forRent: false,
    materialType: "Cement",
    deliveryAvailable: false
  });

  const [rentalBookings, setRentalBookings] = useState([]);
  const [rentalsLoading, setRentalsLoading] = useState(false);

  // Land Listings & Visits States
  const [landListings, setLandListings] = useState([]);
  const [landListingsLoading, setLandListingsLoading] = useState(false);
  const [landVisits, setLandVisits] = useState([]);
  const [landVisitsLoading, setLandVisitsLoading] = useState(false);
  
  const [showLandModal, setShowLandModal] = useState(false);
  const [isEditingLand, setIsEditingLand] = useState(false);
  const [landFormLoading, setLandFormLoading] = useState(false);
  const [uploadedLandImageUrl, setUploadedLandImageUrl] = useState("");
  const [uploadedLandDocUrl, setUploadedLandDocUrl] = useState("");
  
  const [landForm, setLandForm] = useState({
    id: null,
    landTitle: "",
    description: "",
    areaInAcres: "",
    areaUnit: "acre", // acre, hectare
    landType: "Agricultural", // Agricultural, Farm Land, etc.
    pricePerAcre: "",
    state: "",
    district: "",
    taluka: "",
    village: "",
    pinCode: "",
    latitude: 20.5937,
    longitude: 78.9629,
    soilInformation: "",
    waterSourceInformation: "",
    accessibility: "",
    electricityAvailability: false,
    roadConnectivity: "Tar Road", // Tar Road, Dirt Road, National Highway, No Road
    documentUrl: "",
    images: [],
    landStatus: "AVAILABLE"
  });

  const fetchRentalBookings = async () => {
    if (!sellerProfile?.id) return;
    setRentalsLoading(true);
    try {
      const eqResponse = await api.get(`/equipments/bookings/seller/${sellerProfile.id}`);
      const eqList = eqResponse.data?.data || eqResponse.data || [];
      
      let machList = [];
      try {
        const machResponse = await api.get(`/machinery/bookings/seller/${sellerProfile.id}`);
        machList = machResponse.data?.data || machResponse.data || [];
      } catch (mErr) {
        console.error("Failed to fetch machinery bookings:", mErr);
      }

      const unifiedBookings = [
        ...eqList.map(b => ({ ...b, isEquipment: true })),
        ...machList.map(b => ({ ...b, isEquipment: false }))
      ];
      // Sort unified bookings by createdAt descending
      unifiedBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setRentalBookings(unifiedBookings);
    } catch (err) {
      console.error("Failed to load unified rental bookings:", err);
    } finally {
      setRentalsLoading(false);
    }
  };

  const fetchSellerLandListings = async () => {
    if (!sellerProfile?.id) return;
    setLandListingsLoading(true);
    try {
      const response = await api.get(`/land-listings/seller/${sellerProfile.id}`, { params: { size: 100 } });
      const content = response.data?.content || response.data?.data?.content || response.data?.data || [];
      setLandListings(Array.isArray(content) ? content : []);
    } catch (err) {
      console.error("Failed to load seller land listings:", err);
    } finally {
      setLandListingsLoading(false);
    }
  };

  const fetchLandVisitRequests = async () => {
    if (!sellerProfile?.id) return;
    setLandVisitsLoading(true);
    try {
      const response = await api.get(`/land-listings/visits/seller/${sellerProfile.id}`);
      const content = response.data?.data || response.data || [];
      setLandVisits(Array.isArray(content) ? content : []);
    } catch (err) {
      console.error("Failed to load land visit requests:", err);
    } finally {
      setLandVisitsLoading(false);
    }
  };

  const handleUpdateLandVisitStatus = async (visitId, newStatus) => {
    setError("");
    setSuccess("");
    try {
      await api.put(`/land-listings/visits/${visitId}/status?status=${newStatus}`);
      setSuccess(`Land visit request status updated to ${newStatus}!`);
      fetchLandVisitRequests();
    } catch (err) {
      console.error(err);
      setError("Failed to update visit status.");
    }
  };

  // Settings Forms States
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [shopSettings, setShopSettings] = useState({
    businessName: sellerProfile?.businessName || "",
    businessCategory: sellerProfile?.businessCategory || "General",
    businessWebsite: sellerProfile?.businessWebsite || "",
    bio: sellerProfile?.bio || "",
    logoUrl: sellerProfile?.logoUrl || "",
    profileImage: sellerProfile?.profileImage || ""
  });

  const [addressSettings, setAddressSettings] = useState({
    shopAddress: sellerProfile?.shopAddress || "",
    state: sellerProfile?.state || "",
    district: sellerProfile?.district || "",
    pincode: sellerProfile?.pincode || ""
  });

  const [paymentSettings, setPaymentSettings] = useState({
    bankAccountHolderName: sellerProfile?.bankAccountHolderName || "",
    bankName: sellerProfile?.bankName || "",
    accountNumber: sellerProfile?.accountNumber || "",
    ifscCode: sellerProfile?.ifscCode || "",
    upiId: sellerProfile?.upiId || ""
  });

  // Fetch Dashboard Stats
  const fetchDashboardStats = async () => {
    if (!sellerProfile?.id) return;
    try {
      const response = await api.get(`/sellers/${sellerProfile.id}/dashboard-stats`);
      setDashboardStats(response.data?.data || response.data);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    }
  };

  // Fetch Products
  const fetchMerchantProducts = async () => {
    if (!sellerProfile?.id) return;
    setLoading(true);
    try {
      const response = await api.get(`/products/seller/${sellerProfile.id}/all`);
      const content = response.data?.content || response.data?.data?.content || response.data?.data || [];
      setProducts(Array.isArray(content) ? content : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load products inventory.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Orders
  const fetchMerchantOrders = async () => {
    if (!sellerProfile?.id) return;
    try {
      const response = await api.get(`/orders/seller/${sellerProfile.id}`);
      const content = response.data?.content || response.data?.data?.content || response.data?.data || [];
      setOrders(Array.isArray(content) ? content : []);
    } catch (err) {
      console.error("Failed to load seller orders:", err);
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      const list = response.data?.data || response.data || [];
      setCategories(list);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSellerStats = async () => {
    if (!sellerProfile?.id) return;
    setStatsLoading(true);
    try {
      const response = await api.get("/seller/listings/stats");
      setSellerStats(response.data?.data || response.data);
    } catch (err) {
      console.error("Failed to fetch seller inventory stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Initial Load & Tab Switching
  useEffect(() => {
    if (sellerProfile?.id) {
      fetchDashboardStats();
      fetchMerchantProducts();
      fetchMerchantOrders();
      fetchSellerLandListings();
      fetchLandVisitRequests();
      fetchSellerStats();
    }
    fetchCategories();
  }, [sellerProfile?.id]);

  const handleUpdateBookingStatus = async (bookingId, newStatus, isEquipment = true) => {
    setError("");
    setSuccess("");
    try {
      if (isEquipment) {
        await api.put(`/equipments/bookings/${bookingId}/status?status=${newStatus}`);
      } else {
        await api.put(`/machinery/bookings/${bookingId}/status?status=${newStatus}`);
      }
      setSuccess(`Rental booking status updated to ${newStatus}!`);
      fetchRentalBookings();
    } catch (err) {
      console.error(err);
      setError("Failed to update booking status.");
    }
  };

  const handleTabChange = (tab) => {
    setError("");
    setSuccess("");
    if (tab === "OVERVIEW") {
      navigate("/account/seller-application");
    } else if (tab === "ANALYTICS") {
      navigate("/account/seller-application/analytics");
    } else if (tab === "PRODUCTS") {
      navigate("/account/seller-application/listings");
    } else if (tab === "ORDERS") {
      navigate("/account/seller-application/orders");
    } else if (tab === "EARNINGS") {
      navigate("/account/seller-application/earnings");
    } else if (tab === "SETTINGS") {
      navigate("/account/seller-application/shop");
    } else if (tab === "LAND_LISTINGS") {
      navigate("/account/seller-application/land-listings");
    } else {
      setActiveTab(tab);
    }
  };

  // Dropdown dependency handlers
  const handleCategoryChange = async (e, customVal = null) => {
    const catId = customVal !== null ? customVal : e.target.value;
    setProductForm(prev => ({ ...prev, categoryId: catId, subcategoryId: "" }));
    setSubcategories([]);
    if (!catId) return;

    try {
      const response = await api.get(`/categories/${catId}/subcategories`);
      const list = response.data?.data || response.data || [];
      setSubcategories(list);
    } catch (err) {
      console.error(err);
    }
  };

  // File Upload Helper
  const handleFileUpload = async (e, type = "product") => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    const isImage = ["product", "land", "shop-logo", "profile"].includes(type);
    const endpoint = isImage ? "/images/upload" : "/files/upload";

    try {
      const response = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const data = response.data?.data || response.data;
      const fileUrl = isImage ? (data.secureUrl || data) : (data || response.data);
      
      if (type === "product") {
        setUploadedImages([{ imageUrl: fileUrl, isPrimary: true, displayOrder: 0 }]);
      } else if (type === "land") {
        setUploadedLandImageUrl(fileUrl);
      } else if (type === "land-doc") {
        setUploadedLandDocUrl(fileUrl);
      } else if (type === "shop-logo") {
        setShopSettings(prev => ({ ...prev, logoUrl: fileUrl }));
      } else if (type === "profile") {
        setShopSettings(prev => ({ ...prev, profileImage: fileUrl }));
      } else if (type === "machinery-cert") {
        setProductForm(prev => ({ ...prev, registrationCertificateUrl: fileUrl }));
      } else if (type === "machinery-ins") {
        setProductForm(prev => ({ ...prev, insuranceDocumentUrl: fileUrl }));
      }
      setSuccess("Document uploaded successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to upload document.");
    } finally {
      setUploadingFile(false);
    }
  };

  // Land Listing Create/Edit Handlers
  const openAddLandModal = () => {
    setError("");
    setSuccess("");
    setIsEditingLand(false);
    setUploadedLandImageUrl("");
    setUploadedLandDocUrl("");
    setLandForm({
      id: null,
      landTitle: "",
      description: "",
      areaInAcres: "",
      areaUnit: "acre",
      landType: "Agricultural",
      pricePerAcre: "",
      state: "",
      district: "",
      taluka: "",
      village: "",
      pinCode: "",
      latitude: 20.5937,
      longitude: 78.9629,
      soilInformation: "",
      waterSourceInformation: "",
      accessibility: "",
      electricityAvailability: false,
      roadConnectivity: "Tar Road",
      documentUrl: "",
      images: [],
      landStatus: "AVAILABLE"
    });
    setShowLandModal(true);
  };

  const openEditLandModal = (land) => {
    setError("");
    setSuccess("");
    setIsEditingLand(true);
    setUploadedLandImageUrl(land.images?.[0]?.imageUrl || "");
    setUploadedLandDocUrl(land.documentUrl || "");
    setLandForm({
      id: land.id,
      landTitle: land.landTitle || "",
      description: land.description || "",
      areaInAcres: land.areaInAcres || "",
      areaUnit: land.areaUnit || "acre",
      landType: land.landType || "Agricultural",
      pricePerAcre: land.pricePerAcre || "",
      state: land.state || "",
      district: land.district || "",
      taluka: land.taluka || "",
      village: land.village || "",
      pinCode: land.pinCode || "",
      latitude: land.latitude || 20.5937,
      longitude: land.longitude || 78.9629,
      soilInformation: land.soilInformation || "",
      waterSourceInformation: land.waterSourceInformation || "",
      accessibility: land.accessibility || "",
      electricityAvailability: land.electricityAvailability || false,
      roadConnectivity: land.roadConnectivity || "Tar Road",
      documentUrl: land.documentUrl || "",
      images: land.images || [],
      landStatus: land.landStatus || "AVAILABLE"
    });
    setShowLandModal(true);
  };

  const handleLandSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (Number(landForm.areaInAcres) <= 0) {
      setError("Area must be greater than 0.");
      return;
    }
    if (Number(landForm.pricePerAcre) <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

    setLandFormLoading(true);

    const payload = {
      ...landForm,
      sellerId: sellerProfile.id,
      pricePerAcre: Number(landForm.pricePerAcre),
      areaInAcres: Number(landForm.areaInAcres),
      latitude: Number(landForm.latitude),
      longitude: Number(landForm.longitude),
      documentUrl: uploadedLandDocUrl || null,
      images: uploadedLandImageUrl ? [{ imageUrl: uploadedLandImageUrl, isPrimary: true, displayOrder: 0 }] : []
    };

    try {
      if (isEditingLand) {
        await api.put(`/land-listings/${landForm.id}`, payload);
        setSuccess("Land listing updated successfully! 🌍");
      } else {
        await api.post("/land-listings", payload);
        setSuccess("Land listing created successfully! 🌍");
      }
      setShowLandModal(false);
      fetchSellerLandListings();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to save land listing.");
    } finally {
      setLandFormLoading(false);
    }
  };

  const handleDeleteLand = async (land) => {
    if (!window.confirm("Are you sure you want to delete this land listing?")) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/land-listings/${land.id}`);
      setSuccess("Land listing deleted successfully.");
      fetchSellerLandListings();
    } catch (err) {
      console.error(err);
      setError("Failed to delete land listing.");
    }
  };

  // Product Create/Edit Handlers
  const openAddModal = () => {
    setError("");
    setSuccess("");
    setIsEditingProduct(false);
    setUploadedImages([]);
    setProductForm({
      id: null,
      cropId: null,
      milkId: null,
      fertilizerId: null,
      farmingEquipmentId: null,
      buildingMaterialId: null,
      machineryId: null,
      productName: "",
      sku: "",
      shortDescription: "",
      productDescription: "",
      price: "",
      discountPrice: "",
      categoryId: "",
      subcategoryId: "",
      quantityAvailable: 1,
      reorderLevel: 10,
      productStatus: "ACTIVE",
      variety: "",
      unit: "bags",
      harvestDate: "",
      location: "",
      milkType: "Cow",
      fatPercentage: 3.5,
      dailyAvailability: true,
      deliveryRadius: 5,
      brand: "",
      manufacturingDate: "",
      expiryDate: "",
      model: "",
      purchaseYear: "",
      equipmentCondition: "GOOD",
      rentPerHour: "",
      rentPerDay: "",
      rentPerWeek: "",
      securityDeposit: "",
      forSale: true,
      forRent: false,
      materialType: "Cement",
      deliveryAvailable: false,
      machineryType: "Tractor",
      brandName: "",
      modelNumber: "",
      manufacturingYear: "",
      conditionStatus: "NEW",
      negotiable: false,
      availableForSale: true,
      availableForRent: false,
      availableForBoth: false,
      state: "",
      district: "",
      villageCity: "",
      pincode: "",
      gpsLocation: "",
      videoUrl: "",
      registrationCertificateUrl: "",
      insuranceDocumentUrl: "",
      engineType: "",
      powerHp: "",
      capacitySpecification: "",
      maintenanceIntervalHours: "",
      warrantyYears: "",
      fuelEfficiency: "",
      noiseLevelDb: "",
      enginePower: "",
      fuelType: "",
      workingWidth: "",
      weight: "",
      otherSpecifications: "",
      sellerContactName: "",
      mobileNumber: "",
      alternateNumber: "",
      whatsappNumber: ""
    });
    setSubcategories([]);
    setShowProductModal(true);
  };

  const openEditModal = async (product) => {
    setError("");
    setSuccess("");
    setIsEditingProduct(true);
    setUploadedImages(product.images || []);
    
    // Trigger subcategories fetch
    if (product.categoryId) {
      await handleCategoryChange(null, product.categoryId);
    }

    const catObj = categories.find(c => Number(c.id) === Number(product.categoryId));
    const isCrop = catObj?.categoryName?.toLowerCase() === "crops";
    const isMilk = catObj?.categoryName?.toLowerCase() === "dairy products";
    const isFertilizer = catObj?.categoryName?.toLowerCase() === "fertilizers";
    const isEquipment = catObj?.categoryName?.toLowerCase() === "farming equipment";
    const isMaterial = catObj?.categoryName?.toLowerCase() === "building materials";
    const isMachinery = catObj?.categoryName?.toLowerCase() === "machinery";

    let cropFields = { cropId: null, variety: "", unit: "kg", harvestDate: "", location: "" };
    let milkFields = { milkId: null, milkType: "Cow", fatPercentage: 3.5, dailyAvailability: true, deliveryRadius: 5 };
    let fertilizerFields = { fertilizerId: null, brand: "", manufacturingDate: "", expiryDate: "" };
    let equipmentFields = {
      farmingEquipmentId: null,
      model: "",
      purchaseYear: "",
      equipmentCondition: "GOOD",
      rentPerHour: "",
      rentPerDay: "",
      securityDeposit: "",
      forSale: true,
      forRent: false
    };
    let buildingMaterialFields = { buildingMaterialId: null, materialType: "Cement", unit: "bags", deliveryAvailable: false };
    let machineryFields = {
      machineryId: null,
      machineryType: "Tractor",
      brandName: "",
      modelNumber: "",
      manufacturingYear: "",
      conditionStatus: "NEW",
      negotiable: false,
      rentPerHour: "",
      rentPerDay: "",
      rentPerWeek: "",
      securityDeposit: "",
      availableForSale: true,
      availableForRent: false,
      availableForBoth: false,
      state: "",
      district: "",
      villageCity: "",
      pincode: "",
      gpsLocation: "",
      videoUrl: "",
      registrationCertificateUrl: "",
      insuranceDocumentUrl: "",
      engineType: "",
      powerHp: "",
      capacitySpecification: "",
      maintenanceIntervalHours: "",
      warrantyYears: "",
      fuelEfficiency: "",
      noiseLevelDb: "",
      enginePower: "",
      fuelType: "",
      workingWidth: "",
      weight: "",
      otherSpecifications: "",
      sellerContactName: "",
      mobileNumber: "",
      alternateNumber: "",
      whatsappNumber: ""
    };

    if (isMaterial) {
      try {
        const response = await api.get(`/materials/product/${product.id}`);
        const bmData = response.data?.data || response.data;
        if (bmData) {
          buildingMaterialFields = {
            buildingMaterialId: bmData.id || null,
            materialType: bmData.materialType || "Cement",
            unit: bmData.unit || "bags",
            deliveryAvailable: bmData.deliveryAvailable !== undefined ? bmData.deliveryAvailable : false
          };
        }
      } catch (err) {
        console.error("Failed to fetch building material details for edit modal", err);
      }
    } else if (isCrop) {
      try {
        const response = await api.get(`/crops/product/${product.id}`);
        const cData = response.data?.data || response.data;
        if (cData) {
          cropFields = {
            cropId: cData.id || null,
            variety: cData.variety || "",
            unit: cData.unit || "kg",
            harvestDate: cData.harvestDate || "",
            location: cData.location || ""
          };
        }
      } catch (err) {
        console.error("Failed to fetch crop details for edit modal", err);
      }
    } else if (isMilk) {
      try {
        const response = await api.get(`/milk/product/${product.id}`);
        const mData = response.data?.data || response.data;
        if (mData) {
          milkFields = {
            milkId: mData.id || null,
            milkType: mData.milkType || "Cow",
            fatPercentage: mData.fatPercentage || 3.5,
            dailyAvailability: mData.dailyAvailability !== undefined ? mData.dailyAvailability : true,
            deliveryRadius: mData.deliveryRadius || 5
          };
        }
      } catch (err) {
        console.error("Failed to fetch milk details for edit modal", err);
      }
    } else if (isFertilizer) {
      try {
        const response = await api.get(`/fertilizers/product/${product.id}`);
        const fData = response.data?.data || response.data;
        if (fData) {
          fertilizerFields = {
            fertilizerId: fData.id || null,
            brand: fData.brand || "",
            manufacturingDate: fData.manufacturingDate || "",
            expiryDate: fData.expiryDate || ""
          };
        }
      } catch (err) {
        console.error("Failed to fetch fertilizer details for edit modal", err);
      }
    } else if (isEquipment) {
      try {
        const response = await api.get(`/equipments/product/${product.id}`);
        const eqData = response.data?.data || response.data;
        if (eqData) {
          equipmentFields = {
            farmingEquipmentId: eqData.id || null,
            brand: eqData.brand || "",
            model: eqData.model || "",
            purchaseYear: eqData.purchaseYear || "",
            equipmentCondition: eqData.equipmentCondition || "GOOD",
            rentPerHour: eqData.rentPerHour || "",
            rentPerDay: eqData.rentPerDay || "",
            securityDeposit: eqData.securityDeposit || "",
            forSale: eqData.forSale !== undefined ? eqData.forSale : true,
            forRent: eqData.forRent !== undefined ? eqData.forRent : false
          };
        }
      } catch (err) {
        console.error("Failed to fetch equipment details for edit modal", err);
      }
    } else if (isMachinery) {
      try {
        const response = await api.get(`/machinery/product/${product.id}`);
        const mData = response.data?.data || response.data;
        if (mData) {
          machineryFields = {
            machineryId: mData.id || null,
            machineryType: mData.machineryType || "Tractor",
            brandName: mData.brandName || "",
            modelNumber: mData.modelNumber || "",
            manufacturingYear: mData.manufacturingYear || "",
            conditionStatus: mData.conditionStatus || "NEW",
            negotiable: mData.negotiable !== undefined ? mData.negotiable : false,
            rentPerHour: mData.rentPerHour || "",
            rentPerDay: mData.rentPerDay || "",
            rentPerWeek: mData.rentPerWeek || "",
            securityDeposit: mData.securityDeposit || "",
            availableForSale: mData.availableForSale !== undefined ? mData.availableForSale : true,
            availableForRent: mData.availableForRent !== undefined ? mData.availableForRent : false,
            availableForBoth: mData.availableForBoth !== undefined ? mData.availableForBoth : false,
            state: mData.state || "",
            district: mData.district || "",
            villageCity: mData.villageCity || "",
            pincode: mData.pincode || "",
            gpsLocation: mData.gpsLocation || "",
            videoUrl: mData.videoUrl || "",
            registrationCertificateUrl: mData.registrationCertificateUrl || "",
            insuranceDocumentUrl: mData.insuranceDocumentUrl || "",
            engineType: mData.engineType || "",
            powerHp: mData.powerHp || "",
            capacitySpecification: mData.capacitySpecification || "",
            maintenanceIntervalHours: mData.maintenanceIntervalHours || "",
            warrantyYears: mData.warrantyYears || "",
            fuelEfficiency: mData.fuelEfficiency || "",
            noiseLevelDb: mData.noiseLevelDb || "",
            enginePower: mData.enginePower || "",
            fuelType: mData.fuelType || "",
            workingWidth: mData.workingWidth || "",
            weight: mData.weight || "",
            otherSpecifications: mData.otherSpecifications || "",
            sellerContactName: mData.sellerContactName || "",
            mobileNumber: mData.mobileNumber || "",
            alternateNumber: mData.alternateNumber || "",
            whatsappNumber: mData.whatsappNumber || ""
          };
        }
      } catch (err) {
        console.error("Failed to fetch machinery details for edit modal", err);
      }
    }

    setProductForm({
      id: product.id,
      productName: product.productName,
      sku: product.sku,
      shortDescription: product.shortDescription || "",
      productDescription: product.productDescription || "",
      price: product.price,
      discountPrice: product.discountPrice || "",
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId || "",
      quantityAvailable: product.inventory?.quantityAvailable || 0,
      reorderLevel: product.inventory?.reorderLevel || 10,
      productStatus: product.productStatus || "ACTIVE",
      ...cropFields,
      ...milkFields,
      ...fertilizerFields,
      ...equipmentFields,
      ...buildingMaterialFields,
      ...machineryFields
    });
    
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const selectedCategoryObj = categories.find(c => Number(c.id) === Number(productForm.categoryId));
    const isCropCategory = selectedCategoryObj?.categoryName?.toLowerCase() === "crops";
    const isMilkCategory = selectedCategoryObj?.categoryName?.toLowerCase() === "dairy products";
    const isFertilizerCategory = selectedCategoryObj?.categoryName?.toLowerCase() === "fertilizers";
    const isEquipmentCategory = selectedCategoryObj?.categoryName?.toLowerCase() === "farming equipment";
    const isMaterialCategory = selectedCategoryObj?.categoryName?.toLowerCase() === "building materials";
    const isMachineryCategory = selectedCategoryObj?.categoryName?.toLowerCase() === "machinery";

    if (!isEquipmentCategory && !isMachineryCategory && Number(productForm.price) <= 0) {
      setError("Price must be greater than 0.");
      return;
    }
    if (isEquipmentCategory && productForm.forSale && Number(productForm.price) <= 0) {
      setError("Sale price must be greater than 0 if available for purchase.");
      return;
    }
    if (isEquipmentCategory && !productForm.forSale && !productForm.forRent) {
      setError("Equipment must be available either for sale, for rent, or both.");
      return;
    }
    if (isMachineryCategory) {
      if ((productForm.availableForSale || productForm.availableForBoth) && Number(productForm.price) <= 0) {
        setError("Sale price must be greater than 0 if available for purchase.");
        return;
      }
      if (!productForm.availableForSale && !productForm.availableForRent && !productForm.availableForBoth) {
        setError("Machinery must be available either for sale, for rent, or both.");
        return;
      }
    }

    setFormLoading(true);

    try {
      if (isCropCategory) {
        const cropPayload = {
          id: productForm.cropId || null,
          productId: isEditingProduct ? productForm.id : null,
          productName: productForm.productName,
          cropName: productForm.productName,
          sku: productForm.sku,
          price: Number(productForm.price),
          variety: productForm.variety,
          unit: productForm.unit,
          harvestDate: productForm.harvestDate || null,
          location: productForm.location,
          description: productForm.productDescription,
          quantity: Number(productForm.quantityAvailable),
          imageUrls: uploadedImages.map(img => img.imageUrl),
          images: uploadedImages,
          sellerId: sellerProfile.id,
          cropType: "Cereal",
          growingSeason: "General",
          productStatus: productForm.productStatus
        };

        if (isEditingProduct) {
          await api.put(`/crops/${productForm.cropId}`, cropPayload);
          setSuccess("Crop marketplace listing updated! 🌾");
        } else {
          await api.post("/crops", cropPayload);
          setSuccess("Crop successfully listed on the marketplace! 🌾");
        }
      } else if (isMilkCategory) {
        const milkPayload = {
          id: productForm.milkId || null,
          productId: isEditingProduct ? productForm.id : null,
          productName: productForm.productName,
          sku: productForm.sku,
          price: Number(productForm.price),
          description: productForm.productDescription,
          quantity: Number(productForm.quantityAvailable),
          imageUrls: uploadedImages.map(img => img.imageUrl),
          images: uploadedImages,
          sellerId: sellerProfile.id,
          milkType: productForm.milkType,
          fatPercentage: Number(productForm.fatPercentage),
          dailyAvailability: Boolean(productForm.dailyAvailability),
          deliveryRadius: Number(productForm.deliveryRadius),
          productStatus: productForm.productStatus
        };

        if (isEditingProduct) {
          await api.put(`/milk/${productForm.milkId}`, milkPayload);
          setSuccess("Milk marketplace listing updated! 🥛");
        } else {
          await api.post("/milk", milkPayload);
          setSuccess("Milk successfully listed on the marketplace! 🥛");
        }
      } else if (isFertilizerCategory) {
        const fertilizerPayload = {
          id: productForm.fertilizerId || null,
          productId: isEditingProduct ? productForm.id : null,
          productName: productForm.productName,
          sku: productForm.sku,
          price: Number(productForm.price),
          description: productForm.productDescription,
          quantity: Number(productForm.quantityAvailable),
          imageUrls: uploadedImages.map(img => img.imageUrl),
          images: uploadedImages,
          sellerId: sellerProfile.id,
          brand: productForm.brand,
          manufacturingDate: productForm.manufacturingDate || null,
          expiryDate: productForm.expiryDate || null,
          productStatus: productForm.productStatus
        };

        if (isEditingProduct) {
          await api.put(`/fertilizers/${productForm.fertilizerId}`, fertilizerPayload);
          setSuccess("Fertilizer marketplace listing updated! 🌱");
        } else {
          await api.post("/fertilizers", fertilizerPayload);
          setSuccess("Fertilizer successfully listed on the marketplace! 🌱");
        }
      } else if (isEquipmentCategory) {
        const equipmentPayload = {
          id: productForm.farmingEquipmentId || null,
          productId: isEditingProduct ? productForm.id : null,
          productName: productForm.productName,
          sku: productForm.sku,
          price: productForm.forSale ? Number(productForm.price) : 0,
          description: productForm.productDescription,
          quantity: Number(productForm.quantityAvailable),
          imageUrls: uploadedImages.map(img => img.imageUrl),
          images: uploadedImages,
          sellerId: sellerProfile.id,
          equipmentName: productForm.productName,
          brand: productForm.brand,
          model: productForm.model,
          purchaseYear: productForm.purchaseYear ? Number(productForm.purchaseYear) : null,
          equipmentCondition: productForm.equipmentCondition,
          rentPerHour: productForm.forRent && productForm.rentPerHour ? Number(productForm.rentPerHour) : null,
          rentPerDay: productForm.forRent && productForm.rentPerDay ? Number(productForm.rentPerDay) : null,
          securityDeposit: productForm.forRent && productForm.securityDeposit ? Number(productForm.securityDeposit) : null,
          forSale: Boolean(productForm.forSale),
          forRent: Boolean(productForm.forRent),
          productStatus: productForm.productStatus
        };

        if (isEditingProduct) {
          await api.put(`/equipments/${productForm.farmingEquipmentId}`, equipmentPayload);
          setSuccess("Farming equipment marketplace listing updated! 🚜");
        } else {
          await api.post("/equipments", equipmentPayload);
          setSuccess("Farming equipment successfully listed on the marketplace! 🚜");
        }
      } else if (isMaterialCategory) {
        const materialPayload = {
          id: productForm.buildingMaterialId || null,
          productId: isEditingProduct ? productForm.id : null,
          productName: productForm.productName,
          sku: productForm.sku,
          price: Number(productForm.price),
          description: productForm.productDescription,
          quantity: Number(productForm.quantityAvailable),
          imageUrls: uploadedImages.map(img => img.imageUrl),
          images: uploadedImages,
          sellerId: sellerProfile.id,
          materialType: productForm.materialType,
          unit: productForm.unit,
          deliveryAvailable: Boolean(productForm.deliveryAvailable),
          productStatus: productForm.productStatus
        };

        if (isEditingProduct) {
          await api.put(`/materials/${productForm.buildingMaterialId}`, materialPayload);
          setSuccess("Building material marketplace listing updated! 🧱");
        } else {
          await api.post("/materials", materialPayload);
          setSuccess("Building material successfully listed on the marketplace! 🧱");
        }
      } else if (isMachineryCategory) {
        const machineryPayload = {
          id: productForm.machineryId || null,
          productId: isEditingProduct ? productForm.id : null,
          productName: productForm.productName,
          sku: productForm.sku,
          description: productForm.productDescription,
          quantityAvailable: Number(productForm.quantityAvailable),
          imageUrls: uploadedImages.map(img => img.imageUrl),
          images: uploadedImages,
          sellerId: sellerProfile.id,
          
          machineryType: productForm.machineryType,
          brandName: productForm.brandName,
          modelNumber: productForm.modelNumber,
          manufacturingYear: productForm.manufacturingYear ? Number(productForm.manufacturingYear) : null,
          conditionStatus: productForm.conditionStatus,
          
          price: productForm.availableForSale || productForm.availableForBoth ? Number(productForm.price) : null,
          negotiable: Boolean(productForm.negotiable),
          rentPerHour: productForm.availableForRent || productForm.availableForBoth ? Number(productForm.rentPerHour) : null,
          rentPerDay: productForm.availableForRent || productForm.availableForBoth ? Number(productForm.rentPerDay) : null,
          rentPerWeek: productForm.availableForRent || productForm.availableForBoth ? Number(productForm.rentPerWeek) : null,
          securityDeposit: productForm.availableForRent || productForm.availableForBoth ? Number(productForm.securityDeposit) : null,
          
          availableForSale: Boolean(productForm.availableForSale),
          availableForRent: Boolean(productForm.availableForRent),
          availableForBoth: Boolean(productForm.availableForBoth),
          
          state: productForm.state,
          district: productForm.district,
          villageCity: productForm.villageCity,
          pincode: productForm.pincode,
          gpsLocation: productForm.gpsLocation,
          
          videoUrl: productForm.videoUrl,
          registrationCertificateUrl: productForm.registrationCertificateUrl,
          insuranceDocumentUrl: productForm.insuranceDocumentUrl,
          
          engineType: productForm.engineType,
          powerHp: productForm.powerHp ? Number(productForm.powerHp) : null,
          capacitySpecification: productForm.capacitySpecification,
          maintenanceIntervalHours: productForm.maintenanceIntervalHours ? Number(productForm.maintenanceIntervalHours) : null,
          warrantyYears: productForm.warrantyYears ? Number(productForm.warrantyYears) : null,
          fuelEfficiency: productForm.fuelEfficiency,
          noiseLevelDb: productForm.noiseLevelDb ? Number(productForm.noiseLevelDb) : null,
          enginePower: productForm.enginePower,
          fuelType: productForm.fuelType,
          workingWidth: productForm.workingWidth,
          weight: productForm.weight,
          otherSpecifications: productForm.otherSpecifications,
          
          sellerContactName: productForm.sellerContactName,
          mobileNumber: productForm.mobileNumber,
          alternateNumber: productForm.alternateNumber,
          whatsappNumber: productForm.whatsappNumber,
          productStatus: productForm.productStatus
        };

        if (isEditingProduct) {
          await api.put(`/machinery/${productForm.machineryId}`, machineryPayload);
          setSuccess("Machinery listing updated! 🚜");
        } else {
          await api.post("/machinery", machineryPayload);
          setSuccess("Machinery successfully listed on the marketplace! 🚜");
        }
      } else {
        const payload = {
          productName: productForm.productName,
          sku: productForm.sku,
          shortDescription: productForm.shortDescription,
          productDescription: productForm.productDescription,
          price: Number(productForm.price),
          discountPrice: productForm.discountPrice ? Number(productForm.discountPrice) : null,
          categoryId: Number(productForm.categoryId),
          subcategoryId: productForm.subcategoryId ? Number(productForm.subcategoryId) : null,
          sellerId: sellerProfile.id,
          productStatus: productForm.productStatus,
          isFeatured: false,
          isBestseller: false,
          images: uploadedImages,
          inventory: {
            quantityAvailable: Number(productForm.quantityAvailable),
            reorderLevel: Number(productForm.reorderLevel),
            reorderQuantity: 50
          }
        };

        if (isEditingProduct) {
          await api.put(`/products/${productForm.id}`, payload);
          setSuccess("Product updated successfully! 🌾");
        } else {
          await api.post("/products", payload);
          setSuccess("Product successfully listed! 🌾");
        }
      }
      setShowProductModal(false);
      fetchMerchantProducts();
      fetchDashboardStats();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to list product. Ensure SKU is unique.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (product) => {
    setLoadingStatusId(product.id);
    setError("");
    setSuccess("");
    try {
      const newStatus = product.productStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await api.patch(`/seller/listings/products/${product.id}/status`, null, {
        params: { status: newStatus }
      });
      setSuccess(`Listing status updated to ${newStatus}!`);
      await fetchMerchantProducts();
      await fetchSellerStats();
    } catch (err) {
      console.error(err);
      setError("Failed to toggle listing status.");
    } finally {
      setLoadingStatusId(null);
    }
  };

  const handleInlineStockSave = async (productId) => {
    if (tempStockValue === "" || isNaN(tempStockValue) || Number(tempStockValue) < 0) {
      setError("Invalid stock quantity");
      return;
    }
    setError("");
    setSuccess("");
    try {
      await api.patch(`/seller/listings/products/${productId}/stock`, null, {
        params: { quantity: Number(tempStockValue) }
      });
      setSuccess("Stock level updated successfully!");
      setEditingStockId(null);
      await fetchMerchantProducts();
      await fetchSellerStats();
    } catch (err) {
      console.error(err);
      setError("Failed to update stock.");
    }
  };

  const handleBulkStatusChange = async (targetStatus) => {
    setError("");
    setSuccess("");
    try {
      await api.post("/seller/listings/products/bulk-status", {
        ids: selectedProductIds,
        status: targetStatus
      });
      setSuccess(`Bulk updated ${selectedProductIds.length} listings to ${targetStatus}!`);
      setSelectedProductIds([]);
      await fetchMerchantProducts();
      await fetchSellerStats();
    } catch (err) {
      console.error(err);
      setError("Failed to execute bulk status change.");
    }
  };

  const handleBulkStockPrompt = async () => {
    const qty = prompt("Enter new stock quantity for selected listings:");
    if (qty === null) return;
    if (qty === "" || isNaN(qty) || Number(qty) < 0) {
      setError("Invalid quantity entered.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      await api.post("/seller/listings/products/bulk-stock", {
        ids: selectedProductIds,
        quantity: Number(qty)
      });
      setSuccess(`Bulk updated stock for ${selectedProductIds.length} listings to ${qty}!`);
      setSelectedProductIds([]);
      await fetchMerchantProducts();
      await fetchSellerStats();
    } catch (err) {
      console.error(err);
      setError("Failed to execute bulk stock update.");
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm("Are you sure you want to delete this product listing?")) return;
    setError("");
    setSuccess("");
    try {
      const catObj = categories.find(c => Number(c.id) === Number(product.categoryId));
      const isCrop = catObj?.categoryName?.toLowerCase() === "crops";
      const isMilk = catObj?.categoryName?.toLowerCase() === "dairy products";
      const isFertilizer = catObj?.categoryName?.toLowerCase() === "fertilizers";
      const isEquipment = catObj?.categoryName?.toLowerCase() === "farming equipment";
      const isMaterial = catObj?.categoryName?.toLowerCase() === "building materials";
      const isMachinery = catObj?.categoryName?.toLowerCase() === "machinery";
      
      if (isCrop) {
        // Fetch crop details to get the Crop ID
        const response = await api.get(`/crops/product/${product.id}`);
        const cData = response.data?.data || response.data;
        if (cData && cData.id) {
          await api.delete(`/crops/${cData.id}`);
        } else {
          await api.delete(`/products/${product.id}`);
        }
      } else if (isMilk) {
        // Fetch milk details to get the Milk ID
        const response = await api.get(`/milk/product/${product.id}`);
        const mData = response.data?.data || response.data;
        if (mData && mData.id) {
          await api.delete(`/milk/${mData.id}`);
        } else {
          await api.delete(`/products/${product.id}`);
        }
      } else if (isFertilizer) {
        // Fetch fertilizer details to get the Fertilizer ID
        const response = await api.get(`/fertilizers/product/${product.id}`);
        const fData = response.data?.data || response.data;
        if (fData && fData.id) {
          await api.delete(`/fertilizers/${fData.id}`);
        } else {
          await api.delete(`/products/${product.id}`);
        }
      } else if (isMaterial) {
        // Fetch material details to get the Material ID
        const response = await api.get(`/materials/product/${product.id}`);
        const bmData = response.data?.data || response.data;
        if (bmData && bmData.id) {
          await api.delete(`/materials/${bmData.id}`);
        } else {
          await api.delete(`/products/${product.id}`);
        }
      } else if (isEquipment) {
        // Fetch equipment details to get the Equipment ID
        const response = await api.get(`/equipments/product/${product.id}`);
        const eqData = response.data?.data || response.data;
        if (eqData && eqData.id) {
          await api.delete(`/equipments/${eqData.id}`);
        } else {
          await api.delete(`/products/${product.id}`);
        }
      } else if (isMachinery) {
        // Fetch machinery details to get the Machinery ID
        const response = await api.get(`/machinery/product/${product.id}`);
        const mData = response.data?.data || response.data;
        if (mData && mData.id) {
          await api.delete(`/machinery/${mData.id}`);
        } else {
          await api.delete(`/products/${product.id}`);
        }
      } else {
        await api.delete(`/products/${product.id}`);
      }
      setSuccess("Product deleted successfully.");
      fetchMerchantProducts();
      fetchDashboardStats();
    } catch (err) {
      console.error(err);
      setError("Failed to delete product.");
    }
  };

  // Order Management Actions
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setError("");
    setSuccess("");
    try {
      await api.put(`/orders/${orderId}/status?status=${newStatus}`);
      setSuccess(`Order status updated to ${newStatus} successfully!`);
      fetchMerchantOrders();
      fetchDashboardStats();
    } catch (err) {
      console.error(err);
      setError("Failed to update order status.");
    }
  };

  // Update Settings Handlers
  const handleSaveSettings = async (type) => {
    setSettingsLoading(true);
    setError("");
    setSuccess("");
    
    let payload = {};
    if (type === "SHOP") {
      payload = { ...shopSettings };
    } else if (type === "ADDRESS") {
      payload = { ...addressSettings };
    } else if (type === "PAYMENT") {
      payload = { ...paymentSettings };
    }

    try {
      const response = await api.put(`/sellers/${sellerProfile.id}`, payload);
      const updatedProfile = response.data?.data || response.data;
      setSellerProfile(updatedProfile);
      setSuccess("Settings updated successfully! 🌾");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save settings. Please verify details.");
    } finally {
      setSettingsLoading(false);
    }
  };

  // Generate SVG custom chart data
  const renderEarningsChart = () => {
    if (!dashboardStats?.monthlySales) return null;
    const maxSales = Math.max(...dashboardStats.monthlySales.map(m => m.sales || 0), 1000);
    const chartHeight = 220;
    const chartWidth = 700;
    const padding = 40;
    const barWidth = 35;
    const spacing = 18;

    return (
      <div className="relative bg-white rounded-3xl p-6 border border-green-100 shadow-md overflow-x-auto">
        <h4 className="text-lg font-black text-green-950 mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-600" size={20} />
          Monthly Revenue Analysis ({new Date().getFullYear()})
        </h4>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[550px]">
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding + (chartHeight - padding * 2) * (1 - ratio);
            const val = Math.round(maxSales * ratio);
            return (
              <g key={idx}>
                <line x1={padding * 1.5} y1={y} x2={chartWidth - padding} y2={y} stroke="#f0fdf4" strokeWidth="1.5" />
                <text x={padding * 1.2} y={y + 4} textAnchor="end" className="text-[10px] font-bold fill-gray-400">
                  ₹{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                </text>
              </g>
            );
          })}

          {/* Bar Chart rendering */}
          {dashboardStats.monthlySales.map((m, idx) => {
            const x = padding * 1.8 + idx * (barWidth + spacing);
            const contentHeight = chartHeight - padding * 2;
            const barHeight = ((m.sales || 0) / maxSales) * contentHeight;
            const y = chartHeight - padding - barHeight;

            return (
              <g key={idx} className="group cursor-pointer">
                {/* Background Hover Highlight bar */}
                <rect
                  x={x - 4}
                  y={padding}
                  width={barWidth + 8}
                  height={contentHeight + 8}
                  fill="transparent"
                  className="hover:fill-green-50/30 transition rounded-xl"
                />
                
                {/* Solid bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 3)}
                  rx="6"
                  className="fill-green-600 hover:fill-green-700 transition-all duration-300"
                />

                {/* Sales tooltip on hover */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <rect x={x - 15} y={y - 32} width={barWidth + 30} height={24} rx="6" fill="#14532d" />
                  <text x={x + barWidth / 2} y={y - 16} textAnchor="middle" className="text-[10px] font-black fill-white">
                    ₹{m.sales?.toLocaleString("en-IN") || 0}
                  </text>
                </g>

                {/* X axis Label */}
                <text x={x + barWidth / 2} y={chartHeight - padding + 18} textAnchor="middle" className="text-[10px] font-bold fill-gray-600">
                  {m.month.substring(0, 3)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[70vh]">
      {/* Sidebar navigation */}
      <div className="lg:w-64 flex-shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 border-b lg:border-b-0 lg:border-r border-green-50 pr-0 lg:pr-6">
        {[
          { id: "OVERVIEW", label: "Dashboard", icon: Package },
          { id: "ANALYTICS", label: "Analytics", icon: BarChart2 },
          { id: "PRODUCTS", label: "My Products", icon: ShoppingBag },
          { id: "LAND_LISTINGS", label: "My Land Listings", icon: MapPin },
          { id: "LAND_VISITS", label: "Land Visits", icon: Calendar },
          { id: "ORDERS", label: "Client Orders", icon: FileText },
          { id: "RENTALS", label: "Rental Bookings", icon: Calendar },
          { id: "EARNINGS", label: "Earning Insights", icon: TrendingUp },
          { id: "SETTINGS", label: "Store Settings", icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition whitespace-nowrap text-sm ${
                activeTab === tab.id
                  ? "bg-green-600 text-white shadow-lg shadow-green-100"
                  : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-100/80"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-grow space-y-6">
        {/* Global Notifications */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl flex items-center gap-3 font-semibold animate-fadeIn">
            <CheckCircle className="text-green-600 flex-shrink-0" size={22} />
            <div className="text-sm">{success}</div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 font-semibold animate-fadeIn">
            <AlertCircle className="text-red-600 flex-shrink-0" size={22} />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {/* TAB: ANALYTICS */}
        {activeTab === "ANALYTICS" && (
          <SellerAnalyticsDashboard sellerProfile={sellerProfile} />
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Quick Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-gradient-to-br from-green-600 to-green-800 text-white rounded-3xl p-6 shadow-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider opacity-80">Store Revenue</span>
                  <h3 className="text-2xl font-black mt-2">
                    ₹{dashboardStats?.totalRevenue?.toLocaleString("en-IN") || "0"}
                  </h3>
                </div>
                <div className="bg-white/20 p-2.5 rounded-xl">
                  <IndianRupee size={22} />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Products</span>
                  <h3 className="text-2xl font-black text-green-950 mt-2">{dashboardStats?.totalProducts || 0}</h3>
                </div>
                <div className="bg-green-50 text-green-700 p-2.5 rounded-xl">
                  <ShoppingBag size={22} />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Orders</span>
                  <h3 className="text-2xl font-black text-green-950 mt-2">{dashboardStats?.totalOrders || 0}</h3>
                </div>
                <div className="bg-green-50 text-green-700 p-2.5 rounded-xl">
                  <FileText size={22} />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Pending Orders</span>
                  <h3 className="text-2xl font-black text-yellow-600 mt-2">{dashboardStats?.pendingOrdersCount || 0}</h3>
                </div>
                <div className="bg-yellow-50 text-yellow-700 p-2.5 rounded-xl">
                  <AlertCircle size={22} />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Completed Orders</span>
                  <h3 className="text-2xl font-black text-green-700 mt-2">{dashboardStats?.completedOrdersCount || 0}</h3>
                </div>
                <div className="bg-green-50 text-green-700 p-2.5 rounded-xl">
                  <CheckCircle size={22} />
                </div>
              </div>
            </div>

            {/* Quick action shortcuts & Recent Activity */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[32px] p-6 border border-green-50 shadow-lg">
                  <h3 className="text-xl font-black text-green-950 mb-4 flex items-center gap-2">
                    <FileText className="text-green-600" size={20} />
                    Recent Client Orders
                  </h3>
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 font-bold">No orders received yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 3).map(order => (
                        <div key={order.id} className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-green-200 transition">
                          <div>
                            <div className="font-extrabold text-green-950 text-sm">{order.orderNumber}</div>
                            <div className="text-xs text-gray-400 font-bold mt-1">Client: {order.buyerName}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-extrabold text-green-700 text-sm">{formatPrice(order.totalAmount)}</div>
                            <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full mt-1.5 uppercase ${
                              order.orderStatus === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                              order.orderStatus === "DELIVERED" ? "bg-green-100 text-green-800" :
                              order.orderStatus === "CANCELLED" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                            }`}>
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => handleTabChange("ORDERS")}
                        className="w-full py-3 bg-green-50 hover:bg-green-100 text-green-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                      >
                        View All Orders <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-[32px] p-6 border border-green-50 shadow-lg text-center">
                  <Building className="mx-auto text-green-600 mb-3" size={36} />
                  <h4 className="text-base font-black text-green-950">{sellerProfile.businessName}</h4>
                  <p className="text-xs text-gray-400 font-bold mt-1">{sellerProfile.businessCategory} Firm</p>
                  <div className="border-t border-gray-100 my-4 pt-4 text-left space-y-2.5 text-xs text-gray-500 font-semibold">
                    <div className="flex justify-between"><span>PAN No:</span> <strong className="text-gray-700">{sellerProfile.panNumber}</strong></div>
                    <div className="flex justify-between"><span>Status:</span> <strong className="text-green-700 uppercase">{sellerProfile.sellerStatus}</strong></div>
                  </div>
                  <button
                    onClick={() => handleTabChange("SETTINGS")}
                    className="w-full py-3 border border-gray-200 hover:bg-gray-50 font-bold text-xs text-gray-700 rounded-xl transition"
                  >
                    Edit Shop Information
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS */}
        {activeTab === "PRODUCTS" && (
          <div className="bg-white rounded-[32px] p-8 border border-green-50 shadow-lg space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black text-green-950 flex items-center gap-2">
                  <ShoppingBag className="text-green-600" size={24} />
                  Manage Store Inventory
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-1">Add products, edit details, and keep track of your active stock levels.</p>
              </div>
              <button
                onClick={openAddModal}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-lg transition"
              >
                <Plus size={18} />
                Add New Product
              </button>
            </div>

            {/* Inventory summary bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { id: "ALL", label: "Total Listings", val: sellerStats.totalListings, color: "border-green-100 text-green-950 bg-green-50/10" },
                { id: "ACTIVE", label: "Active Listings", val: sellerStats.activeListings, color: "border-emerald-250 text-emerald-800 bg-emerald-50/10" },
                { id: "INACTIVE", label: "Draft/Inactive", val: sellerStats.inactiveListings, color: "border-gray-200 text-gray-500 bg-gray-50/20" },
                { id: "LOW_STOCK", label: "Low Stock Alert", val: sellerStats.lowStockListings, color: "border-amber-250 text-amber-700 bg-amber-50/20" },
                { id: "OUT_OF_STOCK", label: "Out of Stock", val: sellerStats.outOfStockListings, color: "border-red-200 text-red-600 bg-red-50/10" }
              ].map(card => (
                <button
                  key={card.id}
                  onClick={() => setProductFilter(card.id)}
                  className={`border rounded-2xl p-4 text-left transition hover:shadow-sm ${card.color} ${
                    productFilter === card.id ? "ring-2 ring-green-600 shadow-md font-black" : ""
                  }`}
                >
                  <span className="text-[10px] uppercase font-black tracking-wider block opacity-75">{card.label}</span>
                  <span className="text-2xl font-black block mt-2">{card.val}</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 font-bold">Fetching product list...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                <h4 className="text-lg font-bold text-gray-700">Your store is empty</h4>
                <p className="text-sm text-gray-400 mt-1">Click the add button above to list crops, machinery, or fertilizers.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-100 relative pb-16">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase border-b border-gray-100">
                      <th className="p-4 pl-3 w-8">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          checked={
                            products.filter(p => {
                              const stockVal = p.inventory?.quantityAvailable ?? 0;
                              const reorderVal = p.inventory?.reorderLevel ?? 10;
                              const isLowStock = (stockVal - (p.inventory?.quantityReserved ?? 0)) <= reorderVal && stockVal > 0;
                              const isOutOfStock = (stockVal - (p.inventory?.quantityReserved ?? 0)) <= 0;
                              if (productFilter === "ACTIVE") return p.productStatus === "ACTIVE";
                              if (productFilter === "INACTIVE") return p.productStatus === "INACTIVE" || p.productStatus === "DRAFT";
                              if (productFilter === "LOW_STOCK") return isLowStock && p.productStatus === "ACTIVE";
                              if (productFilter === "OUT_OF_STOCK") return isOutOfStock;
                              return true;
                            }).length > 0 &&
                            selectedProductIds.length === products.filter(p => {
                              const stockVal = p.inventory?.quantityAvailable ?? 0;
                              const reorderVal = p.inventory?.reorderLevel ?? 10;
                              const isLowStock = (stockVal - (p.inventory?.quantityReserved ?? 0)) <= reorderVal && stockVal > 0;
                              const isOutOfStock = (stockVal - (p.inventory?.quantityReserved ?? 0)) <= 0;
                              if (productFilter === "ACTIVE") return p.productStatus === "ACTIVE";
                              if (productFilter === "INACTIVE") return p.productStatus === "INACTIVE" || p.productStatus === "DRAFT";
                              if (productFilter === "LOW_STOCK") return isLowStock && p.productStatus === "ACTIVE";
                              if (productFilter === "OUT_OF_STOCK") return isOutOfStock;
                              return true;
                            }).length
                          }
                          onChange={(e) => {
                            const filteredList = products.filter(p => {
                              const stockVal = p.inventory?.quantityAvailable ?? 0;
                              const reorderVal = p.inventory?.reorderLevel ?? 10;
                              const isLowStock = (stockVal - (p.inventory?.quantityReserved ?? 0)) <= reorderVal && stockVal > 0;
                              const isOutOfStock = (stockVal - (p.inventory?.quantityReserved ?? 0)) <= 0;
                              if (productFilter === "ACTIVE") return p.productStatus === "ACTIVE";
                              if (productFilter === "INACTIVE") return p.productStatus === "INACTIVE" || p.productStatus === "DRAFT";
                              if (productFilter === "LOW_STOCK") return isLowStock && p.productStatus === "ACTIVE";
                              if (productFilter === "OUT_OF_STOCK") return isOutOfStock;
                              return true;
                            });
                            if (e.target.checked) {
                              setSelectedProductIds(filteredList.map(p => p.id));
                            } else {
                              setSelectedProductIds([]);
                            }
                          }}
                        />
                      </th>
                      <th className="p-4 pl-3">Product Details</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {products
                      .filter(product => {
                        const stockVal = product.inventory?.quantityAvailable ?? 0;
                        const reorderVal = product.inventory?.reorderLevel ?? 10;
                        const isLowStock = (stockVal - (product.inventory?.quantityReserved ?? 0)) <= reorderVal && stockVal > 0;
                        const isOutOfStock = (stockVal - (product.inventory?.quantityReserved ?? 0)) <= 0;
                        if (productFilter === "ACTIVE") return product.productStatus === "ACTIVE";
                        if (productFilter === "INACTIVE") return product.productStatus === "INACTIVE" || product.productStatus === "DRAFT";
                        if (productFilter === "LOW_STOCK") return isLowStock && product.productStatus === "ACTIVE";
                        if (productFilter === "OUT_OF_STOCK") return isOutOfStock;
                        return true;
                      })
                      .map((product) => {
                        const stockVal = product.inventory?.quantityAvailable ?? 0;
                        const reorderVal = product.inventory?.reorderLevel ?? 10;
                        const reservedVal = product.inventory?.quantityReserved ?? 0;
                        const availableVal = stockVal - reservedVal;
                        return (
                          <tr key={product.id} className="hover:bg-gray-50/50 transition">
                            <td className="p-4 pl-3">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                checked={selectedProductIds.includes(product.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProductIds(prev => [...prev, product.id]);
                                  } else {
                                    setSelectedProductIds(prev => prev.filter(id => id !== product.id));
                                  }
                                }}
                              />
                            </td>
                            <td className="p-4 pl-3">
                              <div className="flex items-center gap-3.5">
                                <div className="w-14 h-14 rounded-2xl bg-green-50 overflow-hidden flex items-center justify-center border border-green-100 shadow-inner flex-shrink-0">
                                  {product.images && product.images[0] ? (
                                    <img src={product.images[0].imageUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="text-green-600" size={24} />
                                  )}
                                </div>
                                <div>
                                  <div className="font-extrabold text-gray-950 text-base">{product.productName}</div>
                                  <div className="text-xs text-gray-400 font-bold mt-0.5">{product.categoryName} {product.subcategoryName ? `> ${product.subcategoryName}` : ""}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-mono font-bold text-gray-600 text-xs">{product.sku}</td>
                            <td className="p-4">
                              {editingStockId === product.id ? (
                                <div className="flex items-center gap-1.5 animate-fadeIn">
                                  <input
                                    type="number"
                                    value={tempStockValue}
                                    onChange={(e) => setTempStockValue(e.target.value)}
                                    className="w-16 border border-gray-300 px-2 py-1 rounded-lg text-xs font-mono font-extrabold focus:ring-1 focus:ring-green-500 focus:outline-none"
                                    min="0"
                                  />
                                  <button
                                    onClick={() => handleInlineStockSave(product.id)}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white font-extrabold text-[10px] rounded-lg transition"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingStockId(null)}
                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-500 text-[10px] font-bold rounded-lg transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 group/stock">
                                  <div className="flex flex-col">
                                    <span className={`font-extrabold ${availableVal <= reorderVal ? "text-amber-600" : "text-gray-800"} ${availableVal <= 0 ? "text-red-600" : ""}`}>
                                      {availableVal} units available
                                    </span>
                                    {reservedVal > 0 && (
                                      <span className="text-[10px] text-gray-400 font-bold">
                                        ({stockVal} total, {reservedVal} reserved)
                                      </span>
                                    )}
                                    {availableVal <= 0 ? (
                                      <span className="text-[10px] text-red-500 font-black uppercase mt-0.5">Out of Stock Alert</span>
                                    ) : availableVal <= reorderVal ? (
                                      <span className="text-[10px] text-amber-500 font-black uppercase mt-0.5">Low Stock Alert</span>
                                    ) : null}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setEditingStockId(product.id);
                                      setTempStockValue(stockVal);
                                    }}
                                    className="opacity-0 group-hover/stock:opacity-100 p-1 hover:bg-gray-150 rounded-lg text-green-600 transition cursor-pointer"
                                    title="Quick Stock Edit"
                                  >
                                    <Edit size={12} />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <span className="font-extrabold text-green-800">{formatPrice(product.price)}</span>
                              {product.discountPrice && (
                                <div className="text-xs text-gray-400 line-through mt-0.5">{formatPrice(product.discountPrice)}</div>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  product.productStatus === "ACTIVE" ? "bg-green-50 text-green-700 border border-green-200" :
                                  product.productStatus === "DRAFT" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                  "bg-gray-50 text-gray-600 border border-gray-200"
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    product.productStatus === "ACTIVE" ? "bg-green-600 animate-pulse" :
                                    product.productStatus === "DRAFT" ? "bg-amber-500" :
                                    "bg-gray-400"
                                  }`}></span>
                                  {product.productStatus || "ACTIVE"}
                                </span>
                                <button
                                  onClick={() => handleToggleStatus(product)}
                                  className={`p-1.5 rounded-lg border transition ${
                                    product.productStatus === "ACTIVE" 
                                      ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" 
                                      : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"
                                  }`}
                                  title={product.productStatus === "ACTIVE" ? "Pause Listing" : "Activate Listing"}
                                  disabled={loadingStatusId === product.id}
                                >
                                  <RefreshCw size={12} className={loadingStatusId === product.id ? "animate-spin" : ""} />
                                </button>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openEditModal(product)}
                                  className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-xl transition"
                                  title="Edit Product"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition"
                                  title="Delete Product"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>

                {/* Bulk Actions Floating Toolbar */}
                {selectedProductIds.length > 0 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl flex items-center gap-6 shadow-2xl z-50 border border-slate-700/50 animate-slideUp">
                    <span className="text-xs font-bold font-mono text-slate-300">
                      {selectedProductIds.length} items selected
                    </span>
                    
                    <div className="h-4 w-[1px] bg-slate-700"></div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBulkStatusChange("ACTIVE")}
                        className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
                      >
                        Bulk Activate
                      </button>
                      <button
                        onClick={() => handleBulkStatusChange("INACTIVE")}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
                      >
                        Bulk Pause
                      </button>
                      <button
                        onClick={handleBulkStockPrompt}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
                      >
                        Bulk Stock Update
                      </button>
                      <button
                        onClick={() => setSelectedProductIds([])}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition"
                      >
                        Deselect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* LAND LISTINGS TAB */}
        {activeTab === "LAND_LISTINGS" && (
          <div className="bg-white rounded-[32px] p-8 border border-green-50 shadow-lg space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black text-green-950 flex items-center gap-2">
                  <MapPin className="text-green-600" size={24} />
                  Manage Agricultural Lands
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-1">List agricultural plots, update pricing, soil/water information, and coordinates.</p>
              </div>
              <button
                onClick={openAddLandModal}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-lg transition"
              >
                <Plus size={18} />
                Add Land Listing
              </button>
            </div>

            {landListingsLoading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 font-bold">Loading land listings...</p>
              </div>
            ) : landListings.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                <h4 className="text-lg font-bold text-gray-700">No Land Listings Yet</h4>
                <p className="text-sm text-gray-400 mt-1">Click the button above to post your first agricultural land listing.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {landListings.map((land) => (
                  <div key={land.id} className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition bg-white flex flex-col">
                    <div className="relative h-48 bg-gray-100">
                      {land.images && land.images.length > 0 ? (
                        <img
                          src={land.images[0].imageUrl}
                          alt={land.landTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-green-50 text-green-700">
                          <MapPin size={48} />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-black text-green-800 border border-green-100 shadow-sm">
                        {land.landStatus || "AVAILABLE"}
                      </div>
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <h4 className="text-lg font-black text-green-950 line-clamp-1">{land.landTitle}</h4>
                        <p className="text-xs text-gray-400 font-bold flex items-center gap-1 mt-1">
                          <MapPin size={12} />
                          {[land.village, land.taluka, land.district, land.state].filter(Boolean).join(", ")}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-green-50/50 rounded-2xl border border-green-50/20 text-xs">
                          <div>
                            <span className="text-gray-400 block font-bold">Area</span>
                            <span className="font-extrabold text-green-900">{land.areaInAcres} {land.areaUnit || "acres"}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-bold">Soil Type</span>
                            <span className="font-extrabold text-green-900 line-clamp-1">{land.soilInformation || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-bold">Electricity</span>
                            <span className="font-extrabold text-green-900">{land.electricityAvailability ? "Available" : "Not Available"}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-bold">Road</span>
                            <span className="font-extrabold text-green-900 line-clamp-1">{land.roadConnectivity || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-2">
                        <div>
                          <span className="text-[10px] text-gray-400 font-black block uppercase tracking-wider">Price</span>
                          <span className="text-lg font-black text-green-700">{formatPrice(land.pricePerAcre)} <span className="text-xs font-normal text-gray-400">/{land.areaUnit || "acre"}</span></span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const nextStatuses = {
                                AVAILABLE: "UNDER_NEGOTIATION",
                                UNDER_NEGOTIATION: "SOLD",
                                SOLD: "DELISTED",
                                DELISTED: "AVAILABLE"
                              };
                              const nextStatus = nextStatuses[land.landStatus] || "AVAILABLE";
                              try {
                                await api.patch(`/seller/listings/lands/${land.id}/status`, null, {
                                  params: { status: nextStatus }
                                });
                                setSuccess(`Land status updated to ${nextStatus}!`);
                                fetchSellerLandListings();
                                fetchSellerStats();
                              } catch (err) {
                                console.error(err);
                                setError("Failed to update land status.");
                              }
                            }}
                            className="p-2.5 rounded-xl border border-green-100 hover:bg-green-50 text-green-600 transition"
                            title="Toggle Status"
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button
                            onClick={() => openEditLandModal(land)}
                            className="p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-600 transition"
                            title="Edit Listing"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteLand(land)}
                            className="p-2.5 rounded-xl border border-red-100 hover:bg-red-50 text-red-600 transition"
                            title="Delete Listing"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LAND VISITS TAB */}
        {activeTab === "LAND_VISITS" && (
          <div className="bg-white rounded-[32px] p-8 border border-green-50 shadow-lg space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-2xl font-black text-green-950 flex items-center gap-2">
                <Calendar className="text-green-600" size={24} />
                Land Visits & Inquiries
              </h3>
              <p className="text-xs text-gray-400 font-bold mt-1">Review buyer site visit requests, update schedules, and contact details.</p>
            </div>

            {landVisitsLoading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 font-bold">Loading visit requests...</p>
              </div>
            ) : landVisits.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                <h4 className="text-lg font-bold text-gray-700">No Visit Requests Yet</h4>
                <p className="text-sm text-gray-400 mt-1">Visit inquiries from buyers will show up here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {landVisits.map((visit) => (
                  <div key={visit.id} className="border border-gray-100 rounded-3xl p-6 bg-white shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition">
                    <div className="space-y-3 flex-grow">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-extrabold text-green-900 bg-green-50 px-3 py-1 rounded-full text-xs">
                          {visit.landTitle}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          visit.requestStatus === "PENDING"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : visit.requestStatus === "APPROVED"
                            ? "bg-green-50 text-green-700 border-green-100"
                            : visit.requestStatus === "COMPLETED"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : "bg-red-50 text-red-700 border-red-100"
                        }`}>
                          {visit.requestStatus}
                        </span>
                      </div>
                      
                      <h4 className="text-md font-bold text-gray-800 flex items-center gap-1.5">
                        Inquiry from: <span className="font-black text-green-950">{visit.buyerName}</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-500 font-semibold">
                        <div>
                          <span className="text-gray-400 block font-bold">Phone</span>
                          <span className="text-green-900 font-bold">{visit.buyerPhone}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-bold">Email</span>
                          <span className="text-green-900 font-bold">{visit.buyerEmail}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-bold">Proposed Visit</span>
                          <span className="text-green-900 font-black">{visit.visitDate} at {visit.visitTime}</span>
                        </div>
                      </div>

                      {visit.message && (
                        <div className="p-3 bg-gray-50 rounded-2xl text-xs text-gray-600 italic border border-gray-100/50">
                          "{visit.message}"
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col justify-end items-center gap-2 flex-shrink-0">
                      {visit.requestStatus === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleUpdateLandVisitStatus(visit.id, "APPROVED")}
                            className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition shadow shadow-green-100"
                          >
                            Approve Visit
                          </button>
                          <button
                            onClick={() => handleUpdateLandVisitStatus(visit.id, "CANCELLED")}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs px-4 py-2 rounded-xl transition border border-red-100"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {visit.requestStatus === "APPROVED" && (
                        <>
                          <button
                            onClick={() => handleUpdateLandVisitStatus(visit.id, "COMPLETED")}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition shadow shadow-blue-100"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => handleUpdateLandVisitStatus(visit.id, "CANCELLED")}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs px-4 py-2 rounded-xl transition border border-red-100"
                          >
                            Cancel Visit
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === "ORDERS" && (
          <div className="bg-white rounded-[32px] p-8 border border-green-50 shadow-lg space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-2xl font-black text-green-950 flex items-center gap-2">
                <FileText className="text-green-600" size={24} />
                Client Orders Board
              </h3>
              <p className="text-xs text-gray-400 font-bold mt-1">Monitor purchases, accept requests, and update order statuses.</p>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <h4 className="text-lg font-bold text-gray-700">No client orders</h4>
                <p className="text-sm text-gray-400 mt-1">When buyers order your products, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-100 rounded-3xl p-6 bg-gray-50/50 shadow-sm space-y-4 hover:border-green-100 transition">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Order Reference</span>
                        <div className="font-extrabold text-green-950 text-base flex items-center gap-2">
                          {order.orderNumber}
                          <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                            order.orderStatus === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                            order.orderStatus === "ACCEPTED" ? "bg-indigo-100 text-indigo-800" :
                            order.orderStatus === "PACKED" ? "bg-orange-100 text-orange-800" :
                            order.orderStatus === "SHIPPED" ? "bg-purple-100 text-purple-800" :
                            order.orderStatus === "OUT_FOR_DELIVERY" ? "bg-pink-100 text-pink-850" :
                            order.orderStatus === "DELIVERED" ? "bg-green-100 text-green-800" :
                            order.orderStatus === "CANCELLED" ? "bg-red-100 text-red-800" :
                            order.orderStatus === "RETURNED" ? "bg-amber-100 text-amber-800" :
                            order.orderStatus === "REFUNDED" ? "bg-teal-100 text-teal-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {order.orderStatus}
                          </span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Settlement Amount</span>
                        <div className="font-extrabold text-green-800 text-base">
                          {formatPrice(order.sellerAmount != null ? order.sellerAmount : order.totalAmount)}
                        </div>
                        {order.platformFee > 0 && (
                          <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                            Net after {formatPrice(order.platformFee)} fee
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Details & Client info */}
                    <div className="grid md:grid-cols-2 gap-4 text-xs font-semibold text-gray-600">
                      <div className="space-y-2 bg-white rounded-2xl p-4 border border-gray-100">
                        <h4 className="font-bold text-green-950 flex items-center gap-1.5 mb-2">
                          <ShoppingBag size={14} className="text-green-600" /> Purchased Items
                        </h4>
                        {order.orderItems && order.orderItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center py-1 font-bold text-gray-800">
                            <span>{item.productName} (x{item.quantity})</span>
                            <span className="text-gray-500">{formatPrice(item.totalPrice)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 bg-white rounded-2xl p-4 border border-gray-100">
                        <h4 className="font-bold text-green-950 flex items-center gap-1.5 mb-2">
                          <MapPin size={14} className="text-green-600" /> Delivery Target Details
                        </h4>
                        <div><strong className="text-gray-800">Receiver Name:</strong> {order.buyerName}</div>
                        <div><strong className="text-gray-800">Delivery Address:</strong> {order.shippingAddress}</div>
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <div className="text-[11px] text-gray-400 font-bold">
                        Placed on: {new Date(order.createdAt).toLocaleString()}
                      </div>

                      <div className="flex items-center gap-2">
                        {order.orderStatus === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "ACCEPTED")}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition"
                            >
                              Accept Order
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "CANCELLED")}
                              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs rounded-xl transition"
                            >
                              Reject Order
                            </button>
                          </>
                        )}

                        {order.orderStatus !== "PENDING" && !["CANCELLED", "REFUNDED"].includes(order.orderStatus) && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-bold">Progress status:</span>
                            <select
                              value={order.orderStatus}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="border border-gray-300 p-2 rounded-xl text-xs font-bold bg-white focus:ring-1 focus:ring-green-500"
                            >
                              <option value="ACCEPTED">Accepted</option>
                              <option value="PACKED">Packed</option>
                              <option value="SHIPPED">Shipped</option>
                              <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="CANCELLED">Cancelled</option>
                              <option value="RETURNED">Returned</option>
                              <option value="REFUNDED">Refunded</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: RENTAL BOOKINGS */}
        {activeTab === "RENTALS" && (
          <div className="bg-white rounded-[32px] p-8 border border-green-50 shadow-lg space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-2xl font-black text-green-950 flex items-center gap-2">
                <Calendar className="text-green-600" size={24} />
                Equipment Rental Requests
              </h3>
              <p className="text-xs text-gray-400 font-bold mt-1">Review active date slot reservations, security deposits, and confirm bookings.</p>
            </div>

            {rentalsLoading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 font-bold">Fetching rental schedules...</p>
              </div>
            ) : rentalBookings.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                <h4 className="text-lg font-bold text-gray-700">No rental bookings</h4>
                <p className="text-sm text-gray-400 mt-1">When buyers book your equipment, their requests will appear here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {rentalBookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-100 rounded-3xl p-6 bg-gray-50/50 shadow-sm space-y-4 hover:border-green-100 transition">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                          {booking.isEquipment ? "Equipment Booking" : "Machinery Booking"}
                        </span>
                        <div className="font-extrabold text-green-950 text-base flex items-center gap-2">
                          {booking.isEquipment ? booking.equipmentName : booking.machineryName}
                          <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                            booking.bookingStatus === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                            booking.bookingStatus === "CONFIRMED" || booking.bookingStatus === "ACCEPTED" || booking.bookingStatus === "DELIVERED" || booking.bookingStatus === "COMPLETED" ? "bg-green-100 text-green-800" :
                            booking.bookingStatus === "CANCELLED" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {booking.bookingStatus}
                          </span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Value (incl. Deposit)</span>
                        <div className="font-extrabold text-green-800 text-base">{formatPrice(booking.totalPrice)}</div>
                      </div>
                    </div>
 
                    <div className="grid md:grid-cols-2 gap-4 text-xs font-semibold text-gray-600">
                      <div className="space-y-2 bg-white rounded-2xl p-4 border border-gray-100">
                        <h4 className="font-bold text-green-950 flex items-center gap-1.5 mb-2">
                          <Calendar size={14} className="text-green-600" /> Rental Date Slot
                        </h4>
                        <div><strong className="text-gray-800">Start Date:</strong> {new Date(booking.startDate).toLocaleDateString()}</div>
                        <div><strong className="text-gray-800">End Date:</strong> {new Date(booking.endDate).toLocaleDateString()}</div>
                        {!booking.isEquipment && (
                          <div><strong className="text-gray-800">Security Deposit:</strong> {formatPrice(booking.securityDeposit)}</div>
                        )}
                      </div>
 
                      <div className="space-y-2 bg-white rounded-2xl p-4 border border-gray-100">
                        <h4 className="font-bold text-green-950 flex items-center gap-1.5 mb-2">
                          <Building size={14} className="text-green-600" /> Buyer Contact Details
                        </h4>
                        <div><strong className="text-gray-800">Name:</strong> {booking.buyerName}</div>
                        <div><strong className="text-gray-800">Email:</strong> {booking.buyerEmail}</div>
                        {booking.buyerPhone && (
                          <div><strong className="text-gray-800">Phone:</strong> {booking.buyerPhone}</div>
                        )}
                      </div>
                    </div>
 
                    <div className="flex justify-between items-center pt-2">
                      <div className="text-[11px] text-gray-400 font-bold">
                        Requested: {new Date(booking.createdAt).toLocaleString()}
                      </div>
                      <div className="flex gap-2">
                        {booking.isEquipment ? (
                          <>
                            {booking.bookingStatus === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking.id, "CONFIRMED")}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition"
                                >
                                  Approve Reservation
                                </button>
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking.id, "CANCELLED")}
                                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs rounded-xl transition"
                                >
                                  Reject Request
                                </button>
                              </>
                            )}
                            {booking.bookingStatus === "CONFIRMED" && (
                              <button
                                  onClick={() => handleUpdateBookingStatus(booking.id, "COMPLETED")}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition"
                              >
                                Mark Completed
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <label className="text-[11px] font-bold text-gray-500">Update Status:</label>
                            <select
                              value={booking.bookingStatus}
                              onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value, false)}
                              className="border border-gray-350 px-2.5 py-1.5 rounded-xl text-xs bg-white font-bold text-green-950 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                              <option value="PENDING">Pending Approval</option>
                              <option value="ACCEPTED">Accepted</option>
                              <option value="PROCESSING">Processing</option>
                              <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                              <option value="SHIPPED">Shipped</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="COMPLETED">Completed (Returned)</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EARNINGS */}
        {activeTab === "EARNINGS" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-[32px] p-8 border border-green-50 shadow-lg space-y-6">
              <div>
                <h3 className="text-2xl font-black text-green-950 flex items-center gap-2">
                  <TrendingUp className="text-green-600" size={24} />
                  Revenue Insights
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-1">Review financial settlements, monthly metrics, and marketplace trends.</p>
              </div>

              {renderEarningsChart()}

              {/* Earnings summary breakdowns */}
              <div className="grid md:grid-cols-3 gap-6 text-sm font-semibold">
                <div className="p-5 rounded-2xl bg-green-50/50 border border-green-100">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Average Settlement Value</span>
                  <p className="text-xl font-extrabold text-green-900 mt-1">
                    ₹{dashboardStats?.totalOrders > 0
                      ? Math.round(dashboardStats.totalRevenue / dashboardStats.completedOrdersCount || 0).toLocaleString("en-IN")
                      : "0"}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-green-50/50 border border-green-100">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Store Completion Rate</span>
                  <p className="text-xl font-extrabold text-green-900 mt-1">
                    {dashboardStats?.totalOrders > 0
                      ? `${Math.round((dashboardStats.completedOrdersCount / dashboardStats.totalOrders) * 100)}%`
                      : "100%"}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-green-50/50 border border-green-100">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Current Year Total Revenue</span>
                  <p className="text-xl font-extrabold text-green-900 mt-1">
                    ₹{dashboardStats?.totalRevenue?.toLocaleString("en-IN") || "0"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === "SETTINGS" && (
          <div className="space-y-8 animate-fadeIn">
            {/* SUB-SECTION 1: SHOP INFORMATION */}
            <div className="bg-white rounded-[32px] p-8 border border-green-50 shadow-lg space-y-6">
              <div>
                <h3 className="text-xl font-black text-green-950 flex items-center gap-2">
                  <Building className="text-green-600" size={22} />
                  Shop Information
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-1">Update business name, branding website, description, and logs.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Store / Business Name</label>
                  <input
                    type="text"
                    value={shopSettings.businessName}
                    onChange={(e) => setShopSettings({ ...shopSettings, businessName: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Business Website (URL)</label>
                  <input
                    type="url"
                    value={shopSettings.businessWebsite}
                    onChange={(e) => setShopSettings({ ...shopSettings, businessWebsite: e.target.value })}
                    placeholder="https://example.com"
                    className="border border-gray-300 p-3 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Store Biography / Description</label>
                <textarea
                  rows={3}
                  value={shopSettings.bio}
                  onChange={(e) => setShopSettings({ ...shopSettings, bio: e.target.value })}
                  placeholder="Describe your agricultural products or machinery rental services..."
                  className="border border-gray-300 p-3 rounded-xl text-sm"
                ></textarea>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1.5 pl-1">Shop Logo</label>
                  <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 text-center flex flex-col justify-center items-center h-32 relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "shop-logo")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {shopSettings.logoUrl ? (
                      <div className="space-y-1">
                        <CheckCircle className="text-green-600 mx-auto" size={24} />
                        <span className="text-xs text-green-700 font-bold">Logo Uploaded</span>
                        <a href={shopSettings.logoUrl} target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 flex items-center gap-1 justify-center underline">
                          View Image <Eye size={10} />
                        </a>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-gray-400 mb-1.5" size={22} />
                        <span className="text-xs text-gray-500">Change shop logo</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Profile Photo Upload */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1.5 pl-1">Merchant Profile Photo</label>
                  <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 text-center flex flex-col justify-center items-center h-32 relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "profile")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {shopSettings.profileImage ? (
                      <div className="space-y-1">
                        <CheckCircle className="text-green-600 mx-auto" size={24} />
                        <span className="text-xs text-green-700 font-bold">Profile Photo Uploaded</span>
                        <a href={shopSettings.profileImage} target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 flex items-center gap-1 justify-center underline">
                          View Image <Eye size={10} />
                        </a>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-gray-400 mb-1.5" size={22} />
                        <span className="text-xs text-gray-500">Change profile photo</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={settingsLoading}
                  onClick={() => handleSaveSettings("SHOP")}
                  className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition shadow-md shadow-green-100 flex items-center gap-2"
                >
                  {settingsLoading && <RefreshCw size={14} className="animate-spin" />}
                  Save Shop Details
                </button>
              </div>
            </div>

            {/* SUB-SECTION 2: ADDRESS */}
            <div className="bg-white rounded-[32px] p-8 border border-green-50 shadow-lg space-y-6">
              <div>
                <h3 className="text-xl font-black text-green-950 flex items-center gap-2">
                  <MapPin className="text-green-600" size={22} />
                  Shop / Warehouse Address
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-1">Configure your primary pickup address, state, and pincode settings.</p>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Detailed Shop Address</label>
                <input
                  type="text"
                  value={addressSettings.shopAddress}
                  onChange={(e) => setAddressSettings({ ...addressSettings, shopAddress: e.target.value })}
                  placeholder="Plot/Shop number, street address, locality"
                  className="border border-gray-300 p-3 rounded-xl text-sm"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">State</label>
                  <input
                    type="text"
                    value={addressSettings.state}
                    onChange={(e) => setAddressSettings({ ...addressSettings, state: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">District</label>
                  <input
                    type="text"
                    value={addressSettings.district}
                    onChange={(e) => setAddressSettings({ ...addressSettings, district: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Pincode</label>
                  <input
                    type="text"
                    value={addressSettings.pincode}
                    onChange={(e) => setAddressSettings({ ...addressSettings, pincode: e.target.value })}
                    placeholder="6-digit pincode"
                    className="border border-gray-300 p-3 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={settingsLoading}
                  onClick={() => handleSaveSettings("ADDRESS")}
                  className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition shadow-md shadow-green-100 flex items-center gap-2"
                >
                  {settingsLoading && <RefreshCw size={14} className="animate-spin" />}
                  Save Address Details
                </button>
              </div>
            </div>

            {/* SUB-SECTION 3: PAYMENT DETAILS */}
            <div className="bg-white rounded-[32px] p-8 border border-green-50 shadow-lg space-y-6">
              <div>
                <h3 className="text-xl font-black text-green-950 flex items-center gap-2">
                  <CreditCard className="text-green-600" size={22} />
                  Bank Account & Payment Details
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-1">Configure banking data for automatic settlement deposits.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Settlement Account Holder Name</label>
                  <input
                    type="text"
                    value={paymentSettings.bankAccountHolderName}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, bankAccountHolderName: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Bank Name</label>
                  <input
                    type="text"
                    value={paymentSettings.bankName}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, bankName: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Settlement Account Number</label>
                  <input
                    type="text"
                    value={paymentSettings.accountNumber}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, accountNumber: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">IFSC Code</label>
                  <input
                    type="text"
                    value={paymentSettings.ifscCode}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, ifscCode: e.target.value.toUpperCase() })}
                    className="border border-gray-300 p-3 rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">UPI ID (Fast Settlements)</label>
                  <input
                    type="text"
                    value={paymentSettings.upiId}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, upiId: e.target.value })}
                    placeholder="e.g. UPI@bank"
                    className="border border-gray-300 p-3 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={settingsLoading}
                  onClick={() => handleSaveSettings("PAYMENT")}
                  className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition shadow-md shadow-green-100 flex items-center gap-2"
                >
                  {settingsLoading && <RefreshCw size={14} className="animate-spin" />}
                  Save Payment Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit / List Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-green-50/50">
              <h3 className="text-2xl font-black text-green-950 flex items-center gap-2">
                <PlusCircle className="text-green-600" size={24} />
                {isEditingProduct ? "Edit Listed Product" : "List New Product"}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="bg-white text-gray-500 hover:text-gray-800 p-2 rounded-full border border-gray-200 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={productForm.productName}
                    onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })}
                    placeholder="e.g. Organic Urea Fertilizer"
                    className="border border-gray-300 p-3 rounded-xl text-sm"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">SKU (Unique ID) *</label>
                  <input
                    type="text"
                    required
                    disabled={isEditingProduct}
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="e.g. ORG-UREA-25KG"
                    className="border border-gray-300 p-3 rounded-xl text-sm font-mono disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Category *</label>
                  <select
                    required
                    value={productForm.categoryId}
                    onChange={handleCategoryChange}
                    className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.categoryName}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Subcategory *</label>
                  <select
                    required
                    value={productForm.subcategoryId}
                    onChange={(e) => setProductForm({ ...productForm, subcategoryId: e.target.value })}
                    disabled={subcategories.length === 0}
                    className="border border-gray-300 p-3 rounded-xl text-sm bg-white disabled:bg-gray-50"
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.subcategoryName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Crop Specific Fields */}
              {(() => {
                const selectedCategoryObj = categories.find(c => Number(c.id) === Number(productForm.categoryId));
                const isCropCategory = selectedCategoryObj?.categoryName?.toLowerCase() === "crops";
                if (!isCropCategory) return null;
                return (
                  <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-green-50/40 border border-green-100/50 animate-fadeIn">
                    <div className="flex flex-col col-span-2">
                      <span className="text-xs font-black uppercase tracking-wider text-green-800">Crop Specific Information</span>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Variety *</label>
                      <input
                        type="text"
                        required
                        value={productForm.variety}
                        onChange={(e) => setProductForm({ ...productForm, variety: e.target.value })}
                        placeholder="e.g. Basmati Rice, Sharbati Wheat"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Measurement Unit *</label>
                      <select
                        required
                        value={productForm.unit}
                        onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      >
                        <option value="kg">Kilogram (kg)</option>
                        <option value="quintal">Quintal</option>
                        <option value="ton">Ton</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Harvest Date *</label>
                      <input
                        type="date"
                        required
                        value={productForm.harvestDate}
                        onChange={(e) => setProductForm({ ...productForm, harvestDate: e.target.value })}
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Harvest Location (State) *</label>
                      <input
                        type="text"
                        required
                        value={productForm.location}
                        onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                        placeholder="e.g. Punjab, Madhya Pradesh"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Milk Specific Fields */}
              {(() => {
                const selectedCategoryObj = categories.find(c => Number(c.id) === Number(productForm.categoryId));
                const isMilkCategory = selectedCategoryObj?.categoryName?.toLowerCase() === "dairy products";
                if (!isMilkCategory) return null;
                return (
                  <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-blue-50/40 border border-blue-100/50 animate-fadeIn">
                    <div className="flex flex-col col-span-2">
                      <span className="text-xs font-black uppercase tracking-wider text-blue-800">Milk Marketplace Information</span>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Milk Type *</label>
                      <select
                        required
                        value={productForm.milkType}
                        onChange={(e) => setProductForm({ ...productForm, milkType: e.target.value })}
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      >
                        <option value="Cow">Cow</option>
                        <option value="Buffalo">Buffalo</option>
                        <option value="Goat">Goat</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Fat Percentage (%) *</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={productForm.fatPercentage}
                        onChange={(e) => setProductForm({ ...productForm, fatPercentage: e.target.value })}
                        placeholder="e.g. 4.2"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Delivery Radius (km) *</label>
                      <input
                        type="number"
                        required
                        value={productForm.deliveryRadius}
                        onChange={(e) => setProductForm({ ...productForm, deliveryRadius: e.target.value })}
                        placeholder="e.g. 10"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-6 pl-1">
                      <input
                        type="checkbox"
                        id="daily-availability"
                        checked={productForm.dailyAvailability}
                        onChange={(e) => setProductForm({ ...productForm, dailyAvailability: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="daily-availability" className="text-xs font-bold text-gray-700">
                        Available Daily
                      </label>
                    </div>
                  </div>
                );
              })()}

              {/* Fertilizer Specific Fields */}
              {(() => {
                const selectedCategoryObj = categories.find(c => Number(c.id) === Number(productForm.categoryId));
                const isFertilizerCategory = selectedCategoryObj?.categoryName?.toLowerCase() === "fertilizers";
                if (!isFertilizerCategory) return null;
                return (
                  <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100/50 animate-fadeIn">
                    <div className="flex flex-col col-span-2">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Fertilizer Specific Information</span>
                    </div>
                    <div className="flex flex-col col-span-2">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Brand Name *</label>
                      <input
                        type="text"
                        required={isFertilizerCategory}
                        value={productForm.brand}
                        onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                        placeholder="e.g. IFFCO, Tata Paras, Mahadhan"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Manufacturing Date *</label>
                      <input
                        type="date"
                        required={isFertilizerCategory}
                        value={productForm.manufacturingDate}
                        onChange={(e) => setProductForm({ ...productForm, manufacturingDate: e.target.value })}
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Expiry Date *</label>
                      <input
                        type="date"
                        required={isFertilizerCategory}
                        value={productForm.expiryDate}
                        onChange={(e) => setProductForm({ ...productForm, expiryDate: e.target.value })}
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Farming Equipment Specific Fields */}
              {(() => {
                const selectedCategoryObj = categories.find(c => Number(c.id) === Number(productForm.categoryId));
                const isEquipmentCategory = selectedCategoryObj?.categoryName?.toLowerCase() === "farming equipment";
                if (!isEquipmentCategory) return null;
                return (
                  <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-amber-50/40 border border-amber-100/50 animate-fadeIn">
                    <div className="flex flex-col col-span-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-800">Farming Equipment Specification Details</span>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Brand Name *</label>
                      <input
                        type="text"
                        required={isEquipmentCategory}
                        value={productForm.brand}
                        onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                        placeholder="e.g. Mahindra, Kubota, John Deere"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Model Name *</label>
                      <input
                        type="text"
                        required={isEquipmentCategory}
                        value={productForm.model}
                        onChange={(e) => setProductForm({ ...productForm, model: e.target.value })}
                        placeholder="e.g. 575 DI, M-Series"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Purchase/Manufacturing Year *</label>
                      <input
                        type="number"
                        required={isEquipmentCategory}
                        value={productForm.purchaseYear}
                        onChange={(e) => setProductForm({ ...productForm, purchaseYear: e.target.value })}
                        placeholder="e.g. 2022"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Equipment Condition *</label>
                      <select
                        required={isEquipmentCategory}
                        value={productForm.equipmentCondition}
                        onChange={(e) => setProductForm({ ...productForm, equipmentCondition: e.target.value })}
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      >
                        <option value="NEW">New</option>
                        <option value="EXCELLENT">Excellent Condition</option>
                        <option value="GOOD">Good Condition</option>
                        <option value="FAIR">Fair Condition</option>
                      </select>
                    </div>

                    {/* Options: For Sale / For Rent */}
                    <div className="flex flex-col col-span-2 border-t border-amber-100/50 pt-3 mt-1 space-y-3">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-800">Marketplace Listing Options</span>
                      <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="for-sale-check"
                            checked={productForm.forSale}
                            onChange={(e) => setProductForm({ ...productForm, forSale: e.target.checked })}
                            className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                          />
                          <label htmlFor="for-sale-check" className="text-xs font-bold text-gray-700">
                            Available For Sale
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="for-rent-check"
                            checked={productForm.forRent}
                            onChange={(e) => setProductForm({ ...productForm, forRent: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="for-rent-check" className="text-xs font-bold text-gray-700">
                            Available For Rent
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Rental Details Container */}
                    {productForm.forRent && (
                      <div className="grid grid-cols-3 gap-4 col-span-2 p-4 rounded-xl bg-blue-50/50 border border-blue-100/50 mt-1 animate-fadeIn">
                        <div className="flex flex-col col-span-3">
                          <span className="text-xs font-black uppercase tracking-wider text-blue-800">Rental Terms & Rates</span>
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Rent / Hour (₹) *</label>
                          <input
                            type="number"
                            required={productForm.forRent}
                            value={productForm.rentPerHour}
                            onChange={(e) => setProductForm({ ...productForm, rentPerHour: e.target.value })}
                            placeholder="e.g. 150"
                            className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Rent / Day (₹) *</label>
                          <input
                            type="number"
                            required={productForm.forRent}
                            value={productForm.rentPerDay}
                            onChange={(e) => setProductForm({ ...productForm, rentPerDay: e.target.value })}
                            placeholder="e.g. 1000"
                            className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Security Deposit (₹) *</label>
                          <input
                            type="number"
                            required={productForm.forRent}
                            value={productForm.securityDeposit}
                            onChange={(e) => setProductForm({ ...productForm, securityDeposit: e.target.value })}
                            placeholder="e.g. 5000"
                            className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Machinery Specific Fields */}
              {(() => {
                const selectedCategoryObj = categories.find(c => Number(c.id) === Number(productForm.categoryId));
                const isMachineryCategory = selectedCategoryObj?.categoryName?.toLowerCase() === "machinery";
                if (!isMachineryCategory) return null;
                return (
                  <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100/50 animate-fadeIn">
                    <div className="flex flex-col col-span-2">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Machinery Details & Specifications</span>
                    </div>
                    
                    {/* Basic Info */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Machinery Category *</label>
                      <select
                        required={isMachineryCategory}
                        value={productForm.machineryType}
                        onChange={(e) => setProductForm({ ...productForm, machineryType: e.target.value })}
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      >
                        <option value="Tractor">Tractor</option>
                        <option value="Rotavator">Rotavator</option>
                        <option value="Cultivator">Cultivator</option>
                        <option value="Harvester">Harvester</option>
                        <option value="Seeder">Seeder</option>
                        <option value="Plough">Plough</option>
                        <option value="Thresher">Thresher</option>
                        <option value="Sprayer">Sprayer</option>
                        <option value="Water Pump">Water Pump</option>
                        <option value="Power Tiller">Power Tiller</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Brand Name *</label>
                      <input
                        type="text"
                        required={isMachineryCategory}
                        value={productForm.brandName}
                        onChange={(e) => setProductForm({ ...productForm, brandName: e.target.value })}
                        placeholder="e.g. Mahindra, John Deere"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Model Number *</label>
                      <input
                        type="text"
                        required={isMachineryCategory}
                        value={productForm.modelNumber}
                        onChange={(e) => setProductForm({ ...productForm, modelNumber: e.target.value })}
                        placeholder="e.g. XP Plus, 5050D"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Manufacturing Year *</label>
                      <input
                        type="number"
                        required={isMachineryCategory}
                        value={productForm.manufacturingYear}
                        onChange={(e) => setProductForm({ ...productForm, manufacturingYear: e.target.value })}
                        placeholder="e.g. 2023"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Condition Status *</label>
                      <select
                        required={isMachineryCategory}
                        value={productForm.conditionStatus}
                        onChange={(e) => setProductForm({ ...productForm, conditionStatus: e.target.value })}
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      >
                        <option value="NEW">New</option>
                        <option value="USED">Used</option>
                        <option value="REFURBISHED">Refurbished</option>
                      </select>
                    </div>

                    {/* Listing Mode Selection */}
                    <div className="flex flex-col col-span-2 border-t border-emerald-100/50 pt-3 mt-1 space-y-3">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Listing Options & Pricing Mode</span>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="machinery-sale"
                            checked={productForm.availableForSale}
                            onChange={(e) => setProductForm({
                              ...productForm,
                              availableForSale: e.target.checked,
                              availableForBoth: e.target.checked && productForm.availableForRent
                            })}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <label htmlFor="machinery-sale" className="text-xs font-bold text-gray-700">Available For Sale</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="machinery-rent"
                            checked={productForm.availableForRent}
                            onChange={(e) => setProductForm({
                              ...productForm,
                              availableForRent: e.target.checked,
                              availableForBoth: e.target.checked && productForm.availableForSale
                            })}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <label htmlFor="machinery-rent" className="text-xs font-bold text-gray-700">Available For Rent</label>
                        </div>
                      </div>
                    </div>

                    {/* Rent Term Details */}
                    {productForm.availableForRent && (
                      <div className="grid grid-cols-2 gap-4 col-span-2 p-4 rounded-xl bg-blue-50/50 border border-blue-100/50 mt-1">
                        <div className="flex flex-col col-span-2">
                          <span className="text-xs font-black uppercase tracking-wider text-blue-800">Rental Pricing</span>
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Rent / Hour (₹)</label>
                          <input
                            type="number"
                            value={productForm.rentPerHour}
                            onChange={(e) => setProductForm({ ...productForm, rentPerHour: e.target.value })}
                            placeholder="e.g. 200"
                            className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Rent / Day (₹)</label>
                          <input
                            type="number"
                            value={productForm.rentPerDay}
                            onChange={(e) => setProductForm({ ...productForm, rentPerDay: e.target.value })}
                            placeholder="e.g. 1500"
                            className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Rent / Week (₹)</label>
                          <input
                            type="number"
                            value={productForm.rentPerWeek}
                            onChange={(e) => setProductForm({ ...productForm, rentPerWeek: e.target.value })}
                            placeholder="e.g. 9000"
                            className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Security Deposit (₹) *</label>
                          <input
                            type="number"
                            required={productForm.availableForRent}
                            value={productForm.securityDeposit}
                            onChange={(e) => setProductForm({ ...productForm, securityDeposit: e.target.value })}
                            placeholder="e.g. 10000"
                            className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Sale Options */}
                    {(productForm.availableForSale || productForm.availableForBoth) && (
                      <div className="flex items-center gap-2 col-span-2 pl-1 py-1">
                        <input
                          type="checkbox"
                          id="machinery-negotiable"
                          checked={productForm.negotiable}
                          onChange={(e) => setProductForm({ ...productForm, negotiable: e.target.checked })}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <label htmlFor="machinery-negotiable" className="text-xs font-bold text-gray-700">Price Negotiable</label>
                      </div>
                    )}

                    {/* Location Specs */}
                    <div className="flex flex-col col-span-2 border-t border-emerald-100/50 pt-3 mt-1">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Machinery Location</span>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">State *</label>
                      <input
                        type="text"
                        required={isMachineryCategory}
                        value={productForm.state}
                        onChange={(e) => setProductForm({ ...productForm, state: e.target.value })}
                        placeholder="e.g. Punjab"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">District *</label>
                      <input
                        type="text"
                        required={isMachineryCategory}
                        value={productForm.district}
                        onChange={(e) => setProductForm({ ...productForm, district: e.target.value })}
                        placeholder="e.g. Ludhiana"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Village / City *</label>
                      <input
                        type="text"
                        required={isMachineryCategory}
                        value={productForm.villageCity}
                        onChange={(e) => setProductForm({ ...productForm, villageCity: e.target.value })}
                        placeholder="e.g. Khanna"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Pincode *</label>
                      <input
                        type="text"
                        required={isMachineryCategory}
                        value={productForm.pincode}
                        onChange={(e) => setProductForm({ ...productForm, pincode: e.target.value })}
                        placeholder="e.g. 141401"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col col-span-2">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">GPS Coordinates (Optional)</label>
                      <input
                        type="text"
                        value={productForm.gpsLocation}
                        onChange={(e) => setProductForm({ ...productForm, gpsLocation: e.target.value })}
                        placeholder="e.g. 30.7046, 76.7179"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>

                    {/* Tech Specs */}
                    <div className="flex flex-col col-span-2 border-t border-emerald-100/50 pt-3 mt-1">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Technical Specifications</span>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Engine Power (HP/CC)</label>
                      <input
                        type="text"
                        value={productForm.enginePower}
                        onChange={(e) => setProductForm({ ...productForm, enginePower: e.target.value })}
                        placeholder="e.g. 50 HP / 3000 CC"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Horsepower (HP Number)</label>
                      <input
                        type="number"
                        value={productForm.powerHp}
                        onChange={(e) => setProductForm({ ...productForm, powerHp: e.target.value })}
                        placeholder="e.g. 50"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Fuel Type</label>
                      <select
                        value={productForm.fuelType}
                        onChange={(e) => setProductForm({ ...productForm, fuelType: e.target.value })}
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      >
                        <option value="">Select Fuel Type</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Petrol">Petrol</option>
                        <option value="CNG">CNG</option>
                        <option value="Electric">Electric</option>
                        <option value="None/Manual">None / Manual</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Working Width</label>
                      <input
                        type="text"
                        value={productForm.workingWidth}
                        onChange={(e) => setProductForm({ ...productForm, workingWidth: e.target.value })}
                        placeholder="e.g. 6 feet"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Weight</label>
                      <input
                        type="text"
                        value={productForm.weight}
                        onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })}
                        placeholder="e.g. 2100 kg"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Capacity</label>
                      <input
                        type="text"
                        value={productForm.capacitySpecification}
                        onChange={(e) => setProductForm({ ...productForm, capacitySpecification: e.target.value })}
                        placeholder="e.g. 1.2 Tons, 500 Liters"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col col-span-2">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Other Technical Specs</label>
                      <textarea
                        value={productForm.otherSpecifications}
                        onChange={(e) => setProductForm({ ...productForm, otherSpecifications: e.target.value })}
                        placeholder="Describe other specific technical parameters..."
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white h-20"
                      />
                    </div>

                    {/* Contact details */}
                    <div className="flex flex-col col-span-2 border-t border-emerald-100/50 pt-3 mt-1">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Contact Details</span>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Seller Contact Name *</label>
                      <input
                        type="text"
                        required={isMachineryCategory}
                        value={productForm.sellerContactName}
                        onChange={(e) => setProductForm({ ...productForm, sellerContactName: e.target.value })}
                        placeholder="e.g. Gurdev Singh"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Mobile Number *</label>
                      <input
                        type="text"
                        required={isMachineryCategory}
                        value={productForm.mobileNumber}
                        onChange={(e) => setProductForm({ ...productForm, mobileNumber: e.target.value })}
                        placeholder="e.g. 9876543210"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Alternate Number</label>
                      <input
                        type="text"
                        value={productForm.alternateNumber}
                        onChange={(e) => setProductForm({ ...productForm, alternateNumber: e.target.value })}
                        placeholder="e.g. 9876543211"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">WhatsApp Number</label>
                      <input
                        type="text"
                        value={productForm.whatsappNumber}
                        onChange={(e) => setProductForm({ ...productForm, whatsappNumber: e.target.value })}
                        placeholder="e.g. 9876543210"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>

                    {/* Document and Video links */}
                    <div className="flex flex-col col-span-2 border-t border-emerald-100/50 pt-3 mt-1">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Media & Documents</span>
                    </div>
                    <div className="flex flex-col col-span-2">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Machinery Video URL (Optional)</label>
                      <input
                        type="text"
                        value={productForm.videoUrl}
                        onChange={(e) => setProductForm({ ...productForm, videoUrl: e.target.value })}
                        placeholder="e.g. YouTube video URL or MP4 URL"
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      />
                    </div>
                    
                    {/* Reg Certificate Upload */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Registration Certificate</label>
                      <div className="border border-dashed border-gray-300 p-3 rounded-xl text-center bg-white relative hover:bg-gray-50 transition">
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => handleFileUpload(e, "machinery-cert")}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {productForm.registrationCertificateUrl ? (
                          <div className="text-xs font-bold text-green-700 truncate">
                            Uploaded! Click to view certificate
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">Click to upload PDF/Image</div>
                        )}
                      </div>
                    </div>

                    {/* Insurance Document Upload */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Insurance Document</label>
                      <div className="border border-dashed border-gray-300 p-3 rounded-xl text-center bg-white relative hover:bg-gray-50 transition">
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => handleFileUpload(e, "machinery-ins")}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {productForm.insuranceDocumentUrl ? (
                          <div className="text-xs font-bold text-green-700 truncate">
                            Uploaded! Click to view insurance
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">Click to upload PDF/Image</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Building Materials Specific Fields */}
              {(() => {
                const selectedCategoryObj = categories.find(c => Number(c.id) === Number(productForm.categoryId));
                const isMaterialCategory = selectedCategoryObj?.categoryName?.toLowerCase() === "building materials";
                if (!isMaterialCategory) return null;
                return (
                  <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100/50 animate-fadeIn">
                    <div className="flex flex-col col-span-2">
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-800">Building Material Specifications</span>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Material Type *</label>
                      <select
                        required={isMaterialCategory}
                        value={productForm.materialType}
                        onChange={(e) => setProductForm({ ...productForm, materialType: e.target.value })}
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      >
                        <option value="Cement">Cement</option>
                        <option value="Bricks">Bricks</option>
                        <option value="Sand">Sand</option>
                        <option value="Stone">Stone</option>
                        <option value="Iron Rods">Iron Rods</option>
                        <option value="Pipes">Pipes</option>
                        <option value="Other">Other Materials</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Measurement Unit *</label>
                      <select
                        required={isMaterialCategory}
                        value={productForm.unit}
                        onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                        className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                      >
                        <option value="bags">Bags (e.g. Cement)</option>
                        <option value="pieces">Pieces / Units (e.g. Bricks, Pipes)</option>
                        <option value="brass">Brass (e.g. Sand, Stone)</option>
                        <option value="tons">Tons (e.g. Iron Rods, Aggregate)</option>
                        <option value="meters">Meters (e.g. Pipes, Cables)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 mt-6 pl-1 col-span-2">
                      <input
                        type="checkbox"
                        id="delivery-available"
                        checked={productForm.deliveryAvailable}
                        onChange={(e) => setProductForm({ ...productForm, deliveryAvailable: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor="delivery-available" className="text-xs font-bold text-gray-700">
                        Delivery Services Available For This Listing
                      </label>
                    </div>
                  </div>
                );
              })()}

              {(() => {
                const selectedCategoryObj = categories.find(c => Number(c.id) === Number(productForm.categoryId));
                const isEquipmentCategory = selectedCategoryObj?.categoryName?.toLowerCase() === "farming equipment";
                const isSaleAvailable = !isEquipmentCategory || productForm.forSale;
                if (isEquipmentCategory && !productForm.forSale) return null;
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Price (INR) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required={isSaleAvailable}
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="e.g. 45000.00"
                        className="border border-gray-300 p-3 rounded-xl text-sm font-bold"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Discount Price (INR, Optional)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productForm.discountPrice}
                        onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })}
                        placeholder="e.g. 39900.00"
                        className="border border-gray-300 p-3 rounded-xl text-sm text-gray-600"
                      />
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Available Quantity (Stock) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.quantityAvailable}
                    onChange={(e) => setProductForm({ ...productForm, quantityAvailable: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Reorder Level *</label>
                  <input
                    type="number"
                    required
                    value={productForm.reorderLevel}
                    onChange={(e) => setProductForm({ ...productForm, reorderLevel: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Listing Status *</label>
                  <select
                    required
                    value={productForm.productStatus}
                    onChange={(e) => setProductForm({ ...productForm, productStatus: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm bg-white"
                  >
                    <option value="ACTIVE">Active (On Marketplace)</option>
                    <option value="DRAFT">Draft (Not Visible)</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Short Summary *</label>
                <input
                  type="text"
                  required
                  value={productForm.shortDescription}
                  onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })}
                  placeholder="e.g. High quality organic fertilizer packed with nitrogen."
                  className="border border-gray-300 p-3 rounded-xl text-sm"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={productForm.productDescription}
                  onChange={(e) => setProductForm({ ...productForm, productDescription: e.target.value })}
                  placeholder="Describe your crop or machinery renting terms here..."
                  className="border border-gray-300 p-3 rounded-xl text-sm"
                ></textarea>
              </div>

              {/* Image Upload for Product Image */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Product Photos (Max 5)</label>
                <ImageUpload
                  images={uploadedImages}
                  onChange={(updatedList) => setUploadedImages(updatedList)}
                  maxImages={5}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-3 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition flex items-center gap-2"
                >
                  {formLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {isEditingProduct ? "Update Product" : "List Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / List Land Listing Modal */}
      {showLandModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-green-50/50">
              <h3 className="text-2xl font-black text-green-950 flex items-center gap-2">
                <MapPin className="text-green-600" size={24} />
                {isEditingLand ? "Edit Land Listing" : "List Agricultural Land"}
              </h3>
              <button
                onClick={() => setShowLandModal(false)}
                className="text-gray-400 hover:text-green-950 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLandSubmit} className="p-6 space-y-6">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Land Listing Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5 Hectares fertile paddy field near river"
                  value={landForm.landTitle}
                  onChange={(e) => setLandForm({ ...landForm, landTitle: e.target.value })}
                  className="border border-gray-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Land Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe soil status, crops previously grown, accessibility, water details..."
                  value={landForm.description}
                  onChange={(e) => setLandForm({ ...landForm, description: e.target.value })}
                  className="border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Area *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={landForm.areaInAcres}
                      onChange={(e) => setLandForm({ ...landForm, areaInAcres: e.target.value })}
                      placeholder="e.g. 10.5"
                      className="border border-gray-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Unit *</label>
                    <select
                      value={landForm.areaUnit}
                      onChange={(e) => setLandForm({ ...landForm, areaUnit: e.target.value })}
                      className="border border-gray-300 p-3 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="acre">Acre(s)</option>
                      <option value="hectare">Hectare(s)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Price per Unit (INR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={landForm.pricePerAcre}
                    onChange={(e) => setLandForm({ ...landForm, pricePerAcre: e.target.value })}
                    placeholder="e.g. 800000.00"
                    className="border border-gray-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maharashtra"
                    value={landForm.state}
                    onChange={(e) => setLandForm({ ...landForm, state: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">District *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune"
                    value={landForm.district}
                    onChange={(e) => setLandForm({ ...landForm, district: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Taluka</label>
                  <input
                    type="text"
                    placeholder="e.g. Haveli"
                    value={landForm.taluka}
                    onChange={(e) => setLandForm({ ...landForm, taluka: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Village *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Uruli Kanchan"
                    value={landForm.village}
                    onChange={(e) => setLandForm({ ...landForm, village: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Pincode</label>
                  <input
                    type="text"
                    value={landForm.pinCode}
                    onChange={(e) => setLandForm({ ...landForm, pinCode: e.target.value })}
                    placeholder="e.g. 412201"
                    className="border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={landForm.latitude}
                    onChange={(e) => setLandForm({ ...landForm, latitude: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={landForm.longitude}
                    onChange={(e) => setLandForm({ ...landForm, longitude: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Soil Type / Info</label>
                  <input
                    type="text"
                    placeholder="e.g. Rich Black Cotton Soil"
                    value={landForm.soilInformation}
                    onChange={(e) => setLandForm({ ...landForm, soilInformation: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Water Source / Info</label>
                  <input
                    type="text"
                    placeholder="e.g. Canal connected & 1 Borewell"
                    value={landForm.waterSourceInformation}
                    onChange={(e) => setLandForm({ ...landForm, waterSourceInformation: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              <div className={`grid grid-cols-1 ${isEditingLand ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-4`}>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Electricity *</label>
                  <select
                    value={landForm.electricityAvailability ? "true" : "false"}
                    onChange={(e) => setLandForm({ ...landForm, electricityAvailability: e.target.value === "true" })}
                    className="border border-gray-300 p-3 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none font-bold"
                  >
                    <option value="false">No (No connection)</option>
                    <option value="true">Yes (3-Phase farm power)</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Road Connectivity *</label>
                  <select
                    value={landForm.roadConnectivity}
                    onChange={(e) => setLandForm({ ...landForm, roadConnectivity: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none font-bold"
                  >
                    <option value="Tar Road">Tar / Asphalt Road</option>
                    <option value="National Highway">National Highway</option>
                    <option value="Dirt Road">Dirt Road / Farm track</option>
                    <option value="No Road">No direct road access</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Land Type *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Agricultural, Orchard, Wetland"
                    value={landForm.landType}
                    onChange={(e) => setLandForm({ ...landForm, landType: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none font-bold"
                  />
                </div>

                {isEditingLand && (
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Land Status *</label>
                    <select
                      value={landForm.landStatus}
                      onChange={(e) => setLandForm({ ...landForm, landStatus: e.target.value })}
                      className="border border-gray-300 p-3 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none font-bold"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="UNDER_NEGOTIATION">Under Negotiation</option>
                      <option value="SOLD">Sold</option>
                      <option value="DELISTED">Delisted</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Document URL Upload */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Land Ownership Documents / Deed PDF</label>
                <div className="border-2 border-dashed border-green-200 hover:bg-green-50/50 rounded-2xl p-4 text-center cursor-pointer transition relative">
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => handleFileUpload(e, "land-doc")}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingFile}
                  />
                  {uploadingFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      Uploading document...
                    </div>
                  ) : uploadedLandDocUrl ? (
                    <div className="flex items-center justify-center gap-3 text-sm text-green-700 font-bold">
                      <CheckCircle size={20} />
                      Document uploaded!
                      <a href={uploadedLandDocUrl} target="_blank" rel="noreferrer" className="text-green-950 underline flex items-center gap-1">
                        View file <Eye size={12} />
                      </a>
                    </div>
                  ) : (
                    <div>
                      <Upload size={20} className="mx-auto text-green-600 mb-1" />
                      <p className="text-xs text-gray-500">Upload 7/12 extract, title deed or survey map (PDF/Image)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Land Photo Upload */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Land Image / Photo *</label>
                <div className="border-2 border-dashed border-green-200 hover:bg-green-50/50 rounded-2xl p-4 text-center cursor-pointer transition relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "land")}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingFile}
                  />
                  {uploadingFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      Uploading image...
                    </div>
                  ) : uploadedLandImageUrl ? (
                    <div className="flex items-center justify-center gap-3 text-sm text-green-700 font-bold">
                      <CheckCircle size={20} />
                      Photo uploaded!
                      <a href={uploadedLandImageUrl} target="_blank" rel="noreferrer" className="text-green-950 underline flex items-center gap-1">
                        View image <Eye size={12} />
                      </a>
                    </div>
                  ) : (
                    <div>
                      <Upload size={20} className="mx-auto text-green-600 mb-1" />
                      <p className="text-xs text-gray-500">Upload high-res photo showing soil condition or overview</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowLandModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-3 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={landFormLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition flex items-center gap-2"
                >
                  {landFormLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {isEditingLand ? "Update Listing" : "List Land"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
