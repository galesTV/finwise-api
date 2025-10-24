export interface Reminder {
  id?: string;
  userId: string;
  title: string;
  date: string;
  description?: string;
  isCompleted: boolean;
  createdAt: string;
}