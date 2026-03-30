export interface FileNode {
  file: {
    contents: string | Uint8Array;
  };
}

export interface SymlinkNode {
  file: {
    symlink: string;
  };
}

export interface DirectoryNode {
  directory: FileTree;
}

export type FileTree = {
  [key: string]: FileNode | SymlinkNode | DirectoryNode | string;
};

export interface DirEnt {
  name: string | Uint8Array;
  isDirectory(): boolean;
  isFile(): boolean;
}

export type FileEncoding = 
  | 'utf8' 
  | 'utf-16le' 
  | 'ascii' 
  | 'base64' 
  | 'latin1' 
  | 'binary' 
  | 'hex';

export interface FileSystemOptions {
  encoding?: FileEncoding;
  withFileTypes?: boolean;
  recursive?: boolean;
  force?: boolean;
}

export type WatchEvent = 'rename' | 'change';

export interface WatchListener {
  (event: WatchEvent, filename?: string | Uint8Array): void;
}

export interface Watcher {
  close(): void;
}
