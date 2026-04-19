import {
  SuiteCoreComponentId,
  SuiteCoreStringKey,
  SuiteCoreStringKeyValue,
} from '@digitaldefiance/suite-core-lib';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Typography,
} from '@mui/material';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
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
    checkYourEmail?: string;
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
  const { tComponent } = useI18n();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<
    'pending' | 'success' | 'error' | 'info'
  >('pending');

  const translatedLabels = useMemo<{
    title: string;
    success: string;
    failed: string;
    noToken: string;
    checkYourEmail: string;
    proceedToLogin: string;
    contactSupport: string;
    requestNewEmail: string;
  }>(() => {
    return {
      title:
        labels.title ||
        tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.Common_EmailVerification
        ),
      success:
        labels.success ||
        tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.EmailVerification_Success
        ),
      failed:
        labels.failed ||
        tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.EmailVerification_Failed
        ),
      noToken:
        labels.noToken ||
        tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.NoVerificationTokenProvided
        ),
      checkYourEmail:
        labels.checkYourEmail ||
        tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.Registration_CheckYourEmail
        ),
      proceedToLogin:
        labels.proceedToLogin ||
        tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.ProceedToLogin
        ),
      contactSupport:
        labels.contactSupport ||
        tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.HavingTroubleContactSupport
        ),
      requestNewEmail:
        labels.requestNewEmail ||
        tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.RequestNewVerificationEmail
        ),
    };
  }, [labels, tComponent]);

  // Use a ref to track whether verification has already been attempted,
  // preventing infinite re-render loops from unstable onVerify references.
  const hasVerified = useRef(false);

  // Stable reference to onVerify to avoid re-triggering the effect
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;

  useEffect(() => {
    if (hasVerified.current) return;

    if (token) {
      hasVerified.current = true;
      const verifyEmail = async () => {
        try {
          const result = await onVerifyRef.current(token);
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
      verifyEmail();
    } else {
      hasVerified.current = true;
      setLoading(false);
      setVerificationStatus('info');
    }
  }, [token, translatedLabels]);

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
            {verificationStatus === 'info' ? (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {translatedLabels.checkYourEmail}
                </Alert>
                <Typography variant="body1">
                  {translatedLabels.contactSupport}{' '}
                  <Link href={resendLink} color="primary">
                    {translatedLabels.requestNewEmail}
                  </Link>
                  .
                </Typography>
              </>
            ) : (
              <>
                <Alert
                  severity={verificationStatus === 'success' ? 'success' : 'error'}
                  sx={{ mb: 2 }}
                >
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
              </>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default VerifyEmailPage;
