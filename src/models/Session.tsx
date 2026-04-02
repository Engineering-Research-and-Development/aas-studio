import Operator from "@/models/Operator";

interface Session {
    session_id: string;
    operator_id: number;
    device: string;
    ip_address: string;
    created_at: string;
    last_activity: string;
    operator?: Operator
}

export default Session;
