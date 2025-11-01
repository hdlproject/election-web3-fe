// Basic wallet hook integrating chain-sdk provider helpers
import { useCallback, useEffect, useRef, useState } from 'react';
import { getBrowserProvider, getBrowserSigner } from 'chain-sdk';
import { ProviderNotFoundError, UserRejectedError } from 'chain-sdk';

export interface WalletState {
  address: string;
  chainId: number | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  ensureNetwork: (targetChainId?: number) => Promise<boolean>;
}

function parseChainId(raw: any): number | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      return raw.startsWith('0x') ? parseInt(raw, 16) : parseInt(raw, 10);
    } catch { return null; }
  }
  if (typeof raw === 'number') return raw;
  return null;
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refreshChainId = useCallback(async () => {
    try {
      const provider = getBrowserProvider();
      const id = await provider.send('eth_chainId', []);
      setChainId(parseChainId(id));
    } catch { /* ignore */ }
  }, []);

  const connect = useCallback(async () => {
    if (connecting) return;
    setConnecting(true);
    setError(null);
    try {
      const signer = await getBrowserSigner();
      const addr = await signer.getAddress();
      if (!mounted.current) return;
      setAddress(addr);
      await refreshChainId();
    } catch (e: any) {
      if (e instanceof ProviderNotFoundError) setError('No injected wallet found');
      else if (e instanceof UserRejectedError) setError('User rejected connection');
      else setError(e?.message || 'Failed to connect wallet');
    } finally {
      if (mounted.current) setConnecting(false);
    }
  }, [connecting, refreshChainId]);

  const disconnect = useCallback(() => {
    setAddress('');
    setChainId(null);
    setError(null);
  }, []);

  const ensureNetwork = useCallback(async (targetChainId?: number) => {
    if (!targetChainId) return true; // nothing to enforce
    try {
      const provider = getBrowserProvider();
      const current = parseChainId(await provider.send('eth_chainId', []));
      if (current === targetChainId) return true;
      // attempt switch
      const hexId = '0x' + targetChainId.toString(16);
      try {
        await (window as any).ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexId }] });
        await refreshChainId();
        return true;
      } catch (switchErr: any) {
        // If chain not added, try to add minimal params (caller must configure env for a richer flow)
        if (switchErr?.code === 4902) {
          try {
            await (window as any).ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: hexId }] });
            await refreshChainId();
            return true;
          } catch { return false; }
        }
        return false;
      }
    } catch {
      return false;
    }
  }, [refreshChainId]);

  // Auto-init if already authorized
  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const eth: any = (window as any).ethereum;
        if (!eth) return;
        const accounts: string[] = await eth.request({ method: 'eth_accounts' });
        if (accounts && accounts[0]) {
          setAddress(accounts[0]);
          await refreshChainId();
        }
      } catch { /* ignore */ }
    })();
    return () => { mounted.current = false; };
  }, [refreshChainId]);

  // Listen to account & chain changes
  useEffect(() => {
    const eth: any = (window as any).ethereum;
    if (!eth) return;
    const handleAccounts = (accs: string[]) => { setAddress(accs?.[0] || ''); };
    const handleChain = (_chainId: string) => { setChainId(parseChainId(_chainId)); };
    eth.on?.('accountsChanged', handleAccounts);
    eth.on?.('chainChanged', handleChain);
    return () => {
      eth.removeListener?.('accountsChanged', handleAccounts);
      eth.removeListener?.('chainChanged', handleChain);
    };
  }, []);

  return { address, chainId, connecting, error, connect, disconnect, ensureNetwork };
}

export function shortenAddress(addr: string, chars = 4) {
  if (!addr) return '';
  return addr.slice(0, 2 + chars) + '…' + addr.slice(-chars);
}
