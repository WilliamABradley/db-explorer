export enum AddressType {
  Ipv6 = 'Ipv6',
  Ipv4 = 'Ipv4',
  Domain = 'Domain',
}

export function isIpv4(address: string): boolean {
  return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
    address,
  );
}

export function isIpv6(address: string): boolean {
  return /^([a-f0-9:]+:+)+[a-f0-9]+$/.test(address);
}

export function getAddressType(address: string): AddressType {
  if (isIpv4(address)) {
    return AddressType.Ipv4;
  } else if (isIpv6(address)) {
    return AddressType.Ipv6;
  }
  return AddressType.Domain;
}
