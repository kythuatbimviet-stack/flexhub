'use server'

import { createClient } from '@/lib/supabase-server'

/**
 * Upload signature image (base64 or blob) to Supabase Storage
 * @param base64Data Data URL (data:image/png;base64,...)
 * @param fileName Name of the file to store
 * @returns Object with success status and public URL
 */
export async function uploadSignature(base64Data: string, fileName: string) {
    if (!base64Data || !base64Data.startsWith('data:image')) {
        return { success: false, error: 'Dữ liệu không hợp lệ' }
    }

    try {
        const supabase = await createClient()
        
        // Convert base64 to Buffer
        const base64Content = base64Data.split(';base64,').pop()
        if (!base64Content) throw new Error('Format base64 không đúng')
        
        const buffer = Buffer.from(base64Content, 'base64')
        
        // Upload to 'signatures' bucket
        // We use upsert: true to allow replacing if same filename is used (e.g. updating branch signature)
        const { data, error } = await supabase.storage
            .from('signatures')
            .upload(fileName, buffer, {
                contentType: 'image/png',
                upsert: true
            })

        if (error) throw error

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('signatures')
            .getPublicUrl(fileName)

        return { success: true, url: publicUrl }
    } catch (error: any) {
        console.error('Error uploading signature:', error)
        return { success: false, error: error.message || 'Lỗi khi upload chữ ký' }
    }
}

/**
 * Generic image upload to Supabase Storage
 * @param base64Data Data URL
 * @param fileName Name of the file
 * @param bucket Bucket name (default: 'avatars')
 * @returns Object with success status and public URL
 */
export async function uploadImage(base64Data: string, fileName: string, bucket: string = 'avatars') {
    if (!base64Data || !base64Data.startsWith('data:image')) {
        return { success: false, error: 'Dữ liệu không hợp lệ' }
    }

    try {
        const supabase = await createClient()
        
        const base64Content = base64Data.split(';base64,').pop()
        if (!base64Content) throw new Error('Format base64 không đúng')
        
        const buffer = Buffer.from(base64Content, 'base64')
        const contentType = base64Data.split(';')[0].split(':')[1]
        
        const { error } = await supabase.storage
            .from(bucket)
            .upload(fileName, buffer, {
                contentType,
                upsert: true
            })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName)

        return { success: true, url: publicUrl }
    } catch (error: any) {
        console.error(`Error uploading to ${bucket}:`, error)
        return { success: false, error: error.message || 'Lỗi khi upload ảnh' }
    }
}

/**
 * Upload assessment image (postural / physical) to Supabase Storage
 * Convenience wrapper around uploadImage targeting the 'assessments' bucket
 */
export async function uploadAssessmentImage(base64Data: string, fileName: string) {
    return uploadImage(base64Data, fileName, 'assessments')
}
