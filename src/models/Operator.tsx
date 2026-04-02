interface Operator {
  operator_id: number;
  name: string;
  surname: string;
  picture?: string;
  email?: string;
  session_id?: string;
  auth_token?: string;
  type?: string;
  is_activated?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default Operator;