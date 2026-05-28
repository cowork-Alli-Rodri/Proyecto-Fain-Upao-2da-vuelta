export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      allowed_teachers: {
        Row: {
          added_at: string
          added_by: string | null
          email: string
          note: string | null
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          email: string
          note?: string | null
        }
        Update: {
          added_at?: string
          added_by?: string | null
          email?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "allowed_teachers_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymization_log: {
        Row: {
          affected_rows: number
          cycle_close_date_cutoff: string
          executed_at: string
          executor: string
          id: number
        }
        Insert: {
          affected_rows?: number
          cycle_close_date_cutoff: string
          executed_at?: string
          executor: string
          id?: number
        }
        Update: {
          affected_rows?: number
          cycle_close_date_cutoff?: string
          executed_at?: string
          executor?: string
          id?: number
        }
        Relationships: []
      }
      answers: {
        Row: {
          dimension_cuestionario_snapshot:
            | Database["public"]["Enums"]["dim_cuestionario_enum"]
            | null
          dimension_snapshot: Database["public"]["Enums"]["dim_tematica_enum"]
          id: string
          momento_snapshot: Database["public"]["Enums"]["momento_enum"]
          question_id: string
          question_snapshot: string
          responded_at: string
          student_id: string
          tipo_snapshot: Database["public"]["Enums"]["question_type_enum"]
          updated_at: string
          valor: Json
        }
        Insert: {
          dimension_cuestionario_snapshot?:
            | Database["public"]["Enums"]["dim_cuestionario_enum"]
            | null
          dimension_snapshot: Database["public"]["Enums"]["dim_tematica_enum"]
          id?: string
          momento_snapshot: Database["public"]["Enums"]["momento_enum"]
          question_id: string
          question_snapshot: string
          responded_at?: string
          student_id: string
          tipo_snapshot: Database["public"]["Enums"]["question_type_enum"]
          updated_at?: string
          valor: Json
        }
        Update: {
          dimension_cuestionario_snapshot?:
            | Database["public"]["Enums"]["dim_cuestionario_enum"]
            | null
          dimension_snapshot?: Database["public"]["Enums"]["dim_tematica_enum"]
          id?: string
          momento_snapshot?: Database["public"]["Enums"]["momento_enum"]
          question_id?: string
          question_snapshot?: string
          responded_at?: string
          student_id?: string
          tipo_snapshot?: Database["public"]["Enums"]["question_type_enum"]
          updated_at?: string
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          ciclo_cierre_at: string | null
          consent_version: string
          id: number
          jne_session_token: string | null
          jne_token_expires_at: string | null
        }
        Insert: {
          ciclo_cierre_at?: string | null
          consent_version?: string
          id: number
          jne_session_token?: string | null
          jne_token_expires_at?: string | null
        }
        Update: {
          ciclo_cierre_at?: string | null
          consent_version?: string
          id?: number
          jne_session_token?: string | null
          jne_token_expires_at?: string | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          cargo: string
          foto_url: string | null
          id: number
          id_organizacion_politica: number
          last_synced_at: string
          nombre_completo: string
          partido: string
          plan_pdf_url: string | null
          plan_resumen: string | null
        }
        Insert: {
          cargo?: string
          foto_url?: string | null
          id: number
          id_organizacion_politica: number
          last_synced_at?: string
          nombre_completo: string
          partido: string
          plan_pdf_url?: string | null
          plan_resumen?: string | null
        }
        Update: {
          cargo?: string
          foto_url?: string | null
          id?: number
          id_organizacion_politica?: number
          last_synced_at?: string
          nombre_completo?: string
          partido?: string
          plan_pdf_url?: string | null
          plan_resumen?: string | null
        }
        Relationships: []
      }
      consent_events: {
        Row: {
          accepted_data_use_at: string
          accepted_terms_at: string
          consent_version: string
          id: string
          ip_hash: string | null
          user_agent_hash: string | null
          user_id: string
        }
        Insert: {
          accepted_data_use_at: string
          accepted_terms_at: string
          consent_version: string
          id?: string
          ip_hash?: string | null
          user_agent_hash?: string | null
          user_id: string
        }
        Update: {
          accepted_data_use_at?: string
          accepted_terms_at?: string
          consent_version?: string
          id?: string
          ip_hash?: string | null
          user_agent_hash?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_checks: {
        Row: {
          candidato_relacionado: string | null
          contexto: string
          created_at: string
          created_by: string | null
          fact_checker_name: string
          fact_checker_url: string
          fecha_origen: string | null
          id: string
          published_at: string | null
          status: Database["public"]["Enums"]["fact_check_status_enum"]
          titular_falso: string
          updated_at: string
        }
        Insert: {
          candidato_relacionado?: string | null
          contexto: string
          created_at?: string
          created_by?: string | null
          fact_checker_name: string
          fact_checker_url: string
          fecha_origen?: string | null
          id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["fact_check_status_enum"]
          titular_falso: string
          updated_at?: string
        }
        Update: {
          candidato_relacionado?: string | null
          contexto?: string
          created_at?: string
          created_by?: string | null
          fact_checker_name?: string
          fact_checker_url?: string
          fecha_origen?: string | null
          id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["fact_check_status_enum"]
          titular_falso?: string
          updated_at?: string
        }
        Relationships: []
      }
      jne_refresh_log: {
        Row: {
          candidates_updated: number
          dimensions_updated: number
          error_message: string | null
          finished_at: string | null
          id: number
          started_at: string
          status: string
          triggered_by: string
        }
        Insert: {
          candidates_updated?: number
          dimensions_updated?: number
          error_message?: string | null
          finished_at?: string | null
          id?: number
          started_at?: string
          status: string
          triggered_by: string
        }
        Update: {
          candidates_updated?: number
          dimensions_updated?: number
          error_message?: string | null
          finished_at?: string | null
          id?: number
          started_at?: string
          status?: string
          triggered_by?: string
        }
        Relationships: []
      }
      post_surveys: {
        Row: {
          comentario: string | null
          dimension_top: Database["public"]["Enums"]["dimension_top_enum"]
          opinion_changed: Database["public"]["Enums"]["opinion_change_enum"]
          student_id: string
          submitted_at: string
          utility_rating: number
          would_recommend: boolean
        }
        Insert: {
          comentario?: string | null
          dimension_top: Database["public"]["Enums"]["dimension_top_enum"]
          opinion_changed: Database["public"]["Enums"]["opinion_change_enum"]
          student_id: string
          submitted_at?: string
          utility_rating: number
          would_recommend: boolean
        }
        Update: {
          comentario?: string | null
          dimension_top?: Database["public"]["Enums"]["dimension_top_enum"]
          opinion_changed?: Database["public"]["Enums"]["opinion_change_enum"]
          student_id?: string
          submitted_at?: string
          utility_rating?: number
          would_recommend?: boolean
        }
        Relationships: []
      }
      preferences: {
        Row: {
          candidato_preferido: string
          confianza: number
          id: string
          motivo: string | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          candidato_preferido: string
          confianza: number
          id?: string
          motivo?: string | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          candidato_preferido?: string
          confianza?: number
          id?: string
          motivo?: string | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "preferences_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          anonymized_at: string | null
          apellidos: string | null
          candidatos_completed_at: string | null
          candidatos_dimensions_viewed: string[]
          carrera: string | null
          ciclo: number | null
          created_at: string
          current_step: number
          current_step_post: number
          current_step_pre: number
          email: string | null
          email_institucional: boolean
          facultad: string | null
          genero: string | null
          id: string
          is_anonymized: boolean
          nombres: string | null
          questionnaire_completed_at: string | null
          questionnaire_post_completed_at: string | null
          questionnaire_pre_completed_at: string | null
          rango_edad: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          anonymized_at?: string | null
          apellidos?: string | null
          candidatos_completed_at?: string | null
          candidatos_dimensions_viewed?: string[]
          carrera?: string | null
          ciclo?: number | null
          created_at?: string
          current_step?: number
          current_step_post?: number
          current_step_pre?: number
          email?: string | null
          email_institucional?: boolean
          facultad?: string | null
          genero?: string | null
          id: string
          is_anonymized?: boolean
          nombres?: string | null
          questionnaire_completed_at?: string | null
          questionnaire_post_completed_at?: string | null
          questionnaire_pre_completed_at?: string | null
          rango_edad?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          anonymized_at?: string | null
          apellidos?: string | null
          candidatos_completed_at?: string | null
          candidatos_dimensions_viewed?: string[]
          carrera?: string | null
          ciclo?: number | null
          created_at?: string
          current_step?: number
          current_step_post?: number
          current_step_pre?: number
          email?: string | null
          email_institucional?: boolean
          facultad?: string | null
          genero?: string | null
          id?: string
          is_anonymized?: boolean
          nombres?: string | null
          questionnaire_completed_at?: string | null
          questionnaire_post_completed_at?: string | null
          questionnaire_pre_completed_at?: string | null
          rango_edad?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          activo: boolean
          created_at: string
          created_by: string | null
          dimension_cuestionario:
            | Database["public"]["Enums"]["dim_cuestionario_enum"]
            | null
          dimension_jne_mapping:
            | Database["public"]["Enums"]["dim_tematica_enum"]
            | null
          dimension_tematica: Database["public"]["Enums"]["dim_tematica_enum"]
          enunciado: string
          fuente: string | null
          id: string
          momento: Database["public"]["Enums"]["momento_enum"]
          opciones: Json | null
          orden: number
          tipo: Database["public"]["Enums"]["question_type_enum"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          dimension_cuestionario?:
            | Database["public"]["Enums"]["dim_cuestionario_enum"]
            | null
          dimension_jne_mapping?:
            | Database["public"]["Enums"]["dim_tematica_enum"]
            | null
          dimension_tematica: Database["public"]["Enums"]["dim_tematica_enum"]
          enunciado: string
          fuente?: string | null
          id?: string
          momento?: Database["public"]["Enums"]["momento_enum"]
          opciones?: Json | null
          orden: number
          tipo: Database["public"]["Enums"]["question_type_enum"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          dimension_cuestionario?:
            | Database["public"]["Enums"]["dim_cuestionario_enum"]
            | null
          dimension_jne_mapping?:
            | Database["public"]["Enums"]["dim_tematica_enum"]
            | null
          dimension_tematica?: Database["public"]["Enums"]["dim_tematica_enum"]
          enunciado?: string
          fuente?: string | null
          id?: string
          momento?: Database["public"]["Enums"]["momento_enum"]
          opciones?: Json | null
          orden?: number
          tipo?: Database["public"]["Enums"]["question_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          event_type: string
          id: number
          occurred_at: string
          opaque_user_id: string
          payload: Json | null
        }
        Insert: {
          event_type: string
          id?: number
          occurred_at?: string
          opaque_user_id: string
          payload?: Json | null
        }
        Update: {
          event_type?: string
          id?: number
          occurred_at?: string
          opaque_user_id?: string
          payload?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      mv_delta_pre_post: {
        Row: {
          delta: number | null
          dimension_cuestionario:
            | Database["public"]["Enums"]["dim_cuestionario_enum"]
            | null
          dimension_jne_mapping:
            | Database["public"]["Enums"]["dim_tematica_enum"]
            | null
          question_id: string | null
          student_id: string | null
          tipo: Database["public"]["Enums"]["question_type_enum"] | null
          valor_post: number | null
          valor_pre: number | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      hash_opaque_user_id: { Args: { user_uuid: string }; Returns: string }
    }
    Enums: {
      dim_cuestionario_enum:
        | "educacion"
        | "juventud"
        | "trabajo"
        | "economia"
        | "social_publicas"
      dim_tematica_enum: "social" | "economica" | "ambiental" | "institucional"
      dimension_top_enum:
        | "social"
        | "economica"
        | "ambiental"
        | "institucional"
        | "ninguna"
      fact_check_status_enum: "draft" | "published" | "archived"
      momento_enum: "pre" | "post" | "both"
      opinion_change_enum: "si_mucho" | "si_un_poco" | "no"
      question_type_enum:
        | "likert"
        | "single"
        | "multiple"
        | "text"
        | "ranking"
        | "comparison"
      user_role: "student" | "teacher" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      dim_cuestionario_enum: [
        "educacion",
        "juventud",
        "trabajo",
        "economia",
        "social_publicas",
      ],
      dim_tematica_enum: ["social", "economica", "ambiental", "institucional"],
      dimension_top_enum: [
        "social",
        "economica",
        "ambiental",
        "institucional",
        "ninguna",
      ],
      fact_check_status_enum: ["draft", "published", "archived"],
      momento_enum: ["pre", "post", "both"],
      opinion_change_enum: ["si_mucho", "si_un_poco", "no"],
      question_type_enum: [
        "likert",
        "single",
        "multiple",
        "text",
        "ranking",
        "comparison",
      ],
      user_role: ["student", "teacher", "admin"],
    },
  },
} as const

