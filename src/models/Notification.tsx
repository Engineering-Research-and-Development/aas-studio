interface UserNotification {
   message_id: string;
   title: string;
   body: string;
   data: object;
   received_at: string;
}
  
export default UserNotification;