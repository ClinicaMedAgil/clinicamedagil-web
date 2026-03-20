import { DatePicker } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import type { GetProps } from 'antd'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

const disabledDate2 = (date: Dayjs, info: GetProps<typeof DatePicker>) => {
  if (info.type === 'date') {
    return date.month() === 3 || date.day() === 6 || date.date() === 20
  }

  return false
}

const DatePickerComponent = () => {
  return (
    <DatePicker
      disabledDate={disabledDate2}
      defaultValue={dayjs(new Date().toLocaleDateString('pt-BR'), 'DD/MM/YYYY')}
    />
  )
}

export default DatePickerComponent
