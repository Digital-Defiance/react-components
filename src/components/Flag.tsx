import { Box, SxProps, Theme } from '@mui/material';
import { FC } from 'react';

export interface FlagProps {
  languageCode: string;
  countryCode: string;
  sx?: SxProps<Theme>;
}

export const Flag: FC<FlagProps> = ({ languageCode, countryCode, sx }) => {
  if (!countryCode) {
    return null;
  }

  return (
    <Box
      component="span"
      aria-label={`Flag for ${languageCode}`}
      sx={{
        fontSize: '1.5rem',
        lineHeight: 1,
        verticalAlign: 'middle',
        '&::before': {
          content: `" "`,
          display: 'inline-block',
          width: '1em',
          height: '1em',
          backgroundImage: `url(https://flagcdn.com/${countryCode.toLowerCase()}.svg)`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '2px',
        },
        ...sx,
      }}
    />
  );
};
