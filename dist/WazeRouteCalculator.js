"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = require("https");
const process_1 = require("process");
const index_1 = require("./types/index");
class WazeRouteCalculator {
    constructor() {
        this.wazeURL = 'www.waze.com';
        this.baseHeaders = {
            'User-Agent': 'Mozilla/5.0',
            referer: `https://${this.wazeURL}/`,
        };
        this.vehicleTypes = ['TAXI', 'MOTORCYCLE'];
        this.routeOptions = ['AVOID_TRAILS'];
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
    init(props) {
        return __awaiter(this, void 0, void 0, function* () {
            this.startAddress = props.startAddress;
            this.endAddress = props.endAddress;
            this.debugLog(`From: ${this.startAddress} - to: ${this.endAddress}\n`);
            this.region = props.region || index_1.Regions.EU;
            this.avoidSubscriptions = !!props.avoidSubscriptionRoads;
            if (props.vehicleType)
                this.vehicleTypes.push(props.vehicleType.toUpperCase());
            if (props.avoidTollRoads)
                this.routeOptions.push('AVOID_TOLL_ROADS');
            if (props.avoidFerries)
                this.routeOptions.push('AVOID_FERRIES');
            if (this.alreadyCoords(this.startAddress)) {
                this.startCoords = this.coordsStringParser(this.startAddress);
            }
            else {
                this.startCoords = yield this.addressToCoords(this.startAddress);
            }
            this.debugLog(`Start coords: (${this.startCoords.lat}, ${this.startCoords.lon})\n`);
            if (this.alreadyCoords(this.endAddress)) {
                this.endCoords = this.coordsStringParser(this.endAddress);
            }
            else {
                this.endCoords = yield this.addressToCoords(this.endAddress);
            }
            this.debugLog(`End coords: (${this.endCoords.lat}, ${this.endCoords.lon})\n`);
        });
    }
    alreadyCoords(address) {
        return this.coordinatesMatch.test(address);
    }
    coordsStringParser(coords) {
        const [lat, lon] = coords.split(',');
        return {
            lat: Number(lat.trim()),
            lon: Number(lon.trim()),
        };
    }
    addressToCoords(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const baseCoords = this.baseCoords[this.region];
            const getCord = this.coordsServers[this.region];
            const reqConfig = {
                lang: 'eng',
                lat: baseCoords.lat,
                lon: baseCoords.lon,
                origin: 'livemap',
                q: address,
            };
            const data = yield this.wazeRequest(getCord, reqConfig);
            const result = data.find(item => item.city);
            if (result) {
                const bounds = result.bounds ? {
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
        });
    }
    getRoute(nPaths = 1, timeDelta = 0) {
        return __awaiter(this, void 0, void 0, function* () {
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
            if (this.vehicleTypes)
                requestConfig['vehicleTypes'] = this.vehicleTypes;
            if (this.avoidSubscriptions)
                requestConfig['subscription'] = '*';
            const data = yield this.wazeRequest(routingServer, requestConfig);
            if (data) {
                if (data.error) {
                    throw new Error(data.error);
                }
                if (data.alternatives) {
                    return data.alternatives.map(alt => alt.response);
                }
                if (nPaths > 1) {
                    return [data.response];
                }
                return [data.response];
            }
            throw new Error('Empty response');
        });
    }
    addUpRoute(results, realTime = true, stopAtBounds = false) {
        const startBounds = this.startCoords.bounds;
        const endBounds = this.endCoords.bounds;
        const between = (target, min, max) => {
            return target > min && target < max;
        };
        let time = 0;
        let distance = 0;
        results.forEach(segment => {
            if (stopAtBounds && segment.path) {
                const x = segment.path.x;
                const y = segment.path.y;
                const betweenX = between(x, (startBounds.left || 0), startBounds.right || 0)
                    || between(x, endBounds.left || 0, endBounds.right || 0);
                const betweenY = between(y, startBounds.bottom || 0, startBounds.top || 0)
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
        return [routeTime, routeDistance];
    }
    calcRouteInfo(realTime = true, stopAtBounds = false, timeDelta = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            const route = yield this.getRoute(1, timeDelta);
            const result = route[0].results;
            const [routeTime, routeDistance] = this.addUpRoute(result, realTime, stopAtBounds);
            this.debugLog(`Time ${routeTime} minutes, distance ${routeDistance} km\n`);
            return [routeTime, routeDistance];
        });
    }
    calcAllRoutesInfo(nPaths = 3, realTime = true, stopAtBounds = false, timeDelta = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            const routes = yield this.getRoute(nPaths, timeDelta);
            const results = {};
            routes.forEach(route => {
                results[route['routeName']] = this.addUpRoute(route['results'], realTime, stopAtBounds);
            });
            const routeTime = Object.keys(results).map(key => results[key][0]);
            const routeDistance = Object.keys(results).map(key => results[key][1]);
            this.debugLog(`Time ${Math.min(...routeTime)} - ${Math.max(...routeTime)} minutes\n`);
            this.debugLog(`Distance ${Math.min(...routeDistance)} - ${Math.max(...routeDistance)} km\n`);
            return results;
        });
    }
    serializeParameters(params) {
        const bits = [];
        Object.keys(params).forEach(key => {
            bits.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
        });
        return bits.join('&');
    }
    debugLog(value) {
        if (process_1.env.DEBUG === 'true') {
            process_1.stdout.write(value);
        }
    }
    wazeRequest(path, params) {
        return new Promise((resolve, reject) => {
            const reqOptions = {
                headers: this.baseHeaders,
                host: this.wazeURL,
                path: `/${path}?${this.serializeParameters(params)}`,
            };
            const req = (0, https_1.get)(reqOptions, (res) => {
                res.setEncoding('utf8');
                let responseBody = '';
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
exports.default = WazeRouteCalculator;
