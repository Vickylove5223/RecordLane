import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface AppState {
  isOnboarded: boolean;
  settingsOpen: boolean;
  shareModalOpen: boolean;
  shareModalData?: {
    shareLink: string;
    title: string;
  };
  settings: {
    defaultResolution: '720p' | '1080p' | '480p';
    defaultFrameRate: 30 | 60;
    highlightClicksDefault: boolean;
    defaultPrivacy: 'private' | 'unlisted' | 'public';
  };
  recordings: Recording[];
  isLoading: boolean;
  error: string | null;
}

export interface Recording {
  id: string;
  title: string;
  youtubeVideoId?: string;
  youtubeLink?: string;
  thumbnail?: string;
  duration: number;
  createdAt: Date;
  privacy: 'private' | 'unlisted' | 'public';
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
  uploadProgress?: number;
}

type AppAction =
  | { type: 'SET_ONBOARDED'; payload: boolean }
  | { type: 'SET_SETTINGS_OPEN'; payload: boolean }
  | { type: 'SET_SHARE_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_SHARE_MODAL_DATA'; payload: { shareLink: string; title: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> }
  | { type: 'ADD_RECORDING'; payload: Recording }
  | { type: 'UPDATE_RECORDING'; payload: { id: string; updates: Partial<Recording> } }
  | { type: 'REMOVE_RECORDING'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'RESET_SETTINGS' };

const initialState: AppState = {
  isOnboarded: false,
  settingsOpen: false,
  shareModalOpen: false,
  settings: {
    defaultResolution: '720p',
    defaultFrameRate: 30,
    highlightClicksDefault: true,
    defaultPrivacy: 'unlisted',
  },
  recordings: [],
  isLoading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ONBOARDED':
      return { ...state, isOnboarded: action.payload };
    case 'SET_SETTINGS_OPEN':
      return { ...state, settingsOpen: action.payload };
    case 'SET_SHARE_MODAL_OPEN':
      return { ...state, shareModalOpen: action.payload };
    case 'SET_SHARE_MODAL_DATA':
      return { ...state, shareModalData: action.payload };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'ADD_RECORDING':
      return { ...state, recordings: [...state.recordings, action.payload] };
    case 'UPDATE_RECORDING':
      return {
        ...state,
        recordings: state.recordings.map(rec =>
          rec.id === action.payload.id ? { ...rec, ...action.payload.updates } : rec
        ),
      };
    case 'REMOVE_RECORDING':
      return {
        ...state,
        recordings: state.recordings.filter(rec => rec.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    case 'RESET_SETTINGS':
      return { ...state, settings: initialState.settings };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  refreshRecordings: () => Promise<void>;
} | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const refreshRecordings = React.useCallback(async () => {
    // Lightweight refresh - just load from localStorage
    try {
      const savedState = localStorage.getItem('recordlane-app-state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.recordings) {
          const syncedRecordings = parsed.recordings.filter((rec: any) => 
            rec.uploadStatus === 'completed' && rec.youtubeLink
          );
          parsed.recordings = syncedRecordings.map((rec: any) => ({
            ...rec,
            createdAt: new Date(rec.createdAt),
          }));
        }
        parsed.isOnboarded = true;
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } else {
        dispatch({ type: 'LOAD_STATE', payload: { recordings: [], isOnboarded: true } });
      }
    } catch (error) {
      console.error('Failed to load app state:', error);
      dispatch({ type: 'LOAD_STATE', payload: { recordings: [], isOnboarded: true } });
    }
  }, []);

  React.useEffect(() => {
    refreshRecordings();
  }, [refreshRecordings]);

  return (
    <AppContext.Provider value={{ state, dispatch, refreshRecordings }}>
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
