import {Platform} from 'react-native';
import {readFile, exists} from 'react-native-fs';
import {
  pick,
  isCancel,
  types,
  DocumentPickerResponse,
} from 'react-native-document-picker';

export type FilePickOptions = {
  types?: string[];
};

export type FileEncoding = 'utf8' | 'base64';

export type FileData = {
  uri: string;
  data: string;
};

export async function RetrieveFileFromUri(
  uri: string,
  encoding: FileEncoding,
): Promise<string> {
  return await readFile(uri, encoding);
}

async function PickFileBase(
  options?: FilePickOptions,
): Promise<DocumentPickerResponse | null> {
  try {
    const response = await pick(<any>{
      readContent: true,
      type: options?.types ?? [types.allFiles],
    });
    const result = response[0];
    if (result.copyError) {
      throw new Error(result.copyError);
    }
    return result;
  } catch (e: any) {
    if (isCancel(e)) {
      return null;
    }
    throw e;
  }
}

export async function PickFileUri(
  options?: FilePickOptions,
): Promise<string | null> {
  const response = await PickFileBase(options);
  return (response?.fileCopyUri || response?.uri) ?? null;
}

export async function PickFileData(
  encoding: FileEncoding,
  options?: FilePickOptions,
): Promise<FileData | null> {
  const response = await PickFileBase(options);
  if (response) {
    // We use readContent on Windows, which returns a base64 string.
    if (Platform.OS === 'windows') {
      let data: string = (<any>response).content;
      if (encoding !== 'base64') {
        const buff = Buffer.from(data, 'base64');
        data = buff.toString(encoding);
      }
      return {
        uri: response.uri,
        data,
      };
    } else {
      const uri = response.fileCopyUri || response.uri;
      console.debug(`Retrieving ${uri}`);
      const data = await RetrieveFileFromUri(uri, encoding);
      return {
        uri,
        data,
      };
    }
  }
  return null;
}
