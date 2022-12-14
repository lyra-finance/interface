import { GlobalRewardEpoch, GlobalRewardEpochAPY, Market } from '@lyrafinance/lyra-js'

import { ZERO_BN } from '@/app/constants/bn'
import { DAYS_IN_YEAR, SECONDS_IN_THREE_MONTHS, SECONDS_IN_WEEK } from '@/app/constants/time'
import fromBigNumber from '@/app/utils/fromBigNumber'
import lyra from '@/app/utils/lyra'

import useFetch from '../data/useFetch'

export type Vault = {
  market: Market
  globalRewardEpoch: GlobalRewardEpoch | null
  tvl: number
  tvlChange: number
  tradingVolume90D: number
  tokenPrice: number
  tokenPrice90DChange: number
  tokenPrice90DChangeAnnualized: number
  fees: number
  openInterest: number
  netDelta: number
  netStdVega: number
  minApy: number
  minLyraApy: number
  minOpApy: number
  maxApy: number
  maxLyraApy: number
  maxOpApy: number
  pendingDeposits: number
  utilization: number
}

const EMPTY_VAULT_APY: GlobalRewardEpochAPY = {
  total: 0,
  op: 0,
  lyra: 0,
}

export const fetchVault = async (marketAddressOrName: string): Promise<Vault> => {
  const market = await lyra.market(marketAddressOrName)
  const marketLiquidity = await market.liquidity()
  const startTimestamp = market.block.timestamp - SECONDS_IN_THREE_MONTHS
  const [tradingVolumeHistoryResult, liquidityHistoryResult, netGreeksResult, globalRewardEpochResult] =
    await Promise.allSettled([
      market.tradingVolumeHistory({ startTimestamp }),
      market.liquidityHistory({ startTimestamp }),
      market.netGreeks(),
      lyra.latestGlobalRewardEpoch(),
    ])

  const tradingVolumeHistory = tradingVolumeHistoryResult.status === 'fulfilled' ? tradingVolumeHistoryResult.value : []
  const liquidityHistory = liquidityHistoryResult.status === 'fulfilled' ? liquidityHistoryResult.value : []
  const netGreeks = netGreeksResult.status === 'fulfilled' ? netGreeksResult.value : null
  const globalRewardEpoch = globalRewardEpochResult.status === 'fulfilled' ? globalRewardEpochResult.value : null

  const {
    total: minApy,
    op: minOpApy,
    lyra: minLyraApy,
  } = globalRewardEpoch?.minVaultApy(marketAddressOrName) ?? EMPTY_VAULT_APY
  const {
    total: maxApy,
    op: maxOpApy,
    lyra: maxLyraApy,
  } = globalRewardEpoch?.maxVaultApy(marketAddressOrName) ?? EMPTY_VAULT_APY

  const totalNotionalVolume = tradingVolumeHistory.length
    ? tradingVolumeHistory[tradingVolumeHistory.length - 1].totalNotionalVolume
    : ZERO_BN
  const totalNotionalVolume90DAgo = tradingVolumeHistory.length ? tradingVolumeHistory[0].totalNotionalVolume : ZERO_BN
  const tradingVolume90D = fromBigNumber(totalNotionalVolume.sub(totalNotionalVolume90DAgo))
  const fees = tradingVolumeHistory.reduce(
    (sum, tradingVolume) =>
      sum
        .add(tradingVolume.deltaCutoffFees)
        .add(tradingVolume.lpLiquidationFees)
        .add(tradingVolume.optionPriceFees)
        .add(tradingVolume.spotPriceFees)
        .add(tradingVolume.vegaFees)
        .add(tradingVolume.varianceFees),
    ZERO_BN
  )
  const tvl = fromBigNumber(marketLiquidity.nav)
  const tvl30D = liquidityHistory.length ? fromBigNumber(liquidityHistory[0].nav) : 0
  const tvlChange = tvl30D > 0 ? (tvl - tvl30D) / tvl30D : 0
  const tokenPrice90D = liquidityHistory.length ? fromBigNumber(liquidityHistory[0].tokenPrice) : 0
  const tokenPrice =
    liquidityHistory.length > 1 ? fromBigNumber(liquidityHistory[liquidityHistory.length - 1].tokenPrice) : 0
  const tokenPrice90DChange = tokenPrice90D > 0 ? (tokenPrice - tokenPrice90D) / tokenPrice90D : 0
  const tokenPrice90DChangeAnnualized = (tokenPrice90DChange / 90) * DAYS_IN_YEAR
  const pendingDeposits = liquidityHistory.length
    ? fromBigNumber(liquidityHistory[liquidityHistory.length - 1].pendingDeposits)
    : 0
  const utilization = liquidityHistory.length ? liquidityHistory[liquidityHistory.length - 1].utilization : 0

  const earliestStartTimestamp = tradingVolumeHistory.length ? tradingVolumeHistory[0].startTimestamp : startTimestamp
  const is14dOld = earliestStartTimestamp - startTimestamp < SECONDS_IN_WEEK

  return {
    market,
    globalRewardEpoch,
    tvl,
    tvlChange: is14dOld ? tvlChange : 0,
    tradingVolume90D: is14dOld ? tradingVolume90D : 0,
    tokenPrice,
    tokenPrice90DChange: is14dOld ? tokenPrice90DChange : 0,
    tokenPrice90DChangeAnnualized: is14dOld ? tokenPrice90DChangeAnnualized : 0,
    fees: fromBigNumber(fees),
    openInterest: fromBigNumber(market.openInterest),
    netDelta: fromBigNumber(netGreeks?.netDelta ?? ZERO_BN),
    netStdVega: fromBigNumber(netGreeks?.netStdVega ?? ZERO_BN),
    utilization,
    minApy,
    minLyraApy,
    minOpApy,
    maxApy,
    maxLyraApy,
    maxOpApy,
    pendingDeposits,
  }
}

export default function useVault(marketAddressOrName: string): Vault | null {
  const [poolStats] = useFetch('Vault', marketAddressOrName ? [marketAddressOrName] : null, fetchVault)
  return poolStats
}
