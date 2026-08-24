export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      jobs: {
        Row: {
          applied_status: boolean
          company: string | null
          company_logo: string | null
          created_at: string
          description: string | null
          experience_level: string | null
          fetched_at: string
          id: string
          job_type: string | null
          job_url: string
          location: string | null
          match_score: number
          platform: string
          salary: string | null
          saved_status: boolean
          source_url: string
          tags: Json
          title: string
          user_id: string
        }
        Insert: {
          applied_status?: boolean
          company?: string | null
          company_logo?: string | null
          created_at?: string
          description?: string | null
          experience_level?: string | null
          fetched_at?: string
          id?: string
          job_type?: string | null
          job_url: string
          location?: string | null
          match_score?: number
          platform: string
          salary?: string | null
          saved_status?: boolean
          source_url: string
          tags?: Json
          title: string
          user_id: string
        }
        Update: {
          applied_status?: boolean
          company?: string | null
          company_logo?: string | null
          created_at?: string
          description?: string | null
          experience_level?: string | null
          fetched_at?: string
          id?: string
          job_type?: string | null
          job_url?: string
          location?: string | null
          match_score?: number
          platform?: string
          salary?: string | null
          saved_status?: boolean
          source_url?: string
          tags?: Json
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          created_at: string
          id: string
          issue_date: string | null
          issuer: string | null
          name: string
          sort_order: number
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_date?: string | null
          issuer?: string | null
          name: string
          sort_order?: number
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_date?: string | null
          issuer?: string | null
          name?: string
          sort_order?: number
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      education_entries: {
        Row: {
          created_at: string
          degree: string | null
          description: string | null
          end_date: string | null
          field_of_study: string | null
          id: string
          institution: string
          sort_order: number
          start_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          degree?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          institution: string
          sort_order?: number
          start_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          degree?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          institution?: string
          sort_order?: number
          start_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_links: {
        Row: {
          created_at: string
          id: string
          label: string
          sort_order: number
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          sort_order?: number
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_skills: {
        Row: {
          created_at: string
          id: string
          skill: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          skill: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          skill?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          github_url: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          onboarding_completed: boolean
          phone: string | null
          portfolio_url: string | null
          professional_summary: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          id: string
          linkedin_url?: string | null
          location?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          portfolio_url?: string | null
          professional_summary?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          portfolio_url?: string | null
          professional_summary?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
          technologies: string[]
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          technologies?: string[]
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          technologies?: string[]
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          is_primary: boolean
          mime_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          is_primary?: boolean
          mime_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          is_primary?: boolean
          mime_type?: string
          user_id?: string
        }
        Relationships: []
      }
      work_experiences: {
        Row: {
          company: string
          created_at: string
          end_date: string | null
          id: string
          is_current: boolean
          responsibilities: string[]
          sort_order: number
          start_date: string | null
          title: string
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          responsibilities?: string[]
          sort_order?: number
          start_date?: string | null
          title: string
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          responsibilities?: string[]
          sort_order?: number
          start_date?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
