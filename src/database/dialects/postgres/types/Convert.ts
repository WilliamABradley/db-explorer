import {TextDecoder} from 'text-encoding';
import {init as registerTextTypeParsers} from 'pg-types/lib/textParsers';
import {init as registerBinaryTypeParsers} from 'pg-types/lib/binaryParsers';
import PgTypeInfo from './PgTypeInfo';

const textParsers: Record<number, (val: string) => any> = {};
const binaryParsers: Record<number, (val: Buffer) => any> = {};

registerTextTypeParsers((oid: number, parser: (val: string) => any) => {
  textParsers[oid] = parser;
});

registerBinaryTypeParsers((oid: number, parser: (val: Buffer) => any) => {
  binaryParsers[oid] = parser;
});

const textParserKeys = Object.keys(textParsers);
const binaryParserKeys = Object.keys(binaryParsers);
const textDecoder = new TextDecoder('utf-8');

export default function Convert(val: Buffer, typeInfo: PgTypeInfo) {
  const oidKey = typeInfo.oid.toString();
  const isText = textParserKeys.includes(oidKey);
  const isBinary = binaryParserKeys.includes(oidKey);

  let str: string | undefined;
  const getStr = () => {
    if (str) return;
    str = textDecoder.decode(val);
    if (str?.startsWith('\u0001')) {
      str = str.substring(1);
    }
  };

  try {
    if (isBinary) {
      return binaryParsers[typeInfo.oid](val);
    } else {
      getStr();
      if (isText) {
        return textParsers[typeInfo.oid](str!);
      } else {
        return str;
      }
    }
  } catch (e) {
    getStr();
    console.error(e);
    return str;
  }
}
