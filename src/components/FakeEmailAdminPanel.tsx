/**
 * FakeEmailAdminPanel — dev-only panel for inspecting captured emails.
 *
 * Renders only in development/test environments where FakeEmailService is
 * active. Calls the AdminEmailRouter endpoints mounted at `baseUrl/api/admin/emails`.
 *
 * Self-contained: wraps itself with AuthenticatedApiProvider internally.
 * Usage (inside SuiteConfigProvider):
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
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../contexts';
import { ConfirmationDialog } from './ConfirmationDialog';
import {
  AuthenticatedApiProvider,
  useAuthenticatedApi,
} from '../hooks/useAuthenticatedApi';

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

/**
 * Renders email HTML content in a sandboxed iframe so that links are
 * clickable and open in a new tab. Falls back to plain text when no
 * HTML body is available.
 */
const EmailBodyIframe: FC<{ html: string; text: string }> = ({
  html,
  text,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) return;

    if (html) {
      // Inject a <base target="_blank"> so every link opens in a new tab,
      // then write the original HTML body.
      doc.open();
      doc.write(
        `<!DOCTYPE html><html><head><base target="_blank"><style>body{font-family:sans-serif;font-size:14px;margin:8px;}</style></head><body>${html}</body></html>`
      );
      doc.close();
    } else {
      doc.open();
      doc.write(
        `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;font-size:14px;margin:8px;white-space:pre-wrap;}</style></head><body>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body></html>`
      );
      doc.close();
    }

    // Auto-resize iframe height to fit content
    const resize = () => {
      if (doc.body) {
        iframe.style.height = `${doc.body.scrollHeight + 16}px`;
      }
    };
    // Resize after content loads (images, etc.)
    iframe.addEventListener('load', resize);
    resize();
    // Small delay to catch late-rendering content
    const timer = setTimeout(resize, 200);
    return () => {
      iframe.removeEventListener('load', resize);
      clearTimeout(timer);
    };
  }, [html, text]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
      style={{
        width: '100%',
        minHeight: 80,
        border: '1px solid #e0e0e0',
        borderRadius: 4,
        background: '#fff',
      }}
      title="Email body"
    />
  );
};

const FakeEmailAdminPanelContent: FC = () => {
  const api = useAuthenticatedApi();
  const { tComponent } = useI18n();
  const t = (key: SuiteCoreStringKeyValue) =>
    tComponent<SuiteCoreStringKeyValue>(SuiteCoreComponentId, key);

  const [recipients, setRecipients] = useState<RecipientSummary[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  /** Tracks which individual email is expanded to show its body (address:idx) */
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
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
        '/admin/emails'
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
            `/admin/emails/${encodeURIComponent(address)}`
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
      await api.delete('/admin/emails');
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
                    {(emailsByAddress[r.address] ?? []).map((email, idx) => {
                      const emailKey = `${r.address}:${idx}`;
                      const isEmailExpanded = expandedEmail === emailKey;
                      return (
                        <Box key={idx} sx={{ py: 0.25 }}>
                          <ListItemButton
                            disableGutters
                            onClick={() =>
                              setExpandedEmail(isEmailExpanded ? null : emailKey)
                            }
                            sx={{ py: 0.25, px: 0.5, borderRadius: 1 }}
                          >
                            <ListItemText
                              primary={email.subject || '(no subject)'}
                              secondary={`${t(SuiteCoreStringKey.FakeEmail_Admin_Timestamp)}: ${new Date(email.timestamp).toLocaleString()}`}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                            {isEmailExpanded ? (
                              <ExpandLessIcon fontSize="small" />
                            ) : (
                              <ExpandMoreIcon fontSize="small" />
                            )}
                          </ListItemButton>
                          <Collapse in={isEmailExpanded} unmountOnExit>
                            <Box sx={{ pl: 1, pr: 1, pb: 1 }}>
                              <EmailBodyIframe
                                html={email.html}
                                text={email.text}
                              />
                            </Box>
                          </Collapse>
                        </Box>
                      );
                    })}
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

export const FakeEmailAdminPanel: FC = () => (
  <AuthenticatedApiProvider>
    <FakeEmailAdminPanelContent />
  </AuthenticatedApiProvider>
);

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
