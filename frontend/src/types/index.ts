export interface User {
  id: number;
  email: string;
  full_name: string;
  is_verified: boolean;
  avatar_color: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Group {
  id: number;
  name: string;
  description: string | null;
  currency: string;
  invite_code: string;
  user_role: 'admin' | 'co-admin' | 'member';
  member_count: number;
  created_at: string;
}

export interface GroupMember {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'co-admin' | 'member';
  avatar_color: string;
  joined_at: string;
}

export interface Expense {
  id: number;
  group_id: number;
  paid_by_id: number;
  paid_by_name: string;
  paid_by_email: string;
  amount: number;
  description: string;
  category: string;
  payment_method?: string;
  expense_date: string;
  created_at: string;
  can_edit: boolean;
}

export interface MemberContributionStat {
  user_id: number;
  user_name: string;
  avatar_color: string;
  total_contributed: number;
  percentage: number;
}

export interface FundSummary {
  fund_id: number;
  group_id: number;
  is_active: boolean;
  total_contributed: number;
  total_spent: number;
  available_balance: number;
  utilization_percentage: number;
  member_contributions: MemberContributionStat[];
}

export interface FundTransaction {
  id: number;
  transaction_type: 'contribution' | 'expense';
  amount: number;
  description: string;
  category: string | null;
  payment_method?: string;
  user_id: number;
  user_name: string;
  date: string;
  running_balance: number;
  created_at: string;
  can_edit: boolean;
}

export interface MemberBalance {
  user_id: number;
  user_name: string;
  email: string;
  avatar_color: string;
  total_paid: number;
  fair_share: number;
  net_balance: number; // positive = receives, negative = owes
}

export interface SettlementTransfer {
  from_user_id: number;
  from_user_name: string;
  to_user_id: number;
  to_user_name: string;
  amount: number;
}

export interface SettlementPayment {
  id: number;
  group_id: number;
  from_user_id: number;
  from_user_name: string;
  to_user_id: number;
  to_user_name: string;
  amount: number;
  payment_method: string;
  notes: string | null;
  payment_date: string;
  created_at: string;
}

export interface SettlementSummary {
  total_individual_expenses: number;
  member_count: number;
  fair_share_per_member: number;
  member_balances: MemberBalance[];
  suggested_transfers: SettlementTransfer[];
  settlement_history: SettlementPayment[];
}

export interface MemberSpendingStat {
  user_id: number;
  user_name: string;
  email: string;
  avatar_color: string;
  total_spent: number;
  percentage: number;
  transaction_count: number;
}

export interface CategoryStat {
  category: string;
  amount: number;
  percentage: number;
}

export interface MonthlyTrendStat {
  month: string;
  amount: number;
  count: number;
}

export interface DailyTrendStat {
  date: string;
  amount: number;
  count: number;
}

export interface DashboardAnalytics {
  total_individual_expenses: number;
  common_fund_balance: number;
  common_fund_spent: number;
  total_transactions: number;
  member_count: number;
  member_contributions: MemberSpendingStat[];
  highest_spender: MemberSpendingStat | null;
  average_spending_per_member: number;
  category_distribution: CategoryStat[];
  monthly_trends: MonthlyTrendStat[];
  daily_trends: DailyTrendStat[];
  from_date: string | null;
  to_date: string | null;
}

export interface Activity {
  id: number;
  action_type: string;
  description: string;
  user_name: string;
  created_at: string;
}
