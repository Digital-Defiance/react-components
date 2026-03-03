import { FC } from 'react';
import { UserSettingsForm, UserSettingsFormValues, UserSettingsFormProps } from '../components/UserSettingsForm';
import { useSuiteConfig } from '../contexts';
import { useUserSettingsPublic } from '../hooks';
import { getSuiteCoreTranslation, SuiteCoreStringKey } from '@digitaldefiance/suite-core-lib';

export interface UserSettingsFormWrapperProps {
  onSuccess?: () => void;
  componentProps?: Partial<Omit<UserSettingsFormProps, 'initialValues' | 'onSubmit' | 'languages'>>;
}

export const UserSettingsFormWrapper: FC<UserSettingsFormWrapperProps> = ({ 
  onSuccess,
  componentProps = {},
}) => {
  const { settings, updateSettings } = useUserSettingsPublic();
  const { languages } = useSuiteConfig();

  const handleSubmit = async (values: UserSettingsFormValues) => {
    const result = await updateSettings(values);
    if ('success' in result && result.success && onSuccess) {
      onSuccess();
    }
    return result;
  };

  // Only show loading on initial load, not during updates
  // Once we have settings, keep showing the form even during updates
  if (!settings) {
    return <div>{getSuiteCoreTranslation(SuiteCoreStringKey.Common_Loading)}...</div>;
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
