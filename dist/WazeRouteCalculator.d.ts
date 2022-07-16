import type { WazeRouteCalcProps } from './types/index';
declare class WazeRouteCalculator {
    private wazeURL;
    private baseHeaders;
    private vehicleTypes;
    private routeOptions;
    private avoidSubscriptions;
    private baseCoords;
    private coordsServers;
    private routingServers;
    private coordinatesMatch;
    private startAddress;
    private endAddress;
    private startCoords;
    private endCoords;
    private region;
    constructor();
    init(props: WazeRouteCalcProps): Promise<void>;
    private alreadyCoords;
    private coordsStringParser;
    private addressToCoords;
    private getRoute;
    private addUpRoute;
    calcRouteInfo(realTime?: boolean, stopAtBounds?: boolean, timeDelta?: number): Promise<[number, number]>;
    calcAllRoutesInfo(nPaths?: number, realTime?: boolean, stopAtBounds?: boolean, timeDelta?: number): Promise<{
        [key: string]: [number, number];
    }>;
    private serializeParameters;
    private debugLog;
    private wazeRequest;
}
export default WazeRouteCalculator;
