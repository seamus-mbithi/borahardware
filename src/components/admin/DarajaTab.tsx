import React, { useState } from 'react';
import { DarajaConfig } from '../../types';
import {
  Smartphone,
  Key,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  Play,
  Save,
  ExternalLink,
  Wallet,
  ArrowRightLeft,
  Copy,
  Check,
  Send,
  Code2,
  Terminal,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { formatKES } from '../../utils/storage';

interface DarajaTabProps {
  config: DarajaConfig;
  onSaveConfig: (cfg: DarajaConfig) => void;
}

type DarajaSection = 'b2pochi' | 'stkpush';

export const DarajaTab: React.FC<DarajaTabProps> = ({ config, onSaveConfig }) => {
  const [formData, setFormData] = useState<DarajaConfig>(config);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<DarajaSection>('b2pochi');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  // STK Push Simulator state
  const [testPhone, setTestPhone] = useState('0715532279');
  const [testAmount, setTestAmount] = useState('850');
  const [simStatus, setSimStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [stkResponsePayload, setStkResponsePayload] = useState<any | null>(null);

  // B2Pochi Simulator state
  const [pochiPartyB, setPochiPartyB] = useState(formData.pochiPhone || '254715532279');
  const [pochiAmount, setPochiAmount] = useState('850');
  const [pochiRemarks, setPochiRemarks] = useState('Simba Cement site delivery freight');
  const [pochiOccasion, setPochiOccasion] = useState('Bora Hardware Transporter Payout');
  const [pochiSimStatus, setPochiSimStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');
  const [pochiResponsePayload, setPochiResponsePayload] = useState<any | null>(null);

  const sandboxPochiUrl = 'https://sandbox.safaricom.co.ke/mpesa/b2pochi/v1/paymentrequest';
  const prodPochiUrl = 'https://api.safaricom.co.ke/mpesa/b2pochi/v1/paymentrequest';

  const currentPochiEndpoint =
    formData.environment === 'sandbox' ? sandboxPochiUrl : prodPochiUrl;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleRunSTKSimulator = async () => {
    setSimStatus('testing');
    setStkResponsePayload(null);
    try {
      const response = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone.trim(),
          amount: Number(testAmount),
          accountReference: formData.accountReference || 'BORA-TEST',
          transactionDesc: 'Bora HW Test STK',
          environment: formData.environment,
          consumerKey: formData.consumerKey,
          consumerSecret: formData.consumerSecret,
          shortcode: formData.shortcode,
          passkey: formData.passkey,
        }),
      });

      const data = await response.json();
      setStkResponsePayload(data);
      if (response.ok && data.success !== false) {
        setSimStatus('success');
      } else {
        setSimStatus('failed');
      }
    } catch (err: any) {
      setSimStatus('failed');
      setStkResponsePayload({ error: err.message || 'STK Push failed' });
    }
  };

  const handleRunB2PochiSimulator = async () => {
    setPochiSimStatus('sending');
    setPochiResponsePayload(null);
    try {
      const response = await fetch('/api/mpesa/b2pochi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(pochiAmount),
          partyB: pochiPartyB.trim(),
          remarks: pochiRemarks,
          occasion: pochiOccasion,
          commandID: formData.commandID || 'BusinessPayment',
          initiator: formData.initiatorName || 'testapi',
          securityCredential: formData.securityCredential,
          environment: formData.environment,
          consumerKey: formData.consumerKey,
          consumerSecret: formData.consumerSecret,
          shortcode: formData.shortcode || '600988',
          queueTimeOutURL: formData.queueTimeOutUrl,
          resultURL: formData.resultUrl,
        }),
      });

      const data = await response.json();
      setPochiResponsePayload(data);
      setPochiSimStatus('success');
    } catch (err: any) {
      setPochiSimStatus('failed');
      setPochiResponsePayload({ error: err.message || 'B2Pochi request failed' });
    }
  };

  const b2pochiSamplePayload = {
    Initiator: formData.initiatorName || 'testapi',
    SecurityCredential: formData.securityCredential ? '••••••••••••' : '[Base64_Encrypted_Cert]',
    CommandID: formData.commandID || 'BusinessPayment',
    Amount: pochiAmount,
    PartyA: formData.shortcode || '600988',
    PartyB: pochiPartyB.replace(/\D/g, ''),
    Remarks: pochiRemarks,
    QueueTimeOutURL: formData.queueTimeOutUrl || 'https://borahardware.co.ke/api/b2pochi/timeout',
    ResultURL: formData.resultUrl || 'https://borahardware.co.ke/api/b2pochi/result',
    Occasion: pochiOccasion,
  };

  const curlSnippet = `curl -X POST '${currentPochiEndpoint}' \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(
    {
      ...b2pochiSamplePayload,
      SecurityCredential: 'YOUR_ENCRYPTED_SECURITY_CREDENTIAL',
    },
    null,
    2
  )}'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Introduction Banner with Endpoint Spotlight */}
      <div className="bg-emerald-950 text-emerald-100 p-5 rounded-xl border border-emerald-900 shadow-md">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white">Safaricom Daraja M-Pesa API Suite</h3>
                <span className="bg-emerald-800 text-emerald-200 text-[10px] uppercase font-black px-2 py-0.5 rounded">
                  B2Pochi & STK Ready
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-1 max-w-2xl leading-relaxed">
                Connect Bora Hardware directly to Safaricom M-Pesa Daraja. Manage <strong>B2Pochi</strong>{' '}
                (Business to Pochi la Biashara) for supplier/driver disbursements and direct merchant collections,
                alongside <strong>Lipa na M-Pesa STK Push</strong>.
              </p>
            </div>
          </div>

          <div className="bg-emerald-900/60 border border-emerald-700/50 px-3 py-2 rounded-lg text-right hidden lg:block">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Current Target Endpoint</span>
            <code className="text-xs font-mono text-white font-bold">{formData.environment.toUpperCase()}</code>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-emerald-900/60">
          <button
            onClick={() => setActiveSection('b2pochi')}
            id="daraja-tab-b2pochi"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeSection === 'b2pochi'
                ? 'bg-amber-400 text-stone-950 shadow-sm'
                : 'bg-emerald-900/50 text-emerald-200 hover:bg-emerald-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>B2Pochi Payment Request API</span>
            <span className="text-[10px] bg-stone-900/30 text-current px-1.5 py-0.2 rounded font-mono">
              /b2pochi/v1
            </span>
          </button>

          <button
            onClick={() => setActiveSection('stkpush')}
            id="daraja-tab-stkpush"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeSection === 'stkpush'
                ? 'bg-amber-400 text-stone-950 shadow-sm'
                : 'bg-emerald-900/50 text-emerald-200 hover:bg-emerald-800'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Lipa na M-Pesa (STK Push)</span>
            <span className="text-[10px] bg-stone-900/30 text-current px-1.5 py-0.2 rounded font-mono">
              /stkpush/v1
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: B2POCHI PAYMENT REQUEST API (User's specific endpoint)        */}
      {/* ========================================================================= */}
      {activeSection === 'b2pochi' && (
        <div className="space-y-6">
          {/* Endpoint Banner Highlight */}
          <div className="bg-stone-900 text-stone-100 p-4 rounded-xl border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold rounded uppercase">
                  POST
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {currentPochiEndpoint}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Safaricom Daraja B2Pochi Endpoint for Pochi la Biashara transactions (Disbursements & Payment Requests).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCurl}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors border border-stone-700"
                title="Copy cURL Command"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCurl ? 'Copied cURL' : 'Copy cURL'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form: B2Pochi Parameters & Config */}
            <form
              onSubmit={handleSave}
              className="lg:col-span-2 bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <span>B2Pochi Configuration & Credentials</span>
                  </h4>
                  <p className="text-xs text-stone-500">
                    Safaricom Daraja parameters for Pochi la Biashara integrations
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                  />
                  <span>API Active</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Target Environment
                  </label>
                  <select
                    value={formData.environment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        environment: e.target.value as 'sandbox' | 'production',
                        b2pochiEndpoint:
                          e.target.value === 'sandbox' ? sandboxPochiUrl : prodPochiUrl,
                      })
                    }
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-semibold focus:border-emerald-500"
                  >
                    <option value="sandbox">Sandbox (https://sandbox.safaricom.co.ke)</option>
                    <option value="production">Production (https://api.safaricom.co.ke)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    CommandID
                  </label>
                  <select
                    value={formData.commandID || 'BusinessPayment'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        commandID: e.target.value as any,
                      })
                    }
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:border-emerald-500"
                  >
                    <option value="BusinessPayment">BusinessPayment (Supplier/Transporter payout)</option>
                    <option value="CustomerPayment">CustomerPayment (Refund/Customer transfer)</option>
                    <option value="SalaryPayment">SalaryPayment (Staff / Site worker wages)</option>
                    <option value="PromotionPayment">PromotionPayment (Contractor bonus / rebate)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Party A (Sending Shortcode)
                  </label>
                  <input
                    type="text"
                    value={formData.shortcode}
                    onChange={(e) => setFormData({ ...formData, shortcode: e.target.value })}
                    placeholder="e.g. 600988 (Sandbox) or your Paybill/Store Shortcode"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-mono focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    The shortcode debiting funds for the transaction.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Store Pochi la Biashara Phone Number (Mbithi)
                  </label>
                  <input
                    type="text"
                    value={formData.pochiPhone}
                    onChange={(e) => setFormData({ ...formData, pochiPhone: e.target.value })}
                    placeholder="e.g. 254715532279"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-mono focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Storeowner&apos;s registered Pochi la Biashara wallet.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Initiator Name
                  </label>
                  <input
                    type="text"
                    value={formData.initiatorName}
                    onChange={(e) => setFormData({ ...formData, initiatorName: e.target.value })}
                    placeholder="e.g. testapi (Sandbox) or store initiator"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-mono focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Security Credential (Encrypted)
                  </label>
                  <input
                    type="password"
                    value={formData.securityCredential}
                    onChange={(e) => setFormData({ ...formData, securityCredential: e.target.value })}
                    placeholder="Encrypted password using Safaricom Daraja Cert"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-mono focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    QueueTimeOutURL
                  </label>
                  <input
                    type="url"
                    value={formData.queueTimeOutUrl}
                    onChange={(e) => setFormData({ ...formData, queueTimeOutUrl: e.target.value })}
                    placeholder="https://borahardware.co.ke/api/b2pochi/timeout"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-mono focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    ResultURL
                  </label>
                  <input
                    type="url"
                    value={formData.resultUrl}
                    onChange={(e) => setFormData({ ...formData, resultUrl: e.target.value })}
                    placeholder="https://borahardware.co.ke/api/b2pochi/result"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-mono focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-stone-100">
                {savedSuccess ? (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>B2Pochi Configuration Saved!</span>
                  </span>
                ) : (
                  <span className="text-xs text-stone-400">
                    Values are kept safely in your browser storage.
                  </span>
                )}

                <button
                  type="submit"
                  id="save-b2pochi-config-btn"
                  className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save B2Pochi Settings</span>
                </button>
              </div>
            </form>

            {/* B2Pochi Live Payment Request Simulator */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-emerald-600" />
                    <span>Test B2Pochi Payment Request</span>
                  </h4>
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
                    Sandbox Tester
                  </span>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Simulate executing a request to{' '}
                  <code className="bg-stone-100 px-1 py-0.5 rounded text-[11px] font-mono text-stone-800">
                    /mpesa/b2pochi/v1/paymentrequest
                  </code>{' '}
                  for transport freight or quarry supplier payments.
                </p>

                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-0.5">
                      Recipient Pochi Phone (Party B)
                    </label>
                    <input
                      type="tel"
                      value={pochiPartyB}
                      onChange={(e) => setPochiPartyB(e.target.value)}
                      placeholder="2547XXXXXXXX"
                      className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-0.5">
                      Amount (KES)
                    </label>
                    <input
                      type="number"
                      value={pochiAmount}
                      onChange={(e) => setPochiAmount(e.target.value)}
                      className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-0.5">
                      Remarks / Description
                    </label>
                    <input
                      type="text"
                      value={pochiRemarks}
                      onChange={(e) => setPochiRemarks(e.target.value)}
                      className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-800"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-0.5">
                      Occasion
                    </label>
                    <input
                      type="text"
                      value={pochiOccasion}
                      onChange={(e) => setPochiOccasion(e.target.value)}
                      className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-800"
                    />
                  </div>

                  <button
                    onClick={handleRunB2PochiSimulator}
                    disabled={pochiSimStatus === 'sending'}
                    id="run-b2pochi-simulator-btn"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
                  >
                    {pochiSimStatus === 'sending' ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Calling /b2pochi/v1...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Execute B2Pochi Payment Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Real-time Response Output */}
              {pochiResponsePayload && (
                <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 text-stone-200 text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>HTTP 200 OK</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      ResponseCode: 0
                    </span>
                  </div>
                  <pre className="font-mono text-[11px] text-emerald-300 overflow-x-auto p-2 bg-stone-950 rounded">
                    {JSON.stringify(pochiResponsePayload, null, 2)}
                  </pre>
                </div>
              )}

              {/* Pochi la Biashara info card */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-xs space-y-2">
                <h5 className="font-bold text-amber-950 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-700" />
                  <span>Why Pochi la Biashara for Hardware?</span>
                </h5>
                <p className="text-stone-700 text-[11px] leading-relaxed">
                  In Kenya, hardware owners like Mbithi use <strong>Pochi la Biashara</strong> on their Safaricom line (<strong>0715 532 279</strong>) to keep business money separate from personal funds without expensive till hardware.
                </p>
                <ul className="list-disc list-inside text-stone-600 text-[11px] space-y-1">
                  <li>Direct payments cannot be reversed by customers without merchant consent.</li>
                  <li>Zero fees on customer transactions below KES 200.</li>
                  <li>Direct disbursements to site transport drivers & quarry loaders.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* JSON Payload Inspector & cURL documentation */}
          <div className="bg-stone-900 rounded-xl p-5 border border-stone-800 text-stone-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  JSON Request Body: /mpesa/b2pochi/v1/paymentrequest
                </span>
              </div>
              <button
                onClick={handleCopyCurl}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
              >
                {copiedCurl ? 'Copied to Clipboard!' : 'Copy cURL command'}
              </button>
            </div>

            <pre className="p-4 bg-stone-950 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto border border-stone-800">
              {JSON.stringify(b2pochiSamplePayload, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: LIPA NA M-PESA STK PUSH (C2B)                                  */}
      {/* ========================================================================= */}
      {activeSection === 'stkpush' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Credentials Form */}
          <form
            onSubmit={handleSave}
            className="lg:col-span-2 bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Lipa na M-Pesa Online Credentials</h4>
                <p className="text-xs text-stone-500">Configure your Safaricom Developer STK Push keys</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                />
                <span>Enable M-Pesa Express</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Type of Shortcode
                </label>
                <select
                  value={formData.tillOrPaybill}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tillOrPaybill: e.target.value as 'Till Number' | 'Paybill' | 'Pochi la Biashara',
                    })
                  }
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:border-emerald-500"
                >
                  <option value="Till Number">Buy Goods Till Number</option>
                  <option value="Paybill">Paybill Business Number</option>
                  <option value="Pochi la Biashara">Pochi la Biashara (Phone Wallet)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Business Shortcode / Till Number
                </label>
                <input
                  type="text"
                  value={formData.shortcode}
                  onChange={(e) => setFormData({ ...formData, shortcode: e.target.value })}
                  placeholder="e.g. 174379 (Sandbox) or your Till"
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-mono focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Account Reference (Displayed on customer phone)
                </label>
                <input
                  type="text"
                  value={formData.accountReference}
                  onChange={(e) => setFormData({ ...formData, accountReference: e.target.value })}
                  placeholder="e.g. BORA-HARDWARE"
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-mono focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Target Environment
                </label>
                <select
                  value={formData.environment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      environment: e.target.value as 'sandbox' | 'production',
                    })
                  }
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:border-emerald-500"
                >
                  <option value="sandbox">Sandbox (Testing / Demo)</option>
                  <option value="production">Production (Live Safaricom Network)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pb-1 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-stone-500" />
                <span>Protected Daraja API Credentials</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSecrets(!showSecrets)}
                className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 bg-stone-100 px-2 py-1 rounded hover:bg-stone-200 transition-colors"
              >
                {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showSecrets ? 'Hide Secrets' : 'Reveal Secrets'}</span>
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Consumer Key (From developer.safaricom.co.ke)
              </label>
              <input
                type={showSecrets ? 'text' : 'password'}
                value={formData.consumerKey}
                onChange={(e) => setFormData({ ...formData, consumerKey: e.target.value })}
                placeholder="Paste your App Consumer Key"
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-mono focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Consumer Secret
              </label>
              <input
                type={showSecrets ? 'text' : 'password'}
                value={formData.consumerSecret}
                onChange={(e) => setFormData({ ...formData, consumerSecret: e.target.value })}
                placeholder="Paste your App Consumer Secret"
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-mono focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Online Passkey (Lipa na M-Pesa Online Passkey)
              </label>
              {showSecrets ? (
                <textarea
                  value={formData.passkey}
                  onChange={(e) => setFormData({ ...formData, passkey: e.target.value })}
                  rows={2}
                  placeholder="Paste the Daraja Lipa na M-Pesa Passkey"
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-mono focus:border-emerald-500"
                />
              ) : (
                <input
                  type="password"
                  value={formData.passkey}
                  onChange={(e) => setFormData({ ...formData, passkey: e.target.value })}
                  placeholder="Paste the Daraja Lipa na M-Pesa Passkey"
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-mono focus:border-emerald-500"
                />
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              {savedSuccess ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Configuration Saved Successfully!</span>
                </span>
              ) : (
                <span className="text-xs text-stone-400">
                  Credentials are stored safely in local browser storage.
                </span>
              )}

              <button
                type="submit"
                id="save-daraja-config-btn"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save M-Pesa Config</span>
              </button>
            </div>
          </form>

          {/* STK Push Test Tool & Help */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
              <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <Play className="w-4 h-4 text-emerald-600" />
                <span>Test STK Push Simulator</span>
              </h4>
              <p className="text-xs text-stone-500 mt-1">
                Test how an M-Pesa PIN prompt request looks before deploying to customers.
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                    Test Phone Number
                  </label>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                    Amount (KSh)
                  </label>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 font-mono"
                  />
                </div>

                {simStatus === 'testing' && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-center animate-pulse">
                    Initiating STK Push to {testPhone}...
                  </div>
                )}

                {simStatus === 'success' && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-semibold text-center">
                    STK Push prompt sent successfully to {testPhone}!
                  </div>
                )}

                {simStatus === 'failed' && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 text-center">
                    STK Push failed. Check credentials or network logs below.
                  </div>
                )}

                {stkResponsePayload && (
                  <div className="mt-2 p-2.5 bg-stone-900 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto max-h-40">
                    <pre>{JSON.stringify(stkResponsePayload, null, 2)}</pre>
                  </div>
                )}

                <button
                  onClick={handleRunSTKSimulator}
                  disabled={simStatus === 'testing'}
                  id="run-daraja-simulator-btn"
                  className="w-full bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold py-2 rounded-lg text-xs transition-all"
                >
                  {simStatus === 'testing' ? 'Calling Daraja Gateway...' : 'Send Test STK Push'}
                </button>
              </div>
            </div>

            {/* Quick Setup Instructions */}
            <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 text-xs space-y-2.5">
              <h5 className="font-bold text-stone-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-stone-500" />
                <span>How to go live with Daraja</span>
              </h5>
              <ol className="list-decimal list-inside space-y-1 text-stone-600 leading-relaxed text-[11px]">
                <li>Log in to developer.safaricom.co.ke with your Safaricom ID.</li>
                <li>Create a new App (e.g. &ldquo;Bora Hardware Online Store&rdquo;).</li>
                <li>Select <strong>Lipa na M-Pesa Online</strong> API product.</li>
                <li>Copy the Consumer Key, Secret &amp; Passkey into the form on the left.</li>
                <li>Toggle &ldquo;Enable M-Pesa Express&rdquo; and tap Save.</li>
              </ol>
              <a
                href="https://developer.safaricom.co.ke"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold hover:underline pt-1"
              >
                <span>Visit Safaricom Daraja Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
