import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { DriveService, DriveFolder, UploadProgress } from '../services/driveService';
import { TokenService } from '../services/tokenService';
import { ErrorHandler } from '../utils/errorHandler';
import { RetryService } from '../utils/retryService';
import { useToast } from '@/components/ui/use-toast';

interface DriveContextType {
  isConnected: boolean;
  userEmail: string | null;
  selectedFolder: { id: string; name: string } | null;
  requiresFolderSetup: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  connectDrive: () => Promise<void>;
  disconnectDrive: () => Promise<void>;
  listFolders: () => Promise<DriveFolder[]>;
  createFolder: (name: string) => Promise<DriveFolder>;
  selectFolder: (folderId: string, folderName: string) => Promise<void>;
  uploadFile: (
    file: Blob, 
    title: string, 
    privacy: string, 
    onProgress?: (progress: UploadProgress) => void
  ) => Promise<{ fileId: string; shareLink: string; webViewLink: string }>;
  checkConnection: () => Promise<void>;
  retryConnection: () => Promise<void>;
}

const DriveContext = createContext<DriveContextType | undefined>(undefined);

export function DriveProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<{ id: string; name: string } | null>(null);
  const [requiresFolderSetup, setRequiresFolderSetup] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const retryService = new RetryService();

  const checkConnection = useCallback(async () => {
    try {
      setConnectionError(null);
      
      const connection = await retryService.execute(
        () => DriveService.checkConnection(),
        {
          maxRetries: 2,
          retryDelay: 1000,
          shouldRetry: (error) => ErrorHandler.isRecoverableError(error),
        }
      );
      
      setIsConnected(connection.isConnected);
      setUserEmail(connection.userEmail);
      setRequiresFolderSetup(connection.requiresFolderSetup || false);
      
      if (connection.folderId && connection.folderName) {
        setSelectedFolder({ id: connection.folderId, name: connection.folderName });
      } else {
        setSelectedFolder(null);
      }
      
      // Clear any previous errors if check was successful
      if (connection.isConnected) {
        setConnectionError(null);
      }
    } catch (error) {
      console.error('Failed to check Drive connection:', error);
      ErrorHandler.logError('drive-connection-check', error);
      
      setIsConnected(false);
      setUserEmail(null);
      setSelectedFolder(null);
      setRequiresFolderSetup(false);
      
      const errorMessage = ErrorHandler.formatErrorForUser(error);
      setConnectionError(errorMessage);
    }
  }, [retryService]);

  const connectDrive = useCallback(async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const result = await retryService.execute(
        () => DriveService.connect(),
        {
          maxRetries: 1, // Don't retry auth failures
          retryDelay: 2000,
          shouldRetry: (error) => {
            // Only retry on network errors, not auth errors
            return ErrorHandler.isRecoverableError(error) && 
                   !error.message?.includes('popup') &&
                   !error.message?.includes('cancelled') &&
                   !error.message?.includes('denied');
          },
          onRetry: (error, attempt) => {
            toast({
              title: "Connection Retry",
              description: `Retrying connection attempt ${attempt}...`,
            });
          }
        }
      );
      
      setIsConnected(true);
      setUserEmail(result.userEmail);
      setRequiresFolderSetup(result.requiresFolderSetup);
      
      // If folder setup is not required, get the selected folder
      if (!result.requiresFolderSetup) {
        const folder = DriveService.getSelectedFolder();
        if (folder) {
          setSelectedFolder(folder);
        }
      }
      
      toast({
        title: "Drive Connected",
        description: `Successfully connected to ${result.userEmail}`,
      });
    } catch (error) {
      console.error('Failed to connect to Drive:', error);
      ErrorHandler.logError('drive-connect', error);
      
      const errorMessage = ErrorHandler.formatErrorForUser(error);
      setConnectionError(errorMessage);
      
      // Don't show toast for user cancellation
      if (!error.message?.includes('cancelled') && !error.message?.includes('popup was closed')) {
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [toast, retryService]);

  const disconnectDrive = useCallback(async () => {
    try {
      await retryService.execute(
        () => DriveService.disconnect(),
        {
          maxRetries: 2,
          retryDelay: 1000,
          shouldRetry: () => true, // Always retry disconnect attempts
        }
      );
      
      setIsConnected(false);
      setUserEmail(null);
      setSelectedFolder(null);
      setRequiresFolderSetup(false);
      setConnectionError(null);
      
      toast({
        title: "Drive Disconnected",
        description: "Successfully disconnected from Google Drive",
      });
    } catch (error) {
      console.error('Failed to disconnect from Drive:', error);
      ErrorHandler.logError('drive-disconnect', error);
      
      // Even if disconnect fails, clear local state
      setIsConnected(false);
      setUserEmail(null);
      setSelectedFolder(null);
      setRequiresFolderSetup(false);
      setConnectionError(null);
      
      toast({
        title: "Disconnect Warning",
        description: "Local connection cleared, but Google may still show authorization",
        variant: "destructive",
      });
    }
  }, [toast, retryService]);

  const listFolders = useCallback(async () => {
    try {
      return await retryService.execute(
        () => DriveService.listFolders(),
        {
          maxRetries: 2,
          retryDelay: 1000,
          shouldRetry: (error) => {
            // Don't retry auth errors, but do retry network errors
            if (error.code === 'AUTH_EXPIRED' || error.message?.includes('Authentication expired')) {
              // Auth expired, trigger reconnection
              setIsConnected(false);
              setUserEmail(null);
              setSelectedFolder(null);
              setConnectionError('Authentication expired, please reconnect');
              return false;
            }
            return ErrorHandler.isRecoverableError(error);
          },
        }
      );
    } catch (error) {
      if (error.code === 'AUTH_EXPIRED') {
        setIsConnected(false);
        setUserEmail(null);
        setSelectedFolder(null);
        setConnectionError('Authentication expired, please reconnect');
      }
      throw error;
    }
  }, [retryService]);

  const createFolder = useCallback(async (name: string) => {
    try {
      return await retryService.execute(
        () => DriveService.createFolder(name),
        {
          maxRetries: 2,
          retryDelay: 1000,
          shouldRetry: (error) => {
            if (error.code === 'AUTH_EXPIRED') {
              setIsConnected(false);
              setUserEmail(null);
              setSelectedFolder(null);
              setConnectionError('Authentication expired, please reconnect');
              return false;
            }
            return ErrorHandler.isRecoverableError(error);
          },
        }
      );
    } catch (error) {
      if (error.code === 'AUTH_EXPIRED') {
        setIsConnected(false);
        setUserEmail(null);
        setSelectedFolder(null);
        setConnectionError('Authentication expired, please reconnect');
      }
      throw error;
    }
  }, [retryService]);

  const selectFolder = useCallback(async (folderId: string, folderName: string) => {
    try {
      await DriveService.selectFolder(folderId, folderName);
      setSelectedFolder({ id: folderId, name: folderName });
      setRequiresFolderSetup(false);
      
      toast({
        title: "Folder Selected",
        description: `Using "${folderName}" for recordings`,
      });
    } catch (error) {
      console.error('Failed to select folder:', error);
      ErrorHandler.logError('folder-select', error);
      
      if (error.code === 'AUTH_EXPIRED') {
        setIsConnected(false);
        setUserEmail(null);
        setSelectedFolder(null);
        setConnectionError('Authentication expired, please reconnect');
      }
      
      toast({
        title: "Selection Failed",
        description: ErrorHandler.formatErrorForUser(error),
        variant: "destructive",
      });
      
      throw error;
    }
  }, [toast]);

  const uploadFile = useCallback(async (
    file: Blob, 
    title: string, 
    privacy: string,
    onProgress?: (progress: UploadProgress) => void
  ) => {
    if (!isConnected) {
      throw ErrorHandler.createError('DRIVE_NOT_CONNECTED', 'Drive not connected');
    }
    
    if (!selectedFolder) {
      throw ErrorHandler.createError('NO_FOLDER_SELECTED', 'No folder selected for uploads');
    }
    
    try {
      return await retryService.execute(
        () => DriveService.uploadFile(file, title, privacy, onProgress),
        {
          maxRetries: 3,
          retryDelay: 2000,
          shouldRetry: (error) => {
            // Don't retry auth errors
            if (error.code === 'AUTH_EXPIRED') {
              setIsConnected(false);
              setUserEmail(null);
              setSelectedFolder(null);
              setConnectionError('Authentication expired, please reconnect');
              return false;
            }
            // Retry on network errors and certain HTTP errors
            return ErrorHandler.isRecoverableError(error) ||
                   (error.status >= 500 && error.status < 600) ||
                   error.status === 429; // Rate limit
          },
          onRetry: (error, attempt) => {
            toast({
              title: "Upload Retry",
              description: `Retrying upload attempt ${attempt}...`,
            });
          }
        }
      );
    } catch (error) {
      if (error.code === 'AUTH_EXPIRED') {
        setIsConnected(false);
        setUserEmail(null);
        setSelectedFolder(null);
        setConnectionError('Authentication expired, please reconnect');
      }
      throw error;
    }
  }, [isConnected, selectedFolder, retryService, toast]);

  const retryConnection = useCallback(async () => {
    if (connectionError) {
      await connectDrive();
    } else {
      await checkConnection();
    }
  }, [connectionError, connectDrive, checkConnection]);

  // Check connection on mount and periodically check token expiry
  React.useEffect(() => {
    checkConnection();
    
    // Set up periodic token expiry check
    const interval = setInterval(() => {
      if (isConnected && TokenService.isTokenNearExpiry()) {
        console.log('Token is near expiry, clearing connection state');
        setIsConnected(false);
        setUserEmail(null);
        setSelectedFolder(null);
        setConnectionError('Authentication session expired, please reconnect');
        TokenService.clearTokens();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [checkConnection]);

  // Check connection when coming back from background (tab visibility change)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isConnected) {
        // Check if we still have a valid token when tab becomes visible
        const token = TokenService.getValidAccessToken();
        if (!token) {
          setIsConnected(false);
          setUserEmail(null);
          setSelectedFolder(null);
          setConnectionError('Authentication session expired, please reconnect');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected]);

  return (
    <DriveContext.Provider value={{
      isConnected,
      userEmail,
      selectedFolder,
      requiresFolderSetup,
      isConnecting,
      connectionError,
      connectDrive,
      disconnectDrive,
      listFolders,
      createFolder,
      selectFolder,
      uploadFile,
      checkConnection,
      retryConnection,
    }}>
      {children}
    </DriveContext.Provider>
  );
}

export function useDrive() {
  const context = useContext(DriveContext);
  if (context === undefined) {
    throw new Error('useDrive must be used within a DriveProvider');
  }
  return context;
}
