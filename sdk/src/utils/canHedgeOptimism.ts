import { BigNumber } from 'ethers'

import { PoolHedgerParams } from '../admin'
import { SNXPerpsV2PoolHedger } from '../contracts/newport/typechain/NewportSNXPerpsV2PoolHedger'
import { PoolHedgerView } from '../market'
import { Option } from '../option'
import getCappedExpectedHedge from './getCappedExpectedHedge'

const hasEnoughMarketDepth = (
  hedge: BigNumber,
  maxTotalMarketSize: BigNumber,
  marketDepthBuffer: BigNumber,
  shortInterest: BigNumber,
  longInterest: BigNumber
) => {
  const interest = hedge.lt(0) ? shortInterest : longInterest
  const marketUsage = interest.add(hedge.abs().mul(marketDepthBuffer))
  return marketUsage.lt(maxTotalMarketSize)
}

export default function canHedgeOnOptimism(
  spotPrice: BigNumber,
  netDelta: BigNumber,
  option: Option,
  size: BigNumber,
  increasesPoolDelta: boolean,
  hedgerView: PoolHedgerView,
  poolHedgerParams: PoolHedgerParams
) {
  const snxHedgerView = hedgerView as SNXPerpsV2PoolHedger.HedgerStateStructOutput
  if (!snxHedgerView) {
    throw new Error('Invalid PoolHedgerView for canHedgeOnOptimism')
  }

  if (snxHedgerView.marketSuspended) {
    return false
  }

  const cappedExpectedHedge = getCappedExpectedHedge(option, size, netDelta, poolHedgerParams, increasesPoolDelta)
  const cappedExpectedHedgeAbs = cappedExpectedHedge.abs()
  const currentHedge = snxHedgerView.hedgedDelta

  if (cappedExpectedHedgeAbs.lte(currentHedge) && cappedExpectedHedge.mul(currentHedge).gte(0)) {
    // Delta is shrinking (potentially flipping, but still smaller than current hedge), so we skip the check
    return true
  }

  if (increasesPoolDelta && cappedExpectedHedge.gte(0)) {
    // expected hedge is positive, and trade increases delta of the pool - risk is reduced, so accept trade
    return true
  }

  if (!increasesPoolDelta && cappedExpectedHedge.lte(0)) {
    // expected hedge is negative, and trade decreases delta of the pool - risk is reduced, so accept trade
    return true
  }
  // check that the curve swap rates are acceptable
  if (!snxHedgerView.curveRateStable) {
    return false
  }

  if (cappedExpectedHedgeAbs.gt(currentHedge.abs())) {
    // check funding rate is within bounds and so is liquidity
    const fundingRate = snxHedgerView.fundingRate
    const maxFundingRate = snxHedgerView.futuresPoolHedgerParams.maximumFundingRate
    if (fundingRate.abs().gt(maxFundingRate)) {
      return false
    }
  }

  // TODO
  // const shortInterest = snxHedgerView.poolHedgerParams.shortInterest
  // const longInterest = snxHedgerView.poolHedgerParams.longInterest
  // const maxTotalMarketSize = snxHedgerView.poolHedgerParams.maxTotalMarketSize
  const shortInterest = BigNumber.from(0)
  const longInterest = BigNumber.from(0)
  const maxTotalMarketSize = BigNumber.from(0)
  const marketDepthBuffer = snxHedgerView.futuresPoolHedgerParams.marketDepthBuffer

  // Check remaining market liquidity
  if (cappedExpectedHedge.mul(currentHedge).gt(0)) {
    // same sign - so just check the difference
    const hedgeDifference = cappedExpectedHedge.sub(currentHedge)
    if (!hasEnoughMarketDepth(hedgeDifference, maxTotalMarketSize, marketDepthBuffer, shortInterest, longInterest)) {
      return false
    }
  } else {
    if (
      !hasEnoughMarketDepth(cappedExpectedHedge, maxTotalMarketSize, marketDepthBuffer, shortInterest, longInterest)
    ) {
      return false
    }
  }

  return true
}
