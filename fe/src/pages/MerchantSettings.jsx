import React, { useState, useEffect } from "react";
import {
  Settings,
  Store,
  Code,
  ArrowLeft,
  LogOut,
  Save,
  Check,
  Loader,
  Bot,
} from "lucide-react";
import BrandIdentity from "./BrandIdentity";
import ApiConfiguration from "./ApiConfiguration";
import apiService from "../services/api";
import { API_BASE_URL } from '../config/api';

function MerchantSettings({ onLogout }) {
  const [activeTab, setActiveTab] = useState("brand"); // 'brand', 'api', or 'ai'
  const [brandData, setBrandData] = useState(null);
  const [apiConfigs, setApiConfigs] = useState(null);
  const [twoFactorConfigs, setTwoFactorConfigs] = useState(null);
  const [customApis, setCustomApis] = useState([]); // Custom API definitions
  const [aiConfig, setAiConfig] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [merchantId, setMerchantId] = useState(null);

  // Fetch current settings on mount
  useEffect(() => {
    fetchCurrentSettings();
  }, []);

  const fetchCurrentSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get merchant data from API
      const response = await apiService.getMerchant();

      if (response.success && response.data) {
        const merchant = response.data;
        setMerchantId(merchant.id);

        // Prefill brand data
        setBrandData({
          display_logo: merchant.logo || "",
          display_name: merchant.displayName || merchant.name || "",
          display_tagline: merchant.tagline || "",
          display_message: merchant.welcomeMessage || "",
          display_category: merchant.categories || [],
          primary_color: merchant.dynamicSettings?.primaryColor || "#3B82F6",
          secondary_color:
            merchant.dynamicSettings?.secondaryColor || "#60A5FA",
          accent_color: merchant.dynamicSettings?.accentColor || "#F472B6",
          base_prompt:
            merchant.basePrompt || merchant.dynamicSettings?.basePrompt || "",
        });

        // Prefill API configs
        if (merchant.apis && merchant.apis.length > 0) {
          const configs = {};
          const twoFa = {};
          const customApisList = [];
          const apiTypeMapping = {
            search: "search_item",
            addtocart: "add_to_cart",
            checkout: "checkout",
            basesystemprompt: "base_prompt",
            coupons: "coupons",
          };

          // Known default API types
          const defaultApiTypes = [
            "search",
            "addtocart",
            "checkout",
            "coupons",
            "basesystemprompt",
            "send_otp",
            "verify_otp",
          ];

          merchant.apis.forEach((api) => {
            const payload = api.payload || {};

            // Handle 2FA APIs separately
            if (api.apiType === "send_otp" || api.apiType === "verify_otp") {
              twoFa[api.apiType] = {
                url: payload.url || "",
                method: payload.method || "POST",
                headers:
                  payload.headers?.length > 0
                    ? payload.headers
                    : [{ key: "", value: "" }],
                params:
                  payload.params?.length > 0
                    ? payload.params
                    : [{ key: "", value: "" }],
                body: payload.body || "",
                mcpConfig: payload.mcpConfig || null,
              };
            }
            // Check if this is a custom API (starts with 'custom_' or not in default types)
            else if (
              api.apiType.startsWith("custom_") ||
              !defaultApiTypes.includes(api.apiType)
            ) {
              // This is a custom API
              const customKey = api.apiType;

              // Add to custom APIs list (for the tabs/definitions)
              customApisList.push({
                key: customKey,
                label: payload.name || payload.mcpConfig?.toolName || customKey,
                description:
                  payload.description ||
                  payload.mcpConfig?.toolDescription ||
                  "Custom API endpoint",
              });

              // Add to configs (for the form data)
              configs[customKey] = {
                url: payload.url || "",
                method: payload.method || "GET",
                headers:
                  payload.headers?.length > 0
                    ? payload.headers
                    : [{ key: "", value: "" }],
                params:
                  payload.params?.length > 0
                    ? payload.params
                    : [{ key: "", value: "" }],
                body: payload.body || "",
                mcpConfig: payload.mcpConfig || null,
              };
            } else {
              // Default API type
              const configKey = apiTypeMapping[api.apiType] || api.apiType;
              configs[configKey] = {
                url: payload.url || "",
                method: payload.method || "GET",
                headers:
                  payload.headers?.length > 0
                    ? payload.headers
                    : [{ key: "", value: "" }],
                params:
                  payload.params?.length > 0
                    ? payload.params
                    : [{ key: "", value: "" }],
                body: payload.body || "",
                mcpConfig: payload.mcpConfig || null,
              };
            }
          });

          setApiConfigs(configs);
          setCustomApis(customApisList);

          // Set 2FA configs if found
          if (Object.keys(twoFa).length > 0) {
            setTwoFactorConfigs(twoFa);
          }
        }

        // Prefill AI config
        if (merchant.aiConfigurations && merchant.aiConfigurations.length > 0) {
          const activeAi =
            merchant.aiConfigurations.find((c) => c.isActive) ||
            merchant.aiConfigurations[0];
          setAiConfig({
            provider: activeAi.provider || "gemini",
            model: activeAi.model || "gemini-2.5-pro",
            isActive: activeAi.isActive,
          });
        } else {
          setAiConfig({
            provider: "gemini",
            model: "gemini-2.5-pro",
            isActive: true,
          });
        }
      } else {
        setError("Failed to load merchant settings");
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      // If unauthorized, clear token and redirect to login
      if (
        err.message?.includes("401") ||
        err.message?.includes("unauthorized") ||
        err.message?.includes("Invalid") ||
        err.message?.includes("token")
      ) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        window.history.pushState({}, "", "/login");
        window.dispatchEvent(new PopStateEvent("popstate"));
        return;
      }
      setError(err.message || "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to dashboard
  const goToDashboard = () => {
    window.history.pushState({}, "", "/dashboard");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // Handle brand identity updates
  const handleBrandUpdate = (data) => {
    setBrandData(data);
    setHasChanges(true);
  };

  // Handle API config updates
  const handleApiUpdate = (data) => {
    setApiConfigs(data.apiConfigs);
    if (data.twoFactorConfigs) {
      setTwoFactorConfigs(data.twoFactorConfigs);
    }
    if (data.customApis) {
      setCustomApis(data.customApis);
    }
    setHasChanges(true);
  };

  // Save all changes
  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      // Call complete-setup API to save all settings
      const response = await apiService.completeSetup({
        brandData: brandData,
        apiConfigs: apiConfigs || {},
        twoFactorConfigs: twoFactorConfigs || {},
      });

      if (response.success) {
        setSaveStatus("saved");
        setHasChanges(false);
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        throw new Error(response.error || "Failed to save");
      }
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus(null);
      alert("Failed to save: " + err.message);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading your settings...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchCurrentSettings}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Settings Header - Fixed at top */}
      <header className="bg-[#252542] border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={goToDashboard}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-semibold">
                    Merchant Settings
                  </h1>
                  <p className="text-gray-500 text-xs">
                    Configure your store and APIs
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="text-yellow-400 text-xs flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                  Unsaved changes
                </span>
              )}

              <button
                onClick={handleSave}
                disabled={!hasChanges || saveStatus === "saving"}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                  hasChanges
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/25"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                {saveStatus === "saving" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : saveStatus === "saved" ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-[#1e1e3f] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("brand")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === "brand"
                  ? "text-white border-purple-500"
                  : "text-gray-400 border-transparent hover:text-white"
              }`}
            >
              <Store className="w-4 h-4" />
              Brand Identity
            </button>
            <button
              onClick={() => setActiveTab("api")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === "api"
                  ? "text-white border-purple-500"
                  : "text-gray-400 border-transparent hover:text-white"
              }`}
            >
              <Code className="w-4 h-4" />
              API Configuration
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === "ai"
                  ? "text-white border-purple-500"
                  : "text-gray-400 border-transparent hover:text-white"
              }`}
            >
              <Bot className="w-4 h-4" />
              AI Settings
            </button>
          </div>
        </div>
      </div>

      {/* Content - Reuse existing components with prefilled data */}
      <div className="max-w-7xl mx-auto">
        {activeTab === "brand" && brandData && (
          <BrandIdentity
            onNext={handleBrandUpdate}
            onBack={null}
            isSettingsMode={true}
            initialData={brandData}
          />
        )}

        {activeTab === "api" && (
          <ApiConfiguration
            onNext={handleApiUpdate}
            onBack={() => setActiveTab("brand")}
            brandData={brandData}
            isSettingsMode={true}
            initialApiConfigs={apiConfigs}
            initial2FAConfigs={twoFactorConfigs}
            initialCustomApis={customApis}
          />
        )}

        {activeTab === "ai" && (
          <div className="p-6">
            <div className="bg-[#252542] rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Bot className="w-6 h-6 text-purple-400" />
                AI Provider Settings
              </h2>

              {/* Current Config Display */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
                <h3 className="text-white font-medium mb-3">
                  Current Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Provider</p>
                    <p className="text-white font-semibold capitalize">
                      {aiConfig?.provider || "gemini"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Model</p>
                    <p className="text-white font-semibold">
                      {aiConfig?.model || "gemini-2.5-pro"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className="text-green-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      Active
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">API Key</p>
                    <p className="text-white font-mono">••••••••••••</p>
                  </div>
                </div>
              </div>

              {/* Provider Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gemini */}
                <div
                  className={`p-5 rounded-xl border-2 transition-all ${
                    aiConfig?.provider === "gemini"
                      ? "border-green-500 bg-green-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <img
                        src="https://www.gstatic.com/images/branding/product/2x/gemini_32dp.png"
                        alt="Gemini"
                        className="w-8 h-8"
                      />
                      <span className="text-white font-semibold">
                        Google Gemini
                      </span>
                    </div>
                    {aiConfig?.provider === "gemini" && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-3">
                    Fast and efficient AI models for text generation and tool
                    calling.
                  </p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>• Uses GEMINI_MODEL from env</p>
                    <p>• Default: gemini-2.5-pro</p>
                    <p>• Supports all Gemini models</p>
                  </div>
                </div>

                {/* OpenAI */}
                <div
                  className={`p-5 rounded-xl border-2 transition-all ${
                    aiConfig?.provider === "openai"
                      ? "border-green-500 bg-green-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">AI</span>
                      </div>
                      <span className="text-white font-semibold">OpenAI</span>
                    </div>
                    {aiConfig?.provider === "openai" && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-3">
                    Powerful GPT models with advanced reasoning capabilities.
                  </p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>• gpt-4-turbo</p>
                    <p>• gpt-4</p>
                    <p>• gpt-3.5-turbo</p>
                  </div>
                </div>
              </div>

              {/* MCP Endpoint Info */}
              <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white font-medium mb-3">MCP Endpoint</h3>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-black/30 rounded-lg text-green-400 text-sm font-mono">
                    {API_BASE_URL}/api/mcp/merchants/{merchantId}/tools
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${API_BASE_URL}/api/mcp/merchants/${merchantId}/tools`
                      );
                      alert("Copied!");
                    }}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MerchantSettings;
