export interface BaseItem {
  id: string;
  name: string;
  modifiedAt: number;
  createdAt: number;
  isEditing?: boolean;
}

export interface FileItem extends BaseItem {
  type: 'file';
  size: number;
}

export interface FolderItem extends BaseItem {
  type: 'folder';
  isExpanded: boolean;
  children: (FileItem | FolderItem)[];
}

export interface MenuItem {
  icon?: string;
  name: string;
  children?: MenuItem[];
  onClick?: () => void;
}
