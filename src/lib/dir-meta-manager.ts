import { dir, file, write } from 'opfs-tools';
import { joinPath } from './utils';
import type { OTDir, OTFile } from './types';

interface DirMetaEntry {
  name: string;
  kind: 'file' | 'dir';
  modifiedAt: number;
  createdAt: number;
}

interface DirMeta {
  entries: DirMetaEntry[];
}

const META_FILE_NAME = '.opfs-finder-meta';

function getMetaFileByPath(path: string) {
  return file(joinPath(path, META_FILE_NAME));
}

async function getDirMeta(path: string): Promise<DirMeta> {
  const curDir = dir(path);
  if (!(await curDir.exists())) throw Error('dir not exists');
  // 尝试读取现有的元数据文件
  const metaFile = getMetaFileByPath(path);
  if (!(await metaFile.exists())) {
    const entries = (await curDir.children()).map((child) => ({
      name: child.name,
      kind: child.kind,
      modifiedAt: Date.now(),
      createdAt: Date.now(),
    }));
    await write(metaFile, JSON.stringify({ entries }));
    return { entries };
  }
  // todo: 缓存数据，避免每次都读取文件
  return JSON.parse(await metaFile.text());
}

// 添加一个用于更新元数据的辅助函数
async function updateDirMeta(item: OTFile | OTDir): Promise<void> {
  const parentPath = item.parent?.path ?? '/';
  const dirMeta = await getDirMeta(parentPath);
  const itemMeta = dirMeta.entries.find((entry) => entry.name === item.name);

  if (itemMeta) {
    itemMeta.modifiedAt = Date.now();
  } else {
    dirMeta.entries.push({
      name: item.name,
      kind: item.kind,
      modifiedAt: Date.now(),
      createdAt: Date.now(),
    });
  }

  await write(getMetaFileByPath(parentPath), JSON.stringify(dirMeta));
}

export { getDirMeta, updateDirMeta, type DirMeta, type DirMetaEntry };
