import { useState, useEffect, useRef, type KeyboardEvent, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grow,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AddRounded,
  CheckRounded,
  CloseRounded,
  DeleteOutlineRounded,
  EditRounded,
  ErrorOutlineRounded,
  GavelRounded,
  RefreshRounded,
  SchemaRounded,
  SearchRounded,
  SendRounded,
  SmartToyRounded,
  WidgetsRounded,
} from '@mui/icons-material';

import type { SubmodelTemplate, SubmodelElement } from '@/context/AASContext';
import { useApiManager } from '@/api/apiManger';
import { registerTemplate } from '@/utils/template-registry';
import { REGULATION_TEMPLATES, instantiateRegulationElements } from '@/utils/regulation-templates';
import {
  type CatalogEntry,
  clearCatalogCaches,
  fetchCatalog,
  fetchSubmodelTemplate,
  getCachedCatalog,
} from '@/utils/idta-catalog';
import ElementFormDialog from './ElementFormDialog';
import { useChatbotSession, getChatbotUrl } from '@/hooks/useChatbotSession';

// ── IDTA catalog: shared client in @/utils/idta-catalog ──────────────────────

const CUSTOM_CATEGORIES = [
  'Identification', 'Technical', 'Documentation', 'Maintenance', 'Sustainability',
  'Structure', 'Operational', 'AI', 'Connectivity', 'Safety', 'Custom',
];

function countElements(els: SubmodelElement[] | undefined): number {
  if (!els?.length) return 0;
  return els.reduce((n, e) => n + 1 + countElements(e.children), 0);
}

// Compact recursive structure preview for a template.
function TemplateTree({ els, depth }: { els: SubmodelElement[]; depth: number }) {
  return (
    <>
      {els.map((e, i) => (
        <Box key={i} sx={{ pl: depth * 1.5 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ py: 0.2, minWidth: 0 }}>
            <Box sx={{
              width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
              bgcolor: e.children?.length ? 'warning.main' : 'primary.main',
            }} />
            <Typography variant="caption" fontFamily="monospace" noWrap>
              {e.idShort || `[${i}]`}
            </Typography>
            {e.required && (
              <Typography variant="caption" color="error.main" fontWeight={700} sx={{ fontSize: 9, flexShrink: 0 }}>
                REQ
              </Typography>
            )}
            <Typography variant="caption" color="text.disabled" noWrap sx={{ fontSize: 9 }}>
              {e.type}
            </Typography>
            {e.legalRef && (
              <Typography variant="caption" color="secondary.main" noWrap sx={{ fontSize: 8, flexShrink: 0 }}>
                {e.legalRef}
              </Typography>
            )}
          </Stack>
          {e.children?.length ? <TemplateTree els={e.children} depth={depth + 1} /> : null}
        </Box>
      ))}
    </>
  );
}

// ── Chatbot ──────────────────────────────────────────────────────────────────
// Offline fallback only: when no chatbot backend is configured (VITE_CHATBOT_URL
// / config.chatbotUrl) the panel answers from the i18n catalog under
// addSubmodel.chat.*; this resolves the message to the matching key so the
// component translates at render time. With a backend configured, the panel
// talks to the AAS_chatbot Chainlit server via useChatbotSession instead.

function getChatResponseKey(msg: string): string {
  const l = msg.toLowerCase();
  if (l.includes('nameplate') || l.includes('identificaz') || l.includes('serial'))
    return 'addSubmodel.chat.nameplate';
  if (l.includes('mainten') || l.includes('manutenzione') || l.includes('predittiv'))
    return 'addSubmodel.chat.maintenance';
  if (l.includes('tecnic') || l.includes('technical') || l.includes('specs'))
    return 'addSubmodel.chat.technical';
  if (l.includes('document') || l.includes('manuale') || l.includes('handover'))
    return 'addSubmodel.chat.documentation';
  if (l.includes('carbon') || l.includes('co2') || l.includes('pcf'))
    return 'addSubmodel.chat.carbon';
  if (l.includes('bom') || l.includes('distinta') || l.includes('material'))
    return 'addSubmodel.chat.bom';
  if (l.includes('operat') || l.includes('runtime') || l.includes('time series'))
    return 'addSubmodel.chat.operational';
  if (l.includes('eclass') || l.includes('semantic') || l.includes('0173'))
    return 'addSubmodel.chat.eclass';
  return 'addSubmodel.chat.noMatch';
}

// ── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = { role: 'bot' | 'user'; text: string };

interface AddSubmodelDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (sm: SubmodelTemplate) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AddSubmodelDialog({ open, onClose, onAdd }: AddSubmodelDialogProps) {
  const { t } = useTranslation();
  const api = useApiManager();
  const [tab, setTab] = useState<'catalog' | 'regulation' | 'custom'>('catalog');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [onlyTemplates, setOnlyTemplates] = useState(true);
  const [metamodelFilter, setMetamodelFilter] = useState<string>('All');
  const [selected, setSelected] = useState<string | null>(null);
  const [regSelected, setRegSelected] = useState<string | null>(null);
  const [custom, setCustom] = useState({ idShort: '', semanticId: '', description: '', category: 'Custom' });
  const [customElements, setCustomElements] = useState<SubmodelElement[]>([]);
  const [elementForm, setElementForm] = useState<{ mode: 'create' } | { mode: 'edit'; index: number } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    { role: 'bot', text: t('addSubmodel.chat.default') },
  ]);
  const [chatInput, setChatInput] = useState('');
  // Live assistant: with a configured backend the panel speaks the Chainlit
  // protocol; otherwise it keeps the offline keyword mock above.
  const chatbotUrl = getChatbotUrl();
  const liveChat = useChatbotSession(open && chatbotUrl !== null);

  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Structure preview of the selected catalog entry (lazy fetch, cached).
  const [previewTpl, setPreviewTpl] = useState<SubmodelTemplate | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) { setPreviewTpl(null); setPreviewError(null); return; }
    const entry = catalog.find(e => e.id === selected);
    if (!entry) return;
    let stale = false;
    setPreviewLoading(true);
    setPreviewError(null);
    fetchSubmodelTemplate(entry)
      .then(tpl => { if (!stale) setPreviewTpl(tpl); })
      .catch((e: Error) => { if (!stale) { setPreviewTpl(null); setPreviewError(e.message); } })
      .finally(() => { if (!stale) setPreviewLoading(false); });
    return () => { stale = true; };
  }, [selected, catalog]);

  useEffect(() => {
    if (!open) return;
    const cached = getCachedCatalog();
    if (cached) {
      setCatalog(cached);
      return;
    }
    setCatalogLoading(true);
    setCatalogError(null);
    fetchCatalog(api)
      .then(setCatalog)
      .catch((e: Error) => setCatalogError(e.message))
      .finally(() => setCatalogLoading(false));
  }, [open]);

  const categories = ['All', ...Array.from(new Set(catalog.map(e => e.category))).sort()];
  const metamodelVersions = ['All', ...Array.from(new Set(catalog.map(e => e.metamodel))).sort()];

  const filtered = catalog.filter(e => {
    // "Solo Template" hides only instances carrying demo data (Example/Sample);
    // Template + Generic definitions (OPC UA, Digital Battery Passport parts,
    // MTP…) stay visible even when their filename doesn't spell "Template".
    if (onlyTemplates && (e.fileType === 'Example' || e.fileType === 'Sample')) return false;
    if (metamodelFilter !== 'All' && e.metamodel !== metamodelFilter) return false;
    if (catFilter !== 'All' && e.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.idtaCode.toLowerCase().includes(q) ||
        e.version.includes(q)
      );
    }
    return true;
  });

  const canAdd = tab === 'catalog'
    ? !!selected
    : tab === 'regulation'
      ? !!regSelected
      : !!custom.idShort.trim();

  const resetState = () => {
    setTab('catalog');
    setSearch('');
    setCatFilter('All');
    setOnlyTemplates(true);
    setMetamodelFilter('All');
    setSelected(null);
    setRegSelected(null);
    setRefreshing(false);
    setCustom({ idShort: '', semanticId: '', description: '', category: 'Custom' });
    setCustomElements([]);
    setElementForm(null);
    setPreviewTpl(null);
    setPreviewError(null);
    setChatMessages([{ role: 'bot', text: t('addSubmodel.chat.default') }]);
    setChatInput('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Force a catalog refresh from GitHub: wipe the server-side Redis cache and
  // both frontend caches, then re-fetch (the Redis miss re-hydrates from GitHub).
  const handleRefreshCatalog = async () => {
    setRefreshing(true);
    setCatalogError(null);
    setSelected(null);
    try {
      await api.delete('/v1/idta/catalog/cache'); // invalidate Redis
      clearCatalogCaches();                        // drop frontend catalog+template caches
      setCatalogLoading(true);
      const fresh = await fetchCatalog(api);        // re-fetch → GitHub → re-cache
      setCatalog(fresh);
    } catch (e: unknown) {
      setCatalogError(t('addSubmodel.refreshError', { error: e instanceof Error ? e.message : String(e) }));
    } finally {
      setCatalogLoading(false);
      setRefreshing(false);
    }
  };

  const handleAdd = async () => {
    if (tab === 'catalog' && selected) {
      const entry = catalog.find(e => e.id === selected);
      if (!entry) return;
      setAdding(true);
      setCatalogError(null);
      try {
        const template = await fetchSubmodelTemplate(entry);
        onAdd({
          ...template,
          id: `${template.semanticId}:inst:${Date.now()}`,
          elements: template.elements.map(el => ({
            ...el,
            value: el.type === 'MultiLanguageProperty' ? {} : '',
          })),
        });
        handleClose();
      } catch (err: unknown) {
        setCatalogError(t('addSubmodel.templateLoadError', { error: err instanceof Error ? err.message : String(err) }));
      } finally {
        setAdding(false);
      }
      return;
    }
    if (tab === 'regulation' && regSelected) {
      const tpl = REGULATION_TEMPLATES.find(r => r.id === regSelected);
      if (!tpl) return;
      // Feed the validation registry so mandatory fields are cross-checked.
      registerTemplate(tpl);
      onAdd({
        id: `${tpl.semanticId}:inst:${Date.now()}`,
        idShort: tpl.idShort,
        semanticId: tpl.semanticId,
        description: tpl.description,
        category: tpl.category,
        elements: instantiateRegulationElements(tpl.elements),
      });
      handleClose();
      return;
    }
    if (tab === 'custom' && custom.idShort.trim()) {
      onAdd({
        id: `custom-${Date.now()}`,
        idShort: custom.idShort,
        semanticId: custom.semanticId || `urn:custom:${custom.idShort}:1:0`,
        description: custom.description,
        category: custom.category,
        elements: customElements,
      });
      handleClose();
    }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput('');
    if (chatbotUrl) {
      liveChat.sendMessage(msg);
      return;
    }
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setTimeout(
      () => setChatMessages(prev => [...prev, { role: 'bot', text: t(getChatResponseKey(msg)) }]),
      500,
    );
  };

  const renderBoldText = (text: string) =>
    text.split('**').map((part, j) =>
      j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
    );

  // What the assistant panel shows: live session messages (greeting prepended)
  // or the mock conversation.
  const displayedMessages: ChatMessage[] = chatbotUrl
    ? [{ role: 'bot', text: t('addSubmodel.chat.default') }, ...liveChat.messages]
    : chatMessages;
  const chatBusy = Boolean(
    chatbotUrl && liveChat.thinking &&
    displayedMessages[displayedMessages.length - 1]?.role === 'user'
  );

  // Keep the latest message in view while replies stream in.
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const lastChatText = displayedMessages[displayedMessages.length - 1]?.text;
  useEffect(() => {
    if (chatbotUrl) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatbotUrl, displayedMessages.length, lastChatText]);

  return (
    <Dialog
      open={open}
      onClose={(_: unknown, reason: string) => {
        if (reason !== 'backdropClick') handleClose();
      }}
      fullWidth
      maxWidth="xl"
      slots={{ transition: Grow }}
      slotProps={{ transition: { timeout: 300 } }}
      PaperProps={{ sx: { height: '85vh' } }}
    >
      {/* ── Title ── */}
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <AddRounded />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            {t('addSubmodel.title')}
          </Typography>
          <Typography variant="caption" color="text.disabled" fontFamily="monospace">
            {catalog.length > 0 ? t('addSubmodel.subtitleCount', { count: catalog.length }) : t('addSubmodel.subtitleLoading')}
          </Typography>
        </Box>
        <Box flexGrow={1} />
        <IconButton size="small" onClick={handleClose}>
          <CloseRounded fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* ── Body ── */}
      <DialogContent sx={{ display: 'flex', p: 0, overflow: 'hidden' }}>
        {/* ── LEFT ── */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRight: 1,
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            <Tab value="catalog" label={t('addSubmodel.tabCatalog')} />
            <Tab value="regulation" label={t('addSubmodel.tabRegulation')} />
            <Tab value="custom" label={t('addSubmodel.tabCustom')} />
          </Tabs>

          {tab === 'catalog' ? (
            <>
              {/* Search + toggle chips */}
              <Stack spacing={1} p={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    placeholder={t('addSubmodel.searchPlaceholder')}
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    sx={{ flex: 1 }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchRounded fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <Tooltip title={t('addSubmodel.refreshCatalog')}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={handleRefreshCatalog}
                        disabled={refreshing || catalogLoading}
                      >
                        {refreshing ? <CircularProgress size={16} /> : <RefreshRounded fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Chip
                    label={t('addSubmodel.onlyTemplates')}
                    size="small"
                    clickable
                    variant={onlyTemplates ? 'filled' : 'outlined'}
                    color={onlyTemplates ? 'primary' : 'default'}
                    onClick={() => setOnlyTemplates(p => !p)}
                  />
                  {metamodelVersions.map(v => (
                    <Chip
                      key={v}
                      label={v === 'All' ? t('addSubmodel.allMetamodels') : `AAS ${v}`}
                      size="small"
                      clickable
                      variant={metamodelFilter === v ? 'filled' : 'outlined'}
                      color={metamodelFilter === v ? 'secondary' : 'default'}
                      onClick={() => setMetamodelFilter(v)}
                    />
                  ))}
                </Stack>
                {/* Category chips */}
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {categories.map(c => (
                    <Chip
                      key={c}
                      label={c}
                      size="small"
                      clickable
                      variant={catFilter === c ? 'filled' : 'outlined'}
                      color={catFilter === c ? 'primary' : 'default'}
                      onClick={() => setCatFilter(c)}
                    />
                  ))}
                </Stack>
              </Stack>

              {/* List */}
              <Box flex={1} overflow="auto" px={2} pb={2}>
                {catalogLoading && (
                  <Stack alignItems="center" justifyContent="center" height="100%" spacing={1.5}>
                    <CircularProgress size={32} />
                    <Typography variant="caption" color="text.secondary">
                      {t('addSubmodel.loadingCatalog')}
                    </Typography>
                  </Stack>
                )}

                {catalogError && !catalogLoading && (
                  <Stack alignItems="center" justifyContent="center" height="100%" spacing={1}>
                    <ErrorOutlineRounded color="error" />
                    <Typography variant="caption" color="error" textAlign="center">
                      {catalogError}
                    </Typography>
                  </Stack>
                )}

                {!catalogLoading && !catalogError && filtered.map(entry => (
                  <Paper
                    key={entry.path}
                    variant="outlined"
                    onClick={() => setSelected(entry.id)}
                    sx={{
                      p: 1.75,
                      mb: 0.75,
                      cursor: 'pointer',
                      borderColor: selected === entry.id ? 'primary.main' : 'divider',
                      bgcolor: selected === entry.id ? 'action.selected' : 'background.paper',
                      '&:hover': { borderColor: 'primary.light' },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      {/* Template cover from the IDTA repo docs, when available */}
                      <Box
                        sx={{
                          width: 44, height: 44, borderRadius: 1, flexShrink: 0,
                          bgcolor: 'action.hover', overflow: 'hidden',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {entry.thumbnailUrl ? (
                          <Box
                            component="img"
                            src={entry.thumbnailUrl}
                            alt=""
                            loading="lazy"
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              e.currentTarget.style.display = 'none';
                            }}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <WidgetsRounded sx={{ fontSize: 20, color: 'text.disabled' }} />
                        )}
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                            <Typography variant="subtitle2">{entry.name}</Typography>
                            <Chip
                              label={`v${entry.version}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontFamily: 'monospace', fontSize: 9 }}
                            />
                            <Chip
                              label={`AAS ${entry.metamodel}`}
                              size="small"
                              color={entry.metamodel === '3.0' ? 'default' : 'secondary'}
                              variant="outlined"
                              sx={{ fontFamily: 'monospace', fontSize: 9 }}
                            />
                            {entry.fileType !== 'Template' && (
                              <Chip
                                label={entry.fileType}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: 9 }}
                              />
                            )}
                          </Stack>
                          {selected === entry.id && <CheckRounded color="primary" fontSize="small" />}
                        </Stack>
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          display="block"
                          mt={0.5}
                          fontFamily="monospace"
                        >
                          {entry.idtaCode && `${entry.idtaCode} · `}{entry.category}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}

                {!catalogLoading && !catalogError && filtered.length === 0 && catalog.length > 0 && (
                  <Typography variant="body2" color="text.secondary" textAlign="center" mt={4}>
                    {t('addSubmodel.noResults')}
                  </Typography>
                )}
              </Box>
            </>
          ) : tab === 'regulation' ? (
            <Box flex={1} overflow="auto" px={2} pb={2} pt={1.5}>
              {REGULATION_TEMPLATES.map(tpl => (
                <Paper
                  key={tpl.id}
                  variant="outlined"
                  onClick={() => setRegSelected(tpl.id)}
                  sx={{
                    p: 1.75,
                    mb: 0.75,
                    cursor: 'pointer',
                    borderColor: regSelected === tpl.id ? 'primary.main' : 'divider',
                    bgcolor: regSelected === tpl.id ? 'action.selected' : 'background.paper',
                    '&:hover': { borderColor: 'primary.light' },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{
                      width: 44, height: 44, borderRadius: 1, flexShrink: 0,
                      bgcolor: 'action.hover',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <GavelRounded sx={{ fontSize: 20, color: 'secondary.main' }} />
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                          <Typography variant="subtitle2">{tpl.regulationName}</Typography>
                          <Chip
                            label={tpl.regulation}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontSize: 9 }}
                          />
                        </Stack>
                        {regSelected === tpl.id && <CheckRounded color="primary" fontSize="small" />}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                        {tpl.description}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" display="block" mt={0.25} fontFamily="monospace">
                        {tpl.legalBasis} · {tpl.category}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Box>
          ) : (
            <Stack gap={2} p={2} flex={1} overflow="auto">
              <Stack direction="row" spacing={1.5}>
                <TextField
                  label="idShort *"
                  size="small"
                  sx={{ flex: 1 }}
                  value={custom.idShort}
                  placeholder="MyCustomSubmodel"
                  onChange={e => setCustom(p => ({ ...p, idShort: e.target.value }))}
                  slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
                />
                <FormControl size="small" sx={{ width: 180 }}>
                  <InputLabel id="asd-cat-label">{t('addSubmodel.categoryLabel')}</InputLabel>
                  <Select
                    labelId="asd-cat-label"
                    value={custom.category}
                    label={t('addSubmodel.categoryLabel')}
                    onChange={e => setCustom(p => ({ ...p, category: e.target.value }))}
                  >
                    {CUSTOM_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
              <TextField
                label="semanticId"
                size="small"
                fullWidth
                value={custom.semanticId}
                placeholder="urn:org:submodel:Name:1:0"
                onChange={e => setCustom(p => ({ ...p, semanticId: e.target.value }))}
                slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
              />
              <TextField
                label={t('addSubmodel.descriptionLabel')}
                size="small"
                fullWidth
                multiline
                rows={2}
                value={custom.description}
                onChange={e => setCustom(p => ({ ...p, description: e.target.value }))}
              />

              {/* Initial structure: full element builder (same form as the editor) */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} mb={0.75}>
                  <Typography variant="overline" color="text.disabled" flex={1}>
                    {t('addSubmodel.customElements')}
                  </Typography>
                  <Button size="small" startIcon={<AddRounded />} onClick={() => setElementForm({ mode: 'create' })}>
                    {t('addSubmodel.addElementBtn')}
                  </Button>
                </Stack>
                {customElements.length === 0 ? (
                  <Typography variant="caption" color="text.disabled">
                    {t('addSubmodel.noCustomElements')}
                  </Typography>
                ) : (
                  <Paper variant="outlined" sx={{ maxHeight: 260, overflow: 'auto' }}>
                    {customElements.map((el, i) => (
                      <Stack key={i} direction="row" alignItems="center" spacing={1}
                        sx={{ px: 1.5, py: 0.5, borderBottom: i < customElements.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                        <Typography variant="caption" fontFamily="monospace" fontWeight={600} noWrap>
                          {el.idShort}
                        </Typography>
                        {el.required && (
                          <Typography variant="caption" color="error.main" fontWeight={700} sx={{ fontSize: 9 }}>REQ</Typography>
                        )}
                        <Typography variant="caption" color="text.disabled" fontFamily="monospace" noWrap flex={1}>
                          {el.type}{el.children?.length ? ` · ${t('addSubmodel.childCount', { count: countElements(el.children) })}` : ''}
                        </Typography>
                        <Tooltip title={t('editor.editElement')}>
                          <IconButton size="small" sx={{ p: 0.25, color: 'primary.main' }} onClick={() => setElementForm({ mode: 'edit', index: i })}>
                            <EditRounded sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('editor.deleteElement')}>
                          <IconButton size="small" sx={{ p: 0.25, color: 'error.main' }}
                            onClick={() => setCustomElements(prev => prev.filter((_, x) => x !== i))}>
                            <DeleteOutlineRounded sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ))}
                  </Paper>
                )}
              </Box>
            </Stack>
          )}

          {/* Footer */}
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={1}
            p={1.5}
            sx={{ borderTop: 1, borderColor: 'divider' }}
          >
            <Button onClick={handleClose}>{t('common.buttons.cancel')}</Button>
            <Button
              variant="contained"
              disabled={!canAdd || adding}
              startIcon={
                adding ? <CircularProgress size={14} color="inherit" /> : <AddRounded />
              }
              onClick={handleAdd}
            >
              {adding ? t('addSubmodel.adding') : t('addSubmodel.add')}
            </Button>
          </Stack>
        </Box>

        {/* ── RIGHT PANEL: template preview when selected, assistant otherwise ── */}
        <Box
          sx={{
            width: 340,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {tab === 'catalog' && selected ? (() => {
            const selEntry = catalog.find(e => e.id === selected);
            return (
              <>
                <Stack direction="row" spacing={1} alignItems="center" p={1.75}
                  sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <SchemaRounded color="primary" fontSize="small" />
                  <Box minWidth={0} flex={1}>
                    <Typography variant="subtitle2" noWrap lineHeight={1.2}>{selEntry?.name}</Typography>
                    <Typography variant="caption" color="text.disabled" fontFamily="monospace" noWrap display="block">
                      {selEntry?.idtaCode ? `${selEntry.idtaCode} · ` : ''}v{selEntry?.version} · AAS {selEntry?.metamodel}
                    </Typography>
                  </Box>
                </Stack>
                {selEntry?.thumbnailUrl && (
                  <Box
                    component="img"
                    src={selEntry.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
                    sx={{ width: '100%', maxHeight: 130, objectFit: 'cover', borderBottom: 1, borderColor: 'divider' }}
                  />
                )}
                <Box flex={1} overflow="auto" p={1.5}>
                  {previewLoading && (
                    <Stack alignItems="center" py={3} spacing={1}>
                      <CircularProgress size={22} />
                      <Typography variant="caption" color="text.secondary">{t('addSubmodel.previewLoading')}</Typography>
                    </Stack>
                  )}
                  {previewError && !previewLoading && (
                    <Typography variant="caption" color="error">{previewError}</Typography>
                  )}
                  {previewTpl && !previewLoading && (
                    <>
                      <Typography variant="overline" color="text.disabled" display="block">
                        {t('addSubmodel.previewTitle')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.75} fontFamily="monospace">
                        {previewTpl.idShort} · {t('addSubmodel.previewCount', { count: countElements(previewTpl.elements) })}
                      </Typography>
                      <TemplateTree els={previewTpl.elements} depth={0} />
                    </>
                  )}
                </Box>
              </>
            );
          })() : tab === 'regulation' && regSelected ? (() => {
            const tpl = REGULATION_TEMPLATES.find(r => r.id === regSelected);
            if (!tpl) return null;
            return (
              <>
                <Stack direction="row" spacing={1} alignItems="center" p={1.75}
                  sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <GavelRounded color="secondary" fontSize="small" />
                  <Box minWidth={0} flex={1}>
                    <Typography variant="subtitle2" noWrap lineHeight={1.2}>{tpl.regulationName}</Typography>
                    <Typography variant="caption" color="text.disabled" fontFamily="monospace" noWrap display="block">
                      {tpl.regulation} · {tpl.legalBasis}
                    </Typography>
                  </Box>
                </Stack>
                <Box flex={1} overflow="auto" p={1.5}>
                  <Typography variant="overline" color="text.disabled" display="block">
                    {t('addSubmodel.previewTitle')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.75} fontFamily="monospace">
                    {tpl.idShort} · {t('addSubmodel.previewCount', { count: countElements(tpl.elements) })}
                  </Typography>
                  <TemplateTree els={tpl.elements} depth={0} />
                </Box>
              </>
            );
          })() : (
          <>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            p={1.75}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}>
              <SmartToyRounded sx={{ fontSize: 16 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" lineHeight={1.2}>
                {t('addSubmodel.assistant')}
              </Typography>
              <Typography
                variant="caption"
                fontFamily="monospace"
                color={
                  !chatbotUrl || liveChat.status === 'online' ? 'primary.main'
                    : liveChat.status === 'offline' ? 'error.main'
                    : 'text.secondary'
                }
              >
                {chatbotUrl ? t(`addSubmodel.chatStatus.${liveChat.status}`) : t('addSubmodel.online')}
              </Typography>
            </Box>
          </Stack>

          <Box flex={1} overflow="auto" p={1.75} display="flex" flexDirection="column" gap={1}>
            {displayedMessages.map((m, i) => (
              <Box
                key={i}
                display="flex"
                justifyContent={m.role === 'user' ? 'flex-end' : 'flex-start'}
              >
                <Paper
                  sx={{
                    maxWidth: '88%',
                    p: 1.25,
                    bgcolor: m.role === 'user' ? 'primary.main' : 'background.paper',
                    color: m.role === 'user' ? 'primary.contrastText' : 'text.primary',
                    borderRadius:
                      m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  }}
                  elevation={0}
                >
                  <Typography variant="caption" whiteSpace="pre-wrap" lineHeight={1.6}>
                    {renderBoldText(m.text)}
                  </Typography>
                </Paper>
              </Box>
            ))}
            {chatBusy && (
              <Box display="flex" justifyContent="flex-start">
                <Paper sx={{ p: 1.25, borderRadius: '12px 12px 12px 2px' }} elevation={0}>
                  <CircularProgress size={14} />
                </Paper>
              </Box>
            )}
            <Box ref={chatEndRef} />
          </Box>

          <Stack
            direction="row"
            spacing={0.75}
            p={1.5}
            sx={{ borderTop: 1, borderColor: 'divider' }}
          >
            <TextField
              size="small"
              fullWidth
              value={chatInput}
              placeholder={t('addSubmodel.chatPlaceholder')}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setChatInput(e.target.value)}
              onKeyDown={(e: KeyboardEvent) => e.key === 'Enter' && sendChat()}
            />
            <IconButton color="primary" onClick={sendChat} sx={{ flexShrink: 0 }}>
              <SendRounded />
            </IconButton>
          </Stack>
          </>
          )}
        </Box>
      </DialogContent>

      {/* Nested element builder for the Custom tab (same form as the editor) */}
      <ElementFormDialog
        open={Boolean(elementForm)}
        onClose={() => setElementForm(null)}
        mode={elementForm?.mode ?? 'create'}
        initial={elementForm?.mode === 'edit' ? customElements[elementForm.index] : undefined}
        onSave={(el) => {
          setCustomElements(prev =>
            elementForm?.mode === 'edit'
              ? prev.map((x, i) => (i === elementForm.index ? el : x))
              : [...prev, el]);
        }}
      />
    </Dialog>
  );
}
