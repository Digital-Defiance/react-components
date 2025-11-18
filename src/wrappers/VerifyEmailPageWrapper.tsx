import { FC } from 'react';
import { VerifyEmailPage } from '../components/VerifyEmailPage';
import { useEmailVerification } from '../hooks';

export interface VerifyEmailPageWrapperProps {
  onSuccess?: () => void;
  componentProps?: Partial<React.ComponentProps<typeof VerifyEmailPage>>;
}

export const VerifyEmailPageWrapper: FC<VerifyEmailPageWrapperProps> = ({ 
  onSuccess,
  componentProps = {},
}) => {
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');
  const { verifyEmail } = useEmailVerification();

  const handleVerify = async (verificationToken: string) => {
    const result = await verifyEmail(verificationToken);
    if (result.success && onSuccess) {
      onSuccess();
    }
    return result;
  };

  return <VerifyEmailPage token={token} onVerify={handleVerify} {...componentProps} />;
};
