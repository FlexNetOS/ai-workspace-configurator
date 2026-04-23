import { beforeEach, describe, expect, it } from 'vitest';
import useHardwareRegistry, {
  resolveVendorWebhooks,
  generateHardwareSkill,
} from '../src/store/hardwareRegistryStore';
import type { HardwareEntry } from '../src/store/hardwareRegistryStore';
import { resetAllStores } from './test-utils';

describe('hardwareRegistryStore', () => {
  beforeEach(() => {
    resetAllStores();
  });

  describe('initial state', () => {
    it('starts with empty entries', () => {
      expect(useHardwareRegistry.getState().entries).toEqual([]);
      expect(useHardwareRegistry.getState().selectedEntryId).toBeNull();
    });
  });

  describe('entry management', () => {
    it('can add an entry', () => {
      const id = useHardwareRegistry.getState().addEntry({
        componentType: 'gpu',
        vendor: 'NVIDIA',
        model: 'RTX 4090',
        resourceTags: ['primary', 'ai'],
        webhooks: {},
        discoveredSpecs: { vram: '24GB' },
      });

      expect(id).toBeTruthy();
      const entry = useHardwareRegistry.getState().entries.find((e) => e.id === id);
      expect(entry?.vendor).toBe('NVIDIA');
      expect(entry?.model).toBe('RTX 4090');
      expect(entry?.status).toBe('discovered');
      expect(entry?.resourceTags).toEqual(['primary', 'ai']);
    });

    it('auto-selects newly added entry', () => {
      const id = useHardwareRegistry.getState().addEntry({
        componentType: 'cpu',
        vendor: 'Intel',
        model: 'i9-14900K',
        resourceTags: [],
        webhooks: {},
        discoveredSpecs: {},
      });

      expect(useHardwareRegistry.getState().selectedEntryId).toBe(id);
    });

    it('can update an entry', () => {
      const id = useHardwareRegistry.getState().addEntry({
        componentType: 'gpu',
        vendor: 'NVIDIA',
        model: 'RTX 4090',
        resourceTags: [],
        webhooks: {},
        discoveredSpecs: {},
      });

      useHardwareRegistry.getState().updateEntry(id, { serialNumber: 'SN123456' });

      const entry = useHardwareRegistry.getState().entries.find((e) => e.id === id);
      expect(entry?.serialNumber).toBe('SN123456');
      expect(entry?.model).toBe('RTX 4090'); // unchanged
    });

    it('can remove an entry', () => {
      const id = useHardwareRegistry.getState().addEntry({
        componentType: 'gpu',
        vendor: 'NVIDIA',
        model: 'RTX 4090',
        resourceTags: [],
        webhooks: {},
        discoveredSpecs: {},
      });

      useHardwareRegistry.getState().removeEntry(id);
      expect(useHardwareRegistry.getState().entries).toHaveLength(0);
      expect(useHardwareRegistry.getState().selectedEntryId).toBeNull();
    });

    it('clears selection when removing selected entry', () => {
      const id = useHardwareRegistry.getState().addEntry({
        componentType: 'gpu',
        vendor: 'NVIDIA',
        model: 'RTX 4090',
        resourceTags: [],
        webhooks: {},
        discoveredSpecs: {},
      });

      useHardwareRegistry.getState().removeEntry(id);
      expect(useHardwareRegistry.getState().selectedEntryId).toBeNull();
    });
  });

  describe('entry status', () => {
    it('can update entry status', () => {
      const id = useHardwareRegistry.getState().addEntry({
        componentType: 'gpu',
        vendor: 'NVIDIA',
        model: 'RTX 4090',
        resourceTags: [],
        webhooks: {},
        discoveredSpecs: {},
      });

      useHardwareRegistry.getState().setEntryStatus(id, 'registered');
      const entry = useHardwareRegistry.getState().entries.find((e) => e.id === id);
      expect(entry?.status).toBe('registered');
    });
  });

  describe('vendor account', () => {
    it('can set vendor account', () => {
      const id = useHardwareRegistry.getState().addEntry({
        componentType: 'gpu',
        vendor: 'NVIDIA',
        model: 'RTX 4090',
        resourceTags: [],
        webhooks: {},
        discoveredSpecs: {},
      });

      useHardwareRegistry.getState().setVendorAccount(id, {
        portalUrl: 'https://nvidia.com',
        portalName: 'NVIDIA Portal',
        isLinked: true,
      });

      const entry = useHardwareRegistry.getState().entries.find((e) => e.id === id);
      expect(entry?.vendorAccount?.portalName).toBe('NVIDIA Portal');
    });
  });

  describe('resource tags', () => {
    it('can add and remove tags', () => {
      const id = useHardwareRegistry.getState().addEntry({
        componentType: 'gpu',
        vendor: 'NVIDIA',
        model: 'RTX 4090',
        resourceTags: [],
        webhooks: {},
        discoveredSpecs: {},
      });

      useHardwareRegistry.getState().addResourceTag(id, 'primary');
      useHardwareRegistry.getState().addResourceTag(id, 'ai');
      // Duplicate should be ignored
      useHardwareRegistry.getState().addResourceTag(id, 'primary');

      let entry = useHardwareRegistry.getState().entries.find((e) => e.id === id);
      expect(entry?.resourceTags).toEqual(['primary', 'ai']);

      useHardwareRegistry.getState().removeResourceTag(id, 'primary');
      entry = useHardwareRegistry.getState().entries.find((e) => e.id === id);
      expect(entry?.resourceTags).toEqual(['ai']);
    });
  });

  describe('serial and warranty', () => {
    it('can set serial and warranty', () => {
      const id = useHardwareRegistry.getState().addEntry({
        componentType: 'gpu',
        vendor: 'NVIDIA',
        model: 'RTX 4090',
        resourceTags: [],
        webhooks: {},
        discoveredSpecs: {},
      });

      useHardwareRegistry.getState().setSerialWarranty(id, 'SN123', '2026-12-31');

      const entry = useHardwareRegistry.getState().entries.find((e) => e.id === id);
      expect(entry?.serialNumber).toBe('SN123');
      expect(entry?.warrantyExpiry).toBe('2026-12-31');
    });
  });

  describe('skill ID', () => {
    it('can set skill ID', () => {
      const id = useHardwareRegistry.getState().addEntry({
        componentType: 'gpu',
        vendor: 'NVIDIA',
        model: 'RTX 4090',
        resourceTags: [],
        webhooks: {},
        discoveredSpecs: {},
      });

      useHardwareRegistry.getState().setSkillId(id, 'skill-gpu-001');

      const entry = useHardwareRegistry.getState().entries.find((e) => e.id === id);
      expect(entry?.skillId).toBe('skill-gpu-001');
    });
  });

  describe('entry selection', () => {
    it('can select and deselect entries', () => {
      useHardwareRegistry.getState().selectEntry('test-id');
      expect(useHardwareRegistry.getState().selectedEntryId).toBe('test-id');

      useHardwareRegistry.getState().selectEntry(null);
      expect(useHardwareRegistry.getState().selectedEntryId).toBeNull();
    });
  });

  describe('getEntryByType', () => {
    it('can find entry by component type', () => {
      useHardwareRegistry.getState().addEntry({
        componentType: 'gpu',
        vendor: 'NVIDIA',
        model: 'RTX 4090',
        resourceTags: [],
        webhooks: {},
        discoveredSpecs: {},
      });

      const entry = useHardwareRegistry.getState().getEntryByType('gpu');
      expect(entry?.vendor).toBe('NVIDIA');

      const missing = useHardwareRegistry.getState().getEntryByType('cpu');
      expect(missing).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('clears all entries and selection', () => {
      useHardwareRegistry.getState().addEntry({
        componentType: 'gpu',
        vendor: 'NVIDIA',
        model: 'RTX 4090',
        resourceTags: [],
        webhooks: {},
        discoveredSpecs: {},
      });

      useHardwareRegistry.getState().reset();
      expect(useHardwareRegistry.getState().entries).toHaveLength(0);
      expect(useHardwareRegistry.getState().selectedEntryId).toBeNull();
    });
  });
});

describe('resolveVendorWebhooks', () => {
  it('resolves NVIDIA GPU webhooks', () => {
    const hooks = resolveVendorWebhooks('NVIDIA', 'RTX 4090', 'gpu');
    expect(hooks.drivers).toContain('nvidia.com/drivers');
    expect(hooks.vendorDocs).toContain('geforce/graphics-cards/rtx-4090');
    expect(hooks.support).toContain('nvidia.com/en-us/support');
  });

  it('resolves AMD webhooks', () => {
    const hooks = resolveVendorWebhooks('AMD', 'Ryzen 9 7950X', 'cpu');
    expect(hooks.drivers).toContain('amd.com/en/support');
  });

  it('resolves Intel webhooks', () => {
    const hooks = resolveVendorWebhooks('Intel', 'Core i9', 'cpu');
    expect(hooks.vendorDocs).toContain('ark.intel.com');
  });

  it('resolves ASUS motherboard webhooks', () => {
    const hooks = resolveVendorWebhooks('ASUS', 'ROG STRIX Z790', 'motherboard');
    expect(hooks.vendorDocs).toContain('asus.com/support/Download-Center');
    expect(hooks.firmware).toContain('asus.com/support/FAQ');
  });

  it('returns empty object for unknown vendor', () => {
    const hooks = resolveVendorWebhooks('UnknownBrand', 'Model X', 'gpu');
    expect(Object.keys(hooks)).toHaveLength(0);
  });
});

describe('generateHardwareSkill', () => {
  it('generates a skill with correct ID and name', () => {
    const entry: HardwareEntry = {
      id: 'gpu-001',
      componentType: 'gpu',
      vendor: 'NVIDIA',
      model: 'RTX 4090',
      resourceTags: ['primary'],
      status: 'registered',
      webhooks: { drivers: 'https://nvidia.com/drivers' },
      discoveredSpecs: { vram: '24GB' },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const skill = generateHardwareSkill(entry);
    expect(skill.id).toBe('hw-gpu-001');
    expect(skill.name).toContain('NVIDIA');
    expect(skill.name).toContain('RTX 4090');
    expect(skill.componentType).toBe('gpu');
  });

  it('includes GPU-specific known issues', () => {
    const entry: HardwareEntry = {
      id: 'gpu-001',
      componentType: 'gpu',
      vendor: 'NVIDIA',
      model: 'RTX 4090',
      resourceTags: [],
      status: 'registered',
      webhooks: {},
      discoveredSpecs: {},
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const skill = generateHardwareSkill(entry);
    expect(skill.knownIssues.length).toBeGreaterThan(0);
    expect(skill.knownIssues.some((i) => i.includes('WSL2'))).toBe(true);
  });

  it('includes CPU-specific quick commands', () => {
    const entry: HardwareEntry = {
      id: 'cpu-001',
      componentType: 'cpu',
      vendor: 'Intel',
      model: 'i9-14900K',
      resourceTags: [],
      status: 'registered',
      webhooks: {},
      discoveredSpecs: {},
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const skill = generateHardwareSkill(entry);
    expect(skill.quickCommands.some((c) => c.command.includes('lscpu'))).toBe(true);
  });
});
