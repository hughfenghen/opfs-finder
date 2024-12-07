// 格式化文件大小
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 字节';

  const units = ['字节', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + units[i];
}

// 格式化日期
export function formatDate(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}`;
}
