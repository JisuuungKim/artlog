const WITHDRAW_NOTICE_ITEMS = [
  '탈퇴하시면 회원님의 모든 사용 내역과 레슨 노트 기록이 삭제되며, 재가입 시에도 복구할 수 없으니 신중히 결정해 주세요.',
  '탈퇴 시 회원님의 개인정보는 개인정보 처리방침에 따라 탈퇴일로부터 30일 보관 후 삭제돼요.',
] as const;

export default function WithdrawNoticeList() {
  return (
    <div className="space-y-6 text-body1 text-greyscale-text-body-700">
      {WITHDRAW_NOTICE_ITEMS.map(item => (
        <div key={item} className="flex items-start gap-2">
          <span className="mt-1 shrink-0 text-greyscale-text-body-700">•</span>
          <p>{item}</p>
        </div>
      ))}
    </div>
  );
}
