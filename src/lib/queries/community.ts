import { supabase } from '../supabaseClient';

// Community data access. All authorization is enforced server-side by RLS
// (see supabase/migrations/20261112010000_community.sql); the client only
// mirrors those rules to decide which controls to show.

export interface Profile {
  user_id: string;
  display_name: string;
}

export interface CommunitySummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  career_slug: string | null;
  member_count: number;
  post_count: number;
  is_member: boolean;
}

export interface CommunityPost {
  id: string;
  community_id: string | null;
  opportunity_id: string | null;
  author_id: string;
  title: string;
  body: string;
  is_hidden: boolean;
  created_at: string;
  author_name: string;
  comment_count: number;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  is_hidden: boolean;
  created_at: string;
  author_name: string;
}

export type ReportReason = 'spam' | 'harassment' | 'scam' | 'misinformation' | 'off_topic' | 'other';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam or advertising',
  harassment: 'Harassment or abuse',
  scam: 'Scam or fraudulent opportunity',
  misinformation: 'Misleading information',
  off_topic: 'Off-topic',
  other: 'Other',
};

export type ReportStatus = 'open' | 'resolved' | 'dismissed';

export interface ContentReport {
  id: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  created_at: string;
  post: (Omit<CommunityPost, 'comment_count'>) | null;
  comment: CommunityComment | null;
}

// ── helpers ──────────────────────────────────────────────────────────────

function n(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

/** Turns PostgREST / Postgres errors into short user-facing messages. */
export function friendlyError(error: { code?: string; message: string }): Error {
  if (error.code === 'PGRST202' || error.code === '42P01' || /could not find the (function|table)/i.test(error.message)) {
    return new Error('Community features are not installed in the database yet.');
  }
  if (error.code === '42501' || /row-level security/i.test(error.message)) {
    return new Error("You don't have permission to do that.");
  }
  if (error.code === '23505') return new Error('That already exists.');
  if (error.code === '23514') return new Error('Please check the length of what you entered.');
  if (error.code === 'P0001') return new Error(error.message);
  return new Error(error.message);
}

const POST_SELECT =
  'id, community_id, opportunity_id, author_id, title, body, is_hidden, created_at, author:profiles(display_name), community_comments(count)';

type Row = Record<string, unknown>;

function authorName(row: Row): string {
  const author = row.author as { display_name?: string } | { display_name?: string }[] | null;
  const a = Array.isArray(author) ? author[0] : author;
  return a?.display_name ?? 'Former member';
}

function mapPost(row: Row): CommunityPost {
  const counts = row.community_comments as { count: number }[] | undefined;
  return {
    id: String(row.id),
    community_id: (row.community_id as string | null) ?? null,
    opportunity_id: (row.opportunity_id as string | null) ?? null,
    author_id: String(row.author_id),
    title: String(row.title),
    body: String(row.body),
    is_hidden: Boolean(row.is_hidden),
    created_at: String(row.created_at),
    author_name: authorName(row),
    comment_count: n(counts?.[0]?.count),
  };
}

function mapComment(row: Row): CommunityComment {
  return {
    id: String(row.id),
    post_id: String(row.post_id),
    author_id: String(row.author_id),
    body: String(row.body),
    is_hidden: Boolean(row.is_hidden),
    created_at: String(row.created_at),
    author_name: authorName(row),
  };
}

// ── profiles ─────────────────────────────────────────────────────────────

export async function getOwnProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('user_id, display_name').eq('user_id', userId).maybeSingle();
  if (error) throw friendlyError(error);
  return data;
}

export async function saveDisplayName(userId: string, displayName: string, exists: boolean): Promise<void> {
  const name = displayName.trim();
  const { error } = exists
    ? await supabase.from('profiles').update({ display_name: name }).eq('user_id', userId)
    : await supabase.from('profiles').insert({ user_id: userId, display_name: name });
  if (error) {
    if (error.code === '23505') throw new Error('That display name is taken. Please choose another.');
    throw friendlyError(error);
  }
}

// ── communities ──────────────────────────────────────────────────────────

export async function listCommunities(): Promise<CommunitySummary[]> {
  const { data, error } = await supabase.rpc('community_summaries');
  if (error) throw friendlyError(error);
  return ((data ?? []) as Row[]).map((r) => ({
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    description: String(r.description ?? ''),
    career_slug: (r.career_slug as string | null) ?? null,
    member_count: n(r.member_count),
    post_count: n(r.post_count),
    is_member: Boolean(r.is_member),
  }));
}

export async function joinCommunity(communityId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('community_members').insert({ community_id: communityId, user_id: userId });
  if (error && error.code !== '23505') throw friendlyError(error);
}

export async function leaveCommunity(communityId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('community_members').delete().eq('community_id', communityId).eq('user_id', userId);
  if (error) throw friendlyError(error);
}

