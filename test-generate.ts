import { createAdminClient } from './lib/supabase-server'

async function testGenerateClientId() {
    try {
        const adminClient = await createAdminClient()
        console.log("Admin Client Created");

        // Get current user's email from auth session
        const { data: { user: authUser }, error: authError } = await adminClient.auth.getUser()

        console.log("Auth User:", authUser?.email, "Error:", authError?.message);

        let branchCode = '00'
        if (authUser?.email) {
            console.log("Looking up branch_id for email:", authUser.email);
            // Look up branch_id directly from users table — branch_id IS the branch code (text PK)
            const { data: userProfile, error: profileError } = await adminClient
                .from('users')
                .select('branch_id')
                .eq('email', authUser.email)
                .single()

            console.log("User Profile:", userProfile, "Error:", profileError?.message);

            if (userProfile?.branch_id) {
                branchCode = String(userProfile.branch_id).toUpperCase()
                console.log("Found branch code:", branchCode);
            } else {
                console.log("No branch_id in profile.");
            }
        } else {
            console.log("No email in auth session.");
        }
    } catch (e: any) {
        console.error("Test Exception:", e.message);
    }
}

testGenerateClientId();
