export * from './waze';
export declare type BaseReqHeaders = {
    'User-Agent': string;
    referer: string;
};
export declare enum Regions {
    AU = "AU",
    EU = "EU",
    IL = "IL",
    US = "US"
}
export declare type Bounds = {
    bottom: number;
    left: number;
    right: number;
    top: number;
};
export declare type Coords = {
    lat: number;
    lon: number;
    bounds?: Bounds | Record<string, never>;
};
export declare type RegionizedString = {
    [key in Regions]: string;
};
export declare type RegionizedCoords = {
    [key in Regions]: Coords;
};
export interface WazeRouteCalcProps {
    avoidFerries?: boolean;
    avoidSubscriptionRoads?: boolean;
    avoidTollRoads?: boolean;
    endAddress: string;
    region?: Regions;
    startAddress: string;
    vehicleType?: string;
}
