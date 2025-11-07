import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  styled,
  TextField,
  Typography,
} from '@mui/material';
import { FC, useState } from 'react';
import { SuiteCoreComponentId, SuiteCoreStringKey } from '@digitaldefiance/suite-core-lib';
import { useI18n } from '../contexts';

const ApiAccessContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(3),
}));

const ApiAccessContent = styled(Box)(({ theme }) => ({
  maxWidth: '600px',
  width: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  boxShadow: theme.shadows[3],
}));

const ApiAccessTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  color: theme.palette.primary.main,
}));

export interface ApiAccessProps {
  token: string | null;
  labels?: {
    title?: string;
    tokenNotAvailable?: string;
    copyButton?: string;
    notificationTitle?: string;
    copied?: string;
    copyFailed?: string;
    ok?: string;
  };
}

export const ApiAccess: FC<ApiAccessProps> = ({
  token,
  labels = {},
}) => {
  const { t, tComponent } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isError, setIsError] = useState(false);

  const translatedLabels = {
    title: labels.title || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.ApiAccess_Title),
    tokenNotAvailable: labels.tokenNotAvailable || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.ApiAccess_TokenNotAvailable),
    copyButton: labels.copyButton || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_CopyToClipboard),
    notificationTitle: labels.notificationTitle || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_Notification),
    copied: labels.copied || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_CopiedToClipboard),
    copyFailed: labels.copyFailed || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Error_FailedToCopy),
    ok: labels.ok || tComponent(SuiteCoreComponentId, SuiteCoreStringKey.Common_OK),
  };

  const copyToClipboard = async () => {
    if (token) {
      try {
        await navigator.clipboard.writeText(token);
        setIsError(false);
        setDialogOpen(true);
      } catch (err) {
        setIsError(true);
      }
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setIsError(false);
  };

  return (
    <ApiAccessContainer>
      <ApiAccessContent>
        <ApiAccessTitle variant="h4" align="center">
          {translatedLabels.title}
        </ApiAccessTitle>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={token || translatedLabels.tokenNotAvailable}
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
          variant="outlined"
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<ContentCopyIcon />}
          onClick={copyToClipboard}
          fullWidth
          style={{ marginTop: '16px' }}
        >
          {translatedLabels.copyButton}
        </Button>
      </ApiAccessContent>
      <Dialog open={dialogOpen} onClose={handleClose}>
        <DialogTitle>{translatedLabels.notificationTitle}</DialogTitle>
        <DialogContent>{isError ? translatedLabels.copyFailed : translatedLabels.copied}</DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            {translatedLabels.ok}
          </Button>
        </DialogActions>
      </Dialog>
    </ApiAccessContainer>
  );
};
