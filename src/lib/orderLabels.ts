import { OrderType } from '@/types'

/** Русские подписи для внутренних (английских) значений типа ордера — общие для формы выставления и списка активных заявок */
export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  market: 'Рыночная',
  limit: 'Лимитная',
  stop: 'Стоп',
}
