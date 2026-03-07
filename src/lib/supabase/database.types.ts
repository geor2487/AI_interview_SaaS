export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      members: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          role: "admin" | "interviewer";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          role: "admin" | "interviewer";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          role?: "admin" | "interviewer";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "members_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      candidates: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string;
          name: string;
          email: string;
          status:
            | "invited"
            | "scheduled"
            | "interviewed"
            | "evaluated"
            | "rejected"
            | "accepted";
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
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id: string;
          name: string;
          email: string;
          status?:
            | "invited"
            | "scheduled"
            | "interviewed"
            | "evaluated"
            | "rejected"
            | "accepted";
          date_of_birth?: string | null;
          gender?: string | null;
          phone?: string | null;
          location?: string | null;
          desired_position?: string | null;
          desired_salary?: string | null;
          available_from?: string | null;
          self_introduction?: string | null;
          profile_image_url?: string | null;
          profile_completion?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string;
          name?: string;
          email?: string;
          status?:
            | "invited"
            | "scheduled"
            | "interviewed"
            | "evaluated"
            | "rejected"
            | "accepted";
          date_of_birth?: string | null;
          gender?: string | null;
          phone?: string | null;
          location?: string | null;
          desired_position?: string | null;
          desired_salary?: string | null;
          available_from?: string | null;
          self_introduction?: string | null;
          profile_image_url?: string | null;
          profile_completion?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidates_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "candidates_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      question_sets: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_sets_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          question_set_id: string;
          order_index: number;
          content: string;
          evaluation_criteria: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_set_id: string;
          order_index: number;
          content: string;
          evaluation_criteria?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_set_id?: string;
          order_index?: number;
          content?: string;
          evaluation_criteria?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_question_set_id_fkey";
            columns: ["question_set_id"];
            referencedRelation: "question_sets";
            referencedColumns: ["id"];
          },
        ];
      };
      interviews: {
        Row: {
          id: string;
          organization_id: string;
          candidate_id: string;
          status: "pending" | "in_progress" | "completed" | "evaluated";
          current_question_index: number;
          scheduled_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          invite_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          candidate_id: string;
          status?: "pending" | "in_progress" | "completed" | "evaluated";
          current_question_index?: number;
          scheduled_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          invite_token?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          candidate_id?: string;
          status?: "pending" | "in_progress" | "completed" | "evaluated";
          current_question_index?: number;
          scheduled_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          invite_token?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interviews_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interviews_candidate_id_fkey";
            columns: ["candidate_id"];
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
        ];
      };
      interview_question_sets: {
        Row: {
          id: string;
          interview_id: string;
          question_set_id: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          interview_id: string;
          question_set_id: string;
          order_index: number;
        };
        Update: {
          id?: string;
          interview_id?: string;
          question_set_id?: string;
          order_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: "interview_question_sets_interview_id_fkey";
            columns: ["interview_id"];
            referencedRelation: "interviews";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interview_question_sets_question_set_id_fkey";
            columns: ["question_set_id"];
            referencedRelation: "question_sets";
            referencedColumns: ["id"];
          },
        ];
      };
      transcripts: {
        Row: {
          id: string;
          interview_id: string;
          question_id: string | null;
          speaker: "ai" | "candidate";
          content: string;
          timestamp_ms: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          interview_id: string;
          question_id?: string | null;
          speaker: "ai" | "candidate";
          content: string;
          timestamp_ms: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          interview_id?: string;
          question_id?: string | null;
          speaker?: "ai" | "candidate";
          content?: string;
          timestamp_ms?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transcripts_interview_id_fkey";
            columns: ["interview_id"];
            referencedRelation: "interviews";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transcripts_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      evaluations: {
        Row: {
          id: string;
          interview_id: string;
          question_id: string | null;
          ai_score: number | null;
          ai_comment: string | null;
          manual_score: number | null;
          manual_comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          interview_id: string;
          question_id?: string | null;
          ai_score?: number | null;
          ai_comment?: string | null;
          manual_score?: number | null;
          manual_comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          interview_id?: string;
          question_id?: string | null;
          ai_score?: number | null;
          ai_comment?: string | null;
          manual_score?: number | null;
          manual_comment?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evaluations_interview_id_fkey";
            columns: ["interview_id"];
            referencedRelation: "interviews";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evaluations_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      recordings: {
        Row: {
          id: string;
          interview_id: string;
          storage_path: string;
          duration_ms: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          interview_id: string;
          storage_path: string;
          duration_ms: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          interview_id?: string;
          storage_path?: string;
          duration_ms?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recordings_interview_id_fkey";
            columns: ["interview_id"];
            referencedRelation: "interviews";
            referencedColumns: ["id"];
          },
        ];
      };
      candidate_careers: {
        Row: {
          id: string;
          candidate_id: string;
          title: string;
          company: string;
          period_start: string;
          period_end: string | null;
          description: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          title: string;
          company: string;
          period_start: string;
          period_end?: string | null;
          description?: string;
          order_index: number;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          title?: string;
          company?: string;
          period_start?: string;
          period_end?: string | null;
          description?: string;
          order_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_careers_candidate_id_fkey";
            columns: ["candidate_id"];
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
        ];
      };
      candidate_educations: {
        Row: {
          id: string;
          candidate_id: string;
          institution: string;
          department: string;
          period_start: string;
          period_end: string | null;
          description: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          institution: string;
          department: string;
          period_start: string;
          period_end?: string | null;
          description?: string;
          order_index: number;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          institution?: string;
          department?: string;
          period_start?: string;
          period_end?: string | null;
          description?: string;
          order_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_educations_candidate_id_fkey";
            columns: ["candidate_id"];
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
        ];
      };
      candidate_skills: {
        Row: {
          id: string;
          candidate_id: string;
          name: string;
          level: number;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          name: string;
          level: number;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          name?: string;
          level?: number;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_skills_candidate_id_fkey";
            columns: ["candidate_id"];
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
        ];
      };
      candidate_documents: {
        Row: {
          id: string;
          candidate_id: string;
          name: string;
          storage_path: string;
          size_bytes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          name: string;
          storage_path: string;
          size_bytes: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          name?: string;
          storage_path?: string;
          size_bytes?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_documents_candidate_id_fkey";
            columns: ["candidate_id"];
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          organization_id: string;
          candidate_id: string;
          sender_id: string;
          sender_type: "admin" | "interviewer" | "candidate" | "system";
          content: string;
          read_at: string | null;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          candidate_id: string;
          sender_id: string;
          sender_type: "admin" | "interviewer" | "candidate" | "system";
          content: string;
          read_at?: string | null;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          candidate_id?: string;
          sender_id?: string;
          sender_type?: "admin" | "interviewer" | "candidate" | "system";
          content?: string;
          read_at?: string | null;
          parent_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_candidate_id_fkey";
            columns: ["candidate_id"];
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_org_member: {
        Args: { org_id: string };
        Returns: boolean;
      };
      is_candidate_self: {
        Args: { cand_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
