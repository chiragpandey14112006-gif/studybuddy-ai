import React, { useState } from 'react';
import { 
  X, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Cpu,
  Cloud,
  Settings
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { testOpenAIConnection } from '../services/openaiService';
import { initFirebase } from '../services/firebaseService';

export function SettingsDrawer({ 
  isOpen, 
  onClose, 
  onConfigUpdated, 
  onClearHistory 
}) {
  const currentConfig = storageService.getConfig();

  const [apiKey, setApiKey] = useState(currentConfig.openaiApiKey || '');
  const [model, setModel] = useState(currentConfig.openaiModel || 'gpt-4o');
  const [forceOffline, setForceOffline] = useState(Boolean(currentConfig.forceOfflineMode));

  // Firebase fields
  const [fbApiKey, setFbApiKey] = useState(currentConfig.firebaseConfig?.apiKey || '');
  const [fbAuthDomain, setFbAuthDomain] = useState(currentConfig.firebaseConfig?.authDomain || '');
  const [fbProjectId, setFbProjectId] = useState(currentConfig.firebaseConfig?.projectId || '');
  const [fbAppId, setFbAppId] = useState(currentConfig.firebaseConfig?.appId || '');

  const [testStatus, setTestStatus] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const updated = storageService.saveConfig({
      openaiApiKey: apiKey.trim(),
      openaiModel: model,
      forceOfflineMode: forceOffline,
      firebaseConfig: {
        apiKey: fbApiKey.trim(),
        authDomain: fbAuthDomain.trim(),
        projectId: fbProjectId.trim(),
        appId: fbAppId.trim()
      }
    });

    initFirebase();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);

    if (onConfigUpdated) {
      onConfigUpdated(updated);
    }
  };

  const handleTestKey = async () => {
    const keyToTest = apiKey.trim() || import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!keyToTest) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'No OpenAI API key provided to test. Enter one below or use Offline mode.'
      });
      return;
    }

    setTestStatus({ loading: true });
    const result = await testOpenAIConnection(keyToTest, model);
    setTestStatus({
      loading: false,
      success: result.success,
      message: result.message
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#FAF8F5] border-l border-[#E8E3DD] h-full flex flex-col shadow-2xl overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-[#E8E3DD] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">StudyDesk Settings</h2>
              <p className="text-xs text-slate-500">API Keys & Dual-Mode Configuration</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6 flex-1">
          
          {/* Section 1: Execution Mode */}
          <div className="rounded-3xl bg-white border border-[#E8E3DD] p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span>Quiz Engine Mode</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border ${
                forceOffline 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                  : 'bg-indigo-50 border-indigo-300 text-indigo-800'
              }`}>
                {forceOffline ? 'Offline Mode' : 'Live GPT-4'}
              </span>
            </div>

            <label className="flex items-center space-x-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={forceOffline}
                onChange={(e) => setForceOffline(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-800 font-semibold">
                Force Offline Mode (Zero external API calls)
              </span>
            </label>
            <p className="text-[11px] text-slate-500 leading-normal">
              Ideal for campus libraries or offline studying. Uses the client-side regex engine to parse terms, headers, and bullet points from your notes or PDFs.
            </p>
          </div>

          {/* Section 2: OpenAI API Key */}
          <div className="rounded-3xl bg-white border border-[#E8E3DD] p-5 space-y-4 shadow-xs">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>OpenAI API Key (Optional)</span>
            </span>

            <div>
              <label className="block text-xs text-slate-600 mb-1.5 font-medium">
                OpenAI API Key
              </label>
              <input
                type="password"
                placeholder="sk-proj-... (Leave blank for offline mode)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-[#E8E3DD] text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-400 focus:bg-white"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Saved only inside your browser's private localStorage.
              </p>
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1.5 font-medium">
                Model Choice
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-[#E8E3DD] text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-400 focus:bg-white"
              >
                <option value="gpt-4o">gpt-4o (Recommended: Fast & Smart)</option>
                <option value="gpt-4-turbo">gpt-4-turbo (Thorough)</option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo (High Speed)</option>
              </select>
            </div>

            {/* Test Connection Button */}
            <div>
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testStatus?.loading}
                className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 border border-[#E8E3DD] text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                {testStatus?.loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Testing OpenAI Connection...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>

              {testStatus && (
                <div className={`mt-2 p-2.5 rounded-xl border text-xs flex items-start space-x-2 ${
                  testStatus.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {testStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <span>{testStatus.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Firebase Config */}
          <div className="rounded-3xl bg-white border border-[#E8E3DD] p-5 space-y-3 shadow-xs">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Cloud className="w-3.5 h-3.5 text-blue-600" />
              <span>Firebase Cloud Sync (Optional)</span>
            </span>

            <p className="text-[11px] text-slate-500 leading-normal">
              If omitted, StudyBuddy stores all quiz attempts and results in your browser's private local vault.
            </p>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">API Key</label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={fbApiKey}
                  onChange={(e) => setFbApiKey(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-[#E8E3DD] text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Project ID</label>
                <input
                  type="text"
                  placeholder="my-studybuddy-project"
                  value={fbProjectId}
                  onChange={(e) => setFbProjectId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-[#E8E3DD] text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">App ID</label>
                <input
                  type="text"
                  placeholder="1:12345:web:abc"
                  value={fbAppId}
                  onChange={(e) => setFbAppId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-[#E8E3DD] text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Data Reset */}
          <div className="rounded-3xl bg-white border border-[#E8E3DD] p-5 space-y-3 shadow-xs">
            <button
              type="button"
              onClick={onClearHistory}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Local Attempt History</span>
            </button>
          </div>

          {/* Save Button */}
          <div>
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Settings</span>
            </button>

            {saveSuccess && (
              <p className="text-emerald-700 text-center text-xs mt-2 font-medium">
                ✓ Settings saved successfully!
              </p>
            )}
          </div>

        </form>

      </div>
    </div>
  );
}
