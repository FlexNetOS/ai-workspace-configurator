import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Monitor, Wifi, HardDrive, Loader2, Download } from 'lucide-react';
import useWizardStore from '@/store/wizardStore';
import { containerVariants, cardVariants } from './variants';
import Table from './Table';

export default function Step7() {
  const { hardwareDiscovered, setHardwareDiscovered, addTerminalLog, completeStep } = useWizardStore();
  const [activeTab, setActiveTab] = useState('hardware');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (hardwareDiscovered) {
      completeStep(7);
    }
  }, [hardwareDiscovered, completeStep]);

  const tabs = [
    { key: 'hardware', label: 'Hardware', icon: <Cpu className="w-4 h-4" /> },
    { key: 'drivers', label: 'Drivers', icon: <Monitor className="w-4 h-4" /> },
    { key: 'network', label: 'Network', icon: <Wifi className="w-4 h-4" /> },
    { key: 'storage', label: 'Storage', icon: <HardDrive className="w-4 h-4" /> },
  ];

  const hardware = [
    { component: 'CPU', detected: 'Intel Core i9-14900K (24 cores)', status: '✓' },
    { component: 'GPU', detected: 'NVIDIA RTX 4090 (24GB VRAM)', status: '✓' },
    { component: 'RAM', detected: '64GB DDR5-5600', status: '✓' },
    { component: 'Motherboard', detected: 'ASUS ROG STRIX Z790-E', status: '✓' },
    { component: 'Display', detected: '2 monitors (3840x2160, 2560x1440)', status: '✓' },
  ];

  const drivers = [
    { device: 'NVIDIA GPU', version: '551.23', status: '✓ Current' },
    { device: 'Intel Chipset', version: '10.1.19439.8364', status: '✓ Current' },
    { device: 'Network (Intel)', version: '28.2.14.0', status: '⚠ Update available' },
    { device: 'Audio (Realtek)', version: '6.0.9235.1', status: '✓ Current' },
  ];

  const networks = [
    { interface: 'Ethernet', ip: '192.168.1.105', status: 'Connected', speed: '1 Gbps' },
    { interface: 'Wi-Fi', ip: '192.168.1.106', status: 'Connected', speed: 'Wi-Fi 6' },
    { interface: 'WSL Virtual', ip: '172.28.128.1', status: 'Active', speed: 'Virtual' },
  ];

  const storage = [
    { drive: 'C:\\', type: 'NVMe SSD', total: '2TB', free: '1.2TB', health: 'Good' },
    { drive: 'D:\\', type: 'SATA SSD', total: '1TB', free: '800GB', health: 'Good' },
  ];

  const runDiscovery = () => {
    setScanning(true);
    addTerminalLog('> Starting hardware discovery...');
    ['Scanning CPU...', 'Scanning GPU...', 'Scanning memory...', 'Scanning storage...', 'Scanning network...', 'Scanning drivers...'].forEach((l, i) => {
      setTimeout(() => addTerminalLog(`> ${l}`), i * 300);
    });
    setTimeout(() => {
      setScanning(false);
      setHardwareDiscovered(true);
      addTerminalLog('> ✓ Hardware discovery complete.');
      addTerminalLog('> Inventory saved to ~/.ai-workspace/artifacts/hardware-inventory.json');
    }, 2000);
  };

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Hardware & Network Discovery</h1>
          <p className="text-[14px] text-[#94A3B8]">Scanning your system to understand what hardware you have.</p>
        </div>
        <motion.button
          onClick={runDiscovery}
          disabled={scanning}
          className="px-5 py-2.5 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
          whileHover={!scanning ? { y: -1 } : {}}
          whileTap={{ scale: 0.97 }}
        >
          {scanning ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Scanning...</span> : 'Run Discovery'}
        </motion.button>
      </motion.div>

      {scanning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-1 w-full rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden"
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)' }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' as const }}
          />
        </motion.div>
      )}

      {hardwareDiscovered && (
        <motion.div variants={cardVariants} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] overflow-hidden">
          <div className="flex border-b border-[rgba(255,255,255,0.06)]">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3 text-[13px] font-medium transition-colors border-b-2 ${
                  activeTab === t.key
                    ? 'text-[#2563EB] border-[#2563EB]'
                    : 'text-[#64748B] border-transparent hover:text-[#94A3B8]'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'hardware' && <Table headers={['Component', 'Detected', 'Status']} rows={hardware.map((h) => [h.component, h.detected, h.status])} />}
            {activeTab === 'drivers' && <Table headers={['Device', 'Version', 'Status']} rows={drivers.map((d) => [d.device, d.version, d.status])} />}
            {activeTab === 'network' && <Table headers={['Interface', 'IP Address', 'Status', 'Speed']} rows={networks.map((n) => [n.interface, n.ip, n.status, n.speed])} />}
            {activeTab === 'storage' && <Table headers={['Drive', 'Type', 'Total', 'Free', 'Health']} rows={storage.map((s) => [s.drive, s.type, s.total, s.free, s.health])} />}
          </div>
        </motion.div>
      )}

      {hardwareDiscovered && (
        <motion.div variants={cardVariants} className="flex justify-end">
          <motion.button
            onClick={() => addTerminalLog('> Inventory report saved to ~/.ai-workspace/artifacts/hardware-inventory.json')}
            className="px-4 py-2 rounded-[10px] text-[13px] font-medium text-[#94A3B8] border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)] transition-all flex items-center gap-2"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            <Download className="w-4 h-4" />
            Save Inventory Report
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
