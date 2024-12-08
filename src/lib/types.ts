export interface FileItem {
  id: string;
  name: string;
  type: 'file';
  size: number;
  modifiedAt: number;
  createdAt: number;
}

export interface FolderItem {
  id: string;
  name: string;
  type: 'folder';
  modifiedAt: number;
  createdAt: number;
  children?: (FileItem | FolderItem)[];
}
