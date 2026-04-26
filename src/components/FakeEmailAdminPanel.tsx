/**
 * FakeEmailAdminPanel — dev-only panel for inspecting captured emails.
 *
 * Renders only in development/test environments where FakeEmailService is
 * active. Calls the AdminEmailRouter endpoints mounted at `baseUrl/api/admin/emails`.
 *
 * Usage (inside AuthenticatedApiProvider + SuiteConfigProvider):
 *   <FakeEmailAdminPanel />
 */
import {
  SuiteCoreComponentId,
  SuiteCoreStringKey,
  SuiteCoreStringKeyValue,
} from '@digitaldefiance/suite-core-lib';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { FC, useCallback, useEffect, useState } from 'react';
import { useI18n } from '../contexts';
import { ConfirmationDialog } from './ConfirmationDialog';
import { useAuthenticatedApi } from '../hooks/useAuthenticatedApi';

/** Shape of a single captured email as returned by AdminEmailRouter */
export interface CapturedEmailInfo {
  to: string;
  subject: string;
  text: string;
  html: string;
  timestamp: string;
}

/** Shape of a recipient summary as returned by GET /api/admin/emails */
export interface RecipientSummary {
  address: string;
  count: number;
}

export const FakeEmailAdminPanel: FC = () => {
  const api = useAuthenticatedApi();
  const { tComponent } = useI18n();
  const t = (key: SuiteCoreStringKeyValue) =>
    tComponent<SuiteCoreStringKeyValue>(SuiteCoreComponentId, key);

  const [recipients, setRecipients] = useState<RecipientSummary[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [emailsByAddress, setEmailsByAddress] = useState<
    Record<string, CapturedEmailInfo[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const loadRecipients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ recipients: RecipientSummary[] }>(
        '/api/admin/emails'
      );
      setRecipients(res.data.recipients);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void loadRecipients();
  }, [loadRecipients]);

  const toggleExpand = useCallback(
    async (address: string) => {
      if (expanded === address) {
        setExpanded(null);
        return;
      }
      setExpanded(address);
      if (!emailsByAddress[address]) {
        try {
          const res = await api.get<CapturedEmailInfo[]>(
            `/api/admin/emails/${encodeURIComponent(address)}`
          );
          setEmailsByAddress((prev) => ({ ...prev, [address]: res.data }));
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    },
    [api, expanded, emailsByAddress]
  );

  const handleClearAll = useCallback(async () => {
    setClearDialogOpen(false);
    try {
      await api.delete('/api/admin/emails');
      setRecipients([]);
      setEmailsByAddress({});
      setExpanded(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [api]);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ flexGrow: 1 }}>
          {t(SuiteCoreStringKey.FakeEmail_Admin_Title)}
        </Typography>
        <Chip label="DEV" size="small" color="warning" />
        <IconButton
          size="small"
          onClick={() => void loadRecipients()}
          title={t(SuiteCoreStringKey.FakeEmail_Admin_Refresh)}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={() => setClearDialogOpen(true)}
          title={t(SuiteCoreStringKey.FakeEmail_Admin_ClearAll)}
          disabled={recipients.length === 0}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 1 }} />

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Empty state */}
      {!loading && recipients.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {t(SuiteCoreStringKey.FakeEmail_Admin_NoRecipients)}
        </Typography>
      )}

      {/* Recipient list */}
      {!loading && recipients.length > 0 && (
        <List dense disablePadding>
          {recipients.map((r) => (
            <Box key={r.address}>
              <ListItemButton
                onClick={() => void toggleExpand(r.address)}
                sx={{ px: 0, py: 0.5 }}
              >
                <ListItemText
                  primary={r.address}
                  secondary={`${r.count} ${t(SuiteCoreStringKey.FakeEmail_Admin_Recipients)}`}
                />
                {expanded === r.address ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </ListItemButton>

              <Collapse in={expanded === r.address} unmountOnExit>
                {emailsByAddress[r.address]?.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ pl: 2, py: 0.5 }}
                  >
                    {t(SuiteCoreStringKey.FakeEmail_Admin_NoEmails)}
                  </Typography>
                ) : (
                  <List dense disablePadding sx={{ pl: 2 }}>
                    {(emailsByAddress[r.address] ?? []).map((email, idx) => (
                      <ListItem key={idx} disablePadding sx={{ py: 0.25 }}>
                        <ListItemText
                          primary={email.subject || '(no subject)'}
                          secondary={`${t(SuiteCoreStringKey.FakeEmail_Admin_Timestamp)}: ${new Date(email.timestamp).toLocaleString()}`}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Collapse>
              <Divider />
            </Box>
          ))}
        </List>
      )}

      {/* Clear confirmation */}
      <ConfirmationDialog
        open={clearDialogOpen}
        title={t(SuiteCoreStringKey.FakeEmail_Admin_ClearAll)}
        message={t(SuiteCoreStringKey.FakeEmail_Admin_ClearConfirm)}
        onConfirm={() => void handleClearAll()}
        onCancel={() => setClearDialogOpen(false)}
      />
    </Paper>
  );
};

export default FakeEmailAdminPanel;

// Buttons component for use outside the panel (e.g. in a toolbar)
export interface FakeEmailAdminButtonsProps {
  onRefresh: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export const FakeEmailAdminButtons: FC<FakeEmailAdminButtonsProps> = ({
  onRefresh,
  onClear,
  disabled = false,
}) => {
  const { tComponent } = useI18n();
  const t = (key: SuiteCoreStringKeyValue) =>
    tComponent<SuiteCoreStringKeyValue>(SuiteCoreComponentId, key);

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        size="small"
        startIcon={<RefreshIcon />}
        onClick={onRefresh}
        disabled={disabled}
      >
        {t(SuiteCoreStringKey.FakeEmail_Admin_Refresh)}
      </Button>
      <Button
        size="small"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={onClear}
        disabled={disabled}
      >
        {t(SuiteCoreStringKey.FakeEmail_Admin_ClearAll)}
      </Button>
    </Box>
  );
};
