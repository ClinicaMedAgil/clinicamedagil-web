import { DatePicker } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import type { GetProps } from 'antd'
import customParseFormat from 'dayjs/plugin/customParseFormat'

type RangePickerProps = GetProps<typeof DatePicker.RangePicker>

dayjs.extend(customParseFormat)

const disabledDate: RangePickerProps['disabledDate'] = (current) => {
  // Can not select days before today and today
  return current && current < dayjs().endOf('day')
}

const disabledDate2 = (date: Dayjs, info: GetProps<typeof DatePicker>) => {
  if (info.type === 'date') {
    return date.month() === 3 || date.day() === 6 || date.date() === 30
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
