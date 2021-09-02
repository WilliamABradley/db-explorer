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

  if (isText) {
    try {
      const str = textDecoder.decode(val);
      return textParsers[typeInfo.oid](str);
    } catch {
      return '???';
    }
  } else if (isBinary) {
    return binaryParsers[typeInfo.oid](val);
  } else {
    const str = textDecoder.decode(val);
    return String(str);
  }
}
