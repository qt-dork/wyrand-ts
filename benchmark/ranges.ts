import { MAX32 } from "../src/constants";

// Benchmarking experitment for range based methods

export const modulo = (random, min, max) => min + (random.integer() % (max - min));

export const divisionWithRejection = (random, min, max) => {
  const range = max - min;
  const divisor = (MAX32 / range) + 1;

  if (divisor === 0) {
    return 0;
  }

  for (;;) {
    const val = random.integer() / divisor;
    if (val < range) {
      return min + val;
    }
  }
};

export const debiasedModuloOnce = (random, min, max) => {
  const range = max - min;
  const t = MAX32 % range;
  let r = random.integer();
  while (r < t) {
    r = random.integer();
  }

  return min + (r % range);
}

export const debiasedModuloTwice = (random, min, max) => {
  const range = max - min;
  const t = MAX32 % range;
  let r;

  for (;;) {
    r = random.integer();
    if (r >= t) {
      return min + (r % range);
    }
  }
};

// export const debiasedIntegerMultiplication = (random, min, max) => {
//   const range = BigInt(max - min);
//   const t = BigInt(MAX32) % range;
//   let x = random.bigInt();
//   let m = x * t;
//   let l = random.cast(m, 32);

//   while (l < t) {
//     x = random.bigInt();
//     m = x * t;
//     l = random.cast(m, 32);
//   }

//   return Number(BigInt(min) + (m >> 32n));
// };

export const rangeTest = (data, random, lower, upper, numGen) => {
  const results = [];

  for (let i = 0; i < data.length; i++) {
    const start = performance.now();

    for (let j = 0; j < numGen; j++) {
      data[i].gen(random, lower, upper);
    }

    const end = performance.now();
    const duration = end - start;

    results.push({ ...data[i], duration });
  }

  return results;
};
