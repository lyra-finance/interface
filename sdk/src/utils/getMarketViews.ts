import { MarketViewWithBoardsStructOutput } from '../constants/views'
import Lyra from '../lyra'
import filterNulls from './filterNulls'
import getMarketView from './getMarketView'

export default async function getMarketViews(
  lyra: Lyra,
  marketAddresses: string[]
): Promise<MarketViewWithBoardsStructOutput[]> {
  const views = filterNulls(await Promise.all(marketAddresses.map(marketAddress => getMarketView(lyra, marketAddress))))
  if (!views) {
    throw new Error('Market does not exist')
  }
  return views
}
