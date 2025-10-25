export interface Transaction {
  id?: string;
  userId: string;
  value: number;
  type: "income" | "expense";
  category: string;
  date: Date;
  description?: string;
}
