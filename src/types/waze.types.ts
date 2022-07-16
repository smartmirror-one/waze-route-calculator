import { Bounds } from './index';

/**
 * COORDS CALL
 */

export interface WazeCoordsResponseObject {
  bounds:       null | Bounds;
  businessName: null | string;
  city:         string;
  countryName:  CountryName;
  location:     Location;
  name:         string;
  number:       null | string;
  provider:     Provider;
  segmentId:    number;
  state:        null;
  stateName:    StateName;
  street:       null | string;
  streetId:     number;
}

export type WazeCoordsResponse = WazeCoordsResponseObject[];

export interface Location {
  lat: number;
  lon: number;
}

export enum CountryName {
  Netherlands = 'Netherlands',
}

export enum Provider {
  Waze = 'waze',
}

export enum StateName {
  NoState = 'No State',
}

/**
 * ROUTES CALL
 */

export interface WazeRouteResponse {
  alternatives?: { response: WazeRouteResponseObject }[];
  coords:    Coord[];
  error?: string;
  response:  WazeRouteResponseObject;
  segCoords: null;
}

export interface Coord {
  x: number;
  y: number;
  z: CoordsZ;
}

export enum CoordsZ {
  NaN = 'NaN',
}

export enum AvoidStatus {
  Open = 'OPEN',
}

export enum Lane {
  WholeSegment = 'WHOLE_SEGMENT',
}

export interface WazeRouteResponseObject {
  results:                 WazeRouteResult[];
  streetNames:             Array<null | string>;
  tileIds:                 unknown[];
  tileUpdateTimes:         unknown[];
  geom:                    null;
  fromFraction:            number;
  toFraction:              number;
  sameFromSegment:         boolean;
  sameToSegment:           boolean;
  astarPoints:             null;
  wayPointIndexes:         null;
  wayPointFractions:       null;
  tollMeters:              number;
  preferedRouteId:         number;
  isInvalid:               boolean;
  isBlocked:               boolean;
  serverUniqueId:          string;
  displayRoute:            boolean;
  astarVisited:            number;
  astarResult:             string;
  astarData:               null;
  isRestricted:            boolean;
  avoidStatus:             AvoidStatus;
  dueToOverride:           null;
  passesThroughDangerArea: boolean;
  distanceFromSource:      number;
  distanceFromTarget:      number;
  minPassengers:           number;
  hovIndex:                number;
  timeZone:                null;
  routeType:               string[];
  routeAttr:               unknown[];
  astarCost:               number;
  reorderChoice:           null;
  totalRouteTime:          number;
  laneTypes:               unknown[];
  preferredStoppingPoints: null;
  areas:                   unknown[];
  requiredPermits:         unknown[];
  etaHistograms:           unknown[];
  entryPoint:              null;
  shortRouteName:          null;
  tollPrice:               number;
  costs:                   null;
  penalties:               null;
  segGeoms:                null;
  routeName:               string;
  routeNameStreetIds:      null;
  open:                    boolean;
}

export interface WazeRouteResult {
  path:                     Path;
  street:                   number;
  altStreets:               null;
  distance:                 number;
  length:                   number;
  crossTime:                number;
  crossTimeWithoutRealTime: number;
  tiles:                    null;
  clientIds:                null;
  knownDirection:           boolean;
  penalty:                  number;
  roadType:                 number;
  isToll:                   boolean;
  naiveRoute:               null;
  detourSavings:            number;
  detourSavingsNoRT:        number;
  useHovLane:               boolean;
  attributes:               number;
  lane:                     Lane;
  laneType:                 null;
  areas:                    unknown[];
  requiredPermits:          unknown[];
  detourRoute:              null;
  naiveRouteFullResult:     null;
  detourRouteFullResult:    null;
  mergeOffset:              number;
  avoidStatus:              AvoidStatus | null;
  clientLaneSet:            ClientLaneSet | null;
  additionalInstruction:    null;
  instruction:              Instruction | null;
}

export interface ClientLaneSet {
  client_lane: ClientLane[];
  enable_voice_for_instruction?: boolean;
}

export interface ClientLane {
  lane_index: number;
  angle_object: AngleObject[];
}

export interface AngleObject {
  angle: number;
  selected: boolean;
}

export interface Instruction {
  opcode:          string;
  arg:             number;
  instructionText: null;
  laneGuidance:    LaneGuidance | null;
  name:            null;
  tts:             null;
}

export interface LaneGuidance {
  lanes_range:     LanesRange;
  angle:           number;
  angle_override?: number;
}

export interface LanesRange {
  from_lane_index: number;
  to_lane_index:   number;
}

export interface Path {
  segmentId: number;
  nodeId:    number;
  x:         number;
  y:         number;
  direction: boolean;
}
