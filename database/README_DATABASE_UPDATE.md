# Cap nhat MySQL theo code hien tai

Backend hien tai dung MySQL 8.0+ va database mac dinh `elearning_ai`.

Khong chay lai doan SQL cu da dan. Doan do vua tao schema cu, vua `ALTER TABLE`
khong kiem tra cot/index/FK da ton tai, nen de loi trung cot, trung khoa ngoai
hoac sai thu tu phu thuoc.

## Chon dung truong hop

### Truong hop A: Cai database moi, khong can giu du lieu cu

Chi chay:

Chay trong Command Prompt (`cmd`), tai thu muc goc du an:

```bat
mysql -u root -p < database/schema.sql
```

Hoac trong MySQL Workbench:

1. Mo file `database/schema.sql`.
2. Chay toan bo file mot lan.
3. Khong chay `migration_legacy_to_current.sql`.
4. Tao tai khoan bang giao dien/API, hoac chay seed phu hop.

`schema.sql` da co day du cac bang/cot backend hien tai dang dung:

- Khoa hoc, chuong, bai hoc, video va hoc lieu.
- Dang ky, thanh toan, thoi han khoa hoc va bao luu.
- Voucher va lich su su dung voucher.
- Bai tap thu cong, quiz/mixed va tu cham.
- Bai nop, ket qua, tien do va du lieu AI.

### Truong hop B: Database cu da co du lieu va can nang cap

#### Buoc 1: Sao luu database cu

Chay trong Command Prompt (`cmd`):

```bat
mysqldump -u root -p --routines --triggers elearning_ai > elearning_ai_before_update.sql
```

#### Buoc 2: Chay migration tong

Chay trong Command Prompt (`cmd`), tai thu muc goc du an:

```bat
mysql -u root -p elearning_ai < database/migration_legacy_to_current.sql
```

Hoac trong MySQL Workbench:

1. Ket noi den MySQL.
2. Mo file `database/migration_legacy_to_current.sql`.
3. Chay toan bo file, khong tach tung lenh `ALTER TABLE`.
4. Kiem tra ket qua cuoi file phai co `MIGRATION COMPLETED`.
5. Hai danh sach `missing_table` va `missing_column` phai rong.
6. Ba dong `invalid_rows` phai deu bang `0`.

Migration tong co the chay lai va se:

- Giu lai du lieu cu.
- Chi them cot/index/FK khi chua ton tai.
- Tao chuong mac dinh va map bai hoc, bai tap cu vao chuong.
- Sua section bi thieu hoac khong thuoc dung khoa hoc.
- Backfill `payments.course_id` tu enrollment cu.
- Them thoi han, bao luu, voucher va quiz tu cham.
- Chuyen quy tac xoa submission/result sang `RESTRICT`.

Khong chay tiep cac file migration le sau khi da chay migration tong:

- `migration_course_duration.sql`
- `migration_assignment_quiz_auto_grade.sql`
- `voucher_migration.sql`

## Buoc 3: Kiem tra schema sau khi chay

```sql
USE elearning_ai;

SHOW TABLES;
DESCRIBE courses;
DESCRIBE payments;
DESCRIBE enrollments;
DESCRIBE course_sections;
DESCRIBE lessons;
DESCRIBE assignments;
DESCRIBE submissions;
DESCRIBE vouchers;
DESCRIBE voucher_courses;
DESCRIBE voucher_usages;

SELECT COUNT(*) AS lessons_without_section
FROM lessons
WHERE section_id IS NULL;

SELECT COUNT(*) AS assignments_without_section
FROM assignments
WHERE section_id IS NULL;

SELECT COUNT(*) AS orphan_payment_courses
FROM payments p
LEFT JOIN courses c ON c.id = p.course_id
WHERE p.course_id IS NOT NULL AND c.id IS NULL;
```

Ba gia tri dem cuoi phai bang `0`.

## Buoc 4: Khoi dong backend de test

Kiem tra `backend/.env` dang tro den `elearning_ai`, sau do:

```powershell
cd backend
npm run dev
```

Khong insert mat khau dang text nhu `'123456'` vao `password_hash`. Backend dang
dung bcrypt, vi vay tai khoan co mat khau text se khong dang nhap duoc.
