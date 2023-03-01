import Box from '@lyra/ui/components/Box'
import Flex from '@lyra/ui/components/Flex'
import Grid from '@lyra/ui/components/Grid'
import Text from '@lyra/ui/components/Text'
import { MarginProps } from '@lyra/ui/types'
import formatNumber from '@lyra/ui/utils/formatNumber'
import formatPercentage from '@lyra/ui/utils/formatPercentage'
import { AccountRewardEpoch, Market } from '@lyrafinance/lyra-js'
import React, { useMemo } from 'react'

import MarketImage from '@/app/components/common/MarketImage'
import TokenAmountText from '@/app/components/common/TokenAmountText'
import { findLyraRewardEpochToken, findOpRewardEpochToken } from '@/app/utils/findRewardToken'
import formatTokenName from '@/app/utils/formatTokenName'

type Props = {
  accountRewardEpoch: AccountRewardEpoch
} & MarginProps

type RowProps = {
  accountRewardEpoch: AccountRewardEpoch
  market: Market
}

const VaultRewardsHistoryMarketRow = ({ accountRewardEpoch, market }: RowProps) => {
  const marketAddress = market.address
  const vaultTokens = accountRewardEpoch ? accountRewardEpoch.vaultTokenBalance(marketAddress) : 0
  const opRewards = findOpRewardEpochToken(accountRewardEpoch.vaultRewards(marketAddress))
  const lyraRewards = findLyraRewardEpochToken(accountRewardEpoch.vaultRewards(marketAddress))
  const opApy = findOpRewardEpochToken(accountRewardEpoch.vaultApy(marketAddress))
  const lyraApy = findOpRewardEpochToken(accountRewardEpoch.vaultApy(marketAddress))
  const apyMultiplier = accountRewardEpoch.vaultApyMultiplier(marketAddress)

  return (
    <Grid mb={4} sx={{ gridTemplateColumns: ['1fr 1fr', '1fr 1fr 1fr 1fr 1fr'], gridColumnGap: 4, gridRowGap: 6 }}>
      <Flex flexDirection="column" justifyContent="space-between">
        <Text variant="secondary" color="secondaryText" mb={2}>
          Vault
        </Text>
        <Flex alignItems="flex-end">
          <MarketImage market={market} />
          <Text variant="secondary" ml={2} color="secondaryText">
            {formatTokenName(market.baseToken)}
          </Text>
        </Flex>
      </Flex>
      {lyraApy > 0 ? (
        <Flex flexDirection="column" justifyContent="space-between">
          <Text variant="secondary" color="secondaryText" mb={2}>
            LYRA Rewards
          </Text>
          <TokenAmountText variant="secondary" color="secondaryText" tokenNameOrAddress="lyra" amount={lyraRewards} />
        </Flex>
      ) : null}
      {opApy > 0 ? (
        <Flex flexDirection="column" justifyContent="space-between">
          <Text variant="secondary" color="secondaryText" mb={2}>
            OP Rewards
          </Text>
          <TokenAmountText variant="secondary" color="secondaryText" tokenNameOrAddress="op" amount={opRewards} />
        </Flex>
      ) : null}
      <Flex flexDirection="column" justifyContent="space-between">
        <Text variant="secondary" color="secondaryText" mb={2}>
          Avg. LP Tokens
        </Text>
        <Text variant="secondary">{formatNumber(vaultTokens)}</Text>
      </Flex>
      <Flex flexDirection="column" justifyContent="space-between">
        <Text variant="secondary" color="secondaryText" mb={2}>
          Avg. APY
        </Text>
        <Text variant="secondary" color="primaryText">
          {formatPercentage(opApy + lyraApy, true)} {apyMultiplier > 1 ? `(${formatNumber(apyMultiplier)}x)` : ''}
        </Text>
      </Flex>
    </Grid>
  )
}

const VaultRewardsHistoryGrid = ({ accountRewardEpoch, ...marginProps }: Props) => {
  const markets = accountRewardEpoch.globalEpoch.markets
  const marketsWithRewards = useMemo(() => {
    return markets.filter(market => {
      const vaultRewards = accountRewardEpoch.vaultRewards(market.address)
      const lyraVaultRewards = findLyraRewardEpochToken(vaultRewards)
      const opVaultRewards = findOpRewardEpochToken(vaultRewards)
      return lyraVaultRewards > 0 || opVaultRewards > 0
    })
  }, [accountRewardEpoch, markets])
  if (marketsWithRewards.length === 0) {
    return null
  }
  return (
    <Box {...marginProps}>
      <Text variant="heading2" mb={4}>
        Vault Rewards
      </Text>
      {marketsWithRewards.map(market => (
        <VaultRewardsHistoryMarketRow key={market.name} accountRewardEpoch={accountRewardEpoch} market={market} />
      ))}
    </Box>
  )
}

export default VaultRewardsHistoryGrid
