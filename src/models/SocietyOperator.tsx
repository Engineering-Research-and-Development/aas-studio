export default interface Operator {
  operator_id: number;
  user_id: number;
  society_id: number;
  session_id: string;
  auth_token: string;
  user: {
    user_id: number;
    name: string;
    surname: string;
    email: string;
    picture: string;
  };
  society: {
    society_id: number;
    name: string;
    email: string;
    picture: string;
  };
}
