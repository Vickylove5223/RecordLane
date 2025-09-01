import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/spinner';
import { 
  Folder, 
  Plus, 
  FolderOpen,
  Calendar,
  ArrowRight,
  CheckCircle,
  Search
} from 'lucide-react';
import { useDrive } from '../../contexts/DriveContext';
import { DriveFolder } from '../../services/driveService';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface FolderSetupModalProps {
  onComplete: () => void;
}

export function FolderSetupModal({ onComplete }: FolderSetupModalProps) {
  const { listFolders, createFolder, selectFolder } = useDrive();
  const { toast } = useToast();
  
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [filteredFolders, setFilteredFolders] = useState<DriveFolder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newFolderName, setNewFolderName] = useState('RecordLane Recordings');

  // Load folders on mount
  useEffect(() => {
    loadFolders();
  }, []);

  // Filter folders based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredFolders(
        folders.filter(folder => 
          folder.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredFolders(folders);
    }
  }, [searchQuery, folders]);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      const folderList = await listFolders();
      setFolders(folderList);
      setFilteredFolders(folderList);
    } catch (error) {
      console.error('Failed to load folders:', error);
      toast({
        title: "Failed to Load Folders",
        description: "Could not load your Google Drive folders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFolder = async (folder: DriveFolder) => {
    try {
      setIsSelecting(true);
      setSelectedFolderId(folder.id);
      
      await selectFolder(folder.id, folder.name);
      
      toast({
        title: "Folder Selected",
        description: `Using "${folder.name}" for recordings`,
      });
      
      onComplete();
    } catch (error) {
      console.error('Failed to select folder:', error);
      setSelectedFolderId(null);
      toast({
        title: "Selection Failed",
        description: "Failed to select folder",
        variant: "destructive",
      });
    } finally {
      setIsSelecting(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Please enter a folder name",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      
      const newFolder = await createFolder(newFolderName.trim());
      await selectFolder(newFolder.id, newFolder.name);
      
      toast({
        title: "Folder Created",
        description: `Created and selected "${newFolder.name}"`,
      });
      
      onComplete();
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create folder",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Folder className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-xl">Choose Recording Folder</DialogTitle>
              <DialogDescription>
                Select an existing folder or create a new one to store your recordings
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Create New Folder Section */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">Create New Folder</h3>
                      {showCreateNew ? (
                        <div className="space-y-3">
                          <Input
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Enter folder name"
                            disabled={isCreating}
                          />
                          <div className="flex space-x-2">
                            <Button
                              onClick={handleCreateFolder}
                              disabled={isCreating || !newFolderName.trim()}
                              size="sm"
                            >
                              {isCreating ? (
                                <LoadingSpinner text="Creating..." size="sm" />
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create Folder
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowCreateNew(false)}
                              disabled={isCreating}
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Create a new folder specifically for your RecordLane recordings
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => setShowCreateNew(true)}
                            disabled={isCreating || isSelecting}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Folder
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Existing Folders Section */}
              <div>
                <h3 className="font-semibold mb-4">Or select an existing folder</h3>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search folders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>

                {/* Folders List */}
                {isLoading ? (
                  <div className="text-center py-8">
                    <LoadingSpinner text="Loading folders..." />
                  </div>
                ) : filteredFolders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{searchQuery ? 'No folders match your search' : 'No folders found'}</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredFolders.map((folder) => (
                      <Card 
                        key={folder.id} 
                        className={`cursor-pointer transition-colors hover:bg-accent ${
                          selectedFolderId === folder.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => !isSelecting && handleSelectFolder(folder)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FolderOpen className="h-5 w-5 text-blue-500" />
                              <div>
                                <h4 className="font-medium">{folder.name}</h4>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    Created {formatDistanceToNow(new Date(folder.createdTime), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {selectedFolderId === folder.id && isSelecting ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
