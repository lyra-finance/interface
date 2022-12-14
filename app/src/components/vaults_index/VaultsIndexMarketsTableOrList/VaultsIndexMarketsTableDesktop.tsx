import Box from '@lyra/ui/components/Box'
import Button from '@lyra/ui/components/Button'
import Flex from '@lyra/ui/components/Flex'
import { IconType } from '@lyra/ui/components/Icon'
import Table, { TableCellProps, TableColumn, TableData, TableElement } from '@lyra/ui/components/Table'
import Text from '@lyra/ui/components/Text'
import formatPercentage from '@lyra/ui/utils/formatPercentage'
import formatTruncatedUSD from '@lyra/ui/utils/formatTruncatedUSD'
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import MarketImage from '@/app/components/common/MarketImage'
import { VaultsIndexMarketsTableOrListProps } from '@/app/components/vaults_index/VaultsIndexMarketsTableOrList'
import { PageId } from '@/app/constants/pages'
import fromBigNumber from '@/app/utils/fromBigNumber'
import getPagePath from '@/app/utils/getPagePath'

import MMVPerfTooltip from '../../common/MMVPerfTooltip'
import TokenAPYRangeText from '../../common/TokenAPYRangeText'
import VaultAPYTooltip from '../../common/VaultAPYTooltip'

type VaultsIndexMarketsTableData = TableData<{
  market: string
  marketQuoteSymbol: string
  marketBaseSymbol: string
  tvl: number
  tvlChange: number
  apy: number
  maxApy: number
  lyraApy: number
  opApy: number
  tokenPrice90DChange: number
  tokenPrice90DChangeAnnualized: number
  onClick?: () => void
}>

const VaultsIndexMarketsTableDesktop = ({
  vaults,
  ...styleProps
}: VaultsIndexMarketsTableOrListProps): TableElement<VaultsIndexMarketsTableData> => {
  const navigate = useNavigate()
  const rows: VaultsIndexMarketsTableData[] = useMemo(() => {
    return vaults.map(vault => {
      const market = vault.market
      return {
        market: market.name,
        marketQuoteSymbol: market.quoteToken.symbol,
        marketBaseSymbol: market.baseToken.symbol,
        tvl: vault.tvl,
        tvlChange: vault.tvlChange,
        volume: vault.tradingVolume90D,
        openInterest: fromBigNumber(market.openInterest),
        openInterestDollars: fromBigNumber(market.openInterest) * fromBigNumber(market.spotPrice),
        tokenPrice90DChange: vault.tokenPrice90DChange,
        tokenPrice90DChangeAnnualized: vault.tokenPrice90DChangeAnnualized,
        apy: vault.minApy,
        lyraApy: vault.minLyraApy,
        opApy: vault.minOpApy,
        maxApy: vault.maxApy,
        onClick: () => navigate(getPagePath({ page: PageId.Vaults, marketAddressOrName: market.name })),
      }
    })
  }, [navigate, vaults])
  const columns = useMemo<TableColumn<VaultsIndexMarketsTableData>[]>(
    () => [
      {
        accessor: 'market',
        Header: 'Market',
        Cell: (props: TableCellProps<VaultsIndexMarketsTableData>) => {
          return (
            <Flex alignItems="center">
              <MarketImage size={32} name={props.cell.value} />
              <Box ml={2}>
                <Text variant="secondaryMedium">{props.row.original.marketBaseSymbol}</Text>
              </Box>
            </Flex>
          )
        },
      },
      {
        accessor: 'tvl',
        Header: 'TVL',
        Cell: (props: TableCellProps<VaultsIndexMarketsTableData>) => {
          return props.cell.value > 0 ? (
            <Text variant="secondary">{formatTruncatedUSD(props.cell.value)}</Text>
          ) : (
            <Text variant="secondary" color="secondaryText">
              -
            </Text>
          )
        },
      },
      {
        accessor: 'apy',
        Header: 'Rewards APY',
        Cell: ({ cell, row }: TableCellProps<VaultsIndexMarketsTableData>) => {
          if (row.original.market.toLowerCase() === 'sol') {
            return (
              <Text variant="secondary" color="secondaryText">
                {' '}
                -{' '}
              </Text>
            )
          }
          return cell.value > 0 ? (
            <VaultAPYTooltip
              alignItems="center"
              marketName={cell.row.original.market}
              opApy={cell.row.original.opApy}
              lyraApy={cell.row.original.lyraApy}
            >
              <TokenAPYRangeText
                tokenNameOrAddress={['stkLyra', 'OP']}
                variant="secondary"
                color="primaryText"
                leftValue={formatPercentage(cell.row.original.apy, true)}
                rightValue={formatPercentage(cell.row.original.maxApy, true)}
              />
            </VaultAPYTooltip>
          ) : (
            <Text variant="secondary" color="secondaryText">
              -
            </Text>
          )
        },
      },
      {
        accessor: 'tokenPrice90DChangeAnnualized',
        Header: '90D Perf. (Annualized)',
        Cell: ({ cell }: TableCellProps<VaultsIndexMarketsTableData>) => {
          return cell.value ? (
            <MMVPerfTooltip
              alignItems="center"
              marketName={cell.row.original.market}
              tokenPrice90DChange={cell.row.original.tokenPrice90DChange}
              tokenPrice90DChangeAnnualized={cell.value}
            >
              <Text variant="secondary" color={cell.value >= 0 ? 'primaryText' : 'errorText'}>
                {formatPercentage(cell.value, cell.value === 0)}
              </Text>
            </MMVPerfTooltip>
          ) : (
            <Text variant="secondary" color="secondaryText">
              -
            </Text>
          )
        },
      },
      {
        accessor: 'id',
        Header: '',
        width: 100,
        Cell: (props: TableCellProps<VaultsIndexMarketsTableData>) => {
          const market = props.row.original.marketBaseSymbol
          return (
            <Flex justifyContent={'flex-end'} width="100%">
              <Button
                variant="primary"
                label={market.toLowerCase() === 'ssol' ? 'Vault' : 'Deposit'}
                rightIcon={IconType.ArrowRight}
                href={getPagePath({ page: PageId.Vaults, marketAddressOrName: market })}
                minWidth={100}
              />
            </Flex>
          )
        },
      },
    ],
    []
  )
  return <Table width="100%" data={rows} columns={columns} {...styleProps} />
}

export default VaultsIndexMarketsTableDesktop
