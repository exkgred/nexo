export interface Account {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  createdAt: Date;
  updatedAt: Date;
}
