import Box from '@lyra/ui/components/Box'
import IconButton from '@lyra/ui/components/Button/IconButton'
import Flex from '@lyra/ui/components/Flex'
import { IconType } from '@lyra/ui/components/Icon'
import List, { ListElement } from '@lyra/ui/components/List'
import ListItem from '@lyra/ui/components/List/ListItem'
import Text from '@lyra/ui/components/Text'
import formatPercentage from '@lyra/ui/utils/formatPercentage'
import formatTruncatedUSD from '@lyra/ui/utils/formatTruncatedUSD'
import React from 'react'
import { useNavigate } from 'react-router-dom'

import { VaultsIndexMarketsTableOrListProps } from '@/app/components/vaults_index/VaultsIndexMarketsTableOrList'
import { PageId } from '@/app/constants/pages'
import getPagePath from '@/app/utils/getPagePath'

import VaultAPYTooltip from '../../common/VaultAPYTooltip'
import VaultLabel from '../../common/VaultLabel'

const VaultsIndexMarketsTableMobile = ({ vaults, ...styleProps }: VaultsIndexMarketsTableOrListProps): ListElement => {
  const navigate = useNavigate()
  return (
    <List {...styleProps}>
      {vaults.map(vault => {
        const market = vault.market
        return (
          <ListItem
            key={market.address}
            label={<VaultLabel marketName={market.baseToken.symbol} />}
            onClick={() => {
              navigate(getPagePath({ page: PageId.Vaults, marketAddressOrName: market.name }))
            }}
            rightContent={
              <Flex alignItems="center">
                <Box>
                  <Text textAlign="right" variant="secondary">
                    {formatTruncatedUSD(vault.tvl)} TVL
                  </Text>
                  <Flex alignSelf="flex-end" alignItems="center">
                    <VaultAPYTooltip marketName={market.name} opApy={vault.minOpApy} lyraApy={vault.minLyraApy}>
                      <Text variant="small" color="primaryText">
                        {formatPercentage(vault.minApy, true)} - {formatPercentage(vault.maxApy, true)} APY
                      </Text>
                    </VaultAPYTooltip>
                  </Flex>
                </Box>
                <IconButton ml={4} icon={IconType.ArrowRight} />
              </Flex>
            }
          />
        )
      })}
    </List>
  )
}

export default VaultsIndexMarketsTableMobile