// ── posts ────────────────────────────────────────────────────────────────

export async function listCommunityPosts(communityId: string): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('community_posts')
    .select(POST_SELECT)
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw friendlyError(error);
  return ((data ?? []) as Row[]).map(mapPost);
}

export async function listOpportunityPosts(opportunityId: string): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('community_posts')
    .select(POST_SELECT)
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw friendlyError(error);
  return ((data ?? []) as Row[]).map(mapPost);
}

export async function getPost(postId: string): Promise<CommunityPost | null> {
  const { data, error } = await supabase.from('community_posts').select(POST_SELECT).eq('id', postId).maybeSingle();
  if (error) throw friendlyError(error);
  return data ? mapPost(data as Row) : null;
}

export async function createPost(input: {
  authorId: string;
  title: string;
  body: string;
  communityId?: string;
  opportunityId?: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      author_id: input.authorId,
      title: input.title.trim(),
      body: input.body.trim(),
      community_id: input.communityId ?? null,
      opportunity_id: input.opportunityId ?? null,
    })
    .select('id')
    .single();
  if (error) throw friendlyError(error);
  return String(data.id);
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('community_posts').delete().eq('id', postId);
  if (error) throw friendlyError(error);
}

// ── comments ─────────────────────────────────────────────────────────────

export async function listComments(postId: string): Promise<CommunityComment[]> {
  const { data, error } = await supabase
    .from('community_comments')
    .select('id, post_id, author_id, body, is_hidden, created_at, author:profiles(display_name)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(500);
  if (error) throw friendlyError(error);
  return ((data ?? []) as Row[]).map(mapComment);
}

export async function createComment(postId: string, authorId: string, body: string): Promise<void> {
  const { error } = await supabase.from('community_comments').insert({ post_id: postId, author_id: authorId, body: body.trim() });
  if (error) throw friendlyError(error);
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('community_comments').delete().eq('id', commentId);
  if (error) throw friendlyError(error);
}

// ── reports ──────────────────────────────────────────────────────────────

export async function reportContent(input: {
  reporterId: string;
  target: { postId: string } | { commentId: string };
  reason: ReportReason;
  details: string;
}): Promise<'reported' | 'already_reported'> {
  const { error } = await supabase.from('content_reports').insert({
    reporter_id: input.reporterId,
    post_id: 'postId' in input.target ? input.target.postId : null,
    comment_id: 'commentId' in input.target ? input.target.commentId : null,
    reason: input.reason,
    details: input.details.trim(),
  });
  if (error) {
    if (error.code === '23505') return 'already_reported';
    throw friendlyError(error);
  }
  return 'reported';
}

// ── admin moderation (RLS restricts all of these to admins) ──────────────

export async function listReportsForAdmin(status: ReportStatus): Promise<ContentReport[]> {
  const { data, error } = await supabase
    .from('content_reports')
    .select(
      'id, reason, details, status, created_at, ' +
        'post:community_posts(id, community_id, opportunity_id, author_id, title, body, is_hidden, created_at, author:profiles(display_name)), ' +
        'comment:community_comments(id, post_id, author_id, body, is_hidden, created_at, author:profiles(display_name))',
    )
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw friendlyError(error);
  return ((data ?? []) as unknown as Row[]).map((r) => {
    const post = r.post as Row | null;
    const comment = r.comment as Row | null;
    return {
      id: String(r.id),
      reason: r.reason as ReportReason,
      details: String(r.details ?? ''),
      status: r.status as ReportStatus,
      created_at: String(r.created_at),
      post: post ? (({ comment_count: _c, ...rest }) => rest)(mapPost(post)) : null,
      comment: comment ? mapComment(comment) : null,
    };
  });
}

export async function setContentHidden(target: 'post' | 'comment', id: string, hidden: boolean): Promise<void> {
  const table = target === 'post' ? 'community_posts' : 'community_comments';
  const { error } = await supabase.from(table).update({ is_hidden: hidden }).eq('id', id);
  if (error) throw friendlyError(error);
}

/** Marks every open report for the same content as resolved/dismissed. */
export async function closeReportsFor(
  target: { postId: string } | { commentId: string },
  status: 'resolved' | 'dismissed',
  adminId: string,
): Promise<void> {
  const column = 'postId' in target ? 'post_id' : 'comment_id';
  const value = 'postId' in target ? target.postId : target.commentId;
  const { error } = await supabase
    .from('content_reports')
    .update({ status, resolved_at: new Date().toISOString(), resolved_by: adminId })
    .eq(column, value)
    .eq('status', 'open');
  if (error) throw friendlyError(error);
}

export async function reopenReport(reportId: string): Promise<void> {
  const { error } = await supabase
    .from('content_reports')
    .update({ status: 'open', resolved_at: null, resolved_by: null })
    .eq('id', reportId);
  if (error) throw friendlyError(error);
}
