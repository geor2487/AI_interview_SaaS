interface TemplateVars {
  candidate_name: string;
  company_name: string;
  interview_url?: string;
  interview_date?: string;
  duration?: string;
  result_days?: string;
  deadline_date?: string;
}

function replaceVars(template: string, vars: TemplateVars): string {
  return template
    .replace(/\{\{candidate_name\}\}/g, vars.candidate_name)
    .replace(/\{\{company_name\}\}/g, vars.company_name)
    .replace(/\{\{interview_url\}\}/g, vars.interview_url ?? "")
    .replace(/\{\{interview_date\}\}/g, vars.interview_date ?? "")
    .replace(/\{\{duration\}\}/g, vars.duration ?? "30")
    .replace(/\{\{result_days\}\}/g, vars.result_days ?? "5")
    .replace(/\{\{deadline_date\}\}/g, vars.deadline_date ?? "");
}

export function invitationEmail(vars: TemplateVars) {
  const subject = replaceVars("【{{company_name}}】面接のご案内 — アカウント登録のお願い", vars);
  const body = replaceVars(
    `{{candidate_name}} 様

この度は{{company_name}}にご応募いただき、誠にありがとうございます。

選考を進めるにあたり、下記リンクよりアカウントを作成してください。
アカウント作成後、プロフィール・経歴をご登録いただきます。
面接の日程は、マイページのメッセージにてご案内いたします。

■ アカウント作成リンク
{{interview_url}}

■ 登録の流れ
1. 上記リンクからアカウントを作成
2. プロフィール・経歴を入力
3. マイページで面接のご案内をお待ちください

ご不明な点がございましたら、お気軽にお問い合わせください。

{{company_name}}
採用担当`,
    vars
  );
  return { subject, body };
}

export function reminderEmail(vars: TemplateVars) {
  const subject = replaceVars("【リマインド】面接の回答期限が近づいています - {{company_name}}", vars);
  const body = replaceVars(
    `{{candidate_name}} 様

AI面接の回答期限が近づいておりますので、お知らせいたします。

■ 回答期限
{{deadline_date}}

■ 面接リンク
{{interview_url}}

■ 所要時間
約{{duration}}分

まだ受験されていない場合は、期限までに受験を完了してください。
ご不明な点がございましたら、お気軽にお問い合わせください。

{{company_name}}
採用担当`,
    vars
  );
  return { subject, body };
}

export function completionEmail(vars: TemplateVars) {
  const subject = replaceVars("【{{company_name}}】面接完了のお知らせ", vars);
  const body = replaceVars(
    `{{candidate_name}} 様

本日は面接にご参加いただき、誠にありがとうございました。

選考結果につきましては、{{result_days}}営業日以内にご連絡いたします。
今しばらくお待ちくださいますようお願いいたします。

ご不明な点がございましたら、お気軽にお問い合わせください。

{{company_name}}
採用担当`,
    vars
  );
  return { subject, body };
}

export function rejectionEmail(vars: TemplateVars) {
  const subject = replaceVars("【{{company_name}}】選考結果のご連絡", vars);
  const body = replaceVars(
    `{{candidate_name}} 様

この度は{{company_name}}の選考にご参加いただき、誠にありがとうございました。

慎重に検討いたしました結果、誠に残念ではございますが、
今回はご期待に沿えない結果となりました。

{{candidate_name}}様の今後のご活躍を心よりお祈り申し上げます。

{{company_name}}
採用担当`,
    vars
  );
  return { subject, body };
}
