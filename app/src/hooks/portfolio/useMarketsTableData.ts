import { Market } from '@lyrafinance/lyra-js'

import { synthetixClient } from '@/app/hooks/apollo/client'
import fromBigNumber from '@/app/utils/fromBigNumber'

import lyra from '../../utils/lyra'
import useFetch from '../data/useFetch'
import { CandleQueryVariables, candlesQuery, SynthetixSpotPriceHistoryResult } from '../data/useSpotPriceHistory'

export type MarketTableData = {
  market: Market
  spotPrice: number
  spotPriceChange: number
  tradingVolume30D: number
  openInterest: number
}

const fetcher = async (): Promise<MarketTableData[]> => {
  const toTimestamp = Math.floor(new Date().getTime() / 1000)
  const startTimestamp = toTimestamp - 30 * 24 * 60 * 60
  const markets = (await lyra.markets()).filter(market => market.liveBoards().length > 0)
  const marketBaseTokens = markets.map(market => market.baseToken.symbol)

  // TODO: @dappbeast Replace with SDK spot price feed
  const marketsSpotPriceHistory = await Promise.all(
    marketBaseTokens.map(async synth => {
      const variables: CandleQueryVariables = {
        first: 1,
        orderBy: 'timestamp',
        orderDirection: 'asc',
        where: {
          synth,
          timestamp_gte: toTimestamp - 24 * 60 * 60, // 1 day ago
          timestamp_lt: toTimestamp,
        },
      }
      const { data } = await synthetixClient.query<{ candles: SynthetixSpotPriceHistoryResult[] }>({
        query: candlesQuery,
        variables: variables,
        fetchPolicy: 'cache-first',
      })
      return { synth, candles: data.candles }
    })
  )

  const marketData = await Promise.all(
    markets.map(async market => {
      const spotPriceHistory = marketsSpotPriceHistory.find(
        history => history.synth.toLowerCase() === market.baseToken.symbol.toLowerCase()
      )
      const spotPrice = fromBigNumber(market.spotPrice)
      const spotPrice1dAgo = parseFloat(spotPriceHistory?.candles[0].close ?? '0')
      const spotPriceChange =
        spotPrice1dAgo && !isNaN(spotPrice1dAgo) ? (spotPrice - spotPrice1dAgo) / spotPrice1dAgo : 0
      const tradingVolumeHistory = await market.tradingVolumeHistory({ startTimestamp })
      const totalVolume30dAgo = tradingVolumeHistory.length
        ? fromBigNumber(tradingVolumeHistory[0].totalNotionalVolume)
        : 0
      const totalVolume = tradingVolumeHistory.length
        ? fromBigNumber(tradingVolumeHistory[tradingVolumeHistory.length - 1].totalNotionalVolume)
        : 0
      const tradingVolume30D = totalVolume - totalVolume30dAgo
      const openInterest = market.liveBoards().reduce((sum, liveBoard) => {
        return (
          sum +
          liveBoard.strikes().reduce((sum, strike) => {
            return (
              sum +
              (fromBigNumber(strike.call().longOpenInterest.add(strike.call().shortOpenInterest)) +
                fromBigNumber(strike.put().longOpenInterest.add(strike.put().shortOpenInterest)))
            )
          }, 0)
        )
      }, 0)
      return {
        market,
        spotPrice,
        spotPriceChange,
        tradingVolume30D,
        openInterest,
      }
    })
  )
  return marketData
}

const EMPTY: MarketTableData[] = []

export default function useMarketsTableData(): MarketTableData[] {
  const [marketsTableData] = useFetch('MarketsTableData', [], fetcher)
  return marketsTableData ?? EMPTY
}
