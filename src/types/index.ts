export type Role = "admin" | "interviewer";
export type CandidateStatus = "invited" | "scheduled" | "interviewed" | "evaluated" | "rejected" | "accepted";
export type InterviewStatus = "pending" | "in_progress" | "completed" | "evaluated";
export type SpeakerType = "ai" | "candidate";
export type SenderType = "admin" | "interviewer" | "candidate" | "system";

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface Member {
  id: string;
  user_id: string;
  organization_id: string;
  role: Role;
  created_at: string;
}

export interface Candidate {
  id: string;
  user_id: string | null;
  organization_id: string;
  name: string;
  email: string;
  status: CandidateStatus;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  location: string | null;
  desired_position: string | null;
  desired_salary: string | null;
  available_from: string | null;
  self_introduction: string | null;
  profile_image_url: string | null;
  profile_completion: number;
  created_at: string;
}

export interface QuestionSet {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  created_at: string;
  questions?: Question[];
}

export interface Question {
  id: string;
  question_set_id: string;
  order_index: number;
  content: string;
  evaluation_criteria: string;
  created_at: string;
}

export interface Interview {
  id: string;
  organization_id: string;
  candidate_id: string;
  status: InterviewStatus;
  current_question_index: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  invite_token: string;
  created_at: string;
  candidate?: Candidate;
  question_sets?: QuestionSet[];
}

export interface InterviewQuestionSet {
  id: string;
  interview_id: string;
  question_set_id: string;
  order_index: number;
}

export interface Transcript {
  id: string;
  interview_id: string;
  question_id: string | null;
  speaker: SpeakerType;
  content: string;
  timestamp_ms: number;
  created_at: string;
}

export interface Evaluation {
  id: string;
  interview_id: string;
  question_id: string | null;
  ai_score: number | null;
  ai_comment: string | null;
  manual_score: number | null;
  manual_comment: string | null;
  created_at: string;
}

export interface Recording {
  id: string;
  interview_id: string;
  storage_path: string;
  duration_ms: number;
  created_at: string;
}

export interface CandidateCareer {
  id: string;
  candidate_id: string;
  title: string;
  company: string;
  period_start: string;
  period_end: string | null;
  description: string;
  order_index: number;
}

export interface CandidateEducation {
  id: string;
  candidate_id: string;
  institution: string;
  department: string;
  period_start: string;
  period_end: string | null;
  description: string;
  order_index: number;
}

export interface CandidateSkill {
  id: string;
  candidate_id: string;
  name: string;
  level: number;
}

export interface CandidateDocument {
  id: string;
  candidate_id: string;
  name: string;
  storage_path: string;
  size_bytes: number;
  created_at: string;
}

export interface Message {
  id: string;
  organization_id: string;
  candidate_id: string;
  sender_id: string;
  sender_type: SenderType;
  content: string;
  read_at: string | null;
  parent_id: string | null;
  created_at: string;
}
