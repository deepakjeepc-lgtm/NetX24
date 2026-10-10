const fs = require('fs');
let code = fs.readFileSync('src/context/IgnouDataContext.tsx', 'utf8');

code = code.replace(
  "import { ignouData as initialData, Level } from '../data/ignouData';",
  "import { ignouData as initialData, ignouProjectData as initialProjectData, Level } from '../data/ignouData';"
);

code = code.replace(
  `type IgnouDataContextType = {
  data: Level[];
  loading: boolean;
  updateData: (newData: Level[]) => Promise<void>;
};`,
  `type IgnouDataContextType = {
  assignmentsData: Level[];
  projectsData: Level[];
  loading: boolean;
  updateData: (type: 'assignments' | 'projects', newData: Level[]) => Promise<void>;
};`
);

code = code.replace(
  `const IgnouDataContext = createContext<IgnouDataContextType>({
  data: [],
  loading: true,
  updateData: async () => {},
});`,
  `const IgnouDataContext = createContext<IgnouDataContextType>({
  assignmentsData: [],
  projectsData: [],
  loading: true,
  updateData: async () => {},
});`
);

const fetchAndStateBlock = `export function IgnouDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Level[]>([]);
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
          setData(docSnap.data().levels);
        } else {
          // Use initial data if document doesn't exist yet
          setData(initialData);
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'Timeout fetching data') {
          console.log('Firebase fetch timed out, falling back to local data');
          setData(initialData);
        } else {
          console.error('Error fetching IGNOU data:', error);
          setData(initialData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateData = async (newData: Level[]) => {
    try {
      const docRef = doc(db, 'appData', 'ignou');
      await setDoc(docRef, { levels: newData }, { merge: true });
      setData(newData);
    } catch (error) {
      console.error('Error updating IGNOU data:', error);
      throw error;
    }
  };

  return (
    <IgnouDataContext.Provider value={{ data, loading, updateData }}>
      {children}
    </IgnouDataContext.Provider>
  );
}`;

const newFetchAndStateBlock = `export function IgnouDataProvider({ children }: { children: React.ReactNode }) {
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
      } catch (error) {
        if (error instanceof Error && error.message === 'Timeout fetching data') {
          console.log('Firebase fetch timed out, falling back to local data');
          setAssignmentsData(initialData);
          setProjectsData(initialProjectData);
        } else {
          console.error('Error fetching IGNOU data:', error);
          setAssignmentsData(initialData);
          setProjectsData(initialProjectData);
        }
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
        // also save to 'levels' for backward compatibility if needed, but 'assignments' is better
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
}`;

code = code.replace(fetchAndStateBlock, newFetchAndStateBlock);

fs.writeFileSync('src/context/IgnouDataContext.tsx', code);
console.log("Done Context");
