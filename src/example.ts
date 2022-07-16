import WazeRouteCalculator from './WazeRouteCalculator';
const calculator = new WazeRouteCalculator();

const getRoutes = async () => {
  await calculator.init({
    startAddress: '52.079302, 4.312522',
    endAddress: '51.893719, 5.999410',
  });
  const value = await calculator.calcRouteInfo();
  console.log(value);
};

getRoutes();
