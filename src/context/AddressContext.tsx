import React, { createContext, useContext, useState } from "react";

type Address = {
  id: string;
  label: string;
  address: string;
  mobile: string;
};

type AddressContextType = {
  addresses: Address[];
  selectedAddress: Address | null;
  addAddress: (addr: Address) => void;
  selectAddress: (addr: Address) => void;
};

const AddressContext = createContext<AddressContextType | null>(null);

export const AddressProvider = ({ children }: any) => {

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const addAddress = (addr: Address) => {
    setAddresses((prev) => [...prev, addr]);
  };

  const selectAddress = (addr: Address) => {
    setSelectedAddress(addr);
  };

  return (
    <AddressContext.Provider
      value={{
        addresses,
        selectedAddress,
        addAddress,
        selectAddress,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error("AddressProvider missing");
  return ctx;
};