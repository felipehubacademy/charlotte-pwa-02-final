import { createContext, useContext, useState, ReactNode } from 'react';

interface PaywallContextType {
  paywallOpen: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
}

const PaywallContext = createContext<PaywallContextType>({
  paywallOpen: false,
  openPaywall: () => {},
  closePaywall: () => {},
});

export function PaywallProvider({ children }: { children: ReactNode }) {
  const [paywallOpen, setPaywallOpen] = useState(false);
  return (
    <PaywallContext.Provider value={{
      paywallOpen,
      openPaywall:  () => setPaywallOpen(true),
      closePaywall: () => setPaywallOpen(false),
    }}>
      {children}
    </PaywallContext.Provider>
  );
}

export const usePaywallContext = () => useContext(PaywallContext);
