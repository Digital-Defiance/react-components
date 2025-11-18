import { FC } from 'react';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { useAuth } from '../contexts';

export interface ChangePasswordFormWrapperProps {
  onSuccess?: () => void;
  componentProps?: Partial<React.ComponentProps<typeof ChangePasswordForm>>;
}

export const ChangePasswordFormWrapper: FC<ChangePasswordFormWrapperProps> = ({ 
  onSuccess,
  componentProps = {},
}) => {
  const { changePassword } = useAuth();

  const handleSubmit = async (values: any) => {
    const result = await changePassword(
      values.currentPassword,
      values.newPassword
    );
    if ('error' in result) {
      throw new Error(result.error);
    }
    if (onSuccess) {
      onSuccess();
    }
    return result;
  };

  return <ChangePasswordForm onSubmit={handleSubmit} {...componentProps} />;
};
