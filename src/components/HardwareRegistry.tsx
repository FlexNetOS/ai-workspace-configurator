import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, HardDrive, CircuitBoard, MemoryStick, Wifi, Usb,
  ExternalLink, Tag, Plus, X, Check, ChevronRight, ChevronDown,
  Shield, Package, Globe, Wrench, FileText, Users, Sparkles,
  Link2, Save, Trash2, Edit3
} from 'lucide-react';
import useHardwareRegistry, {
  type HardwareEntry,
  type ComponentType,
  type RegistrationStatus,
  resolveVendorWebhooks,
  generateHardwareSkill,
} from '@/store/hardwareRegistryStore';
import useWizardStore from '@/store/wizardStore';

/* ═══════════════════════════════════════════════════════════════
   Icons per component type
   ═══════════════════════════════════════════════════════════════ */

const typeIcons: Record<ComponentType, React.ReactNode> = {
  cpu: <Cpu className="w-5 h-5" />,
  gpu: <CircuitBoard className="w-5 h-5" />,
  motherboard: <CircuitBoard className="w-5 h-5" />,
  memory: <MemoryStick className="w-5 h-5" />,
  storage: <HardDrive className="w-5 h-5" />,
  network: <Wifi className="w-5 h-5" />,
  peripheral: <Usb className="w-5 h-5" />,
};

const typeColors: Record<ComponentType, string> = {
  cpu: '#F59E0B',
  gpu: '#3B82F6',
  motherboard: '#8B5CF6',
  memory: '#10B981',
  storage: '#06B6D4',
  network: '#EC4899',
  peripheral: '#64748B',
};

