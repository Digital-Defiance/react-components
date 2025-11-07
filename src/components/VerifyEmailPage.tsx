import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Typography,
} from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { SuiteCoreComponentId, SuiteCoreStringKey } from '@digitaldefiance/suite-core-lib';
import { useI18n } from '../contexts';

export interface VerifyEmailPageProps {
  token: string | null;
  onVerify: (token: string) => Promise<{ success: boolean; message?: string }>;
  labels?: {
    title?: string;
    verifying?: string;
    success?: string;
    failed?: string;
    noToken?: string;
    proceedToLogin?: string;
    contactSupport?: string;
    requestNewEmail?: string;
  };
  loginLink?: string;
  resendLink?: string;
}

export const VerifyEmailPage: FC<VerifyEmailPageProps> = ({
  token,
  onVerify,
  labels = {},
  loginLink = '/login',
  resendLink = '/resend-verification',
}) => {
  const { t, tComponent } = useI18n();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>(
    'pending'
  );

  const translatedLabels = {
    title: labels.title || t(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_EmailVerification)),
    success: labels.success || t(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.EmailVerification_Success)),
    failed: labels.failed || t(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.EmailVerification_Failed)),
    noToken: labels.noToken || t(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.NoVerificationTokenProvided)),
    proceedToLogin: labels.proceedToLogin || t(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.ProceedToLogin)),
    contactSupport: labels.contactSupport || t(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.HavingTroubleContactSupport)),
    requestNewEmail: labels.requestNewEmail || t(tComponent(SuiteCoreComponentId, SuiteCoreStringKey.RequestNewVerificationEmail)),
  };

  useEffect(() => {
    const verifyEmail = async (verificationToken: string) => {
      try {
        const result = await onVerify(verificationToken);
        if (result.success) {
          setMessage(result.message || translatedLabels.success);
          setVerificationStatus('success');
        } else {
          setMessage(result.message || translatedLabels.failed);
          setVerificationStatus('error');
        }
      } catch {
        setMessage(translatedLabels.failed);
        setVerificationStatus('error');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmail(token);
    } else {
      setLoading(false);
      setMessage(translatedLabels.noToken);
      setVerificationStatus('error');
    }
  }, [token, onVerify, translatedLabels]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          {translatedLabels.title}
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : (
          <Box sx={{ width: '100%', mt: 2 }}>
            <Alert severity={verificationStatus === 'success' ? 'success' : 'error'} sx={{ mb: 2 }}>
              {message}
            </Alert>

            {verificationStatus === 'success' && (
              <Button
                variant="contained"
                color="primary"
                component={Link}
                href={loginLink}
                fullWidth
              >
                {translatedLabels.proceedToLogin}
              </Button>
            )}

            {verificationStatus === 'error' && (
              <Typography variant="body1">
                {translatedLabels.contactSupport}{' '}
                <Link href={resendLink} color="primary">
                  {translatedLabels.requestNewEmail}
                </Link>
                .
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
};
