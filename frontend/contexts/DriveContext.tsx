import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { DriveService } from '../services/driveService';
import { useToast } from '@/components/ui/use-toast';

interface DriveContextType {
  isConnected: boolean;
  userEmail: string | null;
  folderName: string;
  isConnecting: boolean;
  connectDrive: () => Promise<void>;
  disconnectDrive: () => Promise<void>;
  uploadFile: (file: Blob, title: string, privacy: string) => Promise<{ fileId: string; shareLink: string }>;
  checkConnection: () => Promise<void>;
}

const DriveContext = createContext<DriveContextType | undefined>(undefined);

export function DriveProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('LoomClone Recordings');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const checkConnection = useCallback(async () => {
    try {
      const connection = await DriveService.checkConnection();
      setIsConnected(connection.isConnected);
      setUserEmail(connection.userEmail);
      if (connection.folderName) {
        setFolderName(connection.folderName);
      }
    } catch (error) {
      console.error('Failed to check Drive connection:', error);
      setIsConnected(false);
      setUserEmail(null);
    }
  }, []);

  const connectDrive = useCallback(async () => {
    setIsConnecting(true);
    try {
      const result = await DriveService.connect();
      setIsConnected(true);
      setUserEmail(result.userEmail);
      setFolderName(result.folderName);
      
      toast({
        title: "Drive Connected",
        description: `Successfully connected to ${result.userEmail}`,
      });
    } catch (error) {
      console.error('Failed to connect to Drive:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Drive. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const disconnectDrive = useCallback(async () => {
    try {
      await DriveService.disconnect();
      setIsConnected(false);
      setUserEmail(null);
      setFolderName('LoomClone Recordings');
      
      toast({
        title: "Drive Disconnected",
        description: "Successfully disconnected from Google Drive",
      });
    } catch (error) {
      console.error('Failed to disconnect from Drive:', error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect from Google Drive",
        variant: "destructive",
      });
    }
  }, [toast]);

  const uploadFile = useCallback(async (file: Blob, title: string, privacy: string) => {
    if (!isConnected) {
      throw new Error('Drive not connected');
    }
    
    return await DriveService.uploadFile(file, title, privacy);
  }, [isConnected]);

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
      connectDrive,
      disconnectDrive,
      uploadFile,
      checkConnection,
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