const statusConfig: Record<RegistrationStatus, { label: string; color: string; bg: string }> = {
  discovered: { label: 'Discovered', color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
  identified: { label: 'Identified', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  'vendor-linked': { label: 'Vendor Linked', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  registered: { label: 'Registered', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  active: { label: 'Active', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
};

const webhookIcons: Record<string, React.ReactNode> = {
  vendorDocs: <FileText className="w-3.5 h-3.5" />,
  drivers: <Wrench className="w-3.5 h-3.5" />,
  firmware: <Shield className="w-3.5 h-3.5" />,
  software: <Package className="w-3.5 h-3.5" />,
  support: <Users className="w-3.5 h-3.5" />,
  warrantyCheck: <Shield className="w-3.5 h-3.5" />,
  community: <Globe className="w-3.5 h-3.5" />,
};

const webhookLabels: Record<string, string> = {
  vendorDocs: 'Documentation',
  drivers: 'Drivers',
  firmware: 'Firmware',
  software: 'Software',
  support: 'Support',
  warrantyCheck: 'Warranty',
  community: 'Community',
};

/* ═══════════════════════════════════════════════════════════════
   Mock auto-discovered entries from hardware scan
   ═══════════════════════════════════════════════════════════════ */

const mockDiscovered: Omit<HardwareEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    componentType: 'cpu',
    vendor: 'Intel',
    model: 'Core i9-13900K',
    status: 'discovered',
    resourceTags: ['primary', 'workstation'],
    webhooks: resolveVendorWebhooks('Intel', 'Core i9-13900K', 'cpu'),
    discoveredSpecs: { cores: '24', threads: '32', baseClock: '3.0 GHz', socket: 'LGA1700' },
  },
  {
    componentType: 'gpu',
    vendor: 'NVIDIA',
    model: 'RTX 4090',
    status: 'discovered',
    resourceTags: ['ai', 'primary-gpu'],
    webhooks: resolveVendorWebhooks('NVIDIA', 'RTX 4090', 'gpu'),
    discoveredSpecs: { vram: '24 GB', architecture: 'Ada Lovelace', cudaCores: '16384', tdp: '450W' },
  },
  {
    componentType: 'memory',
    vendor: 'Corsair',
    model: 'Vengeance DDR5 64GB',
    status: 'discovered',
    resourceTags: ['ddr5', '64gb-kit'],
    webhooks: resolveVendorWebhooks('Corsair', 'Vengeance DDR5', 'memory'),
    discoveredSpecs: { capacity: '64 GB', speed: '5600 MHz', type: 'DDR5', modules: '2x32GB' },
  },
  {
    componentType: 'storage',
    vendor: 'Samsung',
    model: '990 PRO 2TB',
    status: 'discovered',
    resourceTags: ['nvme', 'boot-drive', 'primary'],
    webhooks: resolveVendorWebhooks('Samsung', '990 PRO 2TB', 'storage'),
    discoveredSpecs: { capacity: '2 TB', interface: 'PCIe 4.0 x4', formFactor: 'M.2 2280', speed: '7450 MB/s' },
  },
  {
    componentType: 'motherboard',
    vendor: 'ASUS',
    model: 'ROG Maximus Z790 Hero',
    status: 'discovered',
    resourceTags: ['atx', 'z790', 'rog'],
    webhooks: resolveVendorWebhooks('ASUS', 'ROG Maximus Z790 Hero', 'motherboard'),
    discoveredSpecs: { chipset: 'Z790', socket: 'LGA1700', formFactor: 'ATX', pcieSlots: '5' },
  },
];

/* ═══════════════════════════════════════════════════════════════
   Device Card Component
   ═══════════════════════════════════════════════════════════════ */

function DeviceCard({
  entry,
  isExpanded,
  onToggle,
  onStatusChange,
  onAddTag,
  onRemoveTag,
  onSetSerialWarranty,
  onLinkVendor,
  onGenerateSkill,
  onDelete,
}: {
  entry: HardwareEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (status: RegistrationStatus) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onSetSerialWarranty: (serial: string, warranty: string) => void;
  onLinkVendor: () => void;
  onGenerateSkill: () => void;
  onDelete: () => void;
}) {
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [serialInput, setSerialInput] = useState(entry.serialNumber || '');
  const [warrantyInput, setWarrantyInput] = useState(entry.warrantyExpiry || '');
  const [editingSerial, setEditingSerial] = useState(false);
  const color = typeColors[entry.componentType];
  const status = statusConfig[entry.status];
  const hasWebhooks = Object.values(entry.webhooks).filter(Boolean).length;

  const statusFlow: RegistrationStatus[] = ['discovered', 'identified', 'vendor-linked', 'registered', 'active'];
  const currentIdx = statusFlow.indexOf(entry.status);

  return (
    <motion.div
      layout
      className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] overflow-hidden hover:border-[rgba(255,255,255,0.1)] transition-colors"
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, color }}
        >
          {typeIcons[entry.componentType]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-[14px] font-semibold text-[#F0F4F8] truncate">{entry.vendor} {entry.model}</h4>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
              style={{ color: status.color, background: status.bg }}
            >
              {status.label}
            </span>
            {entry.skillId && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[rgba(139,92,246,0.1)] text-[#A78BFA] flex-shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Skill
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#64748B] mt-0.5 capitalize">{entry.componentType} • {hasWebhooks} resource links • {entry.resourceTags.length} tags</p>
        </div>
        <div className="flex items-center gap-1">
          {isExpanded ? <ChevronDown className="w-4 h-4 text-[#475569]" /> : <ChevronRight className="w-4 h-4 text-[#475569]" />}
        </div>
      </div>

      {/* ── Expanded Content ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-[rgba(255,255,255,0.04)] pt-4">

              {/* Status Pipeline */}
              <div>
                <label className="text-[11px] font-medium text-[#475569] uppercase tracking-wider mb-2 block">Registration Status</label>
                <div className="flex items-center gap-1">
                  {statusFlow.map((s, i) => (
                    <div key={s} className="flex items-center">
                      <button
                        onClick={() => onStatusChange(s)}
                        className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                          i <= currentIdx
                            ? 'text-white'
                            : 'text-[#475569] bg-[rgba(255,255,255,0.03)]'
                        }`}
                        style={i <= currentIdx ? { background: `${color}30`, color } : {}}
                      >
                        {statusConfig[s].label}
                      </button>
                      {i < statusFlow.length - 1 && (
                        <ChevronRight className="w-3 h-3 text-[#475569] mx-0.5" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Discovered Specs */}
              {Object.keys(entry.discoveredSpecs).length > 0 && (
                <div>
                  <label className="text-[11px] font-medium text-[#475569] uppercase tracking-wider mb-2 block">Auto-Discovered Specs</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(entry.discoveredSpecs).map(([key, val]) => (
                      <div key={key} className="px-3 py-2 rounded-lg bg-[#050A18] border border-[rgba(255,255,255,0.04)]">
                        <p className="text-[10px] text-[#475569] capitalize">{key}</p>
                        <p className="text-[12px] text-[#F0F4F8] font-mono">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Serial & Warranty */}
              <div>
                <label className="text-[11px] font-medium text-[#475569] uppercase tracking-wider mb-2 block">Serial & Warranty</label>
                {editingSerial ? (
                  <div className="space-y-2">
                    <input
                      value={serialInput}
                      onChange={(e) => setSerialInput(e.target.value)}
                      placeholder="Serial Number"
                      className="w-full px-3 py-2 rounded-lg bg-[#050A18] border border-[rgba(255,255,255,0.08)] text-[#F0F4F8] text-[12px] placeholder-[#475569] focus:outline-none focus:border-[rgba(37,99,235,0.4)]"
                    />
                    <input
                      value={warrantyInput}
                      onChange={(e) => setWarrantyInput(e.target.value)}
                      placeholder="Warranty Expiry (YYYY-MM-DD)"
                      className="w-full px-3 py-2 rounded-lg bg-[#050A18] border border-[rgba(255,255,255,0.08)] text-[#F0F4F8] text-[12px] placeholder-[#475569] focus:outline-none focus:border-[rgba(37,99,235,0.4)]"
                    />
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => { onSetSerialWarranty(serialInput, warrantyInput); setEditingSerial(false); }}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white flex items-center gap-1"
                        style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)' }}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Save className="w-3 h-3" /> Save
                      </motion.button>
                      <button onClick={() => setEditingSerial(false)} className="px-3 py-1.5 rounded-lg text-[11px] text-[#64748B] hover:text-[#94A3B8]">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#050A18] border border-[rgba(255,255,255,0.04)]">
                    <div>
                      <p className="text-[10px] text-[#475569]">Serial: {entry.serialNumber || 'Not set'}</p>
                      <p className="text-[10px] text-[#475569]">Warranty: {entry.warrantyExpiry || 'Not set'}</p>
                    </div>
                    <button onClick={() => setEditingSerial(true)} className="p-1.5 rounded-lg text-[#475569] hover:text-[#3B82F6] hover:bg-[rgba(37,99,235,0.08)] transition-all">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Vendor Account */}
              <div>
                <label className="text-[11px] font-medium text-[#475569] uppercase tracking-wider mb-2 block">Vendor Account</label>
                {entry.vendorAccount?.isLinked ? (
                  <div className="p-3 rounded-lg bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.15)]">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#10B981]" />
                      <span className="text-[12px] text-[#F0F4F8]">Linked to {entry.vendorAccount.portalName}</span>
                    </div>
                    {entry.vendorAccount.username && (
                      <p className="text-[11px] text-[#64748B] mt-1">Username: {entry.vendorAccount.username}</p>
                    )}
                  </div>
                ) : (
                  <motion.button
                    onClick={onLinkVendor}
                    className="w-full p-3 rounded-lg border border-dashed border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(37,99,235,0.3)] hover:bg-[rgba(37,99,235,0.04)] transition-all flex items-center justify-center gap-2"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link2 className="w-4 h-4 text-[#3B82F6]" />
                    <span className="text-[12px] text-[#3B82F6]">Link {entry.vendor} Account</span>
                  </motion.button>
                )}
              </div>

              {/* Webhooks */}
              {hasWebhooks > 0 && (
                <div>
                  <label className="text-[11px] font-medium text-[#475569] uppercase tracking-wider mb-2 block">Resource Links</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(entry.webhooks)
                      .filter(([, url]) => url)
                      .map(([key, url]) => (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-[#94A3B8] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(37,99,235,0.3)] hover:text-[#3B82F6] transition-all"
                        >
                          {webhookIcons[key]}
                          {webhookLabels[key]}
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      ))}
                  </div>
                </div>
              )}

              {/* Resource Tags */}
              <div>
                <label className="text-[11px] font-medium text-[#475569] uppercase tracking-wider mb-2 block">Resource Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {entry.resourceTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-[#94A3B8] bg-[rgba(37,99,235,0.08)] border border-[rgba(37,99,235,0.15)]"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button onClick={() => onRemoveTag(tag)} className="ml-0.5 text-[#475569] hover:text-[#EF4444]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {showTagInput ? (
                  <div className="flex gap-2">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          onAddTag(tagInput.trim());
                          setTagInput('');
                          setShowTagInput(false);
                        }
                      }}
                      placeholder="Enter tag..."
                      autoFocus
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#050A18] border border-[rgba(255,255,255,0.08)] text-[#F0F4F8] text-[12px] placeholder-[#475569] focus:outline-none focus:border-[rgba(37,99,235,0.4)]"
                    />
                    <motion.button
                      onClick={() => { if (tagInput.trim()) { onAddTag(tagInput.trim()); setTagInput(''); setShowTagInput(false); } }}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white"
                      style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)' }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Add
                    </motion.button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTagInput(true)}
                    className="flex items-center gap-1 text-[11px] text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Tag
                  </button>
                )}
              </div>

              {/* Generate AI Skill */}
              {!entry.skillId && (
                <motion.button
                  onClick={onGenerateSkill}
                  className="w-full p-3 rounded-xl border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.05)] hover:bg-[rgba(139,92,246,0.1)] transition-all flex items-center justify-center gap-2"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                  <span className="text-[12px] text-[#A78BFA] font-medium">Generate AI Skill for {entry.vendor} {entry.model}</span>
                </motion.button>
              )}

              {/* Delete */}
              <div className="pt-2 border-t border-[rgba(255,255,255,0.04)]">
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 text-[11px] text-[#EF4444] hover:text-[#DC2626] transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Remove from registry
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main HardwareRegistry Component
   ═══════════════════════════════════════════════════════════════ */

export default function HardwareRegistry() {
  const {
    entries,
    selectedEntryId,
    addEntry,
    removeEntry,
    setEntryStatus,
    setVendorAccount,
    addResourceTag,
    removeResourceTag,
    setSerialWarranty,
    setSkillId,
    selectEntry,
  } = useHardwareRegistry();

  const addTerminalLog = useWizardStore((s) => s.addTerminalLog);
  const [initialized, setInitialized] = useState(false);
  const [generatedSkills, setGeneratedSkills] = useState<string[]>([]);

  // Auto-populate from mock discovered data on first render
  const handleInitialize = useCallback(() => {
    mockDiscovered.forEach((data) => {
      const existing = entries.find(
        (e) => e.componentType === data.componentType && e.model === data.model
      );
      if (!existing) {
        addEntry(data);
      }
    });
    addTerminalLog(`[Hardware] ${mockDiscovered.length} components auto-discovered and added to registry`);
    setInitialized(true);
  }, [entries, addEntry, addTerminalLog]);

  const handleLinkVendor = useCallback(
    (entry: HardwareEntry) => {
      const portals: Record<string, { url: string; name: string }> = {
        Intel: { url: 'https://account.intel.com', name: 'Intel Account' },
        NVIDIA: { url: 'https://www.nvidia.com/en-us/account', name: 'NVIDIA Account' },
        Corsair: { url: 'https://account.corsair.com', name: 'Corsair Account' },
        Samsung: { url: 'https://account.samsung.com', name: 'Samsung Account' },
        ASUS: { url: 'https://account.asus.com', name: 'ASUS Account' },
        AMD: { url: 'https://account.amd.com', name: 'AMD Account' },
      };
      const portal = portals[entry.vendor] || { url: '#', name: `${entry.vendor} Portal` };
      setVendorAccount(entry.id, {
        portalUrl: portal.url,
        portalName: portal.name,
        isLinked: true,
        linkDate: new Date().toISOString(),
      });
      setEntryStatus(entry.id, 'vendor-linked');
      addTerminalLog(`[Hardware] Linked ${entry.vendor} ${entry.model} to vendor account`);
    },
    [setVendorAccount, setEntryStatus, addTerminalLog]
  );

  const handleGenerateSkill = useCallback(
    (entry: HardwareEntry) => {
      const skill = generateHardwareSkill(entry);
      setSkillId(entry.id, skill.id);
      setGeneratedSkills((prev) => [...prev, skill.id]);
      setEntryStatus(entry.id, 'registered');
      addTerminalLog(`[Hardware] AI Skill generated for ${entry.vendor} ${entry.model}: ${skill.id}`);
    },
    [setSkillId, setEntryStatus, addTerminalLog]
  );

  const activeCount = entries.filter((e) => e.status === 'active').length;
  const skillCount = entries.filter((e) => e.skillId).length;

  return (
    <div className="space-y-5">
      {/* Stats Bar */}
      <div className="flex gap-3">
        {[
          { label: 'Components', value: entries.length, icon: <CircuitBoard className="w-4 h-4" />, color: '#3B82F6' },
          { label: 'Active', value: activeCount, icon: <Check className="w-4 h-4" />, color: '#10B981' },
          { label: 'AI Skills', value: skillCount, icon: <Sparkles className="w-4 h-4" />, color: '#A78BFA' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex-1 p-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[16px] font-bold text-[#F0F4F8]">{stat.value}</p>
              <p className="text-[10px] text-[#64748B]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Initialize Button */}
      {!initialized && entries.length === 0 && (
        <motion.button
          onClick={handleInitialize}
          className="w-full p-5 rounded-2xl border border-[rgba(37,99,235,0.2)] bg-[rgba(37,99,235,0.05)] hover:bg-[rgba(37,99,235,0.08)] transition-all text-center"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          <Cpu className="w-8 h-8 text-[#3B82F6] mx-auto mb-2" />
          <h4 className="text-[15px] font-semibold text-[#F0F4F8] mb-1">Import Discovered Hardware</h4>
          <p className="text-[12px] text-[#94A3B8]">
            {mockDiscovered.length} components detected from the hardware scan. Click to add them to your registry.
          </p>
        </motion.button>
      )}

      {/* Device Cards */}
      {entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry) => (
            <DeviceCard
              key={entry.id}
              entry={entry}
              isExpanded={selectedEntryId === entry.id}
              onToggle={() => selectEntry(selectedEntryId === entry.id ? null : entry.id)}
              onStatusChange={(status) => setEntryStatus(entry.id, status)}
              onAddTag={(tag) => addResourceTag(entry.id, tag)}
              onRemoveTag={(tag) => removeResourceTag(entry.id, tag)}
              onSetSerialWarranty={(s, w) => setSerialWarranty(entry.id, s, w)}
              onLinkVendor={() => handleLinkVendor(entry)}
              onGenerateSkill={() => handleGenerateSkill(entry)}
              onDelete={() => removeEntry(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Generated Skills Summary */}
      {generatedSkills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-[rgba(139,92,246,0.15)] bg-[rgba(139,92,246,0.03)]"
        >
          <h4 className="text-[13px] font-semibold text-[#A78BFA] mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> AI Skills Connected to Chat
          </h4>
          <p className="text-[11px] text-[#94A3B8] mb-2">
            Claw now has specialized knowledge about these components. Ask "Why is my {entries.find((e) => e.skillId)?.model} running hot?" or "Optimize my {entries.find((e) => e.skillId)?.vendor} GPU."
          </p>
          <div className="flex flex-wrap gap-1.5">
            {generatedSkills.map((skillId) => {
              const entry = entries.find((e) => e.skillId === skillId);
              return (
                <span key={skillId} className="px-2 py-1 rounded-md text-[10px] font-medium bg-[rgba(139,92,246,0.1)] text-[#A78BFA] border border-[rgba(139,92,246,0.2)]">
                  {entry?.vendor} {entry?.model}
                </span>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
