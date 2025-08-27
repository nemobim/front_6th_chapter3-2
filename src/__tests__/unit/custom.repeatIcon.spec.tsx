import { render, screen } from '@testing-library/react';

import { RepeatIcon } from '../../icons/RepeatIcon';

describe('반복 일정 아이콘을 표시한다', () => {
  it('반복 유형이 none인 경우 아이콘을 표시하지 않는다', () => {
    render(<RepeatIcon repeatType="none" />);

    const icon = screen.queryByTestId('repeat-icon');
    expect(icon).not.toBeInTheDocument();
  });

  it('매일 반복 일정 아이콘을 표시한다', () => {
    render(<RepeatIcon repeatType="daily" />);

    const icon = screen.getByTestId('repeat-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-repeat-type', 'daily');
  });

  it('매주 반복 일정 아이콘을 표시한다', () => {
    render(<RepeatIcon repeatType="weekly" />);

    const icon = screen.getByTestId('repeat-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-repeat-type', 'weekly');
  });

  it('매월 반복 일정 아이콘을 표시한다', () => {
    render(<RepeatIcon repeatType="monthly" />);

    const icon = screen.getByTestId('repeat-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-repeat-type', 'monthly');
  });

  it('매년 반복 일정 아이콘을 표시한다', () => {
    render(<RepeatIcon repeatType="yearly" />);

    const icon = screen.getByTestId('repeat-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-repeat-type', 'yearly');
  });
});
