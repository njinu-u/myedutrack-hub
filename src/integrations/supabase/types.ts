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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          linked_student_id: string | null
          phone_number: string | null
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          linked_student_id?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          linked_student_id?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_users_linked_student_id_fkey"
            columns: ["linked_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          id: string
          notes: string | null
          parent_user_id: string
          requested_at: string
          scheduled_at: string | null
          school_id: string
          status: Database["public"]["Enums"]["appointment_status"]
          student_id: string
          teacher_user_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          parent_user_id: string
          requested_at?: string
          scheduled_at?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
          student_id: string
          teacher_user_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          parent_user_id?: string
          requested_at?: string
          scheduled_at?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          student_id?: string
          teacher_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_teacher_user_id_fkey"
            columns: ["teacher_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          date: string
          id: string
          recorded_at: string
          recorded_by: string | null
          school_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          date: string
          id?: string
          recorded_at?: string
          recorded_by?: string | null
          school_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          date?: string
          id?: string
          recorded_at?: string
          recorded_by?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      counselor_flags: {
        Row: {
          created_at: string
          flagged_by: string | null
          id: string
          reason: string
          resolved_at: string | null
          school_id: string
          severity: Database["public"]["Enums"]["flag_severity"]
          student_id: string
        }
        Insert: {
          created_at?: string
          flagged_by?: string | null
          id?: string
          reason: string
          resolved_at?: string | null
          school_id: string
          severity?: Database["public"]["Enums"]["flag_severity"]
          student_id: string
        }
        Update: {
          created_at?: string
          flagged_by?: string | null
          id?: string
          reason?: string
          resolved_at?: string | null
          school_id?: string
          severity?: Database["public"]["Enums"]["flag_severity"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "counselor_flags_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counselor_flags_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counselor_flags_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          entered_at: string
          entered_by: string | null
          id: string
          max_score: number
          school_id: string
          score: number
          student_id: string
          subject: string
          term: string | null
        }
        Insert: {
          entered_at?: string
          entered_by?: string | null
          id?: string
          max_score?: number
          school_id: string
          score: number
          student_id: string
          subject: string
          term?: string | null
        }
        Update: {
          entered_at?: string
          entered_by?: string | null
          id?: string
          max_score?: number
          school_id?: string
          score?: number
          student_id?: string
          subject?: string
          term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          from_user_id: string
          id: string
          language_code: string | null
          read_at: string | null
          school_id: string
          sent_at: string
          subject: string | null
          to_user_id: string
        }
        Insert: {
          body: string
          from_user_id: string
          id?: string
          language_code?: string | null
          read_at?: string | null
          school_id: string
          sent_at?: string
          subject?: string | null
          to_user_id: string
        }
        Update: {
          body?: string
          from_user_id?: string
          id?: string
          language_code?: string | null
          read_at?: string | null
          school_id?: string
          sent_at?: string
          subject?: string | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_checkins: {
        Row: {
          checked_at: string
          id: string
          mood: number
          note: string | null
          school_id: string
          student_id: string
        }
        Insert: {
          checked_at?: string
          id?: string
          mood: number
          note?: string | null
          school_id: string
          student_id: string
        }
        Update: {
          checked_at?: string
          id?: string
          mood?: number
          note?: string | null
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_checkins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mood_checkins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read_at: string | null
          related_id: string | null
          school_id: string
          to_user_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read_at?: string | null
          related_id?: string | null
          school_id: string
          to_user_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read_at?: string | null
          related_id?: string | null
          school_id?: string
          to_user_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          ai_suggestions: string | null
          created_at: string
          id: string
          note: string
          school_id: string
          student_id: string
          subject: string | null
          tags: string[] | null
          teacher_id: string
        }
        Insert: {
          ai_suggestions?: string | null
          created_at?: string
          id?: string
          note: string
          school_id: string
          student_id: string
          subject?: string | null
          tags?: string[] | null
          teacher_id: string
        }
        Update: {
          ai_suggestions?: string | null
          created_at?: string
          id?: string
          note?: string
          school_id?: string
          student_id?: string
          subject?: string | null
          tags?: string[] | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "observations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      school_invitations: {
        Row: {
          code: string
          created_at: string
          email: string | null
          expires_at: string
          id: string
          linked_student_id: string | null
          name: string | null
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          status: string
          token: string
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          linked_student_id?: string | null
          name?: string | null
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          status?: string
          token?: string
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          linked_student_id?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string
          status?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_invitations_linked_student_id_fkey"
            columns: ["linked_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_invitations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          activated_at: string | null
          admin_email: string
          admin_user_id: string | null
          country: string | null
          created_at: string
          id: string
          is_paid: boolean
          name: string
          paddle_customer_id: string | null
          paddle_transaction_id: string | null
          paid_until: string | null
          paypal_order_id: string | null
          pilot_start_date: string
          plan: Database["public"]["Enums"]["school_plan"]
          status: Database["public"]["Enums"]["school_status"]
          student_count: number | null
          trial_expires_at: string | null
        }
        Insert: {
          activated_at?: string | null
          admin_email: string
          admin_user_id?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_paid?: boolean
          name: string
          paddle_customer_id?: string | null
          paddle_transaction_id?: string | null
          paid_until?: string | null
          paypal_order_id?: string | null
          pilot_start_date?: string
          plan?: Database["public"]["Enums"]["school_plan"]
          status?: Database["public"]["Enums"]["school_status"]
          student_count?: number | null
          trial_expires_at?: string | null
        }
        Update: {
          activated_at?: string | null
          admin_email?: string
          admin_user_id?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_paid?: boolean
          name?: string
          paddle_customer_id?: string | null
          paddle_transaction_id?: string | null
          paid_until?: string | null
          paypal_order_id?: string | null
          pilot_start_date?: string
          plan?: Database["public"]["Enums"]["school_plan"]
          status?: Database["public"]["Enums"]["school_status"]
          student_count?: number | null
          trial_expires_at?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          details: Json
          event_type: string
          id: string
          ip_address: string | null
          message: string
          school_id: string | null
          severity: string
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          ip_address?: string | null
          message: string
          school_id?: string | null
          severity?: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          ip_address?: string | null
          message?: string
          school_id?: string | null
          severity?: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          class_id: string | null
          created_at: string
          full_name: string
          grade: string | null
          id: string
          photo_url: string | null
          school_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          full_name: string
          grade?: string | null
          id?: string
          photo_url?: string | null
          school_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          full_name?: string
          grade?: string | null
          id?: string
          photo_url?: string | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_linked_student_id: { Args: never; Returns: string }
      current_school_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      list_school_staff: {
        Args: never
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      log_security_event: {
        Args: {
          _details?: Json
          _event_type: string
          _message: string
          _school_id?: string
          _severity: string
          _target_user_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "school_admin"
        | "teacher"
        | "counselor"
        | "parent"
        | "student"
      appointment_status: "pending" | "confirmed" | "declined"
      attendance_status: "present" | "absent" | "late"
      flag_severity: "low" | "medium" | "high"
      school_plan: "free_trial" | "school" | "district"
      school_status: "trial" | "active" | "expired" | "cancelled"
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
    Enums: {
      app_role: [
        "super_admin",
        "school_admin",
        "teacher",
        "counselor",
        "parent",
        "student",
      ],
      appointment_status: ["pending", "confirmed", "declined"],
      attendance_status: ["present", "absent", "late"],
      flag_severity: ["low", "medium", "high"],
      school_plan: ["free_trial", "school", "district"],
      school_status: ["trial", "active", "expired", "cancelled"],
    },
  },
} as const
