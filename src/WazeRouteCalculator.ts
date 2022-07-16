import { get as getRequest } from 'https';
import { RequestOptions } from 'http';
import { env, stdout } from 'process';

import { Regions } from './types/index';
import type {
  BaseReqHeaders,
  Bounds,
  Coords,
  RegionizedCoords,
  RegionizedString,
  WazeCoordsResponse,
  WazeRouteCalcProps,
  WazeRouteResponse,
  WazeRouteResponseObject,
  WazeRouteResult,
} from './types/index';

/**
 * Calculate actual route time and distance with Waze API
 */
class WazeRouteCalculator {
  private wazeURL: string;
  private baseHeaders: BaseReqHeaders;
  private vehicleTypes: string[];
  private routeOptions: string[];
  private avoidSubscriptions: boolean;
  private baseCoords: RegionizedCoords;
  private coordsServers: RegionizedString;
  private routingServers: RegionizedString;
  private coordinatesMatch: RegExp;

  private startAddress: string;
  private endAddress: string;
  private startCoords: Coords;
  private endCoords: Coords;
  private region: Regions;

  constructor() {
    this.wazeURL = 'www.waze.com';
    this.baseHeaders = {
      'User-Agent': 'Mozilla/5.0',
      referer: `https://${this.wazeURL}/`,
    };
    this.vehicleTypes = [ 'TAXI', 'MOTORCYCLE' ];
    this.routeOptions = [ 'AVOID_TRAILS' ];
    this.baseCoords = {
      AU: {
        lat: -35.281,
        lon: 149.128,
      },
      EU: {
        lat: 47.498,
        lon: 19.040,
      },
      IL: {
        lat: 31.768,
        lon: 35.214,
      },
      US: {
        lat: 40.713,
        lon: -74.006,
      },
    };
    this.coordsServers = {
      AU: 'row-SearchServer/mozi',
      EU: 'row-SearchServer/mozi',
      IL: 'il-SearchServer/mozi',
      US: 'SearchServer/mozi',
    };
    this.routingServers = {
      AU: 'row-RoutingManager/routingRequest',
      EU: 'row-RoutingManager/routingRequest',
      IL: 'il-RoutingManager/routingRequest',
      US: 'RoutingManager/routingRequest',
    };
    this.coordinatesMatch = /^[-+]?\d{1,2}\.\d+,\s*[-+]?\d{1,3}\.\d+$/;
  }

  /**
   * Anything that could not be instantiated in the regular constructor.
   */
  async init(props: WazeRouteCalcProps) {
    this.startAddress = props.startAddress;
    this.endAddress = props.endAddress;
    this.debugLog(`From: ${this.startAddress} - to: ${this.endAddress}\n`);

    this.region = props.region || Regions.EU;
    this.avoidSubscriptions = !!props.avoidSubscriptionRoads;
    if (props.vehicleType) this.vehicleTypes.push(props.vehicleType.toUpperCase());
    if (props.avoidTollRoads) this.routeOptions.push('AVOID_TOLL_ROADS');
    if (props.avoidFerries) this.routeOptions.push('AVOID_FERRIES');
    // See if we have coordinates or address to resolve
    if (this.alreadyCoords(this.startAddress)) {
      this.startCoords = this.coordsStringParser(this.startAddress);
    } else {
      this.startCoords = await this.addressToCoords(this.startAddress);
    }
    this.debugLog(`Start coords: (${this.startCoords.lat}, ${this.startCoords.lon})\n`);

    if (this.alreadyCoords(this.endAddress)) {
      this.endCoords = this.coordsStringParser(this.endAddress);
    } else {
      this.endCoords = await this.addressToCoords(this.endAddress);
    }
    this.debugLog(`End coords: (${this.endCoords.lat}, ${this.endCoords.lon})\n`);
  }

  /**
   * Test used to see if we have coordinates or address
   * @param address Address to test
   * @returns Boolean
   */
  private alreadyCoords(address: string): boolean {
    return this.coordinatesMatch.test(address);
  }

  /**
   * Parses the address string into coordinates to match addressToCoords return type
   * @param coords The stringified coordinates
   * @returns Coords object
   */
  private coordsStringParser(coords: string): Coords {
    const [ lat, lon ] = coords.split(',');
    return {
      lat: Number(lat.trim()),
      lon: Number(lon.trim()),
    };
  }

  /**
   * Convert address to coordinates
   * @param address The address to convert
   * @returns Coords object
   */
  private async addressToCoords(address: string): Promise<Coords> {
    const baseCoords = this.baseCoords[this.region];
    const getCord = this.coordsServers[this.region];
    const reqConfig = {
      lang: 'eng',
      lat: baseCoords.lat,
      lon: baseCoords.lon,
      origin: 'livemap',
      q: address,
    };
    const data = await this.wazeRequest(getCord, reqConfig) as WazeCoordsResponse;
    const result = data.find(item => item.city);
    if (result) {
      // Sometimes the coords don't match up
      const bounds: Bounds | Record<string, never> = result.bounds ? {
        bottom: Math.min(result.bounds.top, result.bounds.bottom),
        left: Math.min(result.bounds.left, result.bounds.right),
        right: Math.max(result.bounds.left, result.bounds.right),
        top: Math.max(result.bounds.top, result.bounds.bottom),
      } : {};

      return {
        bounds,
        lat: result.location.lat,
        lon: result.location.lon,
      };
    }
    throw new Error(`Cannot get coords for ${address}`);
  }

