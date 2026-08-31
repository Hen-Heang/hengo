export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      goal_evidence: {
        Row: {
          created_at: string
          description: string | null
          evidence_type: string
          goal_id: string
          id: string
          key_result_id: string | null
          metadata: Json
          numeric_value: number | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
          verified_status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          evidence_type: string
          goal_id: string
          id?: string
          key_result_id?: string | null
          metadata?: Json
          numeric_value?: number | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
          verified_status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          evidence_type?: string
          goal_id?: string
          id?: string
          key_result_id?: string | null
          metadata?: Json
          numeric_value?: number | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          verified_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_evidence_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_evidence_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "goal_key_results"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_key_results: {
        Row: {
          baseline_value: number | null
          created_at: string
          current_value: number | null
          data_source: string
          deadline: string | null
          description: string | null
          goal_id: string
          id: string
          metric_type: string
          source_config: Json
          status: string
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          baseline_value?: number | null
          created_at?: string
          current_value?: number | null
          data_source?: string
          deadline?: string | null
          description?: string | null
          goal_id: string
          id?: string
          metric_type: string
          source_config?: Json
          status?: string
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          baseline_value?: number | null
          created_at?: string
          current_value?: number | null
          data_source?: string
          deadline?: string | null
          description?: string | null
          goal_id?: string
          id?: string
          metric_type?: string
          source_config?: Json
          status?: string
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "goal_key_results_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_members: {
        Row: {
          goal_id: string | null
          id: string
          joined_at: string | null
          last_seen: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          goal_id?: string | null
          id?: string
          joined_at?: string | null
          last_seen?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          goal_id?: string | null
          id?: string
          joined_at?: string | null
          last_seen?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_members_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_plan_phases: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          goal_id: string
          id: string
          objective: string | null
          position: number
          start_date: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          goal_id: string
          id?: string
          objective?: string | null
          position?: number
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          goal_id?: string
          id?: string
          objective?: string | null
          position?: number
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_plan_phases_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_reviews: {
        Row: {
          ai_summary: string | null
          blockers: string | null
          created_at: string
          goal_id: string
          id: string
          lessons: string | null
          next_focus: string | null
          outcome_progress_after: number | null
          outcome_progress_before: number | null
          review_period_end: string
          review_period_start: string
          user_id: string
          wins: string | null
        }
        Insert: {
          ai_summary?: string | null
          blockers?: string | null
          created_at?: string
          goal_id: string
          id?: string
          lessons?: string | null
          next_focus?: string | null
          outcome_progress_after?: number | null
          outcome_progress_before?: number | null
          review_period_end: string
          review_period_start: string
          user_id: string
          wins?: string | null
        }
        Update: {
          ai_summary?: string | null
          blockers?: string | null
          created_at?: string
          goal_id?: string
          id?: string
          lessons?: string | null
          next_focus?: string | null
          outcome_progress_after?: number | null
          outcome_progress_before?: number | null
          review_period_end?: string
          review_period_start?: string
          user_id?: string
          wins?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_reviews_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_schedule_rules: {
        Row: {
          active: boolean
          created_at: string
          day_of_month: number | null
          days_of_week: number[] | null
          description: string | null
          duration_minutes: number | null
          end_date: string | null
          goal_id: string
          id: string
          key_result_id: string | null
          phase_id: string | null
          recurrence_interval: number
          recurrence_type: string
          start_date: string
          start_time: string | null
          timezone: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          day_of_month?: number | null
          days_of_week?: number[] | null
          description?: string | null
          duration_minutes?: number | null
          end_date?: string | null
          goal_id: string
          id?: string
          key_result_id?: string | null
          phase_id?: string | null
          recurrence_interval?: number
          recurrence_type: string
          start_date: string
          start_time?: string | null
          timezone?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          day_of_month?: number | null
          days_of_week?: number[] | null
          description?: string | null
          duration_minutes?: number | null
          end_date?: string | null
          goal_id?: string
          id?: string
          key_result_id?: string | null
          phase_id?: string | null
          recurrence_interval?: number
          recurrence_type?: string
          start_date?: string
          start_time?: string | null
          timezone?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_schedule_rules_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_schedule_rules_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "goal_key_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_schedule_rules_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "goal_plan_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_stars: {
        Row: {
          created_at: string
          goal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_stars_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          ai_prompt: string | null
          baseline_summary: string | null
          created_at: string
          description: string | null
          health_reason: string | null
          health_status: string
          id: string
          is_public: boolean
          last_reviewed_at: string | null
          metadata: Json | null
          motivation: string | null
          no_duration: boolean
          outcome_progress: number
          outcome_statement: string | null
          preferences: Json | null
          public_slug: string | null
          review_frequency: string | null
          share_code: string | null
          status: string | null
          success_definition: string | null
          target_date: string | null
          theme_id: string | null
          title: string
          updated_at: string
          user_id: string
          weekly_capacity_minutes: number | null
        }
        Insert: {
          ai_prompt?: string | null
          baseline_summary?: string | null
          created_at?: string
          description?: string | null
          health_reason?: string | null
          health_status?: string
          id?: string
          is_public?: boolean
          last_reviewed_at?: string | null
          metadata?: Json | null
          motivation?: string | null
          no_duration?: boolean
          outcome_progress?: number
          outcome_statement?: string | null
          preferences?: Json | null
          public_slug?: string | null
          review_frequency?: string | null
          share_code?: string | null
          status?: string | null
          success_definition?: string | null
          target_date?: string | null
          theme_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          weekly_capacity_minutes?: number | null
        }
        Update: {
          ai_prompt?: string | null
          baseline_summary?: string | null
          created_at?: string
          description?: string | null
          health_reason?: string | null
          health_status?: string
          id?: string
          is_public?: boolean
          last_reviewed_at?: string | null
          metadata?: Json | null
          motivation?: string | null
          no_duration?: boolean
          outcome_progress?: number
          outcome_statement?: string | null
          preferences?: Json | null
          public_slug?: string | null
          review_frequency?: string | null
          share_code?: string | null
          status?: string | null
          success_definition?: string | null
          target_date?: string | null
          theme_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          weekly_capacity_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kori_achievements: {
        Row: {
          code: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          code: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          code?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_activity_log: {
        Row: {
          created_at: string
          duration_ms: number
          feature: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number
          feature: string
          id?: never
          user_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number
          feature?: string
          id?: never
          user_id?: string
        }
        Relationships: []
      }
      kori_ai_usage: {
        Row: {
          created_at: string
          error_code: string | null
          estimated_cost: number | null
          feature: string
          id: string
          input_tokens: number | null
          latency_ms: number | null
          model: string
          output_tokens: number | null
          success: boolean
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          estimated_cost?: number | null
          feature: string
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model: string
          output_tokens?: number | null
          success: boolean
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_code?: string | null
          estimated_cost?: number | null
          feature?: string
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string
          output_tokens?: number | null
          success?: boolean
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: []
      }
      kori_analyzer_history: {
        Row: {
          analysis: Json
          created_at: string
          id: string
          model_used: string | null
          original_text: string
          source: string | null
          user_id: string
        }
        Insert: {
          analysis?: Json
          created_at?: string
          id?: string
          model_used?: string | null
          original_text: string
          source?: string | null
          user_id: string
        }
        Update: {
          analysis?: Json
          created_at?: string
          id?: string
          model_used?: string | null
          original_text?: string
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      kori_conversations: {
        Row: {
          conversation_type: string
          created_at: string
          id: string
          model_used: string | null
          scenario_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_type?: string
          created_at?: string
          id?: string
          model_used?: string | null
          scenario_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_type?: string
          created_at?: string
          id?: string
          model_used?: string | null
          scenario_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_corrections: {
        Row: {
          coach_mastered: boolean
          coach_review_count: number
          corrected_text: string
          created_at: string
          ease_factor: number
          english_meaning: string | null
          error_category: string | null
          explanation: string | null
          fingerprint: string
          grammar_points: string[]
          id: string
          interval_days: number
          lapses: number
          last_seen_at: string
          mastery: number
          natural_version: string | null
          next_review_date: string
          occurrence_count: number
          original_text: string
          repetitions: number
          scenario_category: string | null
          scenario_id: string | null
          severity: string | null
          source_feature: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          coach_mastered?: boolean
          coach_review_count?: number
          corrected_text: string
          created_at?: string
          ease_factor?: number
          english_meaning?: string | null
          error_category?: string | null
          explanation?: string | null
          fingerprint: string
          grammar_points?: string[]
          id?: string
          interval_days?: number
          lapses?: number
          last_seen_at?: string
          mastery?: number
          natural_version?: string | null
          next_review_date?: string
          occurrence_count?: number
          original_text: string
          repetitions?: number
          scenario_category?: string | null
          scenario_id?: string | null
          severity?: string | null
          source_feature?: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          coach_mastered?: boolean
          coach_review_count?: number
          corrected_text?: string
          created_at?: string
          ease_factor?: number
          english_meaning?: string | null
          error_category?: string | null
          explanation?: string | null
          fingerprint?: string
          grammar_points?: string[]
          id?: string
          interval_days?: number
          lapses?: number
          last_seen_at?: string
          mastery?: number
          natural_version?: string | null
          next_review_date?: string
          occurrence_count?: number
          original_text?: string
          repetitions?: number
          scenario_category?: string | null
          scenario_id?: string | null
          severity?: string | null
          source_feature?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      kori_daily_mission_items: {
        Row: {
          completed_at: string | null
          created_at: string
          estimated_minutes: number
          evidence: Json
          id: string
          item_type: string
          mission_id: string
          progress_count: number
          reason: string
          reference_ids: string[]
          skill_codes: string[]
          status: string
          target_count: number
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          estimated_minutes?: number
          evidence?: Json
          id?: string
          item_type: string
          mission_id: string
          progress_count?: number
          reason: string
          reference_ids?: string[]
          skill_codes?: string[]
          status?: string
          target_count?: number
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          estimated_minutes?: number
          evidence?: Json
          id?: string
          item_type?: string
          mission_id?: string
          progress_count?: number
          reason?: string
          reference_ids?: string[]
          skill_codes?: string[]
          status?: string
          target_count?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kori_daily_mission_items_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "kori_daily_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      kori_daily_missions: {
        Row: {
          context_snapshot: Json
          created_at: string
          estimated_minutes: number
          focus_skill_codes: string[]
          id: string
          mission_date: string
          reason: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context_snapshot?: Json
          created_at?: string
          estimated_minutes?: number
          focus_skill_codes?: string[]
          id?: string
          mission_date: string
          reason: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context_snapshot?: Json
          created_at?: string
          estimated_minutes?: number
          focus_skill_codes?: string[]
          id?: string
          mission_date?: string
          reason?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_daily_phrases: {
        Row: {
          created_at: string
          date: string
          formality: string | null
          id: string
          learned: boolean
          meaning: string
          phrase: string
          romanization: string | null
          similar_expressions: Json
          user_id: string
          when_to_use: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          formality?: string | null
          id?: string
          learned?: boolean
          meaning: string
          phrase: string
          romanization?: string | null
          similar_expressions?: Json
          user_id: string
          when_to_use?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          formality?: string | null
          id?: string
          learned?: boolean
          meaning?: string
          phrase?: string
          romanization?: string | null
          similar_expressions?: Json
          user_id?: string
          when_to_use?: string | null
        }
        Relationships: []
      }
      kori_focus_daily_checkins: {
        Row: {
          coping_strategy: string | null
          created_at: string
          current_urge: number | null
          energy: number | null
          habit_id: string
          healthy_habits_completed: string[]
          id: string
          important_goal: string | null
          intention: string | null
          lesson: string | null
          local_date: string
          mood: string | null
          next_action: string | null
          period: string
          protection_action: string | null
          risk_level: number | null
          sleep_quality: number | null
          stress: number | null
          strongest_urge: number | null
          target_occurred: boolean | null
          updated_at: string
          user_id: string
          win: string | null
        }
        Insert: {
          coping_strategy?: string | null
          created_at?: string
          current_urge?: number | null
          energy?: number | null
          habit_id: string
          healthy_habits_completed?: string[]
          id?: string
          important_goal?: string | null
          intention?: string | null
          lesson?: string | null
          local_date: string
          mood?: string | null
          next_action?: string | null
          period: string
          protection_action?: string | null
          risk_level?: number | null
          sleep_quality?: number | null
          stress?: number | null
          strongest_urge?: number | null
          target_occurred?: boolean | null
          updated_at?: string
          user_id: string
          win?: string | null
        }
        Update: {
          coping_strategy?: string | null
          created_at?: string
          current_urge?: number | null
          energy?: number | null
          habit_id?: string
          healthy_habits_completed?: string[]
          id?: string
          important_goal?: string | null
          intention?: string | null
          lesson?: string | null
          local_date?: string
          mood?: string | null
          next_action?: string | null
          period?: string
          protection_action?: string | null
          risk_level?: number | null
          sleep_quality?: number | null
          stress?: number | null
          strongest_urge?: number | null
          target_occurred?: boolean | null
          updated_at?: string
          user_id?: string
          win?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kori_focus_daily_checkins_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "kori_focus_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      kori_focus_events: {
        Row: {
          action_taken: string | null
          created_at: string
          device: string | null
          emotion: string | null
          habit_id: string
          healthy_action_completed: boolean | null
          id: string
          intensity: number | null
          kind: string
          location: string | null
          note: string | null
          occurred_at: string
          previous_activity: string | null
          resolved_at: string | null
          rode_out: boolean | null
          situation: string | null
          sleep_quality: number | null
          stress_level: number | null
          trigger_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          device?: string | null
          emotion?: string | null
          habit_id: string
          healthy_action_completed?: boolean | null
          id?: string
          intensity?: number | null
          kind: string
          location?: string | null
          note?: string | null
          occurred_at?: string
          previous_activity?: string | null
          resolved_at?: string | null
          rode_out?: boolean | null
          situation?: string | null
          sleep_quality?: number | null
          stress_level?: number | null
          trigger_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          device?: string | null
          emotion?: string | null
          habit_id?: string
          healthy_action_completed?: boolean | null
          id?: string
          intensity?: number | null
          kind?: string
          location?: string | null
          note?: string | null
          occurred_at?: string
          previous_activity?: string | null
          resolved_at?: string | null
          rode_out?: boolean | null
          situation?: string | null
          sleep_quality?: number | null
          stress_level?: number | null
          trigger_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kori_focus_events_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "kori_focus_habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kori_focus_events_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "kori_focus_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      kori_focus_habits: {
        Row: {
          active: boolean
          baseline: Json | null
          created_at: string
          id: string
          label: string
          onboarding_completed_at: string | null
          personal_limit: number | null
          reasons: string[]
          recovery_statement: string | null
          replacement_behavior: string | null
          started_at: string
          tracking_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          baseline?: Json | null
          created_at?: string
          id?: string
          label: string
          onboarding_completed_at?: string | null
          personal_limit?: number | null
          reasons?: string[]
          recovery_statement?: string | null
          replacement_behavior?: string | null
          started_at?: string
          tracking_mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          baseline?: Json | null
          created_at?: string
          id?: string
          label?: string
          onboarding_completed_at?: string | null
          personal_limit?: number | null
          reasons?: string[]
          recovery_statement?: string | null
          replacement_behavior?: string | null
          started_at?: string
          tracking_mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_focus_plans: {
        Row: {
          active: boolean
          created_at: string
          ease_factor: number
          habit_id: string
          id: string
          if_text: string
          interval_days: number
          lapses: number
          mastery: number
          next_review: string
          reminder_enabled: boolean
          repetitions: number
          source_event_id: string | null
          then_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          ease_factor?: number
          habit_id: string
          id?: string
          if_text: string
          interval_days?: number
          lapses?: number
          mastery?: number
          next_review?: string
          reminder_enabled?: boolean
          repetitions?: number
          source_event_id?: string | null
          then_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          ease_factor?: number
          habit_id?: string
          id?: string
          if_text?: string
          interval_days?: number
          lapses?: number
          mastery?: number
          next_review?: string
          reminder_enabled?: boolean
          repetitions?: number
          source_event_id?: string | null
          then_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kori_focus_plans_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "kori_focus_habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kori_focus_plans_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "kori_focus_events"
            referencedColumns: ["id"]
          },
        ]
      }
      kori_focus_privacy_settings: {
        Row: {
          ai_consent: boolean
          bedtime_reminder: boolean
          created_at: string
          custom_notification_text: string | null
          discreet_notifications: boolean
          evening_reminder: boolean
          lock_enabled: boolean
          morning_reminder: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          risk_time_reminder: boolean
          updated_at: string
          user_id: string
          weekly_review_reminder: boolean
        }
        Insert: {
          ai_consent?: boolean
          bedtime_reminder?: boolean
          created_at?: string
          custom_notification_text?: string | null
          discreet_notifications?: boolean
          evening_reminder?: boolean
          lock_enabled?: boolean
          morning_reminder?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          risk_time_reminder?: boolean
          updated_at?: string
          user_id: string
          weekly_review_reminder?: boolean
        }
        Update: {
          ai_consent?: boolean
          bedtime_reminder?: boolean
          created_at?: string
          custom_notification_text?: string | null
          discreet_notifications?: boolean
          evening_reminder?: boolean
          lock_enabled?: boolean
          morning_reminder?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          risk_time_reminder?: boolean
          updated_at?: string
          user_id?: string
          weekly_review_reminder?: boolean
        }
        Relationships: []
      }
      kori_focus_protection_items: {
        Row: {
          category: string
          created_at: string
          habit_id: string
          id: string
          label: string
          preferred_action: boolean
          sort_order: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          habit_id: string
          id?: string
          label: string
          preferred_action?: boolean
          sort_order?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          habit_id?: string
          id?: string
          label?: string
          preferred_action?: boolean
          sort_order?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kori_focus_protection_items_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "kori_focus_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      kori_focus_support_contacts: {
        Row: {
          active: boolean
          contact_method: string | null
          created_at: string
          id: string
          label: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          contact_method?: string | null
          created_at?: string
          id?: string
          label: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          contact_method?: string | null
          created_at?: string
          id?: string
          label?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_focus_triggers: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          label: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_focus_weekly_reviews: {
        Row: {
          ai_consent_at: string | null
          ai_summary: string | null
          created_at: string
          experiment: string | null
          habit_id: string
          id: string
          statistics: Json
          summary: string | null
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          ai_consent_at?: string | null
          ai_summary?: string | null
          created_at?: string
          experiment?: string | null
          habit_id: string
          id?: string
          statistics?: Json
          summary?: string | null
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          ai_consent_at?: string | null
          ai_summary?: string | null
          created_at?: string
          experiment?: string | null
          habit_id?: string
          id?: string
          statistics?: Json
          summary?: string | null
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "kori_focus_weekly_reviews_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "kori_focus_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      kori_foundation_progress: {
        Row: {
          attempts: number
          completed: boolean
          lesson_id: string
          progress: number
          track: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          completed?: boolean
          lesson_id: string
          progress?: number
          track: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          completed?: boolean
          lesson_id?: string
          progress?: number
          track?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_habit_checkins: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          habit_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date: string
          habit_id: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          habit_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kori_habit_checkins_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "kori_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      kori_habits: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          identity_statement: string | null
          label: string
          started_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          identity_statement?: string | null
          label: string
          started_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          identity_statement?: string | null
          label?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_interview_answers: {
        Row: {
          answer_duration_seconds: number | null
          answer_text: string
          confidence_self_score: number | null
          corrected_answer: string | null
          created_at: string
          feedback: string | null
          id: string
          natural_alternative: string | null
          question_id: string | null
          question_ko: string
          scores: Json
          session_id: string | null
          session_type: string
          tip: string | null
          user_id: string
        }
        Insert: {
          answer_duration_seconds?: number | null
          answer_text: string
          confidence_self_score?: number | null
          corrected_answer?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          natural_alternative?: string | null
          question_id?: string | null
          question_ko: string
          scores?: Json
          session_id?: string | null
          session_type: string
          tip?: string | null
          user_id: string
        }
        Update: {
          answer_duration_seconds?: number | null
          answer_text?: string
          confidence_self_score?: number | null
          corrected_answer?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          natural_alternative?: string | null
          question_id?: string | null
          question_ko?: string
          scores?: Json
          session_id?: string | null
          session_type?: string
          tip?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kori_interview_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "kori_interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      kori_interview_attempts: {
        Row: {
          advice: Json
          analytics: Json | null
          created_at: string
          duration_seconds: number
          id: string
          mode: string
          overall: number
          question_count: number
          scores: Json
          summary: string
          topic_id: string
          user_id: string
        }
        Insert: {
          advice?: Json
          analytics?: Json | null
          created_at?: string
          duration_seconds?: number
          id: string
          mode?: string
          overall: number
          question_count?: number
          scores: Json
          summary?: string
          topic_id: string
          user_id: string
        }
        Update: {
          advice?: Json
          analytics?: Json | null
          created_at?: string
          duration_seconds?: number
          id?: string
          mode?: string
          overall?: number
          question_count?: number
          scores?: Json
          summary?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_interview_question_progress: {
        Row: {
          avg_score: number | null
          created_at: string
          id: string
          last_practiced_at: string | null
          last_score: number | null
          question_id: string
          status: string
          times_practiced: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_score?: number | null
          created_at?: string
          id?: string
          last_practiced_at?: string | null
          last_score?: number | null
          question_id: string
          status?: string
          times_practiced?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_score?: number | null
          created_at?: string
          id?: string
          last_practiced_at?: string | null
          last_score?: number | null
          question_id?: string
          status?: string
          times_practiced?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kori_interview_question_progress_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "kori_interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      kori_interview_questions: {
        Row: {
          active: boolean
          category: string
          created_at: string
          created_by_user_id: string | null
          difficulty: string
          display_order: number
          id: string
          keywords: string[]
          priority: string
          question_en: string | null
          question_ko: string
          sample_answer_en: string | null
          sample_answer_ko: string | null
          slug: string | null
          topic_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          created_by_user_id?: string | null
          difficulty?: string
          display_order?: number
          id?: string
          keywords?: string[]
          priority?: string
          question_en?: string | null
          question_ko: string
          sample_answer_en?: string | null
          sample_answer_ko?: string | null
          slug?: string | null
          topic_id?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          created_by_user_id?: string | null
          difficulty?: string
          display_order?: number
          id?: string
          keywords?: string[]
          priority?: string
          question_en?: string | null
          question_ko?: string
          sample_answer_en?: string | null
          sample_answer_ko?: string | null
          slug?: string | null
          topic_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      kori_interview_script_versions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          sections: Json
          source_type: string
          topic_id: string
          user_id: string
          version_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          sections?: Json
          source_type?: string
          topic_id?: string
          user_id: string
          version_label: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          sections?: Json
          source_type?: string
          topic_id?: string
          user_id?: string
          version_label?: string
        }
        Relationships: []
      }
      kori_interview_scripts: {
        Row: {
          sections: Json
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          sections?: Json
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          sections?: Json
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_korean_coach_preferences: {
        Row: {
          correction_strictness: string
          created_at: string
          daily_practice_goal_minutes: number
          default_speech_speed: number
          explanation_language: string
          level: string
          main_goal: string
          preferred_practice_duration_minutes: number
          romanization_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          correction_strictness?: string
          created_at?: string
          daily_practice_goal_minutes?: number
          default_speech_speed?: number
          explanation_language?: string
          level?: string
          main_goal?: string
          preferred_practice_duration_minutes?: number
          romanization_mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          correction_strictness?: string
          created_at?: string
          daily_practice_goal_minutes?: number
          default_speech_speed?: number
          explanation_language?: string
          level?: string
          main_goal?: string
          preferred_practice_duration_minutes?: number
          romanization_mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_korean_practice_turns: {
        Row: {
          created_at: string
          hint_used: boolean
          id: string
          session_id: string
          task_completed: boolean
          transcript_revealed: boolean
          turn_number: number
          tutor_message: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          hint_used?: boolean
          id?: string
          session_id: string
          task_completed?: boolean
          transcript_revealed?: boolean
          turn_number: number
          tutor_message?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          hint_used?: boolean
          id?: string
          session_id?: string
          task_completed?: boolean
          transcript_revealed?: boolean
          turn_number?: number
          tutor_message?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kori_korean_practice_turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "kori_voice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      kori_korean_speaking_attempts: {
        Row: {
          created_at: string
          feedback: Json
          id: string
          input_method: string
          is_retry: boolean
          recording_duration_ms: number | null
          session_id: string
          transcript: string
          turn_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: Json
          id?: string
          input_method: string
          is_retry?: boolean
          recording_duration_ms?: number | null
          session_id: string
          transcript: string
          turn_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: Json
          id?: string
          input_method?: string
          is_retry?: boolean
          recording_duration_ms?: number | null
          session_id?: string
          transcript?: string
          turn_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kori_korean_speaking_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "kori_voice_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kori_korean_speaking_attempts_turn_id_fkey"
            columns: ["turn_id"]
            isOneToOne: false
            referencedRelation: "kori_korean_practice_turns"
            referencedColumns: ["id"]
          },
        ]
      }
      kori_listening_attempts: {
        Row: {
          accuracy: number
          created_at: string
          id: string
          lesson_id: string
          results: Json
          score: number
          total: number
          user_id: string
        }
        Insert: {
          accuracy: number
          created_at?: string
          id?: string
          lesson_id: string
          results?: Json
          score: number
          total: number
          user_id: string
        }
        Update: {
          accuracy?: number
          created_at?: string
          id?: string
          lesson_id?: string
          results?: Json
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kori_listening_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "kori_listening_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      kori_listening_lessons: {
        Row: {
          created_at: string
          id: string
          level: string
          lines: Json
          quiz: Json
          title: string
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          lines?: Json
          quiz?: Json
          title: string
          topic: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          lines?: Json
          quiz?: Json
          title?: string
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_messages: {
        Row: {
          content: string
          conversation_id: string
          corrections: string | null
          created_at: string
          id: string
          role: string
          tokens_used: number
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          corrections?: string | null
          created_at?: string
          id?: string
          role: string
          tokens_used?: number
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          corrections?: string | null
          created_at?: string
          id?: string
          role?: string
          tokens_used?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kori_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "kori_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      kori_notes: {
        Row: {
          category: string | null
          content: string
          created_at: string
          description: string
          icon: string
          id: string
          slug: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_profiles: {
        Row: {
          avatar_url: string | null
          best_vocab_streak: number
          country: string | null
          created_at: string
          display_name: string | null
          exam_countdown_pushed_on: string | null
          id: string
          korean_level: string | null
          learning_goal: string | null
          native_language: string | null
          occupation: string | null
          preferred_model: string | null
          reviews_due_pushed_on: string | null
          streak_saver_pushed_on: string | null
          study_reminder_hour: number | null
          study_reminders_enabled: boolean
          timezone: string
          updated_at: string
          years_of_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          best_vocab_streak?: number
          country?: string | null
          created_at?: string
          display_name?: string | null
          exam_countdown_pushed_on?: string | null
          id: string
          korean_level?: string | null
          learning_goal?: string | null
          native_language?: string | null
          occupation?: string | null
          preferred_model?: string | null
          reviews_due_pushed_on?: string | null
          streak_saver_pushed_on?: string | null
          study_reminder_hour?: number | null
          study_reminders_enabled?: boolean
          timezone?: string
          updated_at?: string
          years_of_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          best_vocab_streak?: number
          country?: string | null
          created_at?: string
          display_name?: string | null
          exam_countdown_pushed_on?: string | null
          id?: string
          korean_level?: string | null
          learning_goal?: string | null
          native_language?: string | null
          occupation?: string | null
          preferred_model?: string | null
          reviews_due_pushed_on?: string | null
          streak_saver_pushed_on?: string | null
          study_reminder_hour?: number | null
          study_reminders_enabled?: boolean
          timezone?: string
          updated_at?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
      kori_push_config: {
        Row: {
          id: boolean
          vapid_private_key: string
          vapid_public_key: string
          vapid_subject: string
        }
        Insert: {
          id?: boolean
          vapid_private_key: string
          vapid_public_key: string
          vapid_subject: string
        }
        Update: {
          id?: boolean
          vapid_private_key?: string
          vapid_public_key?: string
          vapid_subject?: string
        }
        Relationships: []
      }
      kori_push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_reading_progress: {
        Row: {
          entry: Json
          unit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          entry?: Json
          unit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          entry?: Json
          unit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_reading_units: {
        Row: {
          created_at: string
          id: string
          payload: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          payload: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_scenario_sessions: {
        Row: {
          completed_at: string | null
          conversation_id: string | null
          id: string
          improvements: string[]
          mission_item_id: string | null
          scenario_id: string
          score: number | null
          started_at: string
          strengths: string[]
          task_completed: boolean
          user_id: string
          user_turn_count: number
        }
        Insert: {
          completed_at?: string | null
          conversation_id?: string | null
          id?: string
          improvements?: string[]
          mission_item_id?: string | null
          scenario_id: string
          score?: number | null
          started_at?: string
          strengths?: string[]
          task_completed?: boolean
          user_id: string
          user_turn_count?: number
        }
        Update: {
          completed_at?: string | null
          conversation_id?: string | null
          id?: string
          improvements?: string[]
          mission_item_id?: string | null
          scenario_id?: string
          score?: number | null
          started_at?: string
          strengths?: string[]
          task_completed?: boolean
          user_id?: string
          user_turn_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "kori_scenario_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "kori_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kori_scenario_sessions_mission_item_id_fkey"
            columns: ["mission_item_id"]
            isOneToOne: false
            referencedRelation: "kori_daily_mission_items"
            referencedColumns: ["id"]
          },
        ]
      }
      kori_scenarios: {
        Row: {
          category: string
          created_at: string
          goal: string
          id: string
          intro_message: string | null
          level: string
          summary: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          goal?: string
          id: string
          intro_message?: string | null
          level?: string
          summary?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          goal?: string
          id?: string
          intro_message?: string | null
          level?: string
          summary?: string
          title?: string
        }
        Relationships: []
      }
      kori_skill_events: {
        Row: {
          confidence: number | null
          created_at: string
          difficulty: string | null
          id: string
          metadata: Json
          score: number
          skill_code: string
          source_feature: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          difficulty?: string | null
          id?: string
          metadata?: Json
          score: number
          skill_code: string
          source_feature: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          difficulty?: string | null
          id?: string
          metadata?: Json
          score?: number
          skill_code?: string
          source_feature?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      kori_skill_mastery: {
        Row: {
          attempt_count: number
          last_practiced_at: string | null
          mastery_score: number
          recent_score: number | null
          skill_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_count?: number
          last_practiced_at?: string | null
          mastery_score?: number
          recent_score?: number | null
          skill_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_count?: number
          last_practiced_at?: string | null
          mastery_score?: number
          recent_score?: number | null
          skill_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_telegram_link_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_telegram_links: {
        Row: {
          chat_id: string
          linked_at: string
          user_id: string
        }
        Insert: {
          chat_id: string
          linked_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          linked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_vocab_cards: {
        Row: {
          category: string
          created_at: string
          difficulty_level: string | null
          ease_factor: number
          example: string | null
          example_translation: string | null
          id: string
          interval_days: number
          lapses: number
          mastery: number
          meaning: string
          next_review: string
          pronunciation: string | null
          repetitions: number
          tags: string[]
          term: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          difficulty_level?: string | null
          ease_factor?: number
          example?: string | null
          example_translation?: string | null
          id?: string
          interval_days?: number
          lapses?: number
          mastery?: number
          meaning: string
          next_review?: string
          pronunciation?: string | null
          repetitions?: number
          tags?: string[]
          term: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          difficulty_level?: string | null
          ease_factor?: number
          example?: string | null
          example_translation?: string | null
          id?: string
          interval_days?: number
          lapses?: number
          mastery?: number
          meaning?: string
          next_review?: string
          pronunciation?: string | null
          repetitions?: number
          tags?: string[]
          term?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kori_voice_sessions: {
        Row: {
          approx_word_count: number
          assistant_turn_count: number
          conversation_id: string | null
          correction_policy: string
          duration_seconds: number
          ended_at: string | null
          id: string
          important_mistake_count: number
          learner_level: string
          model: string | null
          practice_mode: string
          scenario_completed: boolean | null
          scenario_id: string | null
          started_at: string
          status: string
          summary: Json
          target_expressions: string[]
          user_id: string
          user_turn_count: number
        }
        Insert: {
          approx_word_count?: number
          assistant_turn_count?: number
          conversation_id?: string | null
          correction_policy?: string
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          important_mistake_count?: number
          learner_level?: string
          model?: string | null
          practice_mode?: string
          scenario_completed?: boolean | null
          scenario_id?: string | null
          started_at?: string
          status?: string
          summary?: Json
          target_expressions?: string[]
          user_id: string
          user_turn_count?: number
        }
        Update: {
          approx_word_count?: number
          assistant_turn_count?: number
          conversation_id?: string | null
          correction_policy?: string
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          important_mistake_count?: number
          learner_level?: string
          model?: string | null
          practice_mode?: string
          scenario_completed?: boolean | null
          scenario_id?: string | null
          started_at?: string
          status?: string
          summary?: Json
          target_expressions?: string[]
          user_id?: string
          user_turn_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "kori_voice_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "kori_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          date: string | null
          goal_id: string | null
          id: string
          invitation_status: string | null
          payload: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
          type: string
          url: string | null
        }
        Insert: {
          created_at?: string
          date?: string | null
          goal_id?: string | null
          id?: string
          invitation_status?: string | null
          payload?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
          type: string
          url?: string | null
        }
        Update: {
          created_at?: string
          date?: string | null
          goal_id?: string | null
          id?: string
          invitation_status?: string | null
          payload?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          blocked_reason: string | null
          color: string | null
          completed: boolean
          completion_criteria: string | null
          created_at: string
          daily_end_time: string | null
          daily_start_time: string | null
          description: string | null
          duration_minutes: number | null
          effort_minutes: number | null
          end_date: string | null
          evidence_required: boolean
          expected_output: string | null
          goal_id: string | null
          id: string
          impact_level: string | null
          is_anytime: boolean
          key_result_id: string | null
          occurrence_date: string | null
          overdue_notified_at: string | null
          phase_id: string | null
          reminder_sent_at: string | null
          reschedule_count: number
          schedule_rule_id: string | null
          scheduling_source: string
          source: string
          start_date: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          blocked_reason?: string | null
          color?: string | null
          completed?: boolean
          completion_criteria?: string | null
          created_at?: string
          daily_end_time?: string | null
          daily_start_time?: string | null
          description?: string | null
          duration_minutes?: number | null
          effort_minutes?: number | null
          end_date?: string | null
          evidence_required?: boolean
          expected_output?: string | null
          goal_id?: string | null
          id?: string
          impact_level?: string | null
          is_anytime?: boolean
          key_result_id?: string | null
          occurrence_date?: string | null
          overdue_notified_at?: string | null
          phase_id?: string | null
          reminder_sent_at?: string | null
          reschedule_count?: number
          schedule_rule_id?: string | null
          scheduling_source?: string
          source?: string
          start_date?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          blocked_reason?: string | null
          color?: string | null
          completed?: boolean
          completion_criteria?: string | null
          created_at?: string
          daily_end_time?: string | null
          daily_start_time?: string | null
          description?: string | null
          duration_minutes?: number | null
          effort_minutes?: number | null
          end_date?: string | null
          evidence_required?: boolean
          expected_output?: string | null
          goal_id?: string | null
          id?: string
          impact_level?: string | null
          is_anytime?: boolean
          key_result_id?: string | null
          occurrence_date?: string | null
          overdue_notified_at?: string | null
          phase_id?: string | null
          reminder_sent_at?: string | null
          reschedule_count?: number
          schedule_rule_id?: string | null
          scheduling_source?: string
          source?: string
          start_date?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "goal_key_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "goal_plan_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_schedule_rule_id_fkey"
            columns: ["schedule_rule_id"]
            isOneToOne: false
            referencedRelation: "goal_schedule_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          device_id: string | null
          display_name: string | null
          id: string
          model_preference: string | null
          preferences: Json | null
          reminder_offset_minutes: number
          telegram_chat_id: string | null
          telegram_linked_at: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          device_id?: string | null
          display_name?: string | null
          id: string
          model_preference?: string | null
          preferences?: Json | null
          reminder_offset_minutes?: number
          telegram_chat_id?: string | null
          telegram_linked_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          device_id?: string | null
          display_name?: string | null
          id?: string
          model_preference?: string | null
          preferences?: Json | null
          reminder_offset_minutes?: number
          telegram_chat_id?: string | null
          telegram_linked_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_goal_membership: {
        Args: { p_goal_id: string; p_user_id: string }
        Returns: boolean
      }
      generate_public_slug: { Args: { p_goal_id: string }; Returns: string }
      get_due_task_reminders: {
        Args: never
        Returns: {
          goal_id: string
          start_instant: string
          task_id: string
          telegram_chat_id: string
          title: string
          user_id: string
        }[]
      }
      get_enriched_notifications: {
        Args: {
          p_before?: string
          p_limit?: number
          p_only_invites?: boolean
          p_only_unread?: boolean
          p_user_id: string
        }
        Returns: {
          created_at: string
          goal_id: string
          goal_status: string
          goal_title: string
          id: string
          invitation_status: string
          is_member: boolean
          payload: Json
          read_at: string
          receiver_id: string
          sender_avatar_url: string
          sender_display_name: string
          sender_id: string
          type: string
          url: string
        }[]
      }
      get_goal_by_share_code: {
        Args: { p_share_code: string }
        Returns: {
          id: string
          title: string
          user_id: string
        }[]
      }
      get_goal_members: {
        Args: { p_goal_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          goal_id: string
          id: string
          joined_at: string
          last_seen: string
          role: string
          user_id: string
        }[]
      }
      is_goal_creator:
        | { Args: { p_goal_id: string }; Returns: boolean }
        | { Args: { p_goal_id: string; p_user_id: string }; Returns: boolean }
      join_goal: {
        Args: { p_goal_id: string; p_role: string; p_user_id: string }
        Returns: undefined
      }
      kori_dispatch_push: {
        Args: {
          p_body: string
          p_title: string
          p_url: string
          p_user_id: string
        }
        Returns: undefined
      }
      kori_record_skill_event: {
        Args: {
          p_confidence?: number
          p_difficulty?: string
          p_metadata?: Json
          p_new_attempt_count: number
          p_new_mastery: number
          p_score: number
          p_skill_code: string
          p_source_feature: string
          p_source_id?: string
        }
        Returns: {
          attempt_count: number
          last_practiced_at: string | null
          mastery_score: number
          recent_score: number | null
          skill_code: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "kori_skill_mastery"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      kori_send_exam_countdown_reminders: { Args: never; Returns: number }
      kori_send_reviews_due_reminders: { Args: never; Returns: number }
      kori_send_streak_saver_reminders: { Args: never; Returns: number }
      kori_streak_as_of: {
        Args: { p_end_date: string; p_user_id: string }
        Returns: number
      }
      kori_tg_send: {
        Args: {
          p_chat: string
          p_label?: string
          p_text: string
          p_url: string
        }
        Returns: number
      }
      regenerate_goal_share_code: {
        Args: { p_goal_id: string }
        Returns: string
      }
      remove_goal_member: { Args: { p_member_id: string }; Returns: undefined }
      search_users: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          avatar_url: string
          display_name: string
          email: string
          id: string
        }[]
      }
      search_users_profile: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          avatar_url: string
          display_name: string
          email: string
          id: string
        }[]
      }
      send_daily_planning_nudge: { Args: never; Returns: number }
      send_due_task_reminders: { Args: never; Returns: number }
      send_end_of_day_review: { Args: never; Returns: number }
      send_goal_deadline_alerts: { Args: never; Returns: number }
      send_overdue_nudges: { Args: never; Returns: number }
      tg_bar: { Args: { p_done: number; p_total: number }; Returns: string }
      tg_bot_token: { Args: never; Returns: string }
      tg_esc: { Args: { p: string }; Returns: string }
      tg_greet: { Args: { p_user: string }; Returns: string }
      tg_is_quiet_hours: { Args: { p_tz: string }; Returns: boolean }
      tg_send: { Args: { p_chat: string; p_text: string }; Returns: number }
      tg_send_btn: {
        Args: {
          p_chat: string
          p_label?: string
          p_path: string
          p_text: string
        }
        Returns: number
      }
      toggle_goal_public: {
        Args: { p_goal_id: string; p_is_public: boolean }
        Returns: boolean
      }
      update_member_last_seen: {
        Args: { p_goal_id: string }
        Returns: undefined
      }
      user_is_goal_member: { Args: { p_goal_id: string }; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
