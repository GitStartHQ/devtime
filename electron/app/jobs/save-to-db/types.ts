export declare type hasura_uuid = string;
export type user_event_types_enum =
  | 'app_use'
  | 'browse_url'
  | 'end_day'
  | 'file_edit'
  | 'start_day'
  | 'task_pause'
  | 'task_resume'
  | 'ticket_pause'
  | 'ticket_resume'
  | '%future added value';
export type user_events_insert_input = {
  appName?: string | null;
  browserUrl?: string | null;
  clientId?: string | null;
  clientProjectId?: number | null;
  createdAt?: string | null;
  deletedAt?: string | null;
  duration?: number | null;
  eventType?: user_event_types_enum | null;
  filePath?: string | null;
  id?: string | null;
  occurredAt?: string | null;
  pollInterval?: number | null;
  taskId?: number | null;
  ticketId?: number | null;
  title?: string | null;
  updatedAt?: string | null;
  userId?: number | null;
};

export type work_log_approval_status_types_enum =
  | 'approved'
  | 'auto'
  | 'rejected'
  | 'under_review'
  | '%future added value';
export type work_log_meeting_types_enum =
  | 'all_hands'
  | 'client_call'
  | 'daily_standup'
  | 'team_retrospective'
  | 'weekly_demos'
  | '%future added value';
export type work_log_status_types_enum =
  | 'confirmed'
  | 'locked'
  | 'needs_confirmation'
  | '%future added value';
export type work_log_types_enum =
  | 'client'
  | 'client_billed'
  | 'client_project'
  | 'learning'
  | 'meeting'
  | 'other'
  | 'task'
  | 'ticket'
  | '%future added value';
export type user_work_logs_insert_input = {
  approvalStatus?: work_log_approval_status_types_enum | null;
  billableToClient?: boolean | null;
  clientId?: string | null;
  clientProjectId?: number | null;
  createdAt?: string | null;
  deletedAt?: string | null;
  endAt?: string | null;
  id?: number | null;
  meetingType?: work_log_meeting_types_enum | null;
  source?: string | null;
  startAt?: string | null;
  status?: work_log_status_types_enum | null;
  taskId?: number | null;
  technologyId?: number | null;
  ticketId?: number | null;
  updatedAt?: string | null;
  userId?: number | null;
  workDescription?: string | null;
  workType?: work_log_types_enum | null;
};
