import Inquiry from '@/pages/mypage/Inquiry';
import WithdrawAccount from '@/pages/mypage/WithdrawAccount';
import WithdrawReason from '@/pages/mypage/WithdrawReason';
import UsageStatus from '@/pages/mypage/UsageStatus';

const BASE_PATH = '/mypage';

export const mypageRoutes = [
  { path: `${BASE_PATH}/inquiry`, element: <Inquiry /> },
  { path: `${BASE_PATH}/withdraw-account`, element: <WithdrawAccount /> },
  { path: `${BASE_PATH}/withdraw-reason`, element: <WithdrawReason /> },
  { path: `${BASE_PATH}/usage-status`, element: <UsageStatus /> },
];
