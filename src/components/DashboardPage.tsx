import { Box, Container, Typography } from '@mui/material';
import { FC, ReactNode } from 'react';

export interface DashboardPageProps {
  title?: string;
  children?: ReactNode;
}

export const DashboardPage: FC<DashboardPageProps> = ({ title = 'Dashboard', children }) => {
  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {title}
        </Typography>
        <Box display="flex" justifyContent="center" mt={3}>
          {children}
        </Box>
      </Box>
    </Container>
  );
};
