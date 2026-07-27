import { useState, useEffect, useRef, type ChangeEvent, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormLabel,
  Grow,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Alert,
} from '@mui/material';
import {
  AddRounded,
  AutoAwesomeRounded,
  CloseRounded,
  FileUploadRounded,
  PictureAsPdfRounded,
  UploadFileRounded,
} from '@mui/icons-material';
import type { AASModel, AssetKind, SubmodelTemplate } from '@/context/AASContext';
import { useApiManager } from '@/api/apiManger';
import { mapElement } from '@/utils/aas-mapper';
import { registerTemplate } from '@/utils/template-registry';
import { REGULATION_TEMPLATES } from '@/utils/regulation-templates';
import {
  type CatalogEntry,
  fetchCatalog,
  fetchSubmodelTemplate,
  getCachedCatalog,
} from '@/utils/idta-catalog';

type Mode = 'create' | 'import' | 'pdf';

// AI extraction (POST /v1/extract) response payload
interface ExtractedField { path: string; value: string; confidence: number; evidence: string }
interface ExtractResult {
  shell: { idShort: string; assetId: string; description: string; assetKind: AssetKind };
  submodels: SubmodelTemplate[];
  fields: ExtractedField[];
  provider: string;
  pages?: number;
}

/** Option of the extraction target multi-select ("reg:<id>" | "idta:<id>"). */
interface PdfTplOption { key: string; label: string; group: string }

interface AddEntityDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: { idShort: string; assetId: string; description: string; assetKind: AssetKind }) => void;
  onImport: (model: AASModel) => void;
}

function parseAasJson(raw: unknown): AASModel {
  const data = raw as any;
  const shell = data.assetAdministrationShells?.[0];
  if (!shell) throw new Error(i18next.t('addEntity.errNoShell'));

  return {
    id: shell.id || `imported-${Date.now()}`,
    idShort: shell.idShort || 'Imported_AAS',
    assetId: shell.assetInformation?.globalAssetId || '',
    description: shell.description?.[0]?.text || '',
    assetKind: (shell.assetInformation?.assetKind as AssetKind) || 'Instance',
    versions: [],
    isImported: true,
    submodels: ((data.submodels || []) as any[]).map((sm): SubmodelTemplate => ({
      id: sm.id,
      idShort: sm.idShort,
      semanticId: sm.semanticId?.keys?.[0]?.value || '',
      description: sm.description?.[0]?.text || '',
      category: 'Imported',
      elements: ((sm.submodelElements || []) as any[]).map(mapElement),
    })),
  };
}

