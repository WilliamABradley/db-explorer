import SecureInfo from 'react-native-sensitive-info';

export async function getSecureData<T>(key: string): Promise<T | null> {
  const entry = await SecureInfo.getItem(key, {}).catch(_ => null);
  if (entry) {
    return JSON.parse(entry);
  }
  return null;
}

export async function setSecureData(key: string, value: any): Promise<void> {
  await SecureInfo.setItem(key, JSON.stringify(value), {});
}

export async function deleteSecureData(key: string): Promise<void> {
  await SecureInfo.deleteItem(key, {});
}
