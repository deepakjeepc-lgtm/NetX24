import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type ServiceItem = {
  id: string;
  iconName: string;
  title: string;
  subtitle: string;
  price: string;
  unit: string;
  isDeliverable?: boolean;
};

const initialServices: ServiceItem[] = [
  { id: '1', iconName: 'Printer', title: "Printing (B&W)", subtitle: "A4 Size", price: "2.5", unit: "/ pg", isDeliverable: true },
  { id: '2', iconName: 'Printer', title: "Printing (Colour)", subtitle: "High Quality", price: "5", unit: "/ pg", isDeliverable: true },
  { id: '3', iconName: 'Copy', title: "Photocopy / Xerox", subtitle: "Black & White", price: "2", unit: "/ pg", isDeliverable: true },
  { id: '4', iconName: 'Scan', title: "Scanning", subtitle: "Document / Photo", price: "10", unit: "/ pg" },
  { id: '5', iconName: 'Layers', title: "Lamination", subtitle: "A4 / ID Card", price: "20", unit: "/ item", isDeliverable: true },
  { id: '6', iconName: 'FileText', title: "Spiral Binding", subtitle: "Up to 100 pages", price: "40", unit: "/ book", isDeliverable: true },
];

type ServicesDataContextType = {
  services: ServiceItem[];
  loading: boolean;
  updateServices: (newServices: ServiceItem[]) => Promise<void>;
};

const ServicesDataContext = createContext<ServicesDataContextType>({
  services: [],
  loading: true,
  updateServices: async () => {},
});

export function ServicesDataProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'appData', 'services');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout fetching data')), 2000)
        );
        const docSnap = await Promise.race([getDoc(docRef), timeoutPromise]) as any;
        
        if (docSnap.exists()) {
          setServices(docSnap.data().items);
        } else {
          setServices(initialServices);
        }
      } catch (error: any) {
        if (error instanceof Error && error.message === 'Timeout fetching data') {
          console.log("Using cached services data (offline)");
        } else if (error?.code === 'permission-denied') {
          console.warn("Firebase permission missing for services data, using default services data");
        } else {
          console.warn('Note on services data fetch:', error?.message || error);
        }
        setServices(initialServices);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateServices = async (newServices: ServiceItem[]) => {
    try {
      const docRef = doc(db, 'appData', 'services');
      await setDoc(docRef, { items: newServices });
      setServices(newServices);
    } catch (error) {
      console.error('Error updating services data:', error);
      throw error;
    }
  };

  return (
    <ServicesDataContext.Provider value={{ services, loading, updateServices }}>
      {children}
    </ServicesDataContext.Provider>
  );
}

export const useServicesData = () => useContext(ServicesDataContext);
