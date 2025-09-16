export interface Account {
  id: number;
  username: string;
  created_at: Date;
}

export interface Job {
  id?: number;
  title: string;
  description: string;
  company: string;
  link: string;
  account_id: number;
  created_at?: Date;
}

export interface AccountSettings {
  id?: number;
  account_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface AccountStats {
  id?: number;
  account_id: number;
  bot_activation_count: number;
  created_at?: Date;
  updated_at?: Date;
  botActivations?: number;
}

export interface GPTResponse {
  id?: number;
  job_id: number;
  account_id: number;
  response: string;
  created_at?: Date;
}

export interface BotAction {
  id?: number;
  account_id: number;
  action_type: string;
  description: string;
  created_at?: Date;
}

export interface JWTPayload {
  id: number;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Express.Request {
  user: JWTPayload;
  body: any;
  params: any;
}

export interface ScrapedJob {
  title: string;
  description: string;
  company: string;
  link: string;
}

export interface DatabaseResult {
  insertId: number;
  affectedRows: number;
}

export interface QueryResult<T = any> {
  results: T[];
  fields?: any[];
}

// Express module augmentation
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}