export default function AddEntityDialog({ open, onClose, onAdd, onImport }: AddEntityDialogProps) {
  const { t } = useTranslation();
  const api = useApiManager();
  const [mode, setMode] = useState<Mode>('create');

  // create form state
  const [idShort, setIdShort] = useState('');
  const [assetId, setAssetId] = useState('urn:');
  const [description, setDescription] = useState('');
  const [assetKind, setAssetKind] = useState<AssetKind>('Instance');

  // import state
  const [dragOver, setDragOver] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<AASModel | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // pdf-extraction state
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfTpls, setPdfTpls] = useState<PdfTplOption[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractResult, setExtractResult] = useState<ExtractResult | null>(null);

  const canAdd = idShort.trim().length > 0 && assetId.trim().length > 0;

  const reset = () => {
    setIdShort('');
    setAssetId('urn:');
    setDescription('');
    setAssetKind('Instance');
    setImportError(null);
    setImportPreview(null);
    setDragOver(false);
    setPdfFile(null);
    setPdfTpls([]);
    setExtracting(false);
    setExtractError(null);
    setExtractResult(null);
    setMode('create');
  };

  // The extraction target picker needs the IDTA catalog; load it lazily the
  // first time the PDF mode is shown (module cache makes re-opens instant).
  useEffect(() => {
    if (!open || mode !== 'pdf') return;
    const cached = getCachedCatalog();
    if (cached) { setCatalog(cached); return; }
    setCatalogLoading(true);
    fetchCatalog(api)
      .then(setCatalog)
      .catch(() => setCatalog([]))
      .finally(() => setCatalogLoading(false));
  }, [open, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const tplOptions: PdfTplOption[] = [
    ...REGULATION_TEMPLATES.map(r => ({
      key: `reg:${r.id}`,
      label: `${r.regulationName} · ${r.regulation}`,
      group: t('addEntity.pdf.groupRegulation'),
    })),
    ...catalog.filter(e => e.fileType === 'Template').map(e => ({
      key: `idta:${e.id}`,
      label: `${e.name} v${e.version}${e.idtaCode ? ` · ${e.idtaCode}` : ''}`,
      group: t('addEntity.pdf.groupIdta'),
    })),
  ];

  // Resolve the selected options to full templates (reg local, idta fetched).
  const resolveTemplates = async (): Promise<SubmodelTemplate[]> => {
    const out: SubmodelTemplate[] = [];
    for (const opt of pdfTpls) {
      if (opt.key.startsWith('reg:')) {
        const tpl = REGULATION_TEMPLATES.find(r => r.id === opt.key.slice(4));
        if (tpl) { registerTemplate(tpl); out.push(tpl); }
      } else if (opt.key.startsWith('idta:')) {
        const entry = catalog.find(e => e.id === opt.key.slice(5));
        if (entry) out.push(await fetchSubmodelTemplate(entry));
      }
    }
    return out;
  };

  const handleExtract = async () => {
    if (!pdfFile || pdfTpls.length === 0) return;
    setExtracting(true);
    setExtractError(null);
    setExtractResult(null);
    try {
      const templates = await resolveTemplates();
      if (!templates.length) throw new Error(t('addEntity.pdf.templatesNotFound'));
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('templates', JSON.stringify(templates));
      const { data } = await api.post<{ status: string; message?: string; data: ExtractResult }>(
        '/v1/extract', formData,
      );
      if (!data?.data?.submodels) throw new Error(data?.message || 'Invalid response');
      setExtractResult(data.data);
    } catch (e: unknown) {
      const axiosMsg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setExtractError(axiosMsg || (e instanceof Error ? e.message : String(e)));
    } finally {
      setExtracting(false);
    }
  };

  const handleCreateFromPdf = () => {
    if (!extractResult) return;
    const { shell, submodels } = extractResult;
    const now = Date.now();
    const idShortSafe = /^[a-zA-Z_]\w*$/.test(shell.idShort) ? shell.idShort : 'ImportedFromPdf';
    onImport({
      id: `aas-pdf-${now}`,
      idShort: idShortSafe,
      assetId: shell.assetId || '',
      description: shell.description || '',
      assetKind: shell.assetKind === 'Type' ? 'Type' : 'Instance',
      versions: [{
        version: '1.0.0', revision: 'A', date: new Date().toISOString(), status: 'Draft',
        author: 'AI Import', changes: t('addEntity.pdf.initialCommit', { file: pdfFile?.name ?? 'PDF' }), details: [],
      }],
      submodels: submodels.map((sm, i) => ({ ...sm, id: `${sm.semanticId}:inst:${now}-${i}` })),
      dirty: true,
    });
    handleClose();
  };

  const handleClose = () => { reset(); onClose(); };

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd({ idShort: idShort.trim(), assetId: assetId.trim(), description, assetKind });
    handleClose();
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setImportError(t('addEntity.errNotJson'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const model = parseAasJson(parsed);
        setImportPreview(model);
        setImportError(null);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : t('addEntity.errParse'));
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = () => {
    if (!importPreview) return;
    onImport(importPreview);
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={(_: unknown, reason: string) => { if (reason !== 'backdropClick') handleClose(); }}
      fullWidth
      maxWidth="sm"
      slots={{ transition: Grow }}
      slotProps={{ transition: { timeout: 250 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <AddRounded />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>{t('addEntity.title')}</Typography>
          <Typography variant="caption" color="text.disabled" fontFamily="monospace">
            {mode === 'create'
              ? t('addEntity.subtitleCreate')
              : mode === 'import'
                ? t('addEntity.subtitleImport')
                : t('addEntity.subtitlePdf')}
          </Typography>
        </Box>
        <Box flexGrow={1} />
        <IconButton size="small" onClick={handleClose}>
          <CloseRounded fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box px={3} pb={1}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => { if (v) { setMode(v); setImportError(null); setImportPreview(null); } }}
          size="small"
          fullWidth
        >
          <ToggleButton value="create" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
            <AddRounded fontSize="small" sx={{ mr: 0.5 }} />
            {t('addEntity.tabCreate')}
          </ToggleButton>
          <ToggleButton value="import" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
            <FileUploadRounded fontSize="small" sx={{ mr: 0.5 }} />
            {t('addEntity.tabImport')}
          </ToggleButton>
          <ToggleButton value="pdf" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
            <PictureAsPdfRounded fontSize="small" sx={{ mr: 0.5 }} />
            {t('addEntity.tabPdf')}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <DialogContent>
        {mode === 'create' ? (
          <Stack spacing={2} pt={1}>
            <Box>
              <FormLabel sx={{ fontSize: 11, mb: 0.5, display: 'block' }}>idShort *</FormLabel>
              <TextField
                size="small"
                fullWidth
                value={idShort}
                placeholder="MyDevice"
                onChange={(e: ChangeEvent<HTMLInputElement>) => setIdShort(e.target.value)}
                slotProps={{ input: { style: { fontFamily: 'monospace', fontSize: 12 } } }}
              />
            </Box>

            <Box>
              <FormLabel sx={{ fontSize: 11, mb: 0.5, display: 'block' }}>globalAssetId *</FormLabel>
              <TextField
                size="small"
                fullWidth
                value={assetId}
                placeholder="urn:org:device:type:serial"
                onChange={(e: ChangeEvent<HTMLInputElement>) => setAssetId(e.target.value)}
                slotProps={{ input: { style: { fontFamily: 'monospace', fontSize: 12 } } }}
              />
            </Box>

            <Box>
              <FormLabel sx={{ fontSize: 11, mb: 0.5, display: 'block' }}>description</FormLabel>
              <TextField
                size="small"
                fullWidth
                multiline
                rows={3}
                value={description}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
              />
            </Box>

            <Box>
              <FormLabel sx={{ fontSize: 11, mb: 0.5, display: 'block' }}>assetKind</FormLabel>
              <Select
                size="small"
                fullWidth
                value={assetKind}
                onChange={(e) => setAssetKind(e.target.value as AssetKind)}
                sx={{ fontFamily: 'monospace', fontSize: 12 }}
              >
                <MenuItem value="Instance">Instance</MenuItem>
                <MenuItem value="Type">Type</MenuItem>
              </Select>
            </Box>
          </Stack>
        ) : mode === 'import' ? (
          <Stack spacing={2} pt={1}>
            <Box
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: 2,
                borderStyle: 'dashed',
                borderColor: dragOver ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: dragOver ? 'action.hover' : 'background.default',
                transition: 'all 0.15s ease',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}
            >
              <UploadFileRounded sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {t('addEntity.dropText')}
              </Typography>
              <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                {t('addEntity.formatCaption')}
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </Box>

            {importError && (
              <Alert severity="error" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                {importError}
              </Alert>
            )}

            {importPreview && (
              <Alert severity="success" sx={{ fontSize: 12 }}>
                <Typography variant="caption" fontWeight={700} display="block">
                  {t('addEntity.detected', { name: importPreview.idShort })}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontFamily="monospace" display="block">
                  assetId: {importPreview.assetId || '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('addEntity.submodelsFound', { count: importPreview.submodels.length })}
                </Typography>
              </Alert>
            )}
          </Stack>
        ) : (
          <Stack spacing={2} pt={1}>
            <Typography variant="body2" color="text.secondary">
              {t('addEntity.pdf.intro')}
            </Typography>

            {/* 1 · target submodels */}
            <Autocomplete
              multiple
              size="small"
              options={tplOptions}
              groupBy={(o) => o.group}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(a, b) => a.key === b.key}
              value={pdfTpls}
              onChange={(_, v) => { setPdfTpls(v); setExtractResult(null); }}
              loading={catalogLoading}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip {...getTagProps({ index })} key={option.key} label={option.label} size="small" />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('addEntity.pdf.templatesLabel')}
                  placeholder={pdfTpls.length === 0 ? t('addEntity.pdf.templatesPlaceholder') : undefined}
                />
              )}
            />

            {/* 2 · PDF upload */}
            <Box
              component="label"
              sx={{
                border: 2,
                borderStyle: 'dashed',
                borderColor: pdfFile ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: 'background.default',
                display: 'block',
                transition: 'all 0.15s ease',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}
            >
              <input
                type="file"
                hidden
                accept="application/pdf,.pdf"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const f = e.target.files?.[0] ?? null;
                  setPdfFile(f);
                  setExtractResult(null);
                  setExtractError(null);
                  e.target.value = '';
                }}
              />
              {pdfFile ? (
                <>
                  <PictureAsPdfRounded color="primary" sx={{ fontSize: 32, mb: 0.5 }} />
                  <Typography variant="body2" fontWeight={600}>{pdfFile.name}</Typography>
                  <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB · {t('addEntity.pdf.changeFile')}
                  </Typography>
                </>
              ) : (
                <>
                  <UploadFileRounded sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">{t('addEntity.pdf.dropText')}</Typography>
                  <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                    {t('addEntity.pdf.maxSize')}
                  </Typography>
                </>
              )}
            </Box>

            {/* 3 · extract */}
            <Button
              variant="outlined"
              disabled={!pdfFile || pdfTpls.length === 0 || extracting}
              startIcon={extracting ? <CircularProgress size={14} /> : <AutoAwesomeRounded />}
              onClick={handleExtract}
            >
              {extracting ? t('addEntity.pdf.extracting') : t('addEntity.pdf.extractBtn')}
            </Button>

            {extractError && (
              <Alert severity="error" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                {extractError}
              </Alert>
            )}

            {/* 4 · review */}
            {extractResult && (
              <>
                <Alert severity="success" sx={{ fontSize: 12 }}>
                  <Typography variant="caption" fontWeight={700} display="block">
                    {t('addEntity.detected', { name: extractResult.shell.idShort || '—' })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontFamily="monospace" display="block">
                    assetId: {extractResult.shell.assetId || '—'} · {extractResult.shell.assetKind}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t('addEntity.pdf.extractDone', {
                      count: extractResult.fields.length,
                      submodels: extractResult.submodels.length,
                      provider: extractResult.provider,
                    })}
                  </Typography>
                </Alert>
                <Box sx={{ maxHeight: 180, overflow: 'auto' }}>
                  {extractResult.fields.map((f, i) => {
                    const pct = Math.round(f.confidence * 100);
                    const color = f.confidence >= 0.8 ? 'success' : f.confidence >= 0.5 ? 'warning' : 'error';
                    return (
                      <Stack key={i} direction="row" spacing={0.75} alignItems="center"
                        sx={{ py: 0.4, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" fontFamily="monospace" noWrap sx={{ flex: 1, minWidth: 0 }}>
                          {f.path}
                        </Typography>
                        <Typography variant="caption" noWrap sx={{ maxWidth: '35%' }}>
                          {f.value}
                        </Typography>
                        <Chip label={`${pct}%`} size="small" color={color} variant="outlined"
                          sx={{ fontSize: 9, height: 18 }} />
                      </Stack>
                    );
                  })}
                </Box>
              </>
            )}
          </Stack>
        )}
      </DialogContent>

      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={1}
        p={1.5}
        sx={{ borderTop: 1, borderColor: 'divider' }}
      >
        <Button onClick={handleClose}>{t('common.buttons.cancel')}</Button>
        {mode === 'create' ? (
          <Button
            variant="contained"
            disabled={!canAdd}
            startIcon={<AddRounded />}
            onClick={handleAdd}
          >
            {t('common.buttons.create')}
          </Button>
        ) : mode === 'import' ? (
          <Button
            variant="contained"
            disabled={!importPreview}
            startIcon={<FileUploadRounded />}
            onClick={handleImport}
          >
            {t('common.buttons.import')}
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={!extractResult}
            startIcon={<AddRounded />}
            onClick={handleCreateFromPdf}
          >
            {t('addEntity.pdf.createBtn')}
          </Button>
        )}
      </Stack>
    </Dialog>
  );
}
