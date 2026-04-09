# Implementation Plan — Payment Confirmation Integration

This plan outlines the steps to integrate a "Payment Confirmation" (Receipt) feature into the GymnERP contract management system, using the provided HTML template and Google Apps Script logic.

## User Review Required

> [!IMPORTANT]
> **Google Apps Script Web App URL**: I need the deployed URL of the Google Apps Script (from `biennhan/code.gs`) to make the "Send Email" function work. I will add a placeholder in `.env` for now as `NEXT_PUBLIC_PAYMENT_GAS_URL`.

## Proposed Changes

### 1. Backend: Server Action
#### [MODIFY] [send-email.ts](file:///f:/2026/WebApp/GymnERP/gymERP/app/actions/send-email.ts)
- Add a new server action `sendPaymentConfirmationAction` that:
    - Receives the payment confirmation payload.
    - Sends a POST request to the GAS Web App URL.
    - Returns success or error status.

### 2. UI: Payment Confirmation Dialog
#### [NEW] [payment-confirmation-dialog.tsx](file:///f:/2026/WebApp/GymnERP/gymERP/components/contracts/payment-confirmation-dialog.tsx)
- Create a new dialog component based on `evasfit-confirmation.html`.
- **Form Tab**: Allows editing pre-filled fields from the contract.
- **Preview Tab**: Shows a stylized receipt matching the "Eva's Fit" aesthetic.
- **Send Action**: Calls the `sendPaymentConfirmationAction`.

### 3. Integration Points
#### [MODIFY] [contracts/page.tsx](file:///f:/2026/WebApp/GymnERP/gymERP/app/(dashboard)/contracts/page.tsx)
- Add a "Xác nhận thanh toán" button (receipt icon) to each contract row in the expanded customer view.
- Trigger the `PaymentConfirmationDialog` when clicked.

#### [MODIFY] [contract-details-sheet.tsx](file:///f:/2026/WebApp/GymnERP/gymERP/components/contracts/contract-details-sheet.tsx)
- Add a "Tạo xác nhận thanh toán" button in the actions section or a dropdown menu.

## Data Mapping
The mapping from `contract` object to GAS payload will be:
- `coso`: `facility_name`
- `ten`: `member_name`
- `sdt`: `phone`
- `email`: `email`
- `diachi`: `member_address`
- `ngaysinh`: `dob` (formatted)
- `cmnd`: `id_number`
- `nguon`: `source`
- `goi`: `package_name`
- `custom`: `custom_selection`
- `tien1`: `total_amount` (or upfront payment if available)
- `httt1`: `payment_method`
- `hlv`: `trainer_name`
- `nbd`: `start_date`
- `nkt`: `end_date`
- `ndong`: `signing_date` (or today)
- `nguoithu`: `created_by_email` or central rep.

## Verification Plan

### Automated Tests
- None (UI/External Integration focused).

### Manual Verification
- Open a contract and click "Xác nhận thanh toán".
- Verify data is correctly pre-filled.
- Switch to "Xem trước" and check the UI styling.
- Submit "Gửi email" and verify the request is sent (check console logs for payload).
- (If GAS URL provided) Verify email receipt with PDF attachment is received.
