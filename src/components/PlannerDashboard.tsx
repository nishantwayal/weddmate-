import React, { useState } from 'react';
import {
  Download,
  Plus,
  QrCode,
  Shield,
  Users,
  HeartHandshake,
  Clock,
  Lock,
} from 'lucide-react';
import { DurationPreset, PlanTier, WeddingEvent } from '../types';
import { HeartQrCode } from './HeartQrCode';
import { formatCountdown } from '../utils/matching';

interface PlannerDashboardProps {
  myUid: string;
  weddings: WeddingEvent[];
  onCreateWedding: (event: Omit<WeddingEvent, 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateWedding: (id: string, patch: Partial<WeddingEvent>) => Promise<void>;
}

export const PlannerDashboard: React.FC<PlannerDashboardProps> = ({
  myUid,
  weddings,
  onCreateWedding,
  onUpdateWedding,
}) => {
  const myWeddings = weddings.filter((w) => w.plannerUid === myUid || weddings.length <= 2);
  const [selectedId, setSelectedId] = useState<string>(myWeddings[0]?.id || '');

  // Create form state
  const [weddingName, setWeddingName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [weddingDate, setWeddingDate] = useState('2026-12-12');
  const [venue, setVenue] = useState('');
  const [durationPreset, setDurationPreset] = useState<DurationPreset>('3_days');
  const [customDays, setCustomDays] = useState(4);
  const [planTier, setPlanTier] = useState<PlanTier>('Premium');
  const [joinPermission, setJoinPermission] = useState<'open_qr' | 'approval_required' | 'invite_only'>('open_qr');
  const [memoriesUploadPermission, setMemoriesUploadPermission] = useState<'all_guests' | 'organizer_only'>('all_guests');
  const [creating, setCreating] = useState(false);

  const selectedWedding =
    weddings.find((w) => w.id === selectedId) || myWeddings[0] || weddings[0] || null;

  const computeExpiryMs = (preset: DurationPreset, customD: number): number => {
    const days =
      preset === '2_days' ? 2 : preset === '3_days' ? 3 : preset === '5_days' ? 5 : Math.max(1, customD);
    return Date.now() + days * 24 * 60 * 60 * 1000;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weddingName.trim() || !brideName.trim() || !groomName.trim() || !venue.trim()) return;
    setCreating(true);
    const id = `wed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const qrToken = `${brideName.slice(0, 3).toUpperCase()}-${groomName.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      await onCreateWedding({
        id,
        plannerUid: myUid,
        weddingName: weddingName.trim(),
        brideName: brideName.trim(),
        groomName: groomName.trim(),
        weddingDate,
        venue: venue.trim(),
        durationPreset,
        expiresAtMs: computeExpiryMs(durationPreset, customDays),
        qrCodeToken: qrToken,
        joinPermission,
        matchmakingEnabled: true,
        memoriesEnabled: true,
        memoriesUploadPermission,
        status: 'active',
        planTier,
        guestCount: 1,
        optedInCount: 0,
      });
      setSelectedId(id);
      setWeddingName('');
      setBrideName('');
      setGroomName('');
      setVenue('');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadReport = (w: WeddingEvent) => {
    const csv = [
      'Wedding Name,Bride,Groom,Date,Venue,QR Code,Plan Tier,Status,Guests Joined,Opted-In Matchmaking',
      `"${w.weddingName}","${w.brideName}","${w.groomName}","${w.weddingDate}","${w.venue}","${w.qrCodeToken}","${w.planTier}","${w.status}",${w.guestCount},${w.optedInCount}`,
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weddmate-report-${w.qrCodeToken}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-[#8F6A20] dark:text-[#D4AF5A]">
            Wedding Planner &amp; Venue Studio
          </div>
          <h2 className="font-display text-3xl font-semibold text-[#2A151B] dark:text-[#F5EDE2]">
            Planner Dashboard &amp; Heart QR Generator
          </h2>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs text-[#6E535B] dark:text-[#C7B3B8]">
          <Lock className="w-3.5 h-3.5 text-[#6B1D2F] dark:text-[#D4AF5A]" />
          <span>Planners never see private guest chats or dating preferences</span>
        </div>
      </div>

      {/* Create Wedding Event + Live Heart QR Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleCreate}
          className="lg:col-span-7 bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-[#6B1D2F] dark:text-[#D4AF5A]">
            <Plus className="w-4 h-4" />
            <span>Create New Wedding Community &amp; Heart QR</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Wedding Event Name</label>
              <input
                type="text"
                required
                value={weddingName}
                onChange={(e) => setWeddingName(e.target.value)}
                placeholder="e.g. Royal Udaipur Winter Wedding"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Bride&apos;s Name</label>
              <input
                type="text"
                required
                value={brideName}
                onChange={(e) => setBrideName(e.target.value)}
                placeholder="Kiara"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Groom&apos;s Name</label>
              <input
                type="text"
                required
                value={groomName}
                onChange={(e) => setGroomName(e.target.value)}
                placeholder="Aarav"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Wedding Date</label>
              <input
                type="date"
                required
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Venue</label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Taj Lake Palace, Udaipur"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm"
              />
            </div>
          </div>

          {/* QR Duration & Auto-Expiry */}
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Automatic QR Expiry Duration (QR disables automatically after expiry)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: '2_days', label: '2 Days' },
                  { id: '3_days', label: '3 Days' },
                  { id: '5_days', label: '5 Days' },
                  { id: 'custom', label: 'Custom Days' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDurationPreset(opt.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer ${
                    durationPreset === opt.id
                      ? 'bg-[#6B1D2F] text-[#FAF6F0] border-[#6B1D2F]'
                      : 'border-[#DFCBB2] dark:border-[#4A2833]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {durationPreset === 'custom' && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span>Expire after</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={customDays}
                  onChange={(e) => setCustomDays(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 rounded-lg bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] font-mono-tabular"
                />
                <span>days</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Join Permission</label>
              <select
                value={joinPermission}
                onChange={(e) =>
                  setJoinPermission(e.target.value as 'open_qr' | 'approval_required' | 'invite_only')
                }
                className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-xs"
              >
                <option value="open_qr">Open via Heart QR</option>
                <option value="approval_required">Host Approval</option>
                <option value="invite_only">Invite Only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Memories Uploads</label>
              <select
                value={memoriesUploadPermission}
                onChange={(e) =>
                  setMemoriesUploadPermission(e.target.value as 'all_guests' | 'organizer_only')
                }
                className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-xs"
              >
                <option value="all_guests">All Wedding Guests</option>
                <option value="organizer_only">Organiser Only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Pilot Package</label>
              <select
                value={planTier}
                onChange={(e) => setPlanTier(e.target.value as PlanTier)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-xs"
              >
                <option value="Basic">Basic (₹999)</option>
                <option value="Premium">Premium (₹2,999)</option>
                <option value="Luxury">Luxury (₹5,999)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-3 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-[#541524] cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            {creating ? 'Generating Heart QR...' : 'Generate Heart-Shaped Wedding QR'}
          </button>
        </form>

        {/* Active Heart QR Showcase & Controls */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] rounded-2xl p-6 flex flex-col items-center">
          {selectedWedding ? (
            <>
              <HeartQrCode
                value={`weddmate://join/${selectedWedding.qrCodeToken}`}
                weddingName={selectedWedding.weddingName}
                coupleNames={`${selectedWedding.brideName} & ${selectedWedding.groomName}`}
                venue={selectedWedding.venue}
                expiresAtMs={selectedWedding.expiresAtMs}
                qrToken={selectedWedding.qrCodeToken}
                size={230}
              />
              <div className="w-full mt-5 pt-4 border-t border-[#EDE2D4] dark:border-[#361C25] space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C]">
                    <div className="text-[#6E535B] dark:text-[#C7B3B8] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Guests Joined
                    </div>
                    <div className="font-mono-tabular text-xl font-semibold mt-0.5">
                      {selectedWedding.guestCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C]">
                    <div className="text-[#6E535B] dark:text-[#C7B3B8] flex items-center gap-1">
                      <HeartHandshake className="w-3.5 h-3.5" /> Opted-In
                    </div>
                    <div className="font-mono-tabular text-xl font-semibold mt-0.5">
                      {selectedWedding.optedInCount}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void onUpdateWedding(selectedWedding.id, {
                        matchmakingEnabled: !selectedWedding.matchmakingEnabled,
                      })
                    }
                    className="flex-1 py-2 px-3 rounded-xl border border-[#DFCBB2] dark:border-[#4A2833] cursor-pointer"
                  >
                    Matchmaking: {selectedWedding.matchmakingEnabled ? 'On' : 'Paused'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void onUpdateWedding(selectedWedding.id, {
                        status: selectedWedding.status === 'active' ? 'expired' : 'active',
                      })
                    }
                    className="flex-1 py-2 px-3 rounded-xl border border-[#DFCBB2] dark:border-[#4A2833] cursor-pointer"
                  >
                    QR: {selectedWedding.status === 'active' ? 'Active' : 'Disabled'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadReport(selectedWedding)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F3ECE2] dark:bg-[#2A151C] text-[#6B1D2F] dark:text-[#D4AF5A] font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Event Report (CSV)
                </button>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-xs text-[#6E535B] dark:text-[#C7B3B8]">
              Create a wedding event on the left to generate its Heart-Shaped QR card.
            </div>
          )}
        </div>
      </div>

      {/* Events Management Table */}
      <div className="bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#EDE2D4] dark:border-[#361C25] flex items-center justify-between">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#6B1D2F] dark:text-[#D4AF5A]" />
            Managed Wedding Communities ({weddings.length})
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6F0] dark:bg-[#241218] text-[#6E535B] dark:text-[#C7B3B8]">
              <tr>
                <th className="py-3 px-4 font-medium">Wedding</th>
                <th className="py-3 px-4 font-medium">Heart QR</th>
                <th className="py-3 px-4 font-medium">Expiry</th>
                <th className="py-3 px-4 font-medium">Package</th>
                <th className="py-3 px-4 font-medium text-right">Guests</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE2D4] dark:divide-[#361C25]">
              {weddings.map((w) => (
                <tr key={w.id} className="hover:bg-[#FAF6F0]/60 dark:hover:bg-[#241218]/60">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#2A151B] dark:text-[#F5EDE2]">
                      {w.weddingName}
                    </div>
                    <div className="text-[#6E535B] dark:text-[#C7B3B8]">
                      {w.brideName} &amp; {w.groomName} · {w.venue}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono-tabular">{w.qrCodeToken}</td>
                  <td className="py-3 px-4 font-mono-tabular">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#C9A048]" />
                      {formatCountdown(w.expiresAtMs)}
                    </span>
                  </td>
                  <td className="py-3 px-4">{w.planTier}</td>
                  <td className="py-3 px-4 text-right font-mono-tabular">{w.guestCount}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedId(w.id)}
                      className="text-[#6B1D2F] dark:text-[#D4AF5A] font-medium hover:underline cursor-pointer"
                    >
                      Inspect QR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
