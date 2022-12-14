import { ScreenTransactionData, TransactionType } from '@/app/constants/screen'
import isOptimismMainnet from '@/app/utils/isOptimismMainnet'
import isScreeningEnabled from '@/app/utils/isScreeningEnabled'

import useFetch from '../data/useFetch'
import useIsReady from './useIsReady'
import useWallet from './useWallet'

const fetcher = async (address: string, transactionType: TransactionType): Promise<ScreenTransactionData | null> => {
  const res = await fetch(
    `${process.env.REACT_APP_API_URL}/screen/transaction?address=${address}&transactionType=${transactionType}`,
    {
      method: 'GET',
      mode: 'cors',
    }
  )
  const data: ScreenTransactionData = await res.json()
  if (res.status !== 200) {
    return null
  }
  return data
}

const DEFAULT_RESPONSE: ScreenTransactionData = {
  isBlocked: false,
  blockReason: null,
  blockDescription: null,
}

export default function useScreenTransaction(transactionType: TransactionType): ScreenTransactionData | null {
  const { connectedAccount: account } = useWallet()
  const isReady = useIsReady()
  const isScreenable = isReady && isScreeningEnabled()
  const [data] = useFetch('ScreenTransaction', isScreenable && account ? [account, transactionType] : null, fetcher)
  return isScreenable && account && isOptimismMainnet() ? data : DEFAULT_RESPONSE
}
