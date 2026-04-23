export type Category =
  | 'Food & Dining'
  | 'Shopping'
  | 'Transportation'
  | 'Entertainment'
  | 'Health & Medical'
  | 'Housing & Rent'
  | 'Utilities'
  | 'Education'
  | 'Travel'
  | 'Investments'
  | 'Salary / Income'
  | 'Freelance'
  | 'Subscriptions'
  | 'Personal Care'
  | 'Gifts & Donations'
  | 'Groceries'
  | 'Other';

export type PaymentMethod = 'UPI' | 'Cash' | 'Card' | 'Net Banking' | 'Wallet';

export type Tag = 'Personal' | 'Business' | 'Family' | 'Emergency' | 'Savings';

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category: Category;
  paymentMethod: PaymentMethod;
  type: TransactionType;
  tags: Tag[];
  date: string; // ISO date string
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export type NewTransaction = Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  monthlyBudget: number;
  currency: string;
  theme: 'dark' | 'light';
  createdAt: number;
}

export interface CategoryStats {
  category: Category;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

export interface DailySpending {
  date: string;
  amount: number;
  income: number;
}

export interface DashboardStats {
  totalLifetimeSpent: number;
  totalLifetimeIncome: number;
  spentThisMonth: number;
  incomeThisMonth: number;
  remainingBudget: number;
  budgetUsedPercent: number;
  categoryBreakdown: CategoryStats[];
  dailySpending: DailySpending[];
  transactionCount: number;
}


export const CATEGORIES: Category[] = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Entertainment',
  'Health & Medical',
  'Housing & Rent',
  'Utilities',
  'Education',
  'Travel',
  'Investments',
  'Salary / Income',
  'Freelance',
  'Subscriptions',
  'Personal Care',
  'Gifts & Donations',
  'Groceries',
  'Other',
];

export const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Cash', 'Card', 'Net Banking', 'Wallet'];

export const TAGS: Tag[] = ['Personal', 'Business', 'Family', 'Emergency', 'Savings'];

export const CATEGORY_COLORS: Record<Category, string> = {
  'Food & Dining': '#10b981',
  'Shopping': '#6366f1',
  'Transportation': '#f59e0b',
  'Entertainment': '#ec4899',
  'Health & Medical': '#ef4444',
  'Housing & Rent': '#8b5cf6',
  'Utilities': '#06b6d4',
  'Education': '#3b82f6',
  'Travel': '#14b8a6',
  'Investments': '#84cc16',
  'Salary / Income': '#22c55e',
  'Freelance': '#a855f7',
  'Subscriptions': '#f97316',
  'Personal Care': '#fb7185',
  'Gifts & Donations': '#e879f9',
  'Groceries': '#4ade80',
  'Other': '#94a3b8',
};

export const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  'Food & Dining': ['restaurant', 'cafe', 'pizza', 'burger', 'food', 'dinner', 'lunch', 'breakfast', 'eat', 'swiggy', 'zomato', 'biryani', 'dosa'],
  'Shopping': ['amazon', 'flipkart', 'myntra', 'clothes', 'shoes', 'purchase', 'buy', 'mall', 'store', 'market'],
  'Transportation': ['uber', 'ola', 'taxi', 'bus', 'metro', 'petrol', 'fuel', 'parking', 'auto', 'rickshaw', 'train'],
  'Entertainment': ['netflix', 'movie', 'cinema', 'game', 'spotify', 'prime', 'hotstar', 'youtube', 'concert', 'theatre'],
  'Health & Medical': ['doctor', 'hospital', 'medicine', 'pharmacy', 'medical', 'clinic', 'health', 'gym', 'fitness'],
  'Housing & Rent': ['rent', 'house', 'flat', 'apartment', 'maintenance', 'society'],
  'Utilities': ['electricity', 'water', 'gas', 'internet', 'wifi', 'broadband', 'mobile', 'recharge', 'bill'],
  'Education': ['course', 'school', 'college', 'tuition', 'books', 'study', 'fees', 'udemy', 'coursera'],
  'Travel': ['flight', 'hotel', 'trip', 'holiday', 'vacation', 'booking', 'irctc', 'makemytrip'],
  'Investments': ['mutual fund', 'stock', 'sip', 'zerodha', 'investment', 'groww', 'fd', 'nps'],
  'Salary / Income': ['salary', 'paycheck', 'wage', 'stipend', 'income received'],
  'Freelance': ['freelance', 'project payment', 'client', 'consulting', 'contract'],
  'Subscriptions': ['subscription', 'annual plan', 'membership', 'renewal', 'plan'],
  'Personal Care': ['salon', 'haircut', 'beauty', 'spa', 'cosmetics', 'grooming'],
  'Gifts & Donations': ['gift', 'donation', 'charity', 'present', 'birthday'],
  'Groceries': ['grocery', 'vegetables', 'fruits', 'kirana', 'milk', 'supermarket', 'blinkit', 'zepto', 'instamart'],
  'Other': [],
};
