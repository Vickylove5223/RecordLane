import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface AppState {
  isOnboarded: boolean;
  settings: {
    defaultResolution: '720p' | '1080p' | '480p';
    defaultFrameRate: 30 | 60;
    highlightClicksDefault: boolean;
    defaultPrivacy: 'private' | 'anyone-viewer' | 'anyone-commenter';
  };
  recordings: Recording[];
}

export interface Recording {
  id: string;
  title: string;
  driveFileId?: string;
  driveLink?: string;
  thumbnail?: string;
  duration: number;
  createdAt: Date;
  privacy: 'private' | 'anyone-viewer' | 'anyone-commenter';
  localBlob?: Blob;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
  uploadProgress?: number;
}

type AppAction =
  | { type: 'SET_ONBOARDED'; payload: boolean }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> }
  | { type: 'ADD_RECORDING'; payload: Recording }
  | { type: 'UPDATE_RECORDING'; payload: { id: string; updates: Partial<Recording> } }
  | { type: 'REMOVE_RECORDING'; payload: string }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

const initialState: AppState = {
  isOnboarded: false,
  settings: {
    defaultResolution: '720p',
    defaultFrameRate: 30,
    highlightClicksDefault: true,
    defaultPrivacy: 'anyone-viewer',
  },
  recordings: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ONBOARDED':
      return { ...state, isOnboarded: action.payload };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'ADD_RECORDING':
      return { ...state, recordings: [action.payload, ...state.recordings] };
    case 'UPDATE_RECORDING':
      return {
        ...state,
        recordings: state.recordings.map(recording =>
          recording.id === action.payload.id
            ? { ...recording, ...action.payload.updates }
            : recording
        ),
      };
    case 'REMOVE_RECORDING':
      return {
        ...state,
        recordings: state.recordings.filter(recording => recording.id !== action.payload),
      };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load state from localStorage on mount
  React.useEffect(() => {
    const savedState = localStorage.getItem('loomclone-app-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Convert date strings back to Date objects
        if (parsed.recordings) {
          parsed.recordings = parsed.recordings.map((rec: any) => ({
            ...rec,
            createdAt: new Date(rec.createdAt),
          }));
        }
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } catch (error) {
        console.error('Failed to load app state:', error);
      }
    }
  }, []);

  // Save state to localStorage on changes
  React.useEffect(() => {
    localStorage.setItem('loomclone-app-state', JSON.stringify(state));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
