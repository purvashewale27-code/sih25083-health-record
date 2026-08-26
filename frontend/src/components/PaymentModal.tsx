import React, { useState } from 'react';
import type { Appointment } from '../types';
import { apiCreatePaymentOrder, apiVerifyPayment } from '../services/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  patientId: string;
  patientName: string;
  onPaymentSuccess?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  patientId,
  patientName,
  onPaymentSuccess,
}) => {
  const [amount] = useState(50); // Nominal 50 INR fee for secondary clinic appointment
  const [isBplWaiver, setIsBplWaiver] = useState(false);
  const [waiverReason, setWaiverReason] = useState('AWAZ Scheme Cashless Health Checkup');
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'SELECT' | 'UPI_QR' | 'SUCCESS'>('SELECT');
  const [orderData, setOrderData] = useState<{
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleInitiatePayment = async () => {
    setLoading(true);
    const res = await apiCreatePaymentOrder({
      patientId,
      appointmentId: appointment?.id,
      amount,
      isBplWaiver,
      waiverReason: isBplWaiver ? waiverReason : undefined,
    });
    setLoading(false);

    if (res.success && res.data) {
      if (res.data.isWaived) {
        setPaymentStep('SUCCESS');
        setTimeout(() => {
          if (onPaymentSuccess) onPaymentSuccess();
          onClose();
        }, 1800);
      } else {
        setOrderData(res.data);
        setPaymentStep('UPI_QR');
      }
    } else {
      alert(res.error || 'Failed to initiate payment.');
    }
  };

  const handleVerifySandboxPayment = async () => {
    if (!orderData) return;
    setLoading(true);

    const res = await apiVerifyPayment({
      orderId: orderData.orderId,
      paymentId: `pay_sih_test_${Date.now()}`,
      signature: 'sandbox_test_signature',
      method: 'UPI',
    });
    setLoading(false);

    if (res.success) {
      setPaymentStep('SUCCESS');
      setTimeout(() => {
        if (onPaymentSuccess) onPaymentSuccess();
        onClose();
      }, 1800);
    } else {
      alert(res.error || 'Payment verification failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#DDE8E8] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 text-[#16313A]">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-[#DDE8E8] pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F8F6] text-[#00A99D] text-xs font-semibold uppercase tracking-wider mb-1 border border-[#00A99D]/30">
              <span>Secure Gateway (Sandbox)</span>
            </div>
            <h3 className="text-xl font-extrabold text-[#16313A]">Consultation Fee & Waiver</h3>
            <p className="text-xs text-[#61747B]">
              Nominal token for {patientName} {appointment ? `(${appointment.appointmentNumber})` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#61747B] hover:text-[#16313A] text-lg p-1 rounded-lg hover:bg-[#F0FAF8]"
          >
            ✕
          </button>
        </div>

        {paymentStep === 'SELECT' && (
          <div className="space-y-4 text-xs">
            {/* Amount Summary */}
            <div className="p-4 bg-[#F8FAFA] border border-[#DDE8E8] rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[#61747B] text-[11px] block">Standard Consultation Fee:</span>
                <span className="text-2xl font-black text-[#16313A]">₹50.00</span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-semibold text-[11px]">
                Subsidized Govt PHC
              </span>
            </div>

            {/* BPL / AWAZ Waiver Option */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900">
                <input
                  type="checkbox"
                  checked={isBplWaiver}
                  onChange={(e) => setIsBplWaiver(e.target.checked)}
                  className="rounded text-[#00A99D] focus:ring-[#00A99D]"
                />
                <span>Apply 100% Free Waiver (AWAZ / BPL Worker)</span>
              </label>

              {isBplWaiver && (
                <div>
                  <label className="block text-amber-800 text-[11px] font-medium mb-1">Exemption Reason:</label>
                  <select
                    value={waiverReason}
                    onChange={(e) => setWaiverReason(e.target.value)}
                    className="w-full bg-white text-[#16313A] px-3 py-1.5 rounded-xl border border-amber-300"
                  >
                    <option value="AWAZ Scheme Cashless Health Checkup">AWAZ Scheme Cashless Health Checkup</option>
                    <option value="Kerala BPL Interstate Guest Worker Exemption">Kerala BPL Interstate Guest Worker Exemption</option>
                    <option value="Free Mobile Medical Camp Screening">Free Mobile Medical Camp Screening</option>
                  </select>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleInitiatePayment}
                className="w-full py-2.5 bg-[#00A99D] hover:bg-[#008F83] text-white font-bold rounded-xl transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Processing...'
                ) : isBplWaiver ? (
                  'Confirm Free Waiver Access →'
                ) : (
                  'Proceed to UPI / Card Payment (₹50) →'
                )}
              </button>
            </div>
          </div>
        )}

        {paymentStep === 'UPI_QR' && orderData && (
          <div className="space-y-4 text-xs text-center">
            <div className="p-4 bg-[#F8FAFA] border border-[#DDE8E8] rounded-2xl space-y-3 flex flex-col items-center">
              <span className="text-xs font-semibold text-[#61747B]">
                Scan with any UPI App (GPay / PhonePe / Paytm / BHIM)
              </span>

              {/* Dynamic Sandbox UPI QR */}
              <div className="p-3 bg-white border border-[#DDE8E8] rounded-2xl shadow-xs">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    `upi://pay?pa=dhs.kerala@gov&pn=KeralaMigrantHealthPortal&am=50&tr=${orderData.orderId}&cu=INR`
                  )}`}
                  alt="UPI QR Code"
                  className="w-40 h-40 object-contain"
                />
              </div>

              <div className="font-mono text-xs text-[#61747B]">
                Order ID: <strong className="text-[#16313A]">{orderData.orderId}</strong>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentStep('SELECT')}
                className="flex-1 py-2 bg-[#F8FAFA] text-[#61747B] border border-[#DDE8E8] rounded-xl font-medium"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleVerifySandboxPayment}
                className="flex-2 py-2 bg-[#00A99D] hover:bg-[#008F83] text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                {loading ? 'Verifying...' : 'Simulate Successful UPI Payment ✓'}
              </button>
            </div>
          </div>
        )}

        {paymentStep === 'SUCCESS' && (
          <div className="py-6 text-center space-y-2">
            <div className="text-4xl animate-bounce">✅</div>
            <h4 className="text-base font-bold text-[#16313A]">Payment / Waiver Confirmed</h4>
            <p className="text-xs text-[#61747B]">Appointment slot has been permanently confirmed & verified.</p>
          </div>
        )}
      </div>
    </div>
  );
};
