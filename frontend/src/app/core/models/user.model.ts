export interface User {
  id?: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface BusinessRecord {
  id: string;
  title: string;
  ownerId: string;
  category: string;
  status: string;
  createdDate: string;
  description: string;
}
