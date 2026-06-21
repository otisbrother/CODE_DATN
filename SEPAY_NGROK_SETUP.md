# Trien khai SePay Free + ngrok cho chuyen khoan khoa hoc

Endpoint dang dung trong he thong:

```text
POST /api/payments/bank-webhook
```

## 1. Da go Casso nhu the nao

Trong repo khong co code goi Casso truc tiep bang ten. Phan thanh toan truoc do la webhook ngan hang dang generic. Backend da duoc chuyen sang SePay-compatible:

- Doc payload SePay: `accountNumber`, `content`, `transferType`, `transferAmount`, `referenceCode`.
- Chi xu ly giao dich tien vao `transferType = in`.
- Chi chap nhan giao dich vao dung `ADMIN_BANK_ACCOUNT_NO`.
- Tra ve dung body SePay yeu cau: `{"success":true}`.
- Ho tro secret moi `SEPAY_WEBHOOK_SECRET`; bien cu `BANK_WEBHOOK_SECRET` chi con la fallback.

## 2. Cau hinh backend

Mo `backend/.env` va de thong tin ngan hang:

```env
ADMIN_BANK_NAME=MB
ADMIN_BANK_BIN=970422
ADMIN_BANK_ACCOUNT_NO=0395256163
ADMIN_BANK_ACCOUNT_NAME=NGUYEN HUY TOA
SEPAY_WEBHOOK_SECRET=
```

Neu muon test nhanh, co the de `SEPAY_WEBHOOK_SECRET` trong. Khi deploy that nen dat secret va cau hinh cung secret trong SePay.

Khoi dong backend:

```powershell
cd backend
npm run dev
```

Kiem tra endpoint:

```powershell
curl.exe http://localhost:5000/api/payments/bank-webhook
```

## 3. Mo public URL bang ngrok

Tai thu muc root cua project da co `ngrok.exe`, chay:

```powershell
.\ngrok.exe http 5000
```

Lay URL HTTPS ma ngrok hien thi, vi du:

```text
https://abc-123.ngrok-free.app
```

Webhook URL can nhap vao SePay:

```text
https://abc-123.ngrok-free.app/api/payments/bank-webhook
```

## 4. Cau hinh tren SePay

1. Ket noi tai khoan ngan hang MB so `0395256163`.
2. Tao webhook moi.
3. URL webhook: dung URL ngrok o tren.
4. Su kien: giao dich tien vao.
5. Loc tai khoan: tai khoan MB admin.
6. Neu co cau hinh payment code prefix, dung prefix `ELEARNING`.
7. Neu co cau hinh authentication/secret, dat dung gia tri voi `SEPAY_WEBHOOK_SECRET`.

## 5. Tao giao dich pending trong app

Vao trang hoc vien, dang ky khoa hoc tra phi bang chuyen khoan. He thong se tao:

```text
Noi dung CK: ELEARNING <paymentId>
So tien: dung so tien tren QR
```

Vi du neu modal hien `Noi dung CK: ELEARNING 33` va so tien `8000`, webhook phai co dung noi dung va so tien do.

## 6. Test bang SePay simulator

Payload test mau:

```json
{
  "gateway": "MBBank",
  "transactionDate": "2026-06-08 12:30:00",
  "accountNumber": "0395256163",
  "subAccount": "",
  "code": "ELEARNING33",
  "content": "ELEARNING 33",
  "transferType": "in",
  "description": "Test thanh toan khoa hoc",
  "transferAmount": 8000,
  "referenceCode": "TEST-SEPAY-33",
  "accumulated": 5000000,
  "id": 33
}
```

Thay `33` bang `paymentId` that va `8000` bang so tien that trong modal QR.

Ket qua dung:

- SePay log bao webhook success.
- Modal thanh toan trong frontend tu dong dong sau vai giay.
- Khoa hoc duoc mo quyen hoc.
- Payment trong admin/chuc nang poll status chuyen sang `completed`.

## 7. Loi thuong gap

- Sai noi dung CK: phai co `ELEARNING <paymentId>`.
- Sai so tien: `transferAmount` phai lon hon hoac bang so tien don hang.
- Sai tai khoan nhan: `accountNumber` phai khop `ADMIN_BANK_ACCOUNT_NO`.
- Backend khong chay: ngrok van mo nhung webhook se fail.
- Doi URL ngrok moi nhung chua cap nhat lai trong SePay.
- Dat `SEPAY_WEBHOOK_SECRET` nhung SePay khong gui dung secret.
