import { TextField } from '@mui/material';
import { NumericFormat } from 'react-number-format';

export interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currencyCode?: string;
  label: string;
  error?: boolean;
  helperText?: string;
  name: string;
}

export function getCurrencyFormat(currencyCode: string = 'USD'): {
  symbol: string;
  position: 'prefix' | 'postfix' | 'infix';
  groupSeparator: string;
  decimalSeparator: string;
} {
  return {
    symbol: '$',
    position: 'prefix',
    groupSeparator: ',',
    decimalSeparator: '.',
  };
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currencyCode = 'USD',
  label,
  error,
  helperText,
  name,
}) => {
  const format = getCurrencyFormat(currencyCode);

  if (format.position === 'infix') {
    const [whole, decimal] = value.toString().split('.');
    const displayValue = `${whole}${format.symbol}${format.decimalSeparator}${
      decimal || '00'
    }`;

    return (
      <NumericFormat
        customInput={TextField}
        fullWidth
        margin="normal"
        label={label}
        value={displayValue}
        thousandSeparator={format.groupSeparator}
        decimalSeparator={format.decimalSeparator}
        decimalScale={2}
        fixedDecimalScale
        valueIsNumericString
        onValueChange={(values) => {
          onChange(values.floatValue || 0);
        }}
        error={error}
        helperText={helperText}
        name={name}
      />
    );
  }

  return (
    <NumericFormat
      customInput={TextField}
      fullWidth
      margin="normal"
      label={label}
      value={value}
      thousandSeparator={format.groupSeparator}
      decimalSeparator={format.decimalSeparator}
      decimalScale={2}
      fixedDecimalScale
      prefix={format.position === 'prefix' ? format.symbol + ' ' : undefined}
      suffix={format.position === 'postfix' ? ' ' + format.symbol : undefined}
      valueIsNumericString
      onValueChange={(values) => {
        onChange(values.floatValue || 0);
      }}
      error={error}
      helperText={helperText}
      name={name}
    />
  );
};

export default CurrencyInput;