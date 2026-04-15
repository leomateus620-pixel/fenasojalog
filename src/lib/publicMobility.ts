const PUBLIC_MOBILITY_ORIGIN = 'https://fenasojalog.lovable.app';

const PUBLIC_MOBILITY_HOSTS = new Set([
  'fenasojalog.lovable.app',
  'fenasojalog.com',
  'www.fenasojalog.com',
]);

type LocationLike = Pick<Location, 'origin' | 'hostname' | 'pathname' | 'search' | 'hash'>;

export const isPublicMobilityPath = (pathname: string) => /^\/f\/mobilidade\/[^/]+$/.test(pathname);

export const getPublicMobilityOrigin = (locationLike?: LocationLike) => {
  if (!locationLike) return PUBLIC_MOBILITY_ORIGIN;
  return PUBLIC_MOBILITY_HOSTS.has(locationLike.hostname)
    ? locationLike.origin
    : PUBLIC_MOBILITY_ORIGIN;
};

export const getCanonicalPublicMobilityUrl = (
  pathname: string,
  search = '',
  hash = '',
) => `${PUBLIC_MOBILITY_ORIGIN}${pathname}${search}${hash}`;

export const shouldForcePublicMobilityRedirect = (locationLike?: LocationLike) => {
  if (!locationLike) return false;
  return isPublicMobilityPath(locationLike.pathname) && !PUBLIC_MOBILITY_HOSTS.has(locationLike.hostname);
};

export { PUBLIC_MOBILITY_ORIGIN };