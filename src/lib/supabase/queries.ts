import { createClient } from './client'
import type {
  Organization,
  Member,
  Candidate,
  QuestionSet,
  Question,
  Interview,
  Transcript,
  Evaluation,
  Recording,
  CandidateCareer,
  CandidateEducation,
  CandidateSkill,
  CandidateDocument,
  Message,
  Role,
  SpeakerType,
  SenderType,
} from '@/types/index'

// ─── Organizations ───────────────────────────────────────────────

export async function getOrganization(orgId: string) {
  const supabase = createClient()
  return supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single<Organization>()
}

export async function updateOrganization(orgId: string, data: Partial<Organization>) {
  const supabase = createClient()
  return supabase
    .from('organizations')
    .update(data)
    .eq('id', orgId)
    .select()
    .single<Organization>()
}

// ─── Members ─────────────────────────────────────────────────────

export async function getMembers(orgId: string) {
  const supabase = createClient()
  return supabase
    .from('members')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })
    .returns<Member[]>()
}

export async function getCurrentMember() {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: null, error: userError ?? new Error('Not authenticated') }
  }

  return supabase
    .from('members')
    .select('*, organizations(*)')
    .eq('user_id', user.id)
    .single<Member & { organizations: Organization }>()
}

export async function inviteMember(orgId: string, email: string, role: Role) {
  const supabase = createClient()
  // Invite via Supabase auth, then create member record
  const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email)

  if (authError || !authData.user) {
    return { data: null, error: authError ?? new Error('Failed to invite user') }
  }

  return supabase
    .from('members')
    .insert({
      user_id: authData.user.id,
      organization_id: orgId,
      role,
    })
    .select()
    .single<Member>()
}

// ─── Candidates ──────────────────────────────────────────────────

export async function getCandidates(orgId: string) {
  const supabase = createClient()
  return supabase
    .from('candidates')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .returns<Candidate[]>()
}

export async function getCandidate(id: string) {
  const supabase = createClient()
  return supabase
    .from('candidates')
    .select('*')
    .eq('id', id)
    .single<Candidate>()
}

export async function createCandidate(data: {
  organization_id: string
  name: string
  email: string
}) {
  const supabase = createClient()
  return supabase
    .from('candidates')
    .insert(data)
    .select()
    .single<Candidate>()
}

export async function updateCandidate(id: string, data: Partial<Candidate>) {
  const supabase = createClient()
  return supabase
    .from('candidates')
    .update(data)
    .eq('id', id)
    .select()
    .single<Candidate>()
}

export async function deleteCandidate(id: string) {
  const supabase = createClient()
  return supabase
    .from('candidates')
    .delete()
    .eq('id', id)
}

// ─── Question Sets ───────────────────────────────────────────────

export async function getQuestionSets(orgId: string) {
  const supabase = createClient()
  return supabase
    .from('question_sets')
    .select('*, questions(*)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .returns<QuestionSet[]>()
}

export async function getQuestionSet(id: string) {
  const supabase = createClient()
  return supabase
    .from('question_sets')
    .select('*, questions(*)')
    .eq('id', id)
    .single<QuestionSet>()
}

export async function createQuestionSet(data: {
  organization_id: string
  title: string
  description: string
}) {
  const supabase = createClient()
  return supabase
    .from('question_sets')
    .insert(data)
    .select()
    .single<QuestionSet>()
}

export async function updateQuestionSet(id: string, data: Partial<QuestionSet>) {
  const supabase = createClient()
  return supabase
    .from('question_sets')
    .update(data)
    .eq('id', id)
    .select()
    .single<QuestionSet>()
}

export async function deleteQuestionSet(id: string) {
  const supabase = createClient()
  return supabase
    .from('question_sets')
    .delete()
    .eq('id', id)
}

// ─── Questions ───────────────────────────────────────────────────

export async function getQuestions(questionSetId: string) {
  const supabase = createClient()
  return supabase
    .from('questions')
    .select('*')
    .eq('question_set_id', questionSetId)
    .order('order_index', { ascending: true })
    .returns<Question[]>()
}

export async function createQuestion(data: {
  question_set_id: string
  order_index: number
  content: string
  evaluation_criteria: string
}) {
  const supabase = createClient()
  return supabase
    .from('questions')
    .insert(data)
    .select()
    .single<Question>()
}

export async function updateQuestion(id: string, data: Partial<Question>) {
  const supabase = createClient()
  return supabase
    .from('questions')
    .update(data)
    .eq('id', id)
    .select()
    .single<Question>()
}

export async function deleteQuestion(id: string) {
  const supabase = createClient()
  return supabase
    .from('questions')
    .delete()
    .eq('id', id)
}

export async function reorderQuestions(questionSetId: string, orderedIds: string[]) {
  const supabase = createClient()
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('questions')
      .update({ order_index: index })
      .eq('id', id)
      .eq('question_set_id', questionSetId)
  )

  const results = await Promise.all(updates)
  const firstError = results.find((r) => r.error)
  return { data: null, error: firstError?.error ?? null }
}

