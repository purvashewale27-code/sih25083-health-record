import React, { useState, useEffect } from 'react';
import type { Patient, WelfareScheme } from '../types';
import { apiCheckPatientInsuranceEligibility } from '../services/api';

interface InsuranceAssistanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

export const InsuranceAssistanceModal: React.FC<InsuranceAssistanceModalProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  const [loading, setLoading] = useState(true);
  const [evaluationData, setEvaluationData] = useState<{
    patient: {
      id: string;
      healthId: string;
      fullName: string;
      age: number;
      currentDistrict: string;
      stateOfOrigin: string;
      registeredScheme?: string;
      registeredCardNumber?: string;
    };
    evaluations: Array<{
      scheme: WelfareScheme;
      isEligible: boolean;
      reasons: string[];
      hasExistingCard: boolean;
      cardNumber?: string;
    }>;
  } | null>(null);

  useEffect(() => {
    if (isOpen && patient?.id) {
      setLoading(true);
      apiCheckPatientInsuranceEligibility(patient.id).then((res) => {
        setLoading(false);
        if (res.success && res.data) {
          setEvaluationData(res.data);
        }
      });
    }
  }, [isOpen, patient]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#DDE8E8] rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 text-[#16313A]">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-[#DDE8E8] pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F8F6] text-[#00A99D] text-xs font-semibold uppercase tracking-wider mb-1 border border-[#00A99D]/30">
              <span>Govt of Kerala & National Welfare</span>
            </div>
            <h3 className="text-xl font-extrabold text-[#16313A]">Health Insurance & Welfare Schemes</h3>
            <p className="text-xs text-[#61747B]">
              Real-time benefit eligibility evaluation for {patient.fullName} ({patient.healthId})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#61747B] hover:text-[#16313A] text-lg p-1 rounded-lg hover:bg-[#F0FAF8]"
          >
            ✕
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center text-[#61747B] text-xs space-y-2">
            <div className="inline-block animate-spin h-6 w-6 border-2 border-[#00A99D] border-t-transparent rounded-full" />
            <p>Evaluating state & national welfare criteria...</p>
          </div>
        )}

        {!loading && evaluationData && (
          <div className="space-y-4 text-xs">
            {/* Worker Summary Banner */}
            <div className="p-3.5 bg-[#F8FAFA] border border-[#DDE8E8] rounded-2xl flex flex-wrap items-center justify-between gap-2">
              <div>
                <strong className="text-sm text-[#16313A] block">{evaluationData.patient.fullName}</strong>
                <span className="text-[#61747B]">
                  Origin: <strong>{evaluationData.patient.stateOfOrigin}</strong> • Age: <strong>{evaluationData.patient.age} yrs</strong> • District: <strong>{evaluationData.patient.currentDistrict}</strong>
                </span>
              </div>
              {evaluationData.patient.registeredCardNumber && (
                <div className="bg-[#E8F8F6] text-[#00A99D] font-mono font-bold px-2.5 py-1 rounded-lg border border-[#00A99D]/30">
                  {evaluationData.patient.registeredCardNumber}
                </div>
              )}
            </div>

            {/* Schemes List */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {evaluationData.evaluations.map((item) => (
                <div
                  key={item.scheme.id}
                  className="p-4 bg-white border border-[#DDE8E8] hover:border-[#00A99D]/40 rounded-2xl space-y-2.5 shadow-xs transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-[#16313A] text-sm">{item.scheme.name}</h4>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono font-bold text-[10px]">
                          {item.scheme.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#61747B]">{item.scheme.governingBody}</p>
                    </div>

                    {item.isEligible ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-[11px] whitespace-nowrap">
                        ✓ Eligible
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-bold text-[11px] whitespace-nowrap">
                        ⚠️ Not Applicable
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#F8FAFA] p-2.5 rounded-xl text-[11px]">
                    <div>
                      <span className="text-[#61747B] block">Hospitalization Cover:</span>
                      <strong className="text-[#00A99D] font-bold">{item.scheme.healthCoverageAmount}</strong>
                    </div>
                    <div>
                      <span className="text-[#61747B] block">Accidental Benefit:</span>
                      <strong className="text-[#16313A] font-bold">{item.scheme.accidentalBenefit}</strong>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <span className="font-semibold text-[#16313A]">Eligibility Assessment:</span>
                    <ul className="list-disc list-inside text-[#61747B] space-y-0.5 pl-1">
                      {item.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-[#DDE8E8] flex items-center justify-between text-[11px]">
                    <span className="text-[#61747B]">
                      Toll-Free Helpline: <strong className="text-[#16313A] font-mono">{item.scheme.helplinePhone}</strong>
                    </span>
                    <a
                      href={item.scheme.officialPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00A99D] font-bold hover:underline"
                    >
                      Official Scheme Portal ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
