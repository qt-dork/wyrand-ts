// this is all stolen from 
// https://github.com/chrisakroyd/random-seedable/tree/main/benchmark
// since I've tested that on my computer, and have a reliable way to compare the two

import WyRand from "../src/wyrand.js";
import { MAX32 } from "../src/constants.js";
import {
  // debiasedIntegerMultiplication,
  debiasedModuloOnce,
  debiasedModuloTwice,
  divisionWithRejection,
  modulo,
  rangeTest,
} from "./ranges";
import { generatorTest, MathRandomGen } from "./generator.js";

const resultLogger = (testType, results) => {
  console.log(`Benchmark results for ${testType}`);
  results.sort((a, b) => a.duration - b.duration);
  results.forEach((result) => {
    console.log(`${result.name}: ${result.duration}ms`);
  });
  console.log('\n');
}

// export const rangeBenchmark = (numGen = 1000) => { 
//   const random = new WyRand(123456789, 0);
//   const data = [
//     { name: 'Modulo', gen: modulo },
//     { name: 'Debiased modulo (once)', gen: debiasedModuloOnce },
//     { name: 'Debiased modulo (twice)', gen: debiasedModuloTwice },
//     // { name: 'Debiased integer multiplication', gen: debiasedIntegerMultiplication },
//     { name: 'Division with rejection', gen: divisionWithRejection },
//   ];

//   // Wide-range test
//   const wideRange = rangeTest(data, random, 0, MAX32, numGen);
//   // Low-range test
//   const lowRange = rangeTest(data, random, 12, 42, numGen);

//   resultLogger('Wide range generation', wideRange);
//   resultLogger('Low range generation', lowRange);
// };

export const generatorBenchmark = (numGen = 10000) => {
  const data = [
    { name: 'WyRand', gen: new WyRand(0x4d595df4d0f33173n) },
    { name: 'Math.Random()', gen: new MathRandomGen() },
  ];

  const generatorResults = generatorTest(data, numGen);
  resultLogger('Generator performance benchmark', generatorResults);
};

generatorBenchmark();
// rangeBenchmark();
