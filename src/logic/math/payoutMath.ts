export function findRequiredGrossForTargetNet(
  targetNet: number,
  maxPossibleGross: number,
  calcNetFn: (gross: number) => number,
): number {
  // if maximum gross cannot reach target net, return max gross
  if (calcNetFn(maxPossibleGross) <= targetNet) {
    return maxPossibleGross;
  }

  let low = targetNet;
  let high = maxPossibleGross;
  let iterations = 0;

  // binary search convergence for gross-up
  while (iterations < 40) {
    const mid = (low + high) / 2;
    const currentNet = calcNetFn(mid);

    if (Math.abs(currentNet - targetNet) < 0.005) {
      return mid;
    }

    if (currentNet < targetNet) {
      low = mid;
    } else {
      high = mid;
    }
    iterations++;
  }

  return (low + high) / 2;
}
