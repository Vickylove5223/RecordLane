import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ErrorHandler } from '../utils/errorHandler';

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
  isOnboarded: true, // Skip onboarding to avoid requiring users to save data repeatedly
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
  try {
    switch (action.type) {
      case 'SET_ONBOARDED':
        const newOnboardedState = { ...state, isOnboarded: action.payload };
        saveStateToStorage(newOnboardedState);
        return newOnboardedState;
        
      case 'SET_SETTINGS_OPEN':
        return { ...state, settingsOpen: action.payload };
        
      case 'SET_SHARE_MODAL_OPEN':
        return { ...state, shareModalOpen: action.payload };
        
      case 'SET_SHARE_MODAL_DATA':
        return { 
          ...state, 
          shareModalOpen: true, 
          shareModalData: action.payload 
        };
        
      case 'UPDATE_SETTINGS':
        const newSettingsState = { 
          ...state, 
          settings: { ...state.settings, ...action.payload } 
        };
        saveStateToStorage(newSettingsState);
        return newSettingsState;
        
      case 'RESET_SETTINGS':
        const resetSettingsState = {
          ...state,
          settings: { ...initialState.settings }
        };
        saveStateToStorage(resetSettingsState);
        return resetSettingsState;
        
      case 'ADD_RECORDING':
        const newRecordingState = { 
          ...state, 
          recordings: [action.payload, ...state.recordings] 
        };
        saveStateToStorage(newRecordingState);
        return newRecordingState;
        
      case 'UPDATE_RECORDING':
        const updatedRecordingState = {
          ...state,
          recordings: state.recordings.map(recording =>
            recording.id === action.payload.id
              ? { ...recording, ...action.payload.updates }
              : recording
          ),
        };
        saveStateToStorage(updatedRecordingState);
        return updatedRecordingState;
        
      case 'REMOVE_RECORDING':
        console.log('REMOVE_RECORDING action received with id:', action.payload);
        console.log('Current recordings before removal:', state.recordings.map(r => ({ id: r.id, title: r.title })));
        const removedRecordingState = {
          ...state,
          recordings: state.recordings.filter(recording => recording.id !== action.payload),
        };
        console.log('Recordings after removal:', removedRecordingState.recordings.map(r => ({ id: r.id, title: r.title })));
        saveStateToStorage(removedRecordingState);
        return removedRecordingState;
        
      case 'SET_LOADING':
        return { ...state, isLoading: action.payload };
        
      case 'SET_ERROR':
        return { ...state, error: action.payload };
        
      case 'LOAD_STATE':
        return { ...state, ...action.payload, error: null };
        
      default:
        return state;
    }
  } catch (error) {
    console.error('Error in app reducer:', error);
    ErrorHandler.logError('APP_REDUCER_ERROR', error, { action });
    return { ...state, error: 'An error occurred while updating the application state' };
  }
}

function saveStateToStorage(state: AppState): void {
  try {
    const stateToSave = {
      ...state,
      settingsOpen: false,
      shareModalOpen: false,
      shareModalData: undefined,
      isLoading: false,
      error: null,
      recordings: state.recordings.map(recording => ({
        ...recording,
      })),
    };
    
    localStorage.setItem('recordlane-app-state', JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to save app state:', error);
    ErrorHandler.logError('STATE_SAVE_ERROR', error);
    
    if (error.name === 'QuotaExceededError') {
      // If storage is full, keep only the most recent recordings
      const reducedState = {
        ...state,
        recordings: state.recordings.slice(0, 10).map(recording => ({
          ...recording,
        })),
        settingsOpen: false,
        shareModalOpen: false,
        shareModalData: undefined,
        isLoading: false,
        error: null,
      };
      try {
        localStorage.setItem('recordlane-app-state', JSON.stringify(reducedState));
      } catch (e) {
        localStorage.removeItem('recordlane-app-state');
      }
    }
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  refreshRecordings: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const refreshRecordings = React.useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Try to load recordings from Supabase backend, but fallback gracefully if it fails
      try {
        const { metadata } = await import('../supabaseClient');
        const recordingsResponse = await metadata.list({});
        
        if (recordingsResponse.recordings) {
          const recordings = recordingsResponse.recordings.map((rec: any) => ({
            id: rec.id,
            title: rec.title,
            youtubeVideoId: rec.youtube_video_id,
            youtubeLink: rec.youtube_link,
            thumbnail: rec.thumbnail_url,
            duration: rec.duration * 1000, // Convert seconds to milliseconds
            createdAt: new Date(rec.created_at),
            privacy: rec.privacy,
            uploadStatus: 'completed' as const, // All recordings from backend are synced
          }));
          
          dispatch({ type: 'LOAD_STATE', payload: { recordings } });
        }
      } catch (backendError) {
        console.warn('Backend not available, using local storage only:', backendError);
        // Don't set error state, just use local storage
      }
    } catch (error) {
      console.error('Failed to refresh recordings:', error);
      ErrorHandler.logError('RECORDINGS_REFRESH_ERROR', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh recordings' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  React.useEffect(() => {
    const loadState = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Load recordings from Supabase backend
        try {
          console.log('Loading recordings from Supabase...');
          
          // Import Supabase client
          const { supabase } = await import('../lib/supabase');
          
          // Load recordings from Supabase
          const { data: recordings, error } = await supabase
            .from('recordings')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error('Failed to load recordings from Supabase:', error);
            throw error;
          }
          
          // Transform recordings to match expected format
          const transformedRecordings = (recordings || []).map((rec: any) => ({
            id: rec.id,
            title: rec.title,
            youtubeVideoId: rec.youtube_video_id,
            youtubeLink: rec.youtube_link,
            thumbnail: rec.thumbnail_url,
            duration: rec.duration * 1000, // Convert seconds to milliseconds
            createdAt: new Date(rec.created_at),
            privacy: rec.privacy,
            uploadStatus: 'completed' as const,
          }));
          
          dispatch({ type: 'LOAD_STATE', payload: { 
            recordings: transformedRecordings,
            isOnboarded: true 
          }});
          
          console.log(`✅ Loaded ${transformedRecordings.length} recordings from Supabase`);
        } catch (supabaseError) {
          console.warn('Failed to load recordings from Supabase, falling back to local storage:', supabaseError);
          
          // Fallback to local storage
          const savedState = localStorage.getItem('recordlane-app-state');
          if (savedState) {
            try {
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
            } catch (parseError) {
              console.error('Failed to parse saved state:', parseError);
              dispatch({ type: 'LOAD_STATE', payload: { recordings: [], isOnboarded: true } });
            }
          } else {
            dispatch({ type: 'LOAD_STATE', payload: { recordings: [], isOnboarded: true } });
          }
        }
      } catch (error) {
        console.error('Failed to load app state:', error);
        ErrorHandler.logError('STATE_LOAD_ERROR', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load application state' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadState();
  }, []);

  React.useEffect(() => {
    if (state.error) {
      console.error('App state error:', state.error);
      
      const timeoutId = setTimeout(() => {
        dispatch({ type: 'SET_ERROR', payload: null });
      }, 10000);

      return () => clearTimeout(timeoutId);
    }
  }, [state.error]);

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
