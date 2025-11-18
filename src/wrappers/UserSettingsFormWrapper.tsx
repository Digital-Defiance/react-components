import { FC } from 'react';
import { UserSettingsForm, UserSettingsFormValues, UserSettingsFormProps } from '../components/UserSettingsForm';
import { useSuiteConfig } from '../contexts';
import { useUserSettings } from '../hooks';

export interface UserSettingsFormWrapperProps {
  onSuccess?: () => void;
  componentProps?: Partial<Omit<UserSettingsFormProps, 'initialValues' | 'onSubmit' | 'languages'>>;
}

export const UserSettingsFormWrapper: FC<UserSettingsFormWrapperProps> = ({ 
  onSuccess,
  componentProps = {},
}) => {
  const { settings, isLoading, updateSettings } = useUserSettings();
  const { languages } = useSuiteConfig();

  const handleSubmit = async (values: UserSettingsFormValues) => {
    const result = await updateSettings(values);
    if ('success' in result && result.success && onSuccess) {
      onSuccess();
    }
    return result;
  };

  if (isLoading || !settings) {
    return <div>Loading...</div>;
  }

  return (
    <UserSettingsForm
      initialValues={settings}
      onSubmit={handleSubmit}
      languages={languages}
      {...componentProps}
    />
  );
};
