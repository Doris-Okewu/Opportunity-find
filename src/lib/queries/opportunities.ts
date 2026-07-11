import { supabase } from '../supabaseClient';
import type { Opportunity, OpportunityInput } from '../../types/opportunity';

export async function listPublishedOpportunities(): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('is_published', true)
    .order('deadline', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

export async function listAllOpportunitiesForAdmin(): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const { data, error } = await supabase.from('opportunities').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createOpportunity(input: OpportunityInput): Promise<Opportunity> {
  const { data, error } = await supabase.from('opportunities').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateOpportunity(id: string, input: Partial<OpportunityInput>): Promise<Opportunity> {
  const { data, error } = await supabase.from('opportunities').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteOpportunity(id: string): Promise<void> {
  const { error } = await supabase.from('opportunities').delete().eq('id', id);
  if (error) throw error;
}
