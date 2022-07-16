# Smartmirror.one - WazeRouteCalculator

## What is it?

A NodeJS and Typescript port of the original [Python-based implementation by Balu Kovacs](https://github.com/kovacsbalu/WazeRouteCalculator/). All original development was done in that project, we ported the logic to Node/TS to make it easy to import for the [SmartMirror1](https://smarmirror.one) project.

## How can I use it

1. Create a new instance of the WazeRouteCalculator
   ```ts
   import WazeRouteCalculator from './WazeRouteCalculator';
   const calculator = new WazeRouteCalculator();
   ```
1. Initialize the calculator by providing it with a source and destination. This works just like in the Waze mobile app, but since you have no UI to further specify the suggested start- and endpoints, we suggest using coordinates.
   ```ts
    await calculator.init({
      startAddress: '52.079302, 4.312522',
      endAddress: '51.893719, 5.999410',
   });
   ```
1. Grab the result of the shortest trip to your destination and use it in your project.
   ```ts
   const value = await calculator.calcRouteInfo();
   ```

## Can I use this implementation on something different than a smartmirror?
As stated before, we only ported this project, so it's not our place to say that you can't. We provide this module under the [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).
Just make sure that you honour the principles of fair use when connecting to Waze.

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons Licence" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a>