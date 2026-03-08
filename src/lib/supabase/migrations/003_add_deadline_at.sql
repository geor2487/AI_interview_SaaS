-- 面接の回答期限カラムを追加
ALTER TABLE interviews ADD COLUMN deadline_at timestamptz;

-- 既存の scheduled_at データを deadline_at に移行
UPDATE interviews SET deadline_at = scheduled_at WHERE scheduled_at IS NOT NULL;
