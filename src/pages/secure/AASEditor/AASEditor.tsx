import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  AccountTreeRounded,
  AddRounded,
  CheckRounded,
  DeleteRounded,
  ExpandMoreRounded,
  FileDownloadRounded,
  FormatListBulletedRounded,
} from '@mui/icons-material';

import { useAASContext, validateAAS, MOCK_AAS_DB } from '@/context/AASContext';
import { useDialogContext } from '@/context/DialogContext';
import type { SubmodelTemplate, XsdValueType, ValidationResult } from '@/context/AASContext';

import ValidationDialog from './dialogs/ValidationDialog';
import AddSubmodelDialog from './dialogs/AddSubmodelDialog';

// ── Types ─────────────────────────────────────────────────────────────────────
type EditorView = 'list' | 'graph';

// ═══════════════════════
// GRAPH VIEW
// ═══════════════════════

function GraphView({ aasId, sms }: { aasId: string; sms: SubmodelTemplate[] }) {
  const W = 900;
  const maxEl = sms.reduce((a, s) => Math.max(a, (s.elements || []).length), 0);
  const H = Math.max(500, 120 + sms.length * 60 + maxEl * 38);
  const cx = W / 2, cy = 50;
  const n = sms.length;
  const sp = Math.min(210, (W - 120) / (n || 1));
  const sx0 = cx - (n - 1) * sp / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', minHeight: 460 }}>
      <defs>
        <marker id="ar" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto">
          <polygon points="0 0,10 3.5,0 7" fill="#6366f1" opacity=".5" />
        </marker>
      </defs>
      <rect x={cx - 90} y={cy - 22} width={180} height={44} rx={10} fill="#1a2040" stroke="#6366f1" strokeWidth="2" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#6366f1" fontSize="9" fontFamily="monospace" fontWeight="600">AAS</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#e8ecf2" fontSize="11" fontFamily="sans-serif" fontWeight="600">
        {aasId.replace('AAS_', '')}
      </text>
      {sms.map((sm, idx) => {
        const x = sx0 + idx * sp, y = 160;
        const ey0 = y + 55;
        return (
          <g key={sm.id}>
            <line x1={cx} y1={cy + 22} x2={x} y2={y - 20} stroke="#6366f1" strokeWidth="1.5" opacity=".3" markerEnd="url(#ar)" />
            <rect x={x - 75} y={y - 20} width={150} height={40} rx={8} fill="#10291a" stroke="#10b981" strokeWidth="1.5" />
            <text x={x} y={y - 3} textAnchor="middle" fill="#10b981" fontSize="8" fontFamily="monospace" fontWeight="600">SUBMODEL</text>
            <text x={x} y={y + 10} textAnchor="middle" fill="#e8ecf2" fontSize="10" fontFamily="sans-serif" fontWeight="600">{sm.idShort}</text>
            {(sm.elements || []).slice(0, 9).map((el, ei) => {
              const ey = ey0 + ei * 36;
              const c = el.type === 'SubmodelElementCollection' ? '#f5a623' : el.type === 'Operation' ? '#50a0ff' : '#a0aec0';
              const bg = el.type === 'SubmodelElementCollection' ? '#291f10' : el.type === 'Operation' ? '#0f1a2a' : '#151a22';
              const abbr = el.type === 'Property' ? 'P' : el.type === 'SubmodelElementCollection' ? 'C' : el.type === 'MultiLanguageProperty' ? 'MLP' : el.type === 'File' ? 'F' : '?';
              return (
                <g key={ei}>
                  <line x1={x} y1={y + 20} x2={x} y2={ey - 10} stroke={c} strokeWidth="1" opacity=".15" strokeDasharray={ei ? '3,3' : ''} />
                  <rect x={x - 65} y={ey - 12} width={130} height={24} rx={6} fill={bg} stroke={c} strokeWidth="1" opacity=".8" />
                  <text x={x - 53} y={ey + 2} fill={c} fontSize="7" fontFamily="monospace" opacity=".7">{abbr}</text>
                  <text x={x - 40} y={ey + 2} fill="#e8ecf2" fontSize="9" fontFamily="sans-serif">
                    {el.idShort.length > 13 ? el.idShort.slice(0, 13) + '…' : el.idShort}
                  </text>
                  {el.required && <circle cx={x + 58} cy={ey} r={3} fill="#f05252" />}
                </g>
              );
            })}
          </g>
        );
      })}
      {!sms.length && (
        <text x={cx} y={cy + 80} textAnchor="middle" fill="#3d4a5c" fontSize="12" fontFamily="sans-serif">
          Nessun submodel
        </text>
      )}
    </svg>
  );
}

