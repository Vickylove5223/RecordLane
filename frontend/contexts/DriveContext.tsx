import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { DriveService, UploadProgress } from '../services/driveService';
import { ErrorHandler } from '../utils/errorHandler';
import { RetryService } from '../utils/retryService';
import { useToast } from '@/components/ui/use-toast';

interface DriveContextType {
  isConnected: boolean;
  userEmail: string | null;
  folderName: string;
  isConnecting: boolean;
  connectionError: string | null;
  connectDrive: () => Promise<void>;
  disconnectDrive: () => Promise<void>;
  uploadFile: (
    file: Blob, 
    title: string, 
    privacy: string, 
    onProgress?: (progress: UploadProgress) => void
  ) => Promise<{ fileId: string; shareLink: string }>;
  checkConnection: () => Promise<void>;
  retryConnection: () => Promise<void>;
}

const DriveContext = createContext<DriveContextType | undefined>(undefined);

export function DriveProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('RecordLane Recordings');
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
      if (connection.folderName) {
        setFolderName(connection.folderName);
      }
    } catch (error) {
      console.error('Failed to check Drive connection:', error);
      ErrorHandler.logError('drive-connection-check', error);
      setIsConnected(false);
      setUserEmail(null);
      setConnectionError(ErrorHandler.formatErrorForUser(error));
    }
  }, [retryService]);

  const connectDrive = useCallback(async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const result = await retryService.execute(
        () => DriveService.connect(),
        {
          maxRetries: 2,
          retryDelay: 2000,
          shouldRetry: (error) => {
            // Retry on network errors but not on user cancellation
            return ErrorHandler.isRecoverableError(error) && 
                   !error.message?.includes('popup') &&
                   !error.message?.includes('cancelled');
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
      setFolderName(result.folderName);
      
      toast({
        title: "Drive Connected",
        description: `Successfully connected to ${result.userEmail}`,
      });
    } catch (error) {
      console.error('Failed to connect to Drive:', error);
      ErrorHandler.logError('drive-connect', error);
      
      const errorMessage = ErrorHandler.formatErrorForUser(error);
      setConnectionError(errorMessage);
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
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
      setFolderName('RecordLane Recordings');
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
      setConnectionError(null);
      
      toast({
        title: "Disconnect Warning",
        description: "Local connection cleared, but Google may still show authorization",
        variant: "destructive",
      });
    }
  }, [toast, retryService]);

  const uploadFile = useCallback(async (
    file: Blob, 
    title: string, 
    privacy: string,
    onProgress?: (progress: UploadProgress) => void
  ) => {
    if (!isConnected) {
      throw ErrorHandler.createError('DRIVE_NOT_CONNECTED', 'Drive not connected');
    }
    
    return await retryService.execute(
      () => DriveService.uploadFile(file, title, privacy, onProgress),
      {
        maxRetries: 3,
        retryDelay: 2000,
        shouldRetry: (error) => {
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
  }, [isConnected, retryService, toast]);

  const retryConnection = useCallback(async () => {
    if (connectionError) {
      await connectDrive();
    } else {
      await checkConnection();
    }
  }, [connectionError, connectDrive, checkConnection]);

  // Check connection on mount
  React.useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return (
    <DriveContext.Provider value={{
      isConnected,
      userEmail,
      folderName,
      isConnecting,
      connectionError,
      connectDrive,
      disconnectDrive,
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
