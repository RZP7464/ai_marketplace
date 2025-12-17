import React, { useState } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function CursorConfigModal({ isOpen, onClose }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (isOpen && !config) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/mcp/cursor-config`);
      const data = await response.json();
      
      if (data.success) {
        setConfig(data);
      } else {
        setError(data.error || 'Failed to fetch config');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch config');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const jsonString = JSON.stringify(config.config, null, 2);
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadConfig = () => {
    const jsonString = JSON.stringify(config.config, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cursor-mcp-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a2e] border border-purple-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Cursor IDE MCP Configuration</h2>
            <p className="text-purple-100 text-sm mt-1">
              Copy this config to integrate all merchants with Cursor
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading configuration...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
              <p className="font-semibold">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {config && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-gray-400 text-sm">Total Merchants</p>
                  <p className="text-2xl font-bold text-white">{config.merchantCount}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-gray-400 text-sm">Base URL</p>
                  <p className="text-sm font-mono text-purple-300">{config.baseUrl}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-gray-400 text-sm">Config Size</p>
                  <p className="text-2xl font-bold text-white">{Object.keys(config.config.mcpServers).length} servers</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <h3 className="text-blue-400 font-semibold mb-3 flex items-center">
                  <span className="mr-2">📋</span> Setup Instructions
                </h3>
                <ol className="text-gray-300 text-sm space-y-2">
                  {config.instructions.map((instruction, idx) => (
                    <li key={idx} className="flex">
                      <span className="text-blue-400 font-bold mr-2">{idx + 1}.</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  {copied ? (
                    <>
                      <Check size={20} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={20} />
                      Copy to Clipboard
                    </>
                  )}
                </button>
                <button
                  onClick={downloadConfig}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download size={20} />
                  Download
                </button>
              </div>

              {/* JSON Display */}
              <div className="bg-[#0d0d1a] rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm font-semibold">Configuration JSON</p>
                  <span className="text-xs text-gray-500">Ready to paste in Cursor settings.json</span>
                </div>
                <pre className="text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(config.config, null, 2)}
                </pre>
              </div>

              {/* Merchants List */}
              <div className="mt-6">
                <h3 className="text-white font-semibold mb-3">Available Merchant Servers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(config.config.mcpServers).map(([name, serverConfig]) => (
                    <div key={name} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-purple-400 font-semibold">{name}</p>
                      <p className="text-gray-400 text-xs mt-1">{serverConfig.env.MERCHANT_NAME}</p>
                      <p className="text-gray-500 text-xs">Slug: {serverConfig.env.MERCHANT_SLUG}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white/5 border-t border-white/10 p-4 flex justify-between items-center">
          <p className="text-gray-400 text-sm">
            💡 Tip: After pasting, restart Cursor to activate the MCP servers
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default CursorConfigModal;

