export * from './waze.types';

export type BaseReqHeaders = {
  'User-Agent': string;
  referer: string;
};

export enum Regions {
  AU = 'AU',
  EU = 'EU',
  IL = 'IL',
  US = 'US',
}

export type Bounds = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

export type Coords = {
  lat: number;
  lon: number;
  bounds?: Bounds | Record<string, never>;
};

export type RegionizedString = {
  [key in Regions]: string;
}

export type RegionizedCoords = {
  [key in Regions]: Coords;
}

export interface WazeRouteCalcProps {
  avoidFerries?: boolean;
  avoidSubscriptionRoads?: boolean;
  avoidTollRoads?: boolean;
  endAddress: string;
  region?: Regions;
  startAddress: string;
  vehicleType?: string;
}