// ─── Interviews ──────────────────────────────────────────────────

export async function getInterviews(orgId: string) {
  const supabase = createClient()
  return supabase
    .from('interviews')
    .select('*, candidate:candidates(*)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .returns<Interview[]>()
}

export async function getInterview(id: string) {
  const supabase = createClient()
  return supabase
    .from('interviews')
    .select('*, candidate:candidates(*), interview_question_sets(*, question_set:question_sets(*, questions(*)))')
    .eq('id', id)
    .single<Interview>()
}

export async function getInterviewByToken(token: string) {
  const supabase = createClient()
  return supabase
    .from('interviews')
    .select('*, candidate:candidates(*), interview_question_sets(*, question_set:question_sets(*, questions(*)))')
    .eq('invite_token', token)
    .single<Interview>()
}

export async function createInterview(data: {
  organization_id: string
  candidate_id: string
  question_set_ids: string[]
  scheduled_at?: string
}) {
  const supabase = createClient()
  const { question_set_ids, ...interviewData } = data

  // Create the interview
  const { data: interview, error: interviewError } = await supabase
    .from('interviews')
    .insert(interviewData)
    .select()
    .single<Interview>()

  if (interviewError || !interview) {
    return { data: null, error: interviewError }
  }

  // Create junction records for question sets
  if (question_set_ids.length > 0) {
    const junctionRows = question_set_ids.map((qsId, index) => ({
      interview_id: interview.id,
      question_set_id: qsId,
      order_index: index,
    }))

    const { error: junctionError } = await supabase
      .from('interview_question_sets')
      .insert(junctionRows)

    if (junctionError) {
      return { data: null, error: junctionError }
    }
  }

  return { data: interview, error: null }
}

export async function updateInterview(id: string, data: Partial<Interview>) {
  const supabase = createClient()
  return supabase
    .from('interviews')
    .update(data)
    .eq('id', id)
    .select()
    .single<Interview>()
}

// ─── Transcripts ─────────────────────────────────────────────────

export async function getTranscripts(interviewId: string) {
  const supabase = createClient()
  return supabase
    .from('transcripts')
    .select('*')
    .eq('interview_id', interviewId)
    .order('timestamp_ms', { ascending: true })
    .returns<Transcript[]>()
}

export async function createTranscript(data: {
  interview_id: string
  question_id?: string
  speaker: SpeakerType
  content: string
  timestamp_ms: number
}) {
  const supabase = createClient()
  return supabase
    .from('transcripts')
    .insert(data)
    .select()
    .single<Transcript>()
}

// ─── Evaluations ─────────────────────────────────────────────────

export async function getEvaluations(interviewId: string) {
  const supabase = createClient()
  return supabase
    .from('evaluations')
    .select('*')
    .eq('interview_id', interviewId)
    .order('created_at', { ascending: true })
    .returns<Evaluation[]>()
}

export async function createEvaluation(data: Omit<Evaluation, 'id' | 'created_at'>) {
  const supabase = createClient()
  return supabase
    .from('evaluations')
    .insert(data)
    .select()
    .single<Evaluation>()
}

export async function updateEvaluation(id: string, data: Partial<Evaluation>) {
  const supabase = createClient()
  return supabase
    .from('evaluations')
    .update(data)
    .eq('id', id)
    .select()
    .single<Evaluation>()
}

// ─── Recordings ──────────────────────────────────────────────────

export async function getRecording(interviewId: string) {
  const supabase = createClient()
  return supabase
    .from('recordings')
    .select('*')
    .eq('interview_id', interviewId)
    .single<Recording>()
}

export async function uploadRecording(interviewId: string, file: Blob) {
  const supabase = createClient()
  const path = `recordings/${interviewId}/${Date.now()}.webm`

  const { error: uploadError } = await supabase.storage
    .from('recordings')
    .upload(path, file, { contentType: 'audio/webm' })

  if (uploadError) {
    return { data: null, error: uploadError }
  }

  return supabase
    .from('recordings')
    .insert({
      interview_id: interviewId,
      storage_path: path,
      duration_ms: 0, // Will be updated later
    })
    .select()
    .single<Recording>()
}

// ─── Candidate Careers ──────────────────────────────────────────

export async function getCandidateCareers(candidateId: string) {
  const supabase = createClient()
  return supabase
    .from('candidate_careers')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('order_index', { ascending: true })
    .returns<CandidateCareer[]>()
}

export async function createCandidateCareer(data: Omit<CandidateCareer, 'id'>) {
  const supabase = createClient()
  return supabase
    .from('candidate_careers')
    .insert(data)
    .select()
    .single<CandidateCareer>()
}

export async function updateCandidateCareer(id: string, data: Partial<CandidateCareer>) {
  const supabase = createClient()
  return supabase
    .from('candidate_careers')
    .update(data)
    .eq('id', id)
    .select()
    .single<CandidateCareer>()
}

export async function deleteCandidateCareer(id: string) {
  const supabase = createClient()
  return supabase
    .from('candidate_careers')
    .delete()
    .eq('id', id)
}

// ─── Candidate Educations ────────────────────────────────────────

export async function getCandidateEducations(candidateId: string) {
  const supabase = createClient()
  return supabase
    .from('candidate_educations')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('order_index', { ascending: true })
    .returns<CandidateEducation[]>()
}

export async function createCandidateEducation(data: Omit<CandidateEducation, 'id'>) {
  const supabase = createClient()
  return supabase
    .from('candidate_educations')
    .insert(data)
    .select()
    .single<CandidateEducation>()
}

export async function updateCandidateEducation(id: string, data: Partial<CandidateEducation>) {
  const supabase = createClient()
  return supabase
    .from('candidate_educations')
    .update(data)
    .eq('id', id)
    .select()
    .single<CandidateEducation>()
}

export async function deleteCandidateEducation(id: string) {
  const supabase = createClient()
  return supabase
    .from('candidate_educations')
    .delete()
    .eq('id', id)
}

// ─── Candidate Skills ────────────────────────────────────────────

export async function getCandidateSkills(candidateId: string) {
  const supabase = createClient()
  return supabase
    .from('candidate_skills')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('name', { ascending: true })
    .returns<CandidateSkill[]>()
}

export async function createCandidateSkill(data: Omit<CandidateSkill, 'id'>) {
  const supabase = createClient()
  return supabase
    .from('candidate_skills')
    .insert(data)
    .select()
    .single<CandidateSkill>()
}

export async function updateCandidateSkill(id: string, data: Partial<CandidateSkill>) {
  const supabase = createClient()
  return supabase
    .from('candidate_skills')
    .update(data)
    .eq('id', id)
    .select()
    .single<CandidateSkill>()
}

export async function deleteCandidateSkill(id: string) {
  const supabase = createClient()
  return supabase
    .from('candidate_skills')
    .delete()
    .eq('id', id)
}

// ─── Candidate Documents ─────────────────────────────────────────

export async function getCandidateDocuments(candidateId: string) {
  const supabase = createClient()
  return supabase
    .from('candidate_documents')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })
    .returns<CandidateDocument[]>()
}

export async function createCandidateDocument(data: Omit<CandidateDocument, 'id' | 'created_at'>) {
  const supabase = createClient()
  return supabase
    .from('candidate_documents')
    .insert(data)
    .select()
    .single<CandidateDocument>()
}

export async function deleteCandidateDocument(id: string) {
  const supabase = createClient()
  return supabase
    .from('candidate_documents')
    .delete()
    .eq('id', id)
}

// ─── Messages ────────────────────────────────────────────────────

export async function getMessages(candidateId: string, orgId: string) {
  const supabase = createClient()
  return supabase
    .from('messages')
    .select('*')
    .eq('candidate_id', candidateId)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })
    .returns<Message[]>()
}

export async function createMessage(data: {
  organization_id: string
  candidate_id: string
  sender_type: SenderType
  content: string
  parent_id?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return supabase
    .from('messages')
    .insert({
      ...data,
      sender_id: user?.id ?? '',
    })
    .select()
    .single<Message>()
}

export async function markMessageRead(id: string) {
  const supabase = createClient()
  return supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single<Message>()
}
