import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Container, Github, Smile, Router, FileText, Chrome, Cloud,
  Globe, Check, Link2, Loader2, Info,
} from 'lucide-react';
import { Notifications } from '@/components/Notifications';
import { useNotifications } from '@/hooks/useNotifications';
import useWizardStore from '@/store/wizardStore';
import { isLinkedAccountStatus } from '@/store/wizardStore';
import type { Account, AccountStatus } from '@/store/wizardStore';
import { containerVariants, cardVariants } from './variants';

const createSyntheticStatusId = (providerId: string): string =>
  `syn_${providerId}_${Math.random().toString(36).slice(2, 10)}`;

const maskStatusId = (value?: string): string => {
  if (!value) return 'pending';
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
};

export default function Step9() {
  const { linkedAccounts, setAccountStatus, addTerminalLog, completeStep } = useWizardStore();
  const { notifications, notify, removeNotification } = useNotifications();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [realAuthId, setRealAuthId] = useState<string | null>(null);

  useEffect(() => {
    const connected = linkedAccounts.filter((a) => isLinkedAccountStatus(a.status)).length;
    if (connected >= 3) {
      completeStep(9);
    }
  }, [linkedAccounts, completeStep]);

  const accountIcons: Record<string, React.ReactNode> = {
    docker: <Container className="w-8 h-8 text-[#2496ED]" />,
    github: <Github className="w-8 h-8 text-white" />,
    huggingface: <Smile className="w-8 h-8 text-[#FFD21E]" />,
    openrouter: <Router className="w-8 h-8 text-[#8B5CF6]" />,
    notion: <FileText className="w-8 h-8 text-white" />,
    google: <Chrome className="w-8 h-8 text-[#4285F4]" />,
    cloudflare: <Cloud className="w-8 h-8 text-[#F48120]" />,
  };

  const connectSynthetic = (account: Account) => {
    const syntheticRef = account.authRef ?? createSyntheticStatusId(account.id);
    setConnectingId(account.id);
    setAccountStatus(account.id, 'synthetic_pending', {
      authKind: 'synthetic',
      authRef: syntheticRef,
      lastError: undefined,
    });
    addTerminalLog(`> [${account.name}] Creating synthetic continuity link...`);
    addTerminalLog(`> [${account.name}] Synthetic status token issued.`);

    setTimeout(() => {
      setAccountStatus(account.id, 'synthetic_linked', {
        authKind: 'synthetic',
        authRef: syntheticRef,
        lastLinkedAt: new Date().toISOString(),
      });
      addTerminalLog(`> ✓ ${account.name} linked via synthetic continuity token`);
      addTerminalLog(`> Synthetic status ID: ${maskStatusId(syntheticRef)}`);
      notify(`${account.name} linked with synthetic status token.`, 'success');
      setConnectingId(null);
    }, 2000);
  };

  const disconnectAccount = (account: Account) => {
    setAccountStatus(account.id, 'disconnected');
    addTerminalLog(`> [${account.name}] Link disconnected.`);
    notify(`${account.name} disconnected.`, 'info');
  };

  const connectRealAuth = async (account: Account) => {
    if (realAuthId || connectingId) return;

    const syntheticRef = account.authRef ?? createSyntheticStatusId(account.id);
    setRealAuthId(account.id);
    addTerminalLog(`> [${account.name}] Requesting real OAuth URL from Node auth API...`);

    if (!isLinkedAccountStatus(account.status)) {
      setAccountStatus(account.id, 'synthetic_pending', {
        authKind: 'synthetic',
        authRef: syntheticRef,
      });
      setTimeout(() => {
        setAccountStatus(account.id, 'synthetic_linked', {
          authKind: 'synthetic',
          authRef: syntheticRef,
          lastLinkedAt: new Date().toISOString(),
        });
      }, 800);
    }

    try {
      const urlResp = await fetch(
        `/api/auth/url/${account.id}?origin=${encodeURIComponent(window.location.origin)}`,
        { method: 'GET' }
      );

      if (!urlResp.ok) {
        throw new Error(`Auth API returned ${urlResp.status}`);
      }

      const data = await urlResp.json() as {
        available: boolean;
        authUrl?: string;
        state?: string;
        reason?: string;
      };

      if (!data.available || !data.authUrl || !data.state) {
        const reason = data.reason ?? 'OAuth configuration unavailable';
        addTerminalLog(`> [${account.name}] Real auth unavailable: ${reason}`);
        setAccountStatus(account.id, 'synthetic_linked', {
          authKind: 'synthetic',
          authRef: syntheticRef,
          lastError: reason,
          lastLinkedAt: new Date().toISOString(),
        });
        notify(`${account.name}: real auth unavailable, synthetic link kept.`, 'info');
        setRealAuthId(null);
        return;
      }

      const authPopup = window.open(
        data.authUrl,
        `oauth_${account.id}`,
        'width=540,height=740,noopener,noreferrer'
      );

      if (!authPopup) {
        const reason = 'Popup blocked by browser';
        addTerminalLog(`> [${account.name}] ${reason}. Keeping synthetic link.`);
        notify(`${account.name}: popup blocked, synthetic link kept.`, 'warning');
        setAccountStatus(account.id, 'synthetic_linked', {
          authKind: 'synthetic',
          authRef: syntheticRef,
          lastError: reason,
        });
        setRealAuthId(null);
        return;
      }

      let attempts = 0;
      const maxAttempts = 30;
      const poll = window.setInterval(async () => {
        attempts += 1;
        try {
          const statusResp = await fetch(`/api/auth/status/${account.id}?state=${encodeURIComponent(data.state!)}`);
          if (!statusResp.ok) return;

          const statusData = await statusResp.json() as {
            status: 'pending' | 'real_linked' | 'failed';
            sessionRef?: string;
            error?: string;
          };

          if (statusData.status === 'real_linked') {
            window.clearInterval(poll);
            try {
              authPopup.close();
            } catch {
              // Ignore popup close failures.
            }
            setAccountStatus(account.id, 'real_linked', {
              authKind: 'real',
              authRef: statusData.sessionRef ?? syntheticRef,
              lastLinkedAt: new Date().toISOString(),
              lastError: undefined,
            });
            addTerminalLog(`> ✓ [${account.name}] Real OAuth linked successfully.`);
            notify(`${account.name} upgraded to real OAuth link.`, 'success');
            setRealAuthId(null);
            return;
          }

          if (statusData.status === 'failed') {
            window.clearInterval(poll);
            try {
              authPopup.close();
            } catch {
              // Ignore popup close failures.
            }
            const reason = statusData.error ?? 'OAuth callback rejected';
            setAccountStatus(account.id, 'synthetic_linked', {
              authKind: 'synthetic',
              authRef: syntheticRef,
              lastError: reason,
            });
            addTerminalLog(`> [${account.name}] Real OAuth failed: ${reason}. Synthetic link remains active.`);
            notify(`${account.name}: OAuth failed, synthetic link remains active.`, 'warning');
            setRealAuthId(null);
            return;
          }
        } catch {
          // transient polling error; continue polling until timeout
        }

        if (attempts >= maxAttempts || authPopup.closed) {
          window.clearInterval(poll);
          addTerminalLog(`> [${account.name}] OAuth timed out. Synthetic link remains active.`);
          setAccountStatus(account.id, 'synthetic_linked', {
            authKind: 'synthetic',
            authRef: syntheticRef,
            lastError: 'OAuth timeout',
          });
          notify(`${account.name}: OAuth timed out, synthetic link remains active.`, 'info');
          setRealAuthId(null);
        }
      }, 1200);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown OAuth error';
      addTerminalLog(`> [${account.name}] Auth API failed: ${message}`);
      setAccountStatus(account.id, 'synthetic_linked', {
        authKind: 'synthetic',
        authRef: syntheticRef,
        lastError: message,
      });
      notify(`${account.name}: auth server unavailable, synthetic link kept.`, 'warning');
      setRealAuthId(null);
    }
  };

  const statusBadge = (status: AccountStatus) => {
    switch (status) {
      case 'real_linked': return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.25)] flex items-center gap-1"><Check className="w-3 h-3" />Real Linked</span>;
      case 'synthetic_linked': return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(37,99,235,0.1)] text-[#2563EB] border border-[rgba(37,99,235,0.25)] flex items-center gap-1"><Link2 className="w-3 h-3" />Synthetic Linked</span>;
      case 'synthetic_pending': return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(37,99,235,0.1)] text-[#2563EB] border border-[rgba(37,99,235,0.25)] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Pending</span>;
      case 'failed': return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.25)]">Failed</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(255,255,255,0.04)] text-[#64748B] border border-[rgba(255,255,255,0.08)]">Not Connected</span>;
    }
  };

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants}>
        <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Link Your Accounts</h1>
        <p className="text-[14px] text-[#94A3B8] max-w-[600px] leading-[1.6]">
          Synthetic status tokens keep setup moving even when OAuth is unavailable. Upgrade to real OAuth anytime.
        </p>
        <p className="text-[12px] text-[#06B6D4] mt-2 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          Synthetic IDs are masked in the UI and used only for continuity metadata.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {linkedAccounts.map((account) => (
          <motion.div
            key={account.id}
            variants={cardVariants}
            className={`rounded-2xl border p-5 transition-all ${
              isLinkedAccountStatus(account.status)
                ? 'border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.04)]'
                : 'border-[rgba(255,255,255,0.06)] bg-[#0B1120]'
            }`}
            whileHover={{ y: -2, borderColor: isLinkedAccountStatus(account.status) ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.10)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              {accountIcons[account.id] || <Globe className="w-8 h-8 text-[#94A3B8]" />}
              <div className="flex-1">
                <h3 className="text-[16px] font-semibold text-[#F0F4F8]">{account.name}</h3>
              </div>
              {statusBadge(account.status)}
            </div>
            <p className="text-[12px] text-[#64748B] mb-4">{account.description}</p>

            {(account.status === 'synthetic_linked' || account.status === 'real_linked') && account.authRef && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-3 p-2 rounded-lg bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.15)]"
              >
                <p className="text-[10px] text-[#64748B] font-mono uppercase tracking-wider">
                  {account.status === 'real_linked' ? 'OAuth Session Ref' : 'Synthetic Status ID'}
                </p>
                <p className="text-[11px] text-[#10B981] font-mono">{maskStatusId(account.authRef)}</p>
              </motion.div>
            )}

            <div className="grid grid-cols-1 gap-2">
              <motion.button
                onClick={() => {
                  if (isLinkedAccountStatus(account.status) || account.status === 'synthetic_pending') {
                    disconnectAccount(account);
                  } else {
                    connectSynthetic(account);
                  }
                }}
                disabled={connectingId === account.id || realAuthId === account.id}
                className={`w-full py-2 rounded-[10px] text-[13px] font-semibold transition-all disabled:opacity-40 ${
                  isLinkedAccountStatus(account.status)
                    ? 'text-[#EF4444] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.05)]'
                    : 'text-white'
                }`}
                style={!isLinkedAccountStatus(account.status) ? { background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' } : {}}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                {connectingId === account.id
                  ? 'Linking...'
                  : isLinkedAccountStatus(account.status) || account.status === 'synthetic_pending'
                    ? 'Disconnect'
                    : 'Create Synthetic Link'}
              </motion.button>

              {account.status !== 'real_linked' && (
                <motion.button
                  onClick={() => void connectRealAuth(account)}
                  disabled={realAuthId === account.id || connectingId === account.id}
                  className="w-full py-2 rounded-[10px] text-[12px] font-semibold text-[#94A3B8] border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)] transition-all disabled:opacity-40"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {realAuthId === account.id ? 'Waiting For OAuth...' : 'Upgrade To Real OAuth'}
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <Notifications notifications={notifications} removeNotification={removeNotification} />
    </motion.div>
  );
}
