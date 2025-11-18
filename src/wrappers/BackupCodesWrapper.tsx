import { FC } from 'react';
import { useLocation } from 'react-router-dom';
import { BackupCodesForm } from '../components/BackupCodesForm';
import { useBackupCodes } from '../hooks';

export interface BackupCodesWrapperProps {
  componentProps?: Partial<React.ComponentProps<typeof BackupCodesForm>>;
}

export const BackupCodesWrapper: FC<BackupCodesWrapperProps> = ({ 
  componentProps = {},
}) => {
  const location = useLocation();
  const initialCodeCount = (location.state as { codeCount?: number })?.codeCount ?? null;
  const { backupCodesRemaining, generateBackupCodes } = useBackupCodes({ initialCodeCount });

  const handleSubmit = async (values: { password?: string; mnemonic?: string }) => {
    return await generateBackupCodes(values.password, values.mnemonic);
  };
  
  return (
    <BackupCodesForm 
      onSubmit={handleSubmit} 
      backupCodesRemaining={backupCodesRemaining}
      {...componentProps}
    />
  );
};
