import CalendarToday from '@mui/icons-material/CalendarToday';
import CalendarViewMonth from '@mui/icons-material/CalendarViewMonth';
import DateRange from '@mui/icons-material/DateRange';
import Repeat from '@mui/icons-material/Repeat';

import { RepeatType } from '../types';

interface RepeatIconProps {
  repeatType: RepeatType;
}

export function RepeatIcon({ repeatType }: RepeatIconProps) {
  if (repeatType === 'none') {
    return null;
  }

  const getIcon = (type: RepeatType) => {
    switch (type) {
      case 'daily':
        return <Repeat data-testid="repeat-icon" data-repeat-type="daily" />;
      case 'weekly':
        return <DateRange data-testid="repeat-icon" data-repeat-type="weekly" />;
      case 'monthly':
        return <CalendarViewMonth data-testid="repeat-icon" data-repeat-type="monthly" />;
      case 'yearly':
        return <CalendarToday data-testid="repeat-icon" data-repeat-type="yearly" />;
      default:
        return null;
    }
  };

  return getIcon(repeatType);
}
