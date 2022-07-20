import { MAX32 } from "../src/constants.js";

export class MathRandomGen {
  fastNext32() {
    return Math.floor(Math.random() * MAX32);
  }
}

export const generatorTest = (data, numGen) => {
  const results = [];

  for (let i = 0; i < data.length; i++) {
    const start = performance.now();
    
    for (let j = 0; j < numGen; j++) {
      data[i].gen.fastNext32();
    }
    
    const end = performance.now();
    const duration = end - start;

    results.push({ ...data[i], duration });
  }
  return results;
}