  /**
   * Get route data from Waze
   * @param nPaths Number of routes
   * @param timeDelta Distance in seconds to trip
   * @returns One or more alternatives
   */
  private async getRoute(
    nPaths: number = 1,
    timeDelta: number = 0,
  ): Promise<WazeRouteResponseObject[]> {
    const routingServer = this.routingServers[this.region];
    const requestConfig = {
      at: timeDelta,
      from: `x:${this.startCoords.lon} y:${this.startCoords.lat}`,
      nPaths,
      options: this.routeOptions.join(','),
      returnGeometries: true,
      returnInstructions: true,
      returnJSON: true,
      timeout: 60000,
      to: `x:${this.endCoords.lon} y:${this.endCoords.lat}`,
    };
    if (this.vehicleTypes) requestConfig['vehicleTypes'] = this.vehicleTypes;
    // Handle vignette system in Europe. Defaults to false (show all routes)
    if (this.avoidSubscriptions) requestConfig['subscription'] = '*';
    const data = await this.wazeRequest(routingServer, requestConfig) as WazeRouteResponse;
    if (data) {
      if (data.error) {
        throw new Error(data.error);
      }
      if (data.alternatives) {
        return data.alternatives.map(alt => alt.response);
      }
      if (nPaths > 1) {
        return [ data.response ];
      }
      return [ data.response ];
    }
    throw new Error('Empty response');
  }

  /**
   * Calculate route time and distance.
   * @param results Results of a route request
   * @param realTime Should real time be used?
   * @param stopAtBounds Should calculation stop at bounds?
   * @returns `[total time, total distance]`
   */
  private addUpRoute(
    results: WazeRouteResult[],
    realTime: boolean = true,
    stopAtBounds: boolean = false,
  ): [number, number] {
    const startBounds = this.startCoords.bounds as Bounds;
    const endBounds = this.endCoords.bounds as Bounds;

    const between = (target: number, min: number, max: number) => {
      return target > min && target < max;
    };

    let time: number = 0;
    let distance: number = 0;

    results.forEach(segment => {
      if (stopAtBounds && segment.path) {
        const x = segment.path.x;
        const y = segment.path.y;
        const betweenX =
          between(x, (startBounds.left || 0), startBounds.right || 0)
          || between(x, endBounds.left || 0, endBounds.right || 0);
        const betweenY =
          between(y, startBounds.bottom || 0, startBounds.top || 0)
          || between(y, endBounds.bottom || 0, endBounds.top || 0);
        if (!betweenX || !betweenY) {
          return;
        }
      }
      time += realTime ? segment.crossTime : segment.crossTimeWithoutRealTime;
      distance += segment.length;
    });

    const routeTime = time / 60.0;
    const routeDistance = distance / 1000.0;
    return [ routeTime, routeDistance ];
  }

  /**
   * Calculate best route info.
   * @param realTime Should real time be used?
   * @param stopAtBounds Should calculation stop at bounds?
   * @param timeDelta Distance in seconds to trip
   * @returns `[routeTime, routeDistance]`
   */
  async calcRouteInfo(
    realTime: boolean = true,
    stopAtBounds: boolean = false,
    timeDelta: number = 0,
  ): Promise<[number, number]> {
    const route = await this.getRoute(1, timeDelta);
    const result: WazeRouteResult[] = route[0].results;
    const [ routeTime, routeDistance ] = this.addUpRoute(result, realTime, stopAtBounds);
    this.debugLog(`Time ${routeTime} minutes, distance ${routeDistance} km\n`);
    return [ routeTime, routeDistance ];
  }

  /**
   *
   * @param nPaths Number of routes
   * @param realTime Should real time be used?
   * @param stopAtBounds Should calculation stop at bounds?
   * @param timeDelta Distance in seconds to trip
   * @returns A set of `[routeTime, routeDistance]` for each route
   */
  async calcAllRoutesInfo(
    nPaths: number = 3,
    realTime: boolean = true,
    stopAtBounds: boolean = false,
    timeDelta: number = 0,
  ) {
    const routes = await this.getRoute(nPaths, timeDelta);
    const results: {[key: string]: [number, number]} = {};
    routes.forEach(route => {
      results[route['routeName']] = this.addUpRoute(route['results'], realTime, stopAtBounds);
    });

    const routeTime = Object.keys(results).map(key => results[key][0]);
    const routeDistance = Object.keys(results).map(key => results[key][1]);

    this.debugLog(`Time ${Math.min(...routeTime)} - ${Math.max(...routeTime)} minutes\n`);
    this.debugLog(`Distance ${Math.min(...routeDistance)} - ${Math.max(...routeDistance)} km\n`);

    return results;
  }

  /**
   * Helps turn any object into a serialized querystring
   * @param params An object to turn into a querystring
   * @returns A serialized querystring
   */
  private serializeParameters(params: Record<string, string | number | boolean>): string {
    const bits: string[] = [];
    Object.keys(params).forEach(key => {
      bits.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
    });
    return bits.join('&');
  }

  /**
   * Logs output only when DEBUG=true in the environment
   * @param value {string} The string to log
   */
  private debugLog(value: string) {
    if (env.DEBUG === 'true') {
      stdout.write(value);
    }
  }

  private wazeRequest(path: string, params: Record<string, string | number | boolean>) {
    return new Promise((resolve, reject) => {
      const reqOptions: RequestOptions = {
        headers: this.baseHeaders,
        host: this.wazeURL,
        path: `/${path}?${this.serializeParameters(params)}`,
      };

      const req = getRequest(reqOptions, (res) => {
        res.setEncoding('utf8');
        let responseBody: string = '';
        res.on('data', (chunk) => responseBody += chunk);
        res.on('end', () => {
          resolve(JSON.parse(responseBody));
        });
      });

      req.on('error', (err) => reject(err));
      req.end();
    });
  }
}

export default WazeRouteCalculator;