// ═══════════════════════
// VALIDATION PANEL → ./dialogs/ValidationDialog.tsx
// ADD SUBMODEL DIALOG → ./dialogs/AddSubmodelDialog.tsx
// ═══════════════════════

// ═══════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════

const XSD_TYPES: XsdValueType[] = ['xs:string', 'xs:int', 'xs:double', 'xs:float', 'xs:boolean', 'xs:date', 'xs:dateTime', 'xs:anyURI', 'xs:duration'];

export default function AASEditor() {
  const {
    selectedModelId, setSelectedModelId,
    currentModel, currentVersion,
    submodels, aasIdShort, setAasIdShort,
    aasAssetId, setAasAssetId,
    aasDescription, setAasDescription,
    addSubmodel, removeSubmodel, updateElement,
  } = useAASContext();

  const { setHandlers } = useDialogContext();

  const [editorView, setEditorView] = useState<EditorView>('list');
  const [expandedSubmodels, setExpandedSubmodels] = useState<Set<string>>(new Set([submodels[0]?.id]));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [valResult, setValResult] = useState<ValidationResult | null>(null);

  // Register secondary menu handlers
  useState(() => {
    setHandlers({
      onValidateAAS: () => setValResult(validateAAS({ idShort: aasIdShort, assetId: aasAssetId }, submodels)),
      onAddSubmodel: () => setShowAddDialog(true),
      onExportAASX: () => {
        const data = JSON.stringify({ idShort: aasIdShort, assetId: aasAssetId, submodels }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${aasIdShort}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
    return () => setHandlers({});
  });

  const toggleSubmodel = (id: string) => {
    setExpandedSubmodels(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Toolbar ── */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ px: 3, py: 1.25, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}
      >
        <FormControl size="small">
          <Select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            sx={{ fontFamily: 'monospace', fontSize: 11 }}
          >
            {MOCK_AAS_DB.map(m => (
              <MenuItem key={m.id} value={m.id} sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                {m.idShort.replace('AAS_', '')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Chip
          size="small"
          label={`${currentVersion.status} v${currentVersion.version}`}
          color={currentVersion.status === 'Active' ? 'success' : currentVersion.status === 'Draft' ? 'warning' : 'default'}
          variant="outlined"
        />

        <Box flexGrow={1} />

        <ToggleButtonGroup
          size="small"
          exclusive
          value={editorView}
          onChange={(_, v) => v && setEditorView(v as EditorView)}
        >
          <ToggleButton value="list">
            <FormatListBulletedRounded sx={{ fontSize: 16, mr: 0.5 }} /> Lista
          </ToggleButton>
          <ToggleButton value="graph">
            <AccountTreeRounded sx={{ fontSize: 16, mr: 0.5 }} /> Grafo
          </ToggleButton>
        </ToggleButtonGroup>

        <Button
          variant="contained"
          color="success"
          size="small"
          startIcon={<CheckRounded />}
          onClick={() => setValResult(validateAAS({ idShort: aasIdShort, assetId: aasAssetId }, submodels))}
        >
          Validate
        </Button>

        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<FileDownloadRounded />}
        >
          Export AASX
        </Button>
      </Stack>

      {/* ── Content ── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: AAS Properties */}
        <Box
          sx={{
            width: 280,
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflowY: 'auto',
            p: 2.25,
            flexShrink: 0,
          }}
        >
          <Typography variant="overline" color="text.disabled" display="block" mb={1.5}>
            AAS Properties
          </Typography>
          <Stack spacing={1.5}>
            {([
              ['idShort', aasIdShort, setAasIdShort],
              ['globalAssetId', aasAssetId, setAasAssetId],
              ['description', aasDescription, setAasDescription],
            ] as [string, string, (v: string) => void][]).map(([label, value, setter]) => (
              <TextField
                key={label}
                label={label}
                value={value}
                onChange={(e) => setter(e.target.value)}
                size="small"
                multiline={label === 'description'}
                rows={label === 'description' ? 2 : undefined}
                inputProps={{ style: { fontFamily: 'monospace', fontSize: 11 } }}
              />
            ))}
            <TextField
              label="assetKind"
              value={currentModel.assetKind}
              size="small"
              inputProps={{ readOnly: true, style: { fontFamily: 'monospace', fontSize: 11 } }}
            />
          </Stack>

          <Paper variant="outlined" sx={{ mt: 2.5, p: 1.5 }}>
            <Typography variant="overline" color="text.disabled" display="block" mb={1}>
              Stats
            </Typography>
            {([
              ['Submodels', submodels.length],
              ['Properties', submodels.flatMap(s => s.elements).filter(e => e.type === 'Property').length],
              ['Collections', submodels.flatMap(s => s.elements).filter(e => e.type === 'SubmodelElementCollection').length],
            ] as [string, number][]).map(([k, v]) => (
              <Stack key={k} direction="row" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary" fontFamily="monospace">{k}</Typography>
                <Typography variant="caption" color="primary.main" fontFamily="monospace">{v}</Typography>
              </Stack>
            ))}
          </Paper>
        </Box>

        {/* Right: Drop zone */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            border: '2px dashed',
            borderColor: dragOver ? 'primary.main' : 'transparent',
            bgcolor: dragOver ? 'rgba(99,102,241,.04)' : 'background.default',
            transition: 'all .2s',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.getData('nt') === 'Submodel') setShowAddDialog(true);
          }}
        >
          {editorView === 'graph' ? (
            <GraphView aasId={aasIdShort} sms={submodels} />
          ) : (
            <>
              {!submodels.length && !dragOver && (
                <Stack alignItems="center" justifyContent="center" height="100%" spacing={0.75}>
                  <Typography fontSize={36}>🟩</Typography>
                  <Typography variant="body2" fontWeight={500} color="text.disabled">Trascina un Submodel qui</Typography>
                  <Typography variant="caption" fontFamily="monospace" color="text.disabled">oppure clicca + sotto</Typography>
                </Stack>
              )}

              {submodels.map(sm => {
                const isOpen = expandedSubmodels.has(sm.id);
                return (
                  <Paper key={sm.id} variant="outlined" sx={{ mb: 1.5, overflow: 'hidden' }}>
                    {/* Submodel header */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.25}
                      sx={{
                        px: 2.25, py: 1.75,
                        cursor: 'pointer',
                        borderBottom: isOpen ? 1 : 0,
                        borderColor: 'divider',
                      }}
                      onClick={() => toggleSubmodel(sm.id)}
                    >
                      <Typography fontSize={14}>🟩</Typography>
                      <Box flex={1} minWidth={0}>
                        <Typography variant="body2" fontWeight={600} noWrap>{sm.idShort}</Typography>
                        <Typography variant="caption" color="text.disabled" fontFamily="monospace" display="block" noWrap>
                          {sm.semanticId}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={`${sm.elements?.length || 0} el`}
                        color="primary"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontSize: 10 }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); removeSubmodel(sm.id); }}
                        sx={{ color: 'text.disabled' }}
                      >
                        <DeleteRounded sx={{ fontSize: 15 }} />
                      </IconButton>
                      <ExpandMoreRounded
                        sx={{
                          color: 'text.secondary',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                          fontSize: 18,
                        }}
                      />
                    </Stack>

                    {/* Elements */}
                    {isOpen && (
                      <Box sx={{ p: 1.5 }}>
                        {(sm.elements || []).map((el, ei) => {
                          const typeColor: 'default' | 'warning' | 'info' =
                            el.type === 'SubmodelElementCollection' ? 'warning' :
                            el.type === 'Operation' ? 'info' : 'default';
                          return (
                            <Paper key={ei} variant="outlined" sx={{ p: 1.5, mb: 0.75 }}>
                              <Stack direction="row" alignItems="center" spacing={1} mb={el.type === 'Property' ? 1 : 0}>
                                <Chip
                                  size="small"
                                  label={el.type}
                                  color={typeColor}
                                  variant="outlined"
                                  sx={{ fontFamily: 'monospace', fontSize: 9, height: 18 }}
                                />
                                <Typography variant="caption" fontWeight={600} fontFamily="monospace">
                                  {el.idShort}
                                </Typography>
                                {el.required && (
                                  <Typography variant="caption" color="error.main" fontWeight={700} sx={{ fontSize: 9 }}>
                                    REQ
                                  </Typography>
                                )}
                                <Box flex={1} />
                                {el.semanticId && (
                                  <Typography variant="caption" color="text.disabled" fontFamily="monospace" sx={{ fontSize: 9 }}>
                                    {el.semanticId}
                                  </Typography>
                                )}
                              </Stack>

                              {el.type === 'Property' && (
                                <Stack direction="row" spacing={1}>
                                  <TextField
                                    size="small"
                                    value={typeof el.value === 'string' ? el.value : ''}
                                    onChange={(e) => updateElement(sm.id, ei, 'value', e.target.value)}
                                    placeholder={`valore (${el.valueType || 'string'})…`}
                                    inputProps={{ style: { fontFamily: 'monospace', fontSize: 10 } }}
                                    sx={{ flex: 1 }}
                                  />
                                  <FormControl size="small" sx={{ minWidth: 130 }}>
                                    <Select
                                      value={el.valueType || 'xs:string'}
                                      onChange={(e) => updateElement(sm.id, ei, 'valueType', e.target.value)}
                                      sx={{ fontFamily: 'monospace', fontSize: 10 }}
                                    >
                                      {XSD_TYPES.map(t => (
                                        <MenuItem key={t} value={t} sx={{ fontFamily: 'monospace', fontSize: 10 }}>{t}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Stack>
                              )}

                              {el.type === 'SubmodelElementCollection' && el.children && (
                                <Box sx={{ mt: 0.75, pl: 1.5, borderLeft: '2px solid', borderColor: 'divider' }}>
                                  {el.children.map((ch, ci) => (
                                    <Typography key={ci} variant="caption" fontFamily="monospace" color="text.disabled" display="block" py={0.25}>
                                      <Box component="span" color="text.secondary">{ch.idShort}</Box>
                                      {' : '}{ch.type}
                                      {ch.required && <Box component="span" color="error.main"> *</Box>}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                            </Paper>
                          );
                        })}
                        {!(sm.elements || []).length && (
                          <Typography variant="caption" fontFamily="monospace" color="text.disabled" textAlign="center" display="block" py={2.5}>
                            Submodel vuoto
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Paper>
                );
              })}

              <Button
                variant="outlined"
                fullWidth
                startIcon={<AddRounded />}
                onClick={() => setShowAddDialog(true)}
                sx={{ mt: 1, borderStyle: 'dashed', fontFamily: 'monospace' }}
              >
                Aggiungi Submodel
              </Button>
            </>
          )}
        </Box>
      </Box>

      <AddSubmodelDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} onAdd={addSubmodel} />
      <ValidationDialog open={!!valResult} res={valResult} onClose={() => setValResult(null)} />
    </Box>
  );
}
