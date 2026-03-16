import { google } from 'googleapis';
import { fetchAppConfig } from '@/app/actions/app-config';
import { numberToVietnameseWords } from '@/lib/utils';

/**
 * Get Authenticated Google Client using Service Account from Supabase Config
 */
export async function getGoogleAuthClient() {
  const configRes = await fetchAppConfig();
  if (!configRes.success || !configRes.data) {
    throw new Error('Không thể tải cấu hình Google Drive từ database');
  }

  let email = configRes.data['gdrive_service_account_email']?.trim();
  let privateKey = configRes.data['gdrive_private_key']?.trim();

  // Robust parsing: If the user pasted the entire JSON into the private_key field
  if (privateKey?.startsWith('{')) {
    try {
      const parsed = JSON.parse(privateKey);
      if (parsed.private_key) privateKey = parsed.private_key;
      if (parsed.client_email && (!email || email === '')) email = parsed.client_email;
    } catch (e) {
      console.error('Failed to parse privateKey as JSON', e);
    }
  }

  // Also check if they pasted JSON into the email field by mistake
  if (email?.startsWith('{')) {
    try {
      const parsed = JSON.parse(email);
      if (parsed.client_email) email = parsed.client_email;
      if (parsed.private_key && (!privateKey || privateKey === '')) privateKey = parsed.private_key;
    } catch (e) {}
  }

  if (!email || !privateKey) {
    throw new Error('Chưa cấu hình Service Account Email hoặc Private Key trong cài đặt');
  }

  // Handle nested newlines or literal \n
  const formattedKey = privateKey.replace(/\\n/g, '\n');

  try {
    const auth = new google.auth.JWT({
      email,
      key: formattedKey,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents'
      ]
    });

    // Explicitly authorize to catch credential issues early
    await auth.authorize();
    return auth;
  } catch (err: any) {
    console.error('Google Auth Error:', err);
    if (err.message?.includes('invalid_grant')) {
        throw new Error('Xác thực thất bại: Private Key hoặc Email không hợp lệ (invalid_grant). Hãy kiểm tra lại đã copy đúng chưa.');
    }
    throw new Error('Lỗi xác thực Google: ' + (err.message || 'No key set'));
  }
}

/**
 * Maps contract data to placeholders for Google Docs replaceAllText
 */
export function buildContractPlaceholders(contract: any) {
  const data: Record<string, string> = {};

  // Standard fields
  const fields = [
    'id', 'member_name', 'phone', 'email', 'package_name', 'total_sessions',
    'package_price', 'total_amount', 'start_date', 'end_date', 'notes',
    'id_number', 'dob', 'address', 'signing_date'
  ];

  fields.forEach(field => {
    let val = contract[field] || contract.clients?.[field] || '....................';
    
    // Format dates
    if (field.includes('date') || field === 'dob') {
        try {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
                val = d.toLocaleDateString('vi-VN');
            }
        } catch(e) {}
    }

    data[`{{${field}}}`] = val.toString();
    data[`{{UPPER(${field})}}`] = val.toString().toUpperCase();
    
    // Number formatting
    if (field.includes('price') || field.includes('amount')) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        data[`{{TEXT(${field})}}`] = num.toLocaleString('vi-VN');
        data[`{{${field}_words}}`] = numberToVietnameseWords(num) + ' đồng chẵn';
      }
    }
  });

  // Center/Branch info
  if (contract.branches) {
      data['{{center_name}}'] = contract.branches.name || '';
      data['{{center_address}}'] = contract.branches.center_address || '';
      data['{{center_phone}}'] = contract.branches.center_phone || '';
      data['{{center_representative}}'] = contract.branches.legal_representative || '';
  }

  return data;
}
