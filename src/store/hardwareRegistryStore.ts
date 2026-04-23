import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export type ComponentType =
  | 'cpu'
  | 'gpu'
  | 'motherboard'
  | 'memory'
  | 'storage'
  | 'network'
  | 'peripheral';

export type RegistrationStatus =
  | 'discovered'
  | 'identified'
  | 'vendor-linked'
  | 'registered'
  | 'active';

export interface ComponentWebhooks {
  vendorDocs?: string;
  drivers?: string;
  firmware?: string;
  software?: string;
  support?: string;
  warrantyCheck?: string;
  community?: string;
}

export interface VendorAccount {
  portalUrl: string;
  portalName: string;
  username?: string;
  isLinked: boolean;
  linkDate?: string;
}

export interface HardwareEntry {
  id: string;
  componentType: ComponentType;
  vendor: string;
  model: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  resourceTags: string[];
  status: RegistrationStatus;
  webhooks: ComponentWebhooks;
  vendorAccount?: VendorAccount;
  skillId?: string;
  discoveredSpecs: Record<string, string>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HardwareRegistryState {
  entries: HardwareEntry[];
  selectedEntryId: string | null;

  // Actions
  addEntry: (entry: Omit<HardwareEntry, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateEntry: (id: string, patch: Partial<HardwareEntry>) => void;
  removeEntry: (id: string) => void;
  setEntryStatus: (id: string, status: RegistrationStatus) => void;
  setVendorAccount: (id: string, account: VendorAccount) => void;
  setWebhooks: (id: string, webhooks: ComponentWebhooks) => void;
  addResourceTag: (id: string, tag: string) => void;
  removeResourceTag: (id: string, tag: string) => void;
  setSerialWarranty: (id: string, serial?: string, warranty?: string) => void;
  setSkillId: (id: string, skillId: string) => void;
  selectEntry: (id: string | null) => void;
  getEntryByType: (type: ComponentType) => HardwareEntry | undefined;
  reset: () => void;
}

/* ═══════════════════════════════════════════════════════════════
   Vendor Webhook Resolver
   Maps vendor + model to known resource URLs
   ═══════════════════════════════════════════════════════════════ */

export function resolveVendorWebhooks(
  vendor: string,
  model: string,
  type: ComponentType
): ComponentWebhooks {
  const v = vendor.toLowerCase();
  const webhooks: ComponentWebhooks = {};

  // ── NVIDIA GPU ──
  if (v.includes('nvidia')) {
    const modelSlug = model.toLowerCase().replace(/\s+/g, '-');
    webhooks.vendorDocs = `https://www.nvidia.com/en-us/geforce/graphics-cards/${modelSlug}/`;
    webhooks.drivers = 'https://www.nvidia.com/drivers';
    webhooks.software = 'https://developer.nvidia.com/cuda-downloads';
    webhooks.support = 'https://www.nvidia.com/en-us/support/';
    webhooks.warrantyCheck = 'https://www.nvidia.com/en-us/support/warranty/';
    webhooks.community = 'https://www.reddit.com/r/nvidia/';
  }

  // ── AMD GPU / CPU ──
  if (v.includes('amd') || v.includes('advanced micro')) {
    webhooks.vendorDocs = `https://www.amd.com/en/products/processors/${model.toLowerCase().replace(/\s+/g, '-')}`;
    webhooks.drivers = 'https://www.amd.com/en/support';
    webhooks.software = 'https://www.amd.com/en/technologies/software';
    webhooks.support = 'https://www.amd.com/en/support/contact';
    webhooks.warrantyCheck = 'https://www.amd.com/en/support/warranty';
    webhooks.community = 'https://community.amd.com/';
  }

  // ── Intel CPU / GPU ──
  if (v.includes('intel')) {
    const arkSlug = model.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    webhooks.vendorDocs = `https://ark.intel.com/content/www/us/en/ark/products/series/${arkSlug}.html`;
    webhooks.drivers = 'https://www.intel.com/content/www/us/en/download-center/home.html';
    webhooks.software = 'https://www.intel.com/content/www/us/en/developer/tools/overview.html';
    webhooks.support = 'https://www.intel.com/content/www/us/en/support.html';
    webhooks.community = 'https://community.intel.com/';
  }

  // ── Corsair Memory ──
  if (v.includes('corsair')) {
    webhooks.vendorDocs = 'https://www.corsair.com/us/en/s/memory';
    webhooks.software = 'https://www.corsair.com/us/en/s/icue';
    webhooks.support = 'https://help.corsair.com/';
  }

  // ── Kingston Memory ──
  if (v.includes('kingston')) {
    webhooks.vendorDocs = 'https://www.kingston.com/unitedstates/us/memory';
    webhooks.support = 'https://www.kingston.com/unitedstates/us/support';
  }

  // ── Crucial / Micron Memory ──
  if (v.includes('crucial') || v.includes('micron')) {
    webhooks.vendorDocs = 'https://www.crucial.com/memory';
    webhooks.support = 'https://www.crucial.com/support';
    webhooks.software = 'https://www.crucial.com/support/memory-storage-crucial-system-scanner';
  }

  // ── Samsung Storage ──
  if (v.includes('samsung')) {
    webhooks.vendorDocs = 'https://www.samsung.com/us/computing/memory-storage/';
    webhooks.software = 'https://www.samsung.com/us/support/software/SamsungMagician/';
    webhooks.support = 'https://www.samsung.com/us/support/';
  }

  // ── Western Digital ──
  if (v.includes('western digital') || v.includes('wd ')) {
    webhooks.vendorDocs = 'https://www.westerndigital.com/products/internal-drives';
    webhooks.software = 'https://support.westerndigital.com/downloads.aspx';
    webhooks.support = 'https://www.westerndigital.com/support';
  }

  // ── Seagate ──
  if (v.includes('seagate')) {
    webhooks.vendorDocs = 'https://www.seagate.com/support/';
    webhooks.software = 'https://www.seagate.com/support/software/';
    webhooks.support = 'https://www.seagate.com/support/';
  }

  // ── Realtek Network ──
  if (v.includes('realtek')) {
    webhooks.drivers = 'https://www.realtek.com/en/component/zoo/category/network-interface-controllers-10-100-1000m-gigabit-ethernet-pci-express-software';
  }

  // ── Intel Network ──
  if (v.includes('intel') && type === 'network') {
    webhooks.drivers = 'https://www.intel.com/content/www/us/en/download/15817/intel-network-adapter-driver-for-windows-10.html';
  }

  // ── Motherboard OEMs ──
  if (type === 'motherboard') {
    if (v.includes('asus')) {
      webhooks.vendorDocs = 'https://www.asus.com/support/Download-Center/';
      webhooks.drivers = 'https://www.asus.com/support/Download-Center/';
      webhooks.firmware = 'https://www.asus.com/support/FAQ/1038565/';
      webhooks.software = 'https://www.asus.com/campaign/aura-us/download.html';
      webhooks.support = 'https://www.asus.com/support/';
      webhooks.community = 'https://rog-forum.asus.com/';
    }
    if (v.includes('msi')) {
      webhooks.vendorDocs = 'https://www.msi.com/support/download/';
      webhooks.drivers = 'https://www.msi.com/support/download/';
      webhooks.firmware = 'https://www.msi.com/support/technical_details/BIO_Update.html';
      webhooks.software = 'https://www.msi.com/Landing/mystic-light-rgb-gaming-pc/download';
      webhooks.support = 'https://www.msi.com/support/';
    }
    if (v.includes('gigabyte')) {
      webhooks.vendorDocs = 'https://www.gigabyte.com/Support';
      webhooks.drivers = 'https://www.gigabyte.com/Support';
      webhooks.firmware = 'https://www.gigabyte.com/Support/FAQ/386';
      webhooks.support = 'https://www.gigabyte.com/Support';
    }
    if (v.includes('asrock')) {
      webhooks.vendorDocs = 'https://www.asrock.com/support/download.asp';
      webhooks.drivers = 'https://www.asrock.com/support/download.asp';
      webhooks.support = 'https://www.asrock.com/support/index.asp';
    }
  }

  return webhooks;
}

/* ═══════════════════════════════════════════════════════════════
   SKILL Generator
   Creates a per-component skill file for the AI Chat
   ═══════════════════════════════════════════════════════════════ */

export interface HardwareSkill {
  id: string;
  name: string;
  description: string;
  componentType: ComponentType;
  vendor: string;
  model: string;
  capabilities: {
    explain: string[];
    troubleshoot: string[];
    optimize: string[];
  };
  knownIssues: string[];
  quickCommands: { label: string; command: string }[];
  relatedDocs: string[];
  memoryTrigger: string[];
}

export function generateHardwareSkill(entry: HardwareEntry): HardwareSkill {
  const id = `hw-${entry.id}`;
  const name = `${entry.vendor} ${entry.model} (${entry.componentType.toUpperCase()})`;

  const memoryTriggers: string[] = [
    entry.model.toLowerCase(),
    entry.vendor.toLowerCase(),
    `${entry.vendor.toLowerCase()} ${entry.componentType}`,
    entry.componentType,
  ];

  const capabilities = {
    explain: [`What is the ${entry.model}?`, `Specs of ${entry.model}`, `${entry.vendor} ${entry.model} capabilities`],
    troubleshoot: [`${entry.model} not working`, `${entry.vendor} driver issue`, `${entry.componentType} problem`],
    optimize: [`Optimize ${entry.model}`, `Best settings for ${entry.model}`, `${entry.vendor} tuning`],
  };

  const knownIssues: string[] = [];
  if (entry.componentType === 'gpu') {
    knownIssues.push(
      'Driver not detected in WSL2 → Install NVIDIA CUDA toolkit for WSL',
      'High temperature under load → Check fan curve in vendor software',
      'Memory allocation errors → Update to latest driver from vendor'
    );
  }
  if (entry.componentType === 'cpu') {
    knownIssues.push(
      'Virtualization not enabled → Enable VT-x/AMD-V in BIOS',
      'Thermal throttling → Reapply thermal paste, check cooler mount'
    );
  }
  if (entry.componentType === 'memory') {
    knownIssues.push(
      'XMP profile not loading → Enable in BIOS/UEFI memory settings',
      'Memory not at advertised speed → Check motherboard QVL list'
    );
  }
  if (entry.componentType === 'storage') {
    knownIssues.push(
      'Slow read/write speeds → Check SATA mode (AHCI not IDE), update firmware',
      'SMART warnings detected → Backup data immediately, consider replacement'
    );
  }
  if (entry.componentType === 'motherboard') {
    knownIssues.push(
      'BIOS not detecting device → Try different slot/port, reset CMOS',
      'USB ports not working → Check USB controller drivers in Device Manager'
    );
  }

  const quickCommands: { label: string; command: string }[] = [];
  if (entry.webhooks.drivers) {
    quickCommands.push({ label: 'Check for driver updates', command: `Open ${entry.webhooks.drivers}` });
  }
  if (entry.componentType === 'gpu') {
    quickCommands.push(
      { label: 'Test GPU in WSL', command: 'nvidia-smi' },
      { label: 'Check GPU temperature', command: 'nvidia-smi --query-gpu=temperature.gpu --format=csv' }
    );
  }
  if (entry.componentType === 'cpu') {
    quickCommands.push(
      { label: 'Check CPU info', command: 'lscpu' },
      { label: 'Stress test CPU', command: 'stress-ng --cpu 0 --timeout 60s' }
    );
  }
  if (entry.componentType === 'storage') {
    quickCommands.push(
      { label: 'Check disk health', command: 'smartctl -a /dev/sda' },
      { label: 'Benchmark disk', command: 'fio --name=test --filename=/tmp/test --size=1G --bs=1M --direct=1 --rw=read' }
    );
  }

  return {
    id,
    name,
    description: `Knowledge base for ${entry.vendor} ${entry.model} (${entry.componentType}). Auto-generated from hardware registry.`,
    componentType: entry.componentType,
    vendor: entry.vendor,
    model: entry.model,
    capabilities,
    knownIssues,
    quickCommands,
    relatedDocs: Object.values(entry.webhooks).filter(Boolean) as string[],
    memoryTrigger: memoryTriggers,
  };
}

/* ═══════════════════════════════════════════════════════════════
   Store
   ═══════════════════════════════════════════════════════════════ */

const useHardwareRegistry = create<HardwareRegistryState>()(
  persist(
    (set, get) => ({
      entries: [],
      selectedEntryId: null,

      addEntry: (entryData) => {
        const id = `${entryData.componentType}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const now = new Date().toISOString();
        const newEntry: HardwareEntry = {
          ...entryData,
          id,
          status: entryData.status || 'discovered',
          resourceTags: entryData.resourceTags || [],
          webhooks: entryData.webhooks || {},
          discoveredSpecs: entryData.discoveredSpecs || {},
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ entries: [...s.entries, newEntry], selectedEntryId: id }));
        return id;
      },

      updateEntry: (id, patch) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e
          ),
        })),

      removeEntry: (id) =>
        set((s) => ({
          entries: s.entries.filter((e) => e.id !== id),
          selectedEntryId: s.selectedEntryId === id ? null : s.selectedEntryId,
        })),

      setEntryStatus: (id, status) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, status, updatedAt: new Date().toISOString() } : e
          ),
        })),

      setVendorAccount: (id, account) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, vendorAccount: account, updatedAt: new Date().toISOString() } : e
          ),
        })),

      setWebhooks: (id, webhooks) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, webhooks, updatedAt: new Date().toISOString() } : e
          ),
        })),

      addResourceTag: (id, tag) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id && !e.resourceTags.includes(tag)
              ? { ...e, resourceTags: [...e.resourceTags, tag], updatedAt: new Date().toISOString() }
              : e
          ),
        })),

      removeResourceTag: (id, tag) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id
              ? { ...e, resourceTags: e.resourceTags.filter((t) => t !== tag), updatedAt: new Date().toISOString() }
              : e
          ),
        })),

      setSerialWarranty: (id, serial, warranty) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id
              ? { ...e, serialNumber: serial, warrantyExpiry: warranty, updatedAt: new Date().toISOString() }
              : e
          ),
        })),

      setSkillId: (id, skillId) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, skillId, updatedAt: new Date().toISOString() } : e
          ),
        })),

      selectEntry: (id) => set({ selectedEntryId: id }),

      getEntryByType: (type) => {
        return get().entries.find((e) => e.componentType === type);
      },

      reset: () => set({ entries: [], selectedEntryId: null }),
    }),
    {
      name: 'workspace_hardware_registry',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useHardwareRegistry;
