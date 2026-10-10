import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ignouData as initialData, ignouProjectData as initialProjectData, Level } from '../data/ignouData';

type IgnouDataContextType = {
  assignmentsData: Level[];
  projectsData: Level[];
  loading: boolean;
  updateData: (type: 'assignments' | 'projects', newData: Level[]) => Promise<void>;
};

const IgnouDataContext = createContext<IgnouDataContextType>({
  assignmentsData: [],
  projectsData: [],
  loading: true,
  updateData: async () => {},
});

export function IgnouDataProvider({ children }: { children: React.ReactNode }) {
  const [assignmentsData, setAssignmentsData] = useState<Level[]>([]);
  const [projectsData, setProjectsData] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'appData', 'ignou');
        
        // Timeout after 2 seconds
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout fetching data')), 2000)
        );

        const docSnap = await Promise.race([getDoc(docRef), timeoutPromise]) as any;

        if (docSnap.exists()) {
          const d = docSnap.data();
          setAssignmentsData(d.assignments || d.levels || initialData);
          setProjectsData(d.projects || initialProjectData);
        } else {
          // Use initial data if document doesn't exist yet
          setAssignmentsData(initialData);
          setProjectsData(initialProjectData);
        }
      } catch (error: any) {
        if (error instanceof Error && error.message === 'Timeout fetching data') {
          console.log('Firebase fetch timed out, falling back to local data');
        } else if (error?.code === 'permission-denied') {
          console.warn('Firebase permission missing for IGNOU data, falling back to local data');
        } else {
          console.warn('Note on IGNOU data fetch:', error?.message || error);
        }
        setAssignmentsData(initialData);
        setProjectsData(initialProjectData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateData = async (type: 'assignments' | 'projects', newData: Level[]) => {
    try {
      const docRef = doc(db, 'appData', 'ignou');
      if (type === 'assignments') {
        await setDoc(docRef, { assignments: newData, levels: newData }, { merge: true });
        setAssignmentsData(newData);
      } else {
        await setDoc(docRef, { projects: newData }, { merge: true });
        setProjectsData(newData);
      }
    } catch (error) {
      console.error('Error updating IGNOU data:', error);
      throw error;
    }
  };

  return (
    <IgnouDataContext.Provider value={{ assignmentsData, projectsData, loading, updateData }}>
      {children}
    </IgnouDataContext.Provider>
  );
}

export const useIgnouData = () => useContext(IgnouDataContext);
