import { useApiWrapper } from '@/api/apiWrapper';

// ── Types ──────────────────────────────────────────────────────────────────

export type CommitStatus = 'Draft' | 'Active' | 'Deprecated';
export type ChangeType = 'added' | 'modified' | 'removed';

export interface CommitDiff {
  diff_id: number;
  commit_id: number;
  change_type: ChangeType;
  target: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface CommitAuthor {
  operator_id: number;
  user: { user_id: number; name: string; surname: string; email: string };
}

export interface AASCommit {
  commit_id: number;
  document_id: number;
  commit_hash: string;
  version: string;
  revision: string;
  status: CommitStatus;
  message: string;
  author_id: number;
  parent_commit_id: number | null;
  snapshot_hash: string | null;
  createdAt: string;
  diffs?: CommitDiff[];
  author?: CommitAuthor;
  snapshot?: { hash: string; content: any };
}

export interface AASRef {
  document_id: number;
  ref_name: string;
  commit_id: number | null;
  commit?: Pick<AASCommit, 'commit_id' | 'commit_hash' | 'version' | 'revision' | 'status' | 'message' | 'createdAt'>;
}

export interface AASDocument {
  document_id: number;
  id_short: string;
  aas_id: string;
  asset_id: string;
  asset_kind: 'Instance' | 'Type';
  description: string | null;
  organization_id: number;
  created_by: number;
  createdAt: string;
  updatedAt: string;
  head?: AASCommit | null;
  refs?: AASRef[];
}

export interface DiffResult {
  added: { path: string; value: any }[];
  removed: { path: string; value: any }[];
  changed: { path: string; from: any; to: any }[];
}

// ── Hook ──────────────────────────────────────────────────────────────────

export const useAASVersioning = () => {
  const api = useApiWrapper();
  const BASE = '/v1/aas';

  // ── Documents ─────────────────────────────────────────────────────────

  const listDocuments = () =>
    api.get<{ total: number; documents: AASDocument[] }>(BASE);

  const createDocument = (body: {
    id_short: string;
    aas_id: string;
    asset_id: string;
    asset_kind?: 'Instance' | 'Type';
    description?: string;
    version?: string;
    revision?: string;
    message?: string;
    content?: any;
    diffs?: Omit<CommitDiff, 'diff_id' | 'commit_id'>[];
  }) => api.post<{ document: AASDocument; commit: AASCommit; refs: string[] }>(BASE, body);

  const getDocument = (documentId: number) =>
    api.get<{ document: AASDocument; head: AASCommit | null; refs: AASRef[] }>(`${BASE}/${documentId}`);

  const deleteDocument = (documentId: number) =>
    api.delete(`${BASE}/${documentId}`);

  // ── Versioning ────────────────────────────────────────────────────────

  /** git log — full commit history, newest first */
  const getLog = (documentId: number, params?: { ref?: string; status?: CommitStatus }) => {
    const query = new URLSearchParams();
    if (params?.ref) query.set('ref', params.ref);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return api.get<{ total: number; commits: AASCommit[] }>(`${BASE}/${documentId}/log${qs ? `?${qs}` : ''}`);
  };

  /** git show — single commit with snapshot + diffs */
  const showCommit = (documentId: number, commitId: number) =>
    api.get<{ commit: AASCommit }>(`${BASE}/${documentId}/commits/${commitId}`);

  /** Read snapshot content for HEAD or a specific commit/ref (read-only checkout) */
  const checkout = (documentId: number, params?: { commit_id?: number; ref?: string }) => {
    const query = new URLSearchParams();
    if (params?.commit_id) query.set('commit_id', String(params.commit_id));
    if (params?.ref) query.set('ref', params.ref);
    const qs = query.toString();
    return api.get<{ commit_id: number; commit_hash: string; version: string; revision: string; status: CommitStatus; content: any }>(
      `${BASE}/${documentId}/checkout${qs ? `?${qs}` : ''}`
    );
  };

  /** git commit — create a new commit on HEAD */
  const commitSubmodel = (documentId: number, body: {
    message: string;
    content?: any;
    diffs?: Omit<CommitDiff, 'diff_id' | 'commit_id'>[];
    version?: string;
    revision?: string;
    status?: CommitStatus;
    ref?: string;
  }) => api.post<{ commit: AASCommit; snapshot_hash: string | null; ref_advanced: string }>(`${BASE}/${documentId}/commit`, body);

  /** git diff — structural comparison of two commits */
  const diffCommits = (documentId: number, commitIdA: number, commitIdB: number) =>
    api.get<{ from: AASCommit; to: AASCommit; diff: DiffResult }>(`${BASE}/${documentId}/diff/${commitIdA}/${commitIdB}`);

  /** git revert — new commit restoring a past snapshot */
  const restoreCommit = (documentId: number, commitId: number, body?: { message?: string; status?: CommitStatus }) =>
    api.post<{ commit: AASCommit; restored_from: string }>(`${BASE}/${documentId}/restore/${commitId}`, body ?? {});

  /** Change lifecycle status of a commit (Draft → Active → Deprecated) */
  const setCommitStatus = (documentId: number, commitId: number, status: CommitStatus) =>
    api.put<{ commit_id: number; commit_hash: string; status: CommitStatus }>(
      `${BASE}/${documentId}/commits/${commitId}/status`, { status }
    );

  // ── Refs / Branches ───────────────────────────────────────────────────

  const listRefs = (documentId: number) =>
    api.get<{ refs: AASRef[] }>(`${BASE}/${documentId}/refs`);

  /** git branch <name> [<start-point>] */
  const createBranch = (documentId: number, branchName: string, commitId?: number) =>
    api.post<{ ref: AASRef; commit: Pick<AASCommit, 'commit_id' | 'commit_hash'> }>(
      `${BASE}/${documentId}/branches`,
      { branch_name: branchName, ...(commitId ? { commit_id: commitId } : {}) }
    );

  /** git switch <branch> */
  const switchBranch = (documentId: number, branchName: string, commitId?: number) =>
    api.put<{ ref_name: string; commit_id: number }>(
      `${BASE}/${documentId}/branches/${encodeURIComponent(branchName)}/head`,
      commitId ? { commit_id: commitId } : {}
    );

  return {
    listDocuments,
    createDocument,
    getDocument,
    deleteDocument,
    getLog,
    showCommit,
    checkout,
    commitSubmodel,
    diffCommits,
    restoreCommit,
    setCommitStatus,
    listRefs,
    createBranch,
    switchBranch,
  };
};
