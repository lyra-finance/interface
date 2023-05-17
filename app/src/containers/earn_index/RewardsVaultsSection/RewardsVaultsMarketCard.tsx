import IconButton from '@lyra/ui/components/Button/IconButton'
import Card from '@lyra/ui/components/Card'
import CardBody from '@lyra/ui/components/Card/CardBody'
import Flex from '@lyra/ui/components/Flex'
import Grid from '@lyra/ui/components/Grid'
import { IconType } from '@lyra/ui/components/Icon'
import Text from '@lyra/ui/components/Text'
import useIsMobile from '@lyra/ui/hooks/useIsMobile'
import formatTruncatedUSD from '@lyra/ui/utils/formatTruncatedUSD'
import formatUSD from '@lyra/ui/utils/formatUSD'
import React from 'react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import MarketImage from '@/app/components/common/MarketImage'
import RewardTokenAmounts from '@/app/components/rewards/RewardTokenAmounts'
import { EARN_VAULTS_CARD_GRID_COLUMN_TEMPLATE } from '@/app/constants/layout'
import { PageId } from '@/app/constants/pages'
import { Vault } from '@/app/constants/vault'
import formatAPY from '@/app/utils/formatAPY'
import formatAPYRange from '@/app/utils/formatAPYRange'
import formatTokenName from '@/app/utils/formatTokenName'
import getNetworkDisplayName from '@/app/utils/getNetworkDisplayName'
import getPagePath from '@/app/utils/getPagePath'
import sumRewardTokenAmounts from '@/app/utils/sumRewardTokenAmounts'

type Props = {
  vault: Vault
}

const RewardsVaultsMarketCard = ({ vault }: Props) => {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const accountRewardEpoch = vault.accountRewardEpoch
  const globalRewardEpoch = vault.globalRewardEpoch
  const market = vault.market
  const firstRewardToken = vault.globalRewardEpoch?.tradingRewardTokens[0]

  const vaultRewards = useMemo(() => {
    if (!globalRewardEpoch || !firstRewardToken) {
      return null
    }

    const pendingVaultRewards = accountRewardEpoch?.vaultRewards(market.address) ?? []
    const claimableVaultRewards = accountRewardEpoch?.totalClaimableVaultRewards(market.address) ?? []
    const vaultRewards = sumRewardTokenAmounts([...pendingVaultRewards, ...claimableVaultRewards])

    return (vaultRewards.length ? vaultRewards : globalRewardEpoch.vaultRewardTokens.map(t => ({ ...t, amount: 0 })))[0]
  }, [accountRewardEpoch, firstRewardToken, globalRewardEpoch, market.address])

  const liquidityTokenBalanceValue = vault.liquidityTokenBalanceValue

  if (!firstRewardToken || !vaultRewards) {
    return null
  }

  return (
    <Card
      href={getPagePath({
        page: PageId.EarnVaults,
        network: market.lyra.network,
        marketAddressOrName: market.name,
      })}
    >
      <CardBody>
        <Grid
          width="100%"
          sx={{
            gridTemplateColumns: EARN_VAULTS_CARD_GRID_COLUMN_TEMPLATE,
            gridColumnGap: 4,
            gridRowGap: 6,
            alignItems: 'center',
          }}
        >
          <Flex alignItems="center">
            <MarketImage market={market} />
            <Text ml={2}>
              {formatTokenName(market.baseToken)} Vault · {getNetworkDisplayName(market.lyra.network)}
            </Text>
          </Flex>
          {!isMobile ? (
            <>
              <Flex>
                <Text mr={2} color="secondaryText" variant="body">
                  TVL
                </Text>
                <Text variant="body">{formatTruncatedUSD(vault.tvl)}</Text>
              </Flex>
              <Flex>
                <Text mr={2} color="secondaryText">
                  Balance
                </Text>
                <Text>{formatUSD(liquidityTokenBalanceValue, { minDps: 0 })}</Text>
              </Flex>
              <Flex>
                <Text mr={2} color="secondaryText">
                  APY
                </Text>
                {!liquidityTokenBalanceValue ? (
                  <Text>{formatAPYRange(vault.minApy, vault.maxApy, { showSymbol: false })}</Text>
                ) : (
                  <Text>{formatAPY(vault.apy, { showSymbol: false })}</Text>
                )}
              </Flex>
              <Flex>
                <Text mr={2} color="secondaryText">
                  Rewards
                </Text>
                <RewardTokenAmounts
                  color={vaultRewards.amount > 0.001 ? 'primaryText' : 'text'}
                  tokenAmounts={[vaultRewards]}
                  hideTokenImages={true}
                />
              </Flex>
            </>
          ) : null}
          <Flex justifySelf="end">
            <IconButton
              icon={IconType.ArrowRight}
              href={getPagePath({
                page: PageId.EarnVaults,
                network: market.lyra.network,
                marketAddressOrName: market.name,
              })}
            />
          </Flex>
        </Grid>
      </CardBody>
    </Card>
  )
}

export default RewardsVaultsMarketCard