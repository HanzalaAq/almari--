import { create } from 'zustand';

interface ShippingAddress {
  id: string;
  full_name: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postal_code?: string;
  is_default: boolean;
}

interface ShippingState {
  addresses: ShippingAddress[];
  setAddresses: (addresses: ShippingAddress[]) => void;
  addAddress: (address: ShippingAddress) => void;
  removeAddress: (id: string) => void;
  getDefault: () => ShippingAddress | undefined;
}

export const useShippingStore = create<ShippingState>((set, get) => ({
  addresses: [],
  setAddresses: (addresses) => set({ addresses }),
  addAddress: (address) =>
    set((state) => ({
      addresses: address.is_default
        ? state.addresses.map((a) => ({ ...a, is_default: false })).concat(address)
        : [...state.addresses, address],
    })),
  removeAddress: (id) =>
    set((state) => ({
      addresses: state.addresses.filter((a) => a.id !== id),
    })),
  getDefault: () => get().addresses.find((a) => a.is_default) || get().addresses[0],
}